import { pool } from "../config/db.js";
import { logAction } from "../utils/auditLogger.js";
import { sanitizeText, sanitizeDescription, isValidImageUrl } from "../utils/sanitizer.js";
import { sendRestockNotificationEmail } from "../utils/mailer.js";
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

export const addProduct = async (req, res) => {
    try {
        const {
            category_id,
            seller_id,
            name,
            description,
            sku,
            price,
            mrp,
            stock_quantity,
            weight,
            length,
            breadth,
            height,
            brand,
            images, // Array of { url, variantTempId }
            slug,
            variants, // Array of { tempId, name, value, price, stock, weight }
            color,
            size,
            room,
            discount_percent,
            recipient,
            occasion
        } = req.body;

        if (!name || !price || !category_id) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing (name, price, category_id)"
            });
        }

        // Validate image URLs to prevent SSRF and Content-Injection
        if (images && Array.isArray(images)) {
            for (const img of images) {
                const url = typeof img === 'string' ? img : img.url;
                if (!isValidImageUrl(url)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid image URL format or unsafe protocol/host detected."
                    });
                }
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const sellerIdToUse = req.user.type === 'seller' ? req.user.id : (seller_id || null);

        const cleanName = sanitizeText(name);
        const cleanBrand = sanitizeText(brand);
        const cleanRecipient = sanitizeText(recipient);
        const cleanOccasion = sanitizeText(occasion);
        const cleanDescription = sanitizeDescription(description);

        const productResult = await client.query(
            `INSERT INTO products 
            (product_id, category_id, seller_id, name, description, sku, price, mrp, stock_quantity, weight, length, breadth, height, brand, images, slug, color, size, room, discount_percent, recipient, occasion, is_active) 
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true) 
            RETURNING *`,
            [
                category_id,
                sellerIdToUse,
                cleanName,
                cleanDescription,
                sku,
                price,
                mrp,
                stock_quantity || 0,
                weight || 0,
                length || 0,
                breadth || 0,
                height || 0,
                cleanBrand,
                (images && images.length > 0) ? images.map(img => typeof img === 'string' ? img : img.url) : [],
                slug || cleanName.toLowerCase().replace(/\s+/g, '-') + '-' + crypto.randomBytes(4).toString('hex'),
                color,
                size,
                room || cleanOccasion, // Support both for now
                discount_percent || 0,
                cleanRecipient,
                cleanOccasion
            ]
        );

            const product = productResult.rows[0];

            // Insert into product_variants and keep map of tempId -> variant_id
            const variantMap = {};
            if (variants && variants.length > 0) {
                for (const variant of variants) {
                    const variantSku = variant.sku || `${product.sku}-var-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                    const vRes = await client.query(
                        `INSERT INTO product_variants (variant_id, product_id, sku, variant_name, variant_value, price, stock_quantity, weight, name) 
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) 
                        RETURNING variant_id`,
                        [
                            product.product_id,
                            variantSku,
                            variant.name,
                            variant.value,
                            (variant.price || variant.price === 0) ? variant.price : product.price,
                            (variant.stock || variant.stock === 0) ? variant.stock : product.stock_quantity,
                            (variant.weight || variant.weight === 0) ? variant.weight : product.weight,
                            product.name // Default variant name to parent name at creation
                        ]
                    );
                    if (variant.tempId) {
                        variantMap[variant.tempId] = vRes.rows[0].variant_id;
                    }
                }
            }

            // Insert into product_images
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    const imageUrl = typeof img === 'string' ? img : img.url;
                    const variantId = (typeof img === 'object' && img.variantTempId) ? variantMap[img.variantTempId] : null;

                    await client.query(
                        `INSERT INTO product_images (image_id, product_id, image_url, is_primary, sort_order, variant_id) 
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                        [product.product_id, imageUrl, i === 0, i, variantId]
                    );
                }
            }

            // Log the action (Atomic within transaction)
            await logAction(req, 'ADD_PRODUCT', { product_id: product.product_id, name: product.name }, client);

            await client.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Product added successfully',
                data: product
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("ADD PRODUCT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    }
};

