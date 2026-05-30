import { pool } from '../config/db.js';
import { sanitizeText } from '../utils/sanitizer.js';
import crypto from 'crypto';

/**
 * Creates or updates a customer's price offer on a product.
 * POST /api/offers
 */
export const createOffer = async (req, res, next) => {
    try {
        const { productId, offeredPrice } = req.body;
        const customerId = req.user.id; // Logged-in customer UUID

        if (!productId || !offeredPrice) {
            return res.status(400).json({ success: false, message: "Product ID and offered price are required." });
        }

        const priceNum = parseFloat(offeredPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ success: false, message: "Please provide a valid, positive offered price." });
        }

        // Check customer's membership status
        const custRes = await pool.query(
            "SELECT membership FROM customers WHERE customer_id = $1",
            [customerId]
        );
        const membership = custRes.rows[0]?.membership || 'free';

        // 1. Free Tier: Block bargaining completely
        if (membership === 'free') {
            return res.status(403).json({
                success: false,
                message: "Only members can place bargain offers. Please upgrade your membership to Silver, Gold, or Platinum to participate in the Flea Market."
            });
        }

        // 2. Silver Tier: Limit to 5 offers per calendar month
        if (membership === 'silver') {
            const countRes = await pool.query(
                `SELECT COUNT(*) FROM product_offers 
                 WHERE customer_id = $1 
                 AND created_at >= date_trunc('month', CURRENT_DATE)`,
                [customerId]
            );
            const offerCount = parseInt(countRes.rows[0].count);
            if (offerCount >= 5) {
                return res.status(403).json({
                    success: false,
                    message: "You have reached your limit of 5 bargain offers for this month on the Silver plan. Please upgrade to Gold or Platinum for unlimited bargaining."
                });
            }
        }

        // 1. Verify the product exists and fetch its catalog price
        const prodRes = await pool.query(
            "SELECT price, name, is_active, is_deleted FROM products WHERE product_id = $1",
            [productId]
        );

        if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active || prodRes.rows[0].is_deleted) {
            return res.status(404).json({ success: false, message: "Product not found or currently unavailable." });
        }

        const listPrice = parseFloat(prodRes.rows[0].price);

        // 2. Security Bounds Validation: Prevent extreme/spam offers
        // Prevent offers below 50% of the listed price or above 100%
        const minAcceptableOffer = listPrice * 0.50;
        if (priceNum < minAcceptableOffer) {
            return res.status(400).json({ 
                success: false, 
                message: `Your offered price of ₹${priceNum.toLocaleString()} is too low. Offers must be at least 50% of the list price (₹${minAcceptableOffer.toLocaleString()}).` 
            });
        }
        if (priceNum > listPrice) {
            return res.status(400).json({ 
                success: false, 
                message: "Offered price cannot exceed the current retail price." 
            });
        }

        // 3. Upsert offer: If an active negotiation already exists, update it. Otherwise, create a new one.
        const activeOfferRes = await pool.query(`
            SELECT offer_id FROM product_offers 
            WHERE product_id = $1 AND customer_id = $2 AND status IN ('Pending', 'Countered')
        `, [productId, customerId]);

        let result;
        if (activeOfferRes.rows.length > 0) {
            const offerId = activeOfferRes.rows[0].offer_id;
            result = await pool.query(`
                UPDATE product_offers 
                SET offered_price = $1, seller_counter_price = NULL, status = 'Pending', offer_token = NULL, expires_at = NULL, created_at = CURRENT_TIMESTAMP
                WHERE offer_id = $2
                RETURNING *
            `, [priceNum, offerId]);
        } else {
            result = await pool.query(`
                INSERT INTO product_offers (product_id, customer_id, offered_price)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [productId, customerId, priceNum]);
        }

        return res.status(201).json({
            success: true,
            message: "Your price offer has been submitted successfully to the merchant! We will notify you once they respond.",
            offer: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a customer's active and past bargaining offers.
 * GET /api/offers/customer
 */
export const getCustomerOffers = async (req, res, next) => {
    try {
        const customerId = req.user.id;

        const result = await pool.query(`
            SELECT o.*, p.name as product_name, p.price as list_price, p.images as product_images, s.store_name
            FROM product_offers o
            JOIN products p ON o.product_id = p.product_id
            JOIN sellers s ON p.seller_id = s.seller_id
            WHERE o.customer_id = $1
            ORDER BY o.created_at DESC
        `, [customerId]);

        // Auto-expire and restore stock if necessary
        const now = new Date();
        for (const row of result.rows) {
            if (row.status === 'Accepted' && row.expires_at && new Date(row.expires_at) < now) {
                await pool.query("UPDATE product_offers SET status = 'Expired' WHERE offer_id = $1", [row.offer_id]);
                if (row.is_stock_reserved && row.agreed_quantity) {
                    await pool.query(
                        "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2",
                        [row.agreed_quantity, row.product_id]
                    );
                    await pool.query("UPDATE product_offers SET is_stock_reserved = false WHERE offer_id = $1", [row.offer_id]);
                }
                row.status = 'Expired'; // Update locally for response
            }
        }

        // Map and extract thumbnail
        const formattedOffers = result.rows.map(row => {
            let thumbnail = 'https://via.placeholder.com/150';
            if (row.product_images && row.product_images.length > 0) {
                thumbnail = row.product_images[0];
            }
            return {
                ...row,
                product_thumbnail: thumbnail
            };
        });

        return res.json({ success: true, offers: formattedOffers });

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves received offers for a seller's products catalog.
 * GET /api/offers/seller
 */
export const getSellerOffers = async (req, res, next) => {
    try {
        const sellerId = req.user.id; // Logged-in seller UUID

        const result = await pool.query(`
            SELECT o.*, p.name as product_name, p.price as list_price, p.images as product_images, c.full_name as customer_name, c.email as customer_email
            FROM product_offers o
            JOIN products p ON o.product_id = p.product_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE p.seller_id = $1
            ORDER BY o.created_at DESC
        `, [sellerId]);

        const formattedOffers = result.rows.map(row => {
            let thumbnail = 'https://via.placeholder.com/150';
            if (row.product_images && row.product_images.length > 0) {
                thumbnail = row.product_images[0];
            }
            return {
                ...row,
                product_thumbnail: thumbnail
            };
        });

        return res.json({ success: true, offers: formattedOffers });

    } catch (error) {
        next(error);
    }
};

/**
 * Allows sellers to accept, decline, or counter price offers.
 * PUT /api/offers/:id/respond
 */
export const respondToOffer = async (req, res, next) => {
    try {
        const { id } = req.params; // Offer UUID
        const { action, counterPrice } = req.body;
        const sellerId = req.user.id;

        if (!action || !['Accept', 'Reject', 'Counter'].includes(action)) {
            return res.status(400).json({ success: false, message: "Valid action ('Accept', 'Reject', 'Counter') is required." });
        }

        // 1. Fetch offer and verify seller ownership of the product
        const offerRes = await pool.query(`
            SELECT o.*, p.seller_id, p.name as product_name, c.customer_id
            FROM product_offers o
            JOIN products p ON o.product_id = p.product_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.offer_id = $1
        `, [id]);

        if (offerRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Bargain offer not found." });
        }

        const offer = offerRes.rows[0];
        if (offer.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized. This product does not belong to your store catalog." });
        }

        let updatedStatus = 'Pending';
        let offerToken = null;
        let expiration = null;
        let dbCounterPrice = null;

        if (action === 'Accept') {
            updatedStatus = 'Accepted';
            // Generate a secure checkout token
            offerToken = "OFFER_TK_" + crypto.randomBytes(16).toString('hex');
            // Token is active for exactly 24 hours
            expiration = new Date(Date.now() + 1000 * 60 * 60 * 24);
        } else if (action === 'Reject') {
            updatedStatus = 'Rejected';
        } else if (action === 'Counter') {
            updatedStatus = 'Countered';
            dbCounterPrice = parseFloat(counterPrice);
            if (isNaN(dbCounterPrice) || dbCounterPrice <= 0) {
                return res.status(400).json({ success: false, message: "Please provide a valid counter price." });
            }
        }

        const result = await pool.query(`
            UPDATE product_offers
            SET status = $1, offer_token = $2, expires_at = $3, seller_counter_price = $4
            WHERE offer_id = $5
            RETURNING *
        `, [updatedStatus, offerToken, expiration, dbCounterPrice, id]);

        // Insert notification for customer
        let notificationMsg = `Your price offer on "${offer.product_name}" was reviewed by the store: `;
        if (action === 'Accept') {
            notificationMsg += `ACCEPTED! You can now check out for ₹${parseFloat(offer.offered_price).toLocaleString()} (Valid for 24h).`;
        } else if (action === 'Reject') {
            notificationMsg += `Declined. Feel free to submit a revised offer!`;
        } else if (action === 'Counter') {
            notificationMsg += `Countered at ₹${dbCounterPrice.toLocaleString()}. Please review and respond!`;
        }

        await pool.query(`
            INSERT INTO notifications (customer_id, type, message)
            VALUES ($1, $2, $3)
        `, [offer.customer_id, 'offer_update', notificationMsg]);

        return res.json({
            success: true,
            message: `Bargain offer successfully ${updatedStatus.toLowerCase()}!`,
            offer: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Validates a secure bargain checkout token.
 * GET /api/offers/validate/:token
 */
export const validateOfferToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        const result = await pool.query(`
            SELECT o.*, p.name as product_name, p.price as original_price, p.images as product_images, p.seller_id
            FROM product_offers o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.offer_token = $1 AND o.status = 'Accepted'
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Bargain offer token is invalid or expired." });
        }

        const offer = result.rows[0];

        // Check token expiration date
        if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
            // Update status to Expired
            await pool.query("UPDATE product_offers SET status = 'Expired' WHERE offer_id = $1", [offer.offer_id]);
            if (offer.is_stock_reserved && offer.agreed_quantity) {
                await pool.query(
                    "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2",
                    [offer.agreed_quantity, offer.product_id]
                );
                await pool.query("UPDATE product_offers SET is_stock_reserved = false WHERE offer_id = $1", [offer.offer_id]);
            }
            return res.status(410).json({ success: false, message: "This checkout token has expired. Accepted bargains are valid for 24 hours." });
        }

        let thumbnail = 'https://via.placeholder.com/150';
        if (offer.product_images && offer.product_images.length > 0) {
            thumbnail = offer.product_images[0];
        }

        return res.json({
            success: true,
            valid: true,
            productId: offer.product_id,
            productName: offer.product_name,
            originalPrice: offer.original_price,
            bargainedPrice: offer.offered_price,
            sellerId: offer.seller_id,
            productThumbnail: thumbnail,
            expiresAt: offer.expires_at,
            agreedQuantity: offer.agreed_quantity
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Allows a customer to reject an accepted offer (recorded deal),
 * restoring the reserved stock and updating the meeting notes.
 * PUT /api/offers/:id/cancel
 */
export const cancelCustomerOffer = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id } = req.params; // Offer UUID
        const customerId = req.user.id;

        await client.query('BEGIN');

        // Fetch the offer and lock the row
        const offerRes = await client.query(`
            SELECT * FROM product_offers 
            WHERE offer_id = $1 AND customer_id = $2 
            FOR UPDATE
        `, [id, customerId]);

        if (offerRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Offer not found." });
        }

        const offer = offerRes.rows[0];

        if (offer.status !== 'Accepted') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `Cannot cancel an offer that is currently ${offer.status}.` });
        }

        // Restore the reserved stock
        if (offer.is_stock_reserved && offer.agreed_quantity) {
            await client.query(
                "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2",
                [offer.agreed_quantity, offer.product_id]
            );
        }

        // Mark the offer as Rejected
        await client.query(
            "UPDATE product_offers SET status = 'Rejected', is_stock_reserved = false WHERE offer_id = $1",
            [id]
        );

        // Update the meeting notes so admin and seller are informed
        // Append a clear tag to the meeting_notes of the associated completed meeting
        await client.query(`
            UPDATE flea_market_meetings 
            SET meeting_notes = COALESCE(meeting_notes, '') || ' [CANCELLED BY CUSTOMER]'
            WHERE customer_id = $1 AND product_id = $2 AND status = 'Completed'
        `, [customerId, offer.product_id]);

        await client.query('COMMIT');

        return res.json({ success: true, message: "Deal rejected. Stock has been restored." });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};
