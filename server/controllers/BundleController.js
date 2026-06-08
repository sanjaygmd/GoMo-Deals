import { pool } from '../config/db.js';

// POST /api/v1/bundles
export const createBundle = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id: seller_id } = req.user;
        const { title, description, discount_percentage, product_ids } = req.body;

        if (!title || !product_ids || !Array.isArray(product_ids) || product_ids.length < 2) {
            return res.status(400).json({ success: false, message: 'Invalid bundle data. Need title and at least 2 products.' });
        }

        await client.query('BEGIN');

        // Verify products belong to seller
        const productsCheck = await client.query(`
            SELECT product_id FROM products WHERE product_id = ANY($1) AND seller_id = $2
        `, [product_ids, seller_id]);

        if (productsCheck.rows.length !== product_ids.length) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'One or more products do not belong to you or are invalid.' });
        }

        // Create bundle
        const bundleRes = await client.query(`
            INSERT INTO product_bundles (seller_id, title, description, discount_percentage)
            VALUES ($1, $2, $3, $4)
            RETURNING bundle_id
        `, [seller_id, title, description, discount_percentage]);

        const bundle_id = bundleRes.rows[0].bundle_id;

        // Insert bundle items
        for (const pid of product_ids) {
            await client.query(`
                INSERT INTO bundle_items (bundle_id, product_id) VALUES ($1, $2)
            `, [bundle_id, pid]);
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Bundle created successfully', bundle_id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('CREATE BUNDLE ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to create bundle' });
    } finally {
        client.release();
    }
};

// GET /api/v1/bundles/seller
export const getSellerBundles = async (req, res) => {
    try {
        const { id: seller_id } = req.user;
        
        const result = await pool.query(`
            SELECT pb.*, 
                   COALESCE(json_agg(json_build_object(
                       'product_id', p.product_id,
                       'name', p.name,
                       'price', p.price,
                       'thumbnail', p.images[1]
                   )) FILTER (WHERE p.product_id IS NOT NULL), '[]') as items
            FROM product_bundles pb
            LEFT JOIN bundle_items bi ON pb.bundle_id = bi.bundle_id
            LEFT JOIN products p ON bi.product_id = p.product_id
            WHERE pb.seller_id = $1
            GROUP BY pb.bundle_id
            ORDER BY pb.created_at DESC
        `, [seller_id]);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('GET SELLER BUNDLES ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch bundles' });
    }
};

// GET /api/v1/bundles/product/:product_id
export const getProductBundles = async (req, res) => {
    try {
        const { product_id } = req.params;

        // Find active bundles that contain this product
        const result = await pool.query(`
            SELECT pb.*, 
                   COALESCE(json_agg(json_build_object(
                       'product_id', p.product_id,
                       'name', p.name,
                       'price', p.price,
                       'thumbnail', p.images[1]
                   )) FILTER (WHERE p.product_id IS NOT NULL), '[]') as items
            FROM product_bundles pb
            JOIN bundle_items target_bi ON pb.bundle_id = target_bi.bundle_id AND target_bi.product_id = $1
            LEFT JOIN bundle_items bi ON pb.bundle_id = bi.bundle_id
            LEFT JOIN products p ON bi.product_id = p.product_id
            WHERE pb.is_active = TRUE
            GROUP BY pb.bundle_id
        `, [product_id]);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('GET PRODUCT BUNDLES ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch product bundles' });
    }
};

// DELETE /api/v1/bundles/:bundle_id
export const deleteBundle = async (req, res) => {
    try {
        const { id: seller_id } = req.user;
        const { bundle_id } = req.params;

        const result = await pool.query(`
            DELETE FROM product_bundles 
            WHERE bundle_id = $1 AND seller_id = $2
            RETURNING bundle_id
        `, [bundle_id, seller_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bundle not found or unauthorized' });
        }

        return res.status(200).json({ success: true, message: 'Bundle deleted successfully' });
    } catch (error) {
        console.error('DELETE BUNDLE ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete bundle' });
    }
};

// PUT /api/v1/bundles/:bundle_id/toggle
export const toggleBundleStatus = async (req, res) => {
    try {
        const { id: seller_id } = req.user;
        const { bundle_id } = req.params;

        const result = await pool.query(`
            UPDATE product_bundles 
            SET is_active = NOT is_active, updated_at = NOW()
            WHERE bundle_id = $1 AND seller_id = $2
            RETURNING is_active
        `, [bundle_id, seller_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bundle not found or unauthorized' });
        }

        return res.status(200).json({ success: true, is_active: result.rows[0].is_active });
    } catch (error) {
        console.error('TOGGLE BUNDLE ERROR:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle bundle status' });
    }
};