export const getProducts = async (req, res) => {
    try {
        const { seller_id } = req.query;

        let query = `
            SELECT p.*, 
            c.name as category_name,
            c.parent_category_id,
            (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.deleted_at IS NULL
        `;
        const queryParams = [];

        if (seller_id && seller_id !== 'null' && seller_id !== 'undefined' && seller_id !== '') {
            query += ` AND p.seller_id = $1::uuid`;
            queryParams.push(seller_id);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        let countQuery = `SELECT COUNT(*) FROM products p WHERE p.deleted_at IS NULL`;
        const countParams = [];
        if (seller_id && seller_id !== 'null' && seller_id !== 'undefined' && seller_id !== '') {
            countQuery += ` AND p.seller_id = $1::uuid`;
            countParams.push(seller_id);
        }
        const countRes = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countRes.rows[0].count);

        query += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        return res.status(200).json({
            success: true,
            message: 'Getting all products successful',
            data: result.rows,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    }
};

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM categories WHERE is_active = true ORDER BY name ASC");
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("PRODUCT API ERROR:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getProductsById = async (req, res) => {
    try {
        const { product_id } = req.params;
        const result = await pool.query(`
            SELECT p.*, 
            c.name as category_name,
            c.parent_category_id,
            (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = $1
        `, [product_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Getting product by id successful',
            data: result.rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });

    }
};

export const addVariants = async (req, res) => {
    try {
        const { product_id, variants } = req.body;

        if (!product_id || !variants || !Array.isArray(variants)) {
            return res.status(400).json({
                success: false,
                message: "Product ID and variants array are required"
            });
        }

        // Ownership Check
        const pCheck = await pool.query('SELECT seller_id FROM products WHERE product_id = $1', [product_id]);
        if (pCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (req.user.type === 'seller' && pCheck.rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized. This product does not belong to your store catalog." });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const variant of variants) {
                const res = await client.query(
                    `INSERT INTO product_variants (variant_id, product_id, sku, variant_name, variant_value, price, stock_quantity, weight, name) 
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, (SELECT name FROM products WHERE product_id = $1)) 
                    RETURNING *`,
                    [product_id, variant.sku, variant.name, variant.value, variant.price, variant.stock || 0, variant.weight]
                );
                results.push(res.rows[0]);
            }

            await client.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Variants added successfully',
                data: results
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("ADD VARIANTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query(`
            SELECT p.*, 
            c.name as category_name,
            c.parent_category_id,
            (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.slug = $1 AND p.deleted_at IS NULL
        `, [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: "Getting product by slug successful",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("GET PRODUCT BY SLUG ERROR:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const updateProduct = async (req, res) => {

    const { product_id } = req.params;
    const {
        name, description, price, mrp, stock_quantity,
        brand, category_id, room, discount_percent, sku,
        weight, length, breadth, height, variants, // Array of variants to sync
        recipient, occasion, is_active, images,
        color, size
    } = req.body;

    // Validate image URLs to prevent SSRF and Content-Injection
    if (images && Array.isArray(images)) {
        for (const img of images) {
            const url = typeof img === 'string' ? img : img.url;
            if (!isValidImageUrl(url)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image URL format or unsafe protocol/host detected."
                });
            }
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ownership Check: Only the owner (seller) or an admin can update
        const ownershipCheck = await client.query("SELECT seller_id, stock_quantity, name, slug FROM products WHERE product_id = $1", [product_id]);
        if (ownershipCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (req.user.type === 'seller' && ownershipCheck.rows[0].seller_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this product' });
        }

        const cleanName = name ? sanitizeText(name) : name;
        const cleanBrand = brand ? sanitizeText(brand) : brand;
        const cleanRecipient = recipient ? sanitizeText(recipient) : recipient;
        const cleanOccasion = occasion ? sanitizeText(occasion) : occasion;
        const cleanDescription = description ? sanitizeDescription(description) : description;
        const cleanColor = color ? sanitizeText(color) : color;
        const cleanSize = size ? sanitizeText(size) : size;

        const dbImagesArray = images ? images.map(img => typeof img === 'string' ? img : img.url) : null;

        // 1. Update the base product record
        const result = await client.query(
            `UPDATE products 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description), 
                 price = COALESCE($3, price), 
                 mrp = COALESCE($4, mrp), 
                 stock_quantity = COALESCE($5, stock_quantity), 
                 brand = COALESCE($6, brand), 
                 category_id = COALESCE($7, category_id), 
                 room = COALESCE($8, room), 
                 discount_percent = COALESCE($9, discount_percent), 
                 sku = COALESCE($10, sku),
                 weight = COALESCE($11, weight), 
                 length = COALESCE($12, length), 
                 breadth = COALESCE($13, breadth), 
                 height = COALESCE($14, height),
                 recipient = COALESCE($15, recipient),
                 occasion = COALESCE($16, occasion),
                 is_active = COALESCE($17, is_active),
                 images = COALESCE($18, images),
                 color = COALESCE($19, color),
                 size = COALESCE($20, size),
                 updated_at = NOW()
             WHERE product_id = $21 RETURNING *`,
            [
                cleanName, cleanDescription, price, mrp, stock_quantity,
                cleanBrand, category_id, room || cleanOccasion, discount_percent, sku,
                weight, length, breadth, height,
                cleanRecipient, cleanOccasion, is_active,
                dbImagesArray,
                cleanColor, cleanSize,
                product_id
            ]
        );

        const product = result.rows[0];

        // Restock Notification Logic
        if (Number(ownershipCheck.rows[0].stock_quantity) === 0 && Number(stock_quantity) > 0) {
            const pName = ownershipCheck.rows[0].name;
            const pSlug = ownershipCheck.rows[0].slug;
            const pUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${product_id}`;
            
            client.query(`
                SELECT c.email, c.full_name 
                FROM wishlist_items wi 
                JOIN wishlist w ON wi.wishlist_id = w.wishlist_id 
                JOIN customers c ON w.customer_id = c.customer_id 
                WHERE wi.product_id = $1
                GROUP BY c.email, c.full_name
            `, [product_id]).then(res => {
                res.rows.forEach(customer => {
                    sendRestockNotificationEmail(customer.email, customer.full_name || 'Customer', pName, pUrl);
                });
            }).catch(err => console.error("Error triggering restock emails:", err));
        }

        // Sync Product Images Table
        if (images && Array.isArray(images)) {
            await client.query('DELETE FROM product_images WHERE product_id = $1', [product_id]);
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const imageUrl = typeof img === 'string' ? img : img.url;
                const variantId = (typeof img === 'object' && img.variant_id) ? img.variant_id : null;

                await client.query(
                    `INSERT INTO product_images (image_id, product_id, image_url, is_primary, sort_order, variant_id) 
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                    [product_id, imageUrl, i === 0, i, variantId]
                );
            }
        }


        // 2. Sync Variants (Smart Sync)
        if (variants && Array.isArray(variants)) {
            const incomingIds = variants.map(v => v.variant_id || v.id || v.tempId).filter(id => id && !String(id).startsWith('v_'));

            // A. Handle existing/updated variants and inserts
            for (const v of variants) {
                const vid = (v.variant_id || v.id || v.tempId);
                const isNew = !vid || String(vid).startsWith('v_');
                const variantSku = v.sku || `${sku || result.rows[0].sku}-var-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                if (isNew) {
                    await client.query(
                        `INSERT INTO product_variants (variant_id, product_id, sku, variant_name, variant_value, price, stock_quantity, weight, name) 
                         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            product_id,
                            variantSku,
                            v.variant_name || v.name || 'Variant',
                            v.variant_value || v.value || 'Standard',
                            v.price || price,
                            v.stock_quantity || v.stock || 0,
                            v.weight || 0,
                            name || result.rows[0].name // Use new parent name if provided, else existing
                        ]
                    );
                } else {
                    await client.query(
                        `UPDATE product_variants 
                         SET variant_name = $1, variant_value = $2, price = $3, stock_quantity = $4, weight = $5, sku = $6
                         WHERE variant_id = $7 AND product_id = $8`,
                        [v.variant_name || v.name || 'Variant', v.variant_value || v.value || 'Standard', v.price || price, v.stock_quantity || v.stock || 0, v.weight || 0, variantSku, vid, product_id]
                    );
                }
            }

            // B. Clean up removed variants (Only if NOT used in orders)
            if (incomingIds.length > 0) {
                // Find variants that were NOT in the incoming payload
                const toRemoveRes = await client.query(
                    `SELECT variant_id FROM product_variants 
                     WHERE product_id = $1 AND variant_id NOT IN (${incomingIds.map((_, i) => `$${i + 2}`).join(',')})`,
                    [product_id, ...incomingIds]
                );

                for (const row of toRemoveRes.rows) {
                    try {
                        await client.query('DELETE FROM product_variants WHERE variant_id = $1', [row.variant_id]);
                    } catch (err) {
                        console.warn(`Could not delete variant ${row.variant_id} due to dependencies (likely orders). Keeping as legacy data.`);
                    }
                }
            } else if (variants.length === 0) {
                // If the user removed ALL variants, try to delete all
                const allVariants = await client.query(`SELECT variant_id FROM product_variants WHERE product_id = $1`, [product_id]);
                for (const row of allVariants.rows) {
                    try {
                        await client.query('DELETE FROM product_variants WHERE variant_id = $1', [row.variant_id]);
                    } catch (err) {
                        console.warn(`Could not delete variant ${row.variant_id} due to dependencies.`);
                    }
                }
            }
        }

        // 3. Log the action
        // 3. Log the action (Atomic within transaction)
        await logAction(req, 'UPDATE_PRODUCT', { product_id, updates: req.body }, client);

        // 4. Fetch full product with joins to return to frontend
        const fullProduct = await client.query(`
            SELECT p.*, 
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            WHERE p.product_id = $1
        `, [product_id]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Product family updated successfully',
            data: fullProduct.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('UPDATE PRODUCT FAMILY ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error updating product family' });
    } finally {
        client.release();
    }
}

export const deleteProduct = async (req, res) => {
    const { product_id } = req.params;

    try {
        // Ownership Check FIRST
        const prodCheck = await pool.query('SELECT seller_id FROM products WHERE product_id = $1', [product_id]);

        if (prodCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = prodCheck.rows[0];

        if (req.user.type === 'seller' && product.seller_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this product' });
        }

        const result = await pool.query('UPDATE products SET deleted_at = NOW(), is_active = false WHERE product_id = $1 RETURNING *', [product_id]);

        // Log the action
        await logAction(req, 'DELETE_PRODUCT', { product_id, product: result.rows[0] });

        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error deleting product' });
    }
}

export const updateVariant = async (req, res) => {
    const { variant_id } = req.params;
    const body = req.body;

    const {
        variant_name, variant_value, price, stock_quantity, sku, weight,
        name, description, brand, category_id, room
    } = body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Ownership Check (Before Update)
        const vCheck = await client.query("SELECT product_id, stock_quantity, variant_name, variant_value FROM product_variants WHERE variant_id = $1", [variant_id]);
        if (vCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        const prodCheck = await client.query("SELECT seller_id FROM products WHERE product_id = $1", [vCheck.rows[0].product_id]);
        if (req.user.type === 'seller' && prodCheck.rows[0]?.seller_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own the parent product of this variant' });
        }

        // 2. Update the variant record
        const vResult = await client.query(
            `UPDATE product_variants 
             SET name = COALESCE(NULLIF($1, ''), name), 
                 variant_name = COALESCE(NULLIF($2, ''), variant_name), 
                 variant_value = COALESCE(NULLIF($3, ''), variant_value), 
                 price = COALESCE($4, price), 
                 stock_quantity = COALESCE($5, stock_quantity), 
                 sku = COALESCE(NULLIF($6, ''), sku),
                 weight = COALESCE($7, weight)
             WHERE variant_id = $8 RETURNING *`,
            [
                name, 
                variant_name,
                variant_value,
                (price === "" || price === undefined) ? null : price,
                (stock_quantity === "" || stock_quantity === undefined) ? null : stock_quantity,
                sku,
                (weight === "" || weight === undefined) ? null : weight,
                variant_id
            ]
        );

        const variant = vResult.rows[0];

        // Restock Notification Logic
        if (Number(vCheck.rows[0].stock_quantity) === 0 && Number(stock_quantity) > 0) {
            const pName = `${name || 'Product'} - ${vCheck.rows[0].variant_value}`;
            const pUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/product/${variant.product_id}`;
            
            client.query(`
                SELECT c.email, c.full_name 
                FROM wishlist_items wi 
                JOIN wishlist w ON wi.wishlist_id = w.wishlist_id 
                JOIN customers c ON w.customer_id = c.customer_id 
                WHERE wi.product_id = $1 AND (wi.variant_id = $2 OR wi.variant_id IS NULL)
                GROUP BY c.email, c.full_name
            `, [variant.product_id, variant_id]).then(res => {
                res.rows.forEach(customer => {
                    sendRestockNotificationEmail(customer.email, customer.full_name || 'Customer', pName, pUrl);
                });
            }).catch(err => console.error("Error triggering restock emails:", err));
        }

        // 2. Log the action
        // 2. Log the action (Atomic within transaction)
        await logAction(req, 'UPDATE_VARIANT', { variant_id, product_id: variant.product_id, updates: req.body }, client);

        // 3. Fetch full refreshed product family
        const fullProduct = await client.query(`
            SELECT p.*, 
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            WHERE p.product_id = $1
        `, [variant.product_id]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Variant and base product updated successfully',
            data: fullProduct.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('UPDATE PRODUCT VARIANT FAMILY ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error updating product variant family' });
    } finally {
        client.release();
    }
}

export const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const queryText = `
            SELECT p.*, 
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            WHERE p.is_active = true 
            AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.brand ILIKE $1)
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(queryText, [`%${q}%`]);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("SEARCH PRODUCTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getAllAdminProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM products WHERE deleted_at IS NULL`;
        const countResult = await pool.query(countQuery);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const query = `
            SELECT p.*, s.store_name as seller_name,
            c.name as category_name,
            c.parent_category_id,
            (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN sellers s ON p.seller_id = s.seller_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.deleted_at IS NULL
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await pool.query(query, [limit, offset]);
        
        const products = result.rows.map(p => ({
            ...p,
            id: p.product_id,
            thumbnail: p.pi_images && p.pi_images.length > 0 ? p.pi_images[0].image_url : (p.images && p.images.length > 0 ? p.images[0] : null),
            stock: p.stock_quantity || 0,
            status: p.is_active ? "Active" : "Inactive"
        }));

        return res.status(200).json({ 
            success: true, 
            data: products,
            pagination: {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: page,
                limit
            }
        });
    } catch (error) {
        console.error("GET ALL ADMIN PRODUCTS ERROR:", error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getProductStats = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE stock_quantity > 0) as in_stock,
                COUNT(*) FILTER (WHERE stock_quantity = 0) as out_of_stock,
                (SELECT COUNT(*) FROM categories WHERE is_active = true) as total_categories,
                COALESCE(AVG(price), 0) as avg_price
            FROM products
            WHERE deleted_at IS NULL
        `;
        const statsResult = await pool.query(statsQuery);
        return res.status(200).json({ success: true, data: statsResult.rows[0] });
    } catch (error) {
        console.error("GET PRODUCT STATS ERROR:", error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const bulkUploadProducts = async (req, res) => {
    try {
        const seller_id = req.user.type === 'seller' ? req.user.id : req.body.seller_id;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No CSV file uploaded." });
        }

        const csvData = req.file.buffer.toString('utf-8');
        
        let records;
        try {
            records = parse(csvData, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } catch (parseError) {
            return res.status(400).json({ success: false, message: `Invalid CSV format: ${parseError.message}` });
        }

        if (records.length === 0) {
            return res.status(400).json({ success: false, message: "The CSV file is empty." });
        }

        // Pre-validate required fields for all rows
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            if (!row.name || !row.price || !row.category_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Row ${i + 1} is missing required fields (name, price, category_id).` 
                });
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const insertedProducts = [];

            for (const row of records) {
                const cleanName = sanitizeText(row.name);
                const cleanDescription = row.description ? sanitizeDescription(row.description) : null;
                const cleanBrand = row.brand ? sanitizeText(row.brand) : null;
                
                // Allow dynamic slugs or auto-generate
                const slug = row.slug || cleanName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7);

                const productResult = await client.query(
                    `INSERT INTO products 
                    (product_id, category_id, seller_id, name, description, sku, price, mrp, stock_quantity, weight, length, breadth, height, brand, slug, is_active) 
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true) 
                    RETURNING product_id, name`,
                    [
                        row.category_id,
                        seller_id,
                        cleanName,
                        cleanDescription,
                        row.sku || null,
                        parseFloat(row.price),
                        row.mrp ? parseFloat(row.mrp) : null,
                        row.stock_quantity ? parseInt(row.stock_quantity, 10) : 0,
                        row.weight ? parseFloat(row.weight) : 0,
                        row.length ? parseFloat(row.length) : 0,
                        row.breadth ? parseFloat(row.breadth) : 0,
                        row.height ? parseFloat(row.height) : 0,
                        cleanBrand,
                        slug
                    ]
                );
                
                insertedProducts.push(productResult.rows[0]);
            }

            await client.query('COMMIT');

            if (seller_id) {
                await logAction(seller_id, "BULK_UPLOAD_PRODUCTS", { count: records.length }, null, req.ip);
            }

            return res.status(201).json({
                success: true,
                message: `Successfully uploaded and created ${records.length} products.`,
                data: insertedProducts
            });

        } catch (dbError) {
            await client.query('ROLLBACK');
            console.error("BULK UPLOAD DB ERROR:", dbError);
            return res.status(500).json({ success: false, message: `Database error during import: ${dbError.message}` });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("BULK UPLOAD FATAL ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error during bulk upload." });
    }
};

export const getVendorComparison = async (req, res) => {
    try {
        const { product_id } = req.params;
        const result = await pool.query('SELECT name, brand, price, rating FROM products WHERE product_id = $1', [product_id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
        
        const product = result.rows[0];
        const basePrice = Number(product.price);
        const baseRating = Number(product.rating) || 4.2;

        let vendors = null;

        // Try to fetch accurate real-world data using Gemini API with Google Search Grounding
        if (process.env.GEMINI_API_KEY) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    tools: [{ googleSearch: {} }] 
                });
                
                const prompt = `You are a real-time price API. I will give you a product name, brand, and its price on GoMo Deals (INR).
Your task is to use Google Search to find the EXACT REAL-WORLD current prices for this product on Amazon India, Flipkart, and Meesho.
If the product is extremely unlikely to be available on a specific platform (e.g. Meesho mostly has unbranded/local goods), set "available" to false for that platform.
Also provide an "exactSearchQuery" which is a highly specific search string (e.g. "Apple Watch Series 9 45mm Midnight") that will guarantee finding this exact item, avoiding generic searches.
Respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or backticks:
{
  "amazon": { "available": boolean, "price": number, "rating": number, "delivery": "string", "exactSearchQuery": "string" },
  "flipkart": { "available": boolean, "price": number, "rating": number, "delivery": "string", "exactSearchQuery": "string" },
  "meesho": { "available": boolean, "price": number, "rating": number, "delivery": "string", "exactSearchQuery": "string" }
}

Product Name: ${product.name}
Brand: ${product.brand || 'Generic/Unknown'}
GoMo Deals Price: ${basePrice} INR
GoMo Deals Rating: ${baseRating}`;

                const aiResult = await model.generateContent(prompt);
                let responseText = aiResult.response.text().trim();
                
                // Clean up potential markdown formatting from the response
                if (responseText.startsWith('```json')) {
                    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                } else if (responseText.startsWith('```')) {
                    responseText = responseText.replace(/```/g, '').trim();
                }

                vendors = JSON.parse(responseText);
                
                // Validate parsed JSON structure quickly
                if (!vendors.amazon || typeof vendors.amazon.available !== 'boolean') vendors = null; 

            } catch (aiError) {
                console.warn("Gemini pricing fetch failed, falling back to dynamic generation:", aiError.message);
            }
        }

        // Fallback to dynamic random generation if Gemini fails or is not available
        if (!vendors) {
            const genericSearchQuery = `${product.brand ? product.brand + ' ' : ''}${product.name}`;
            vendors = {
                amazon: {
                    available: true,
                    price: basePrice * (1 + (Math.random() * 0.15 + 0.05)),
                    rating: Math.max(1, baseRating - (Math.random() * 0.4)),
                    delivery: `${Math.floor(Math.random() * 3) + 2}-${Math.floor(Math.random() * 3) + 4} Days`,
                    exactSearchQuery: genericSearchQuery
                },
                flipkart: {
                    available: true,
                    price: basePrice * (1 + (Math.random() * 0.12 + 0.02)),
                    rating: Math.max(1, baseRating - (Math.random() * 0.3)),
                    delivery: `${Math.floor(Math.random() * 2) + 3}-${Math.floor(Math.random() * 3) + 5} Days`,
                    exactSearchQuery: genericSearchQuery
                },
                meesho: {
                    available: basePrice < 5000,
                    price: basePrice * (1 - (Math.random() * 0.05)),
                    rating: Math.max(1, baseRating - (Math.random() * 0.8)),
                    delivery: `${Math.floor(Math.random() * 4) + 4}-${Math.floor(Math.random() * 4) + 7} Days`,
                    exactSearchQuery: genericSearchQuery
                }
            };
        }

        return res.status(200).json({ success: true, data: vendors });

    } catch (error) {
        console.error("VENDOR COMPARE ERROR:", error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const performVisualSearch = async (req, res) => {
    try {
        const { imgUrl } = req.body;
        if (!imgUrl) return res.status(400).json({ success: false, message: 'Image URL is required' });

        let base64Image = '';
        let mimeType = 'image/jpeg';

        if (imgUrl.startsWith('data:image')) {
            const base64Index = imgUrl.indexOf('base64,');
            if (base64Index !== -1) {
                const header = imgUrl.substring(0, base64Index);
                mimeType = header.split(';')[0].replace('data:', '');
                base64Image = imgUrl.substring(base64Index + 7);
            }
        } else {
            // It's a URL (either absolute or relative)
            const targetUrl = imgUrl.startsWith('http') ? imgUrl : `http://localhost:${process.env.PORT || 3000}${imgUrl}`;
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            const arrayBuffer = await response.arrayBuffer();
            base64Image = Buffer.from(arrayBuffer).toString('base64');
            mimeType = response.headers.get('content-type') || 'image/jpeg';
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Identify the exact product shown in this image. Respond ONLY with the specific brand and model name (e.g., 'Apple iPhone 15 Pro Max', 'Nike Air Jordan 1 High OG', 'Sony WH-1000XM5'). Do not include any other words.";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType } }
        ]);

        const text = result.response.text().trim();
        return res.status(200).json({ success: true, query: text });

    } catch (error) {
        console.error("VISUAL SEARCH ERROR:", error);
        return res.status(500).json({ success: false, message: 'Visual search failed: ' + (error.message || 'Unknown error') });
    }
};