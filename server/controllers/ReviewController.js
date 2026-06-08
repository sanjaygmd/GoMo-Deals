import { pool } from "../config/db.js";
import { sanitizeText } from "../utils/sanitizer.js";


// Get all reviews with product and customer details (Admin)
export const getAllReviews = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                r.*, 
                p.name as product_name, 
                c.full_name as customer_name,
                c.email as customer_email
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            JOIN customers c ON r.customer_id = c.customer_id
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// Get reviews for seller's products (Seller)
export const getSellerReviews = async (req, res, next) => {
    try {
        const seller_id = req.user.id;
        const query = `
            SELECT 
                r.*, 
                p.name as product_name, 
                c.full_name as customer_name
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            JOIN customers c ON r.customer_id = c.customer_id
            WHERE p.seller_id = $1
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(query, [seller_id]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};


// Delete a review (Admin)
export const deleteReview = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM reviews WHERE review_id = $1 RETURNING review_id", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        return res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        next(error);
    }
};


// Get reviews for a specific product (Public/Seller)
export const getProductReviews = async (req, res, next) => {
    const { productId } = req.params;
    const { variantId } = req.query; // Optional variant filter

    try {
        let query = `
            SELECT 
                r.*, 
                c.full_name as customer_name,
                pv.variant_name,
                pv.variant_value
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            LEFT JOIN product_variants pv ON r.variant_id = pv.variant_id
            WHERE r.product_id = $1
        `;
        const params = [productId];

        // If a specific variantId is provided, filter strictly by it.
        // If no variantId is provided, show ALL reviews for the product (Aggregator mode).
        if (variantId && variantId !== 'null') {
            query += ` AND r.variant_id = $2`;
            params.push(variantId);
        }

        query += ` ORDER BY r.created_at DESC`;
        
        const result = await pool.query(query, params);
        
        const sanitizedRows = result.rows.map(row => {
            const names = row.customer_name ? row.customer_name.split(' ') : ['Guest'];
            return {
                ...row,
                customer_name: names[0] + (names.length > 1 ? ' ' + names[1].charAt(0) + '.' : '')
            };
        });

        return res.status(200).json({ success: true, data: sanitizedRows });
    } catch (error) {
        next(error);
    }
};

// Add a new review (Customer)
export const addReview = async (req, res, next) => {
    const { product_id, order_item_id, rating, title, body, variant_id } = req.body;
    const customer_id = req.user.id; // From verifyToken middleware

    const cleanTitle = sanitizeText(title);
    const cleanBody = sanitizeText(body);

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
    }

    try {
        // Security Fix: Check if customer has a verified purchase for this product
        const purchaseCheck = await pool.query(
            `SELECT oi.order_item_id
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.order_id
             WHERE o.customer_id = $1 
               AND oi.product_id = $2 
               AND o.order_status = 'Delivered'
             LIMIT 1`,
            [customer_id, product_id]
        );

        if (purchaseCheck.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "Only customers with a 'Delivered' order can post reviews." 
            });
        }

        // Check if review already exists for this product by this customer
        const existing = await pool.query(
            "SELECT * FROM reviews WHERE product_id = $1 AND customer_id = $2",
            [product_id, customer_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product" });
        }

        const query = `
            INSERT INTO reviews (review_id, product_id, customer_id, order_item_id, rating, title, body, created_at, variant_id)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), $7)
            RETURNING *
        `;
        const result = await pool.query(query, [product_id, customer_id, order_item_id, parsedRating, cleanTitle, cleanBody, variant_id || null]);
        
        return res.status(201).json({ success: true, message: "Review submitted successfully", data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};


// Check if customer can review a product
export const checkCanReview = async (req, res, next) => {
    const { productId } = req.params;
    const customer_id = req.user.id;

    try {
        // First check if they already reviewed this product
        const alreadyReviewed = await pool.query(
            "SELECT * FROM reviews WHERE customer_id = $1 AND product_id = $2",
            [customer_id, productId]
        );

        if (alreadyReviewed.rows.length > 0) {
            return res.status(200).json({ 
                success: true, 
                canReview: false, 
                alreadyReviewed: true,
                review: alreadyReviewed.rows[0]
            });
        }

        // Find an order item for this product that doesn't have a review yet
        const query = `
            SELECT oi.order_item_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.customer_id = $1 
               AND oi.product_id = $2 
               AND o.order_status = 'Delivered'
            LIMIT 1
        `;
        const result = await pool.query(query, [customer_id, productId]);

        if (result.rows.length > 0) {
            return res.status(200).json({ success: true, canReview: true, orderItemId: result.rows[0].order_item_id });
        } else {
            return res.status(200).json({ success: true, canReview: false });
        }
    } catch (error) {
        next(error);
    }
};

// Update a review (Customer)
export const updateReview = async (req, res, next) => {
    const { id } = req.params;
    const { rating, title, body } = req.body;
    const customer_id = req.user.id;

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
    }

    try {
        // Ensure the review belongs to the customer
        const check = await pool.query("SELECT * FROM reviews WHERE review_id = $1 AND customer_id = $2", [id, customer_id]);
        if (check.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this review" });
        }

        const cleanTitle = sanitizeText(title);
        const cleanBody = sanitizeText(body);

        const query = `
            UPDATE reviews 
            SET rating = $1, title = $2, body = $3, updated_at = NOW()
            WHERE review_id = $4
            RETURNING *
        `;
        const result = await pool.query(query, [parsedRating, cleanTitle, cleanBody, id]);
        return res.status(200).json({ success: true, message: "Review updated successfully", data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Admin: Moderate a review (Approve/Reject)
export const moderateReview = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    try {
        const result = await pool.query(
            "UPDATE reviews SET status = $1, updated_at = NOW() WHERE review_id = $2 RETURNING *",
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        return res.status(200).json({ success: true, message: `Review ${status} successfully`, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Seller: Reply to a review
export const replyToReview = async (req, res, next) => {
    const { id } = req.params;
    const { seller_reply } = req.body;
    const seller_id = req.user.id;

    if (!seller_reply || seller_reply.trim() === '') {
        return res.status(400).json({ success: false, message: "Reply cannot be empty" });
    }

    try {
        // Ensure review belongs to a product owned by the seller
        const reviewCheck = await pool.query(`
            SELECT r.review_id 
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            WHERE r.review_id = $1 AND p.seller_id = $2
        `, [id, seller_id]);

        if (reviewCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or review not found" });
        }

        const cleanReply = sanitizeText(seller_reply);

        const result = await pool.query(
            "UPDATE reviews SET seller_reply = $1, updated_at = NOW() WHERE review_id = $2 RETURNING *",
            [cleanReply, id]
        );

        return res.status(200).json({ success: true, message: "Replied to review successfully", data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};




