import { pool } from '../config/db.js';

export const createBanner = async (req, res) => {
    try {
        const { brand_name, image_url, target_url, start_date, end_date } = req.body;
        
        if (!brand_name || !image_url) {
            return res.status(400).json({ success: false, message: 'Brand name and Image URL are required' });
        }

        const query = `
            INSERT INTO ad_banners (brand_name, image_url, target_url, start_date, end_date) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *;
        `;
        const values = [brand_name, image_url, target_url, start_date || null, end_date || null];
        
        const result = await pool.query(query, values);
        res.status(201).json({ success: true, banner: result.rows[0], message: 'Banner created successfully' });
    } catch (error) {
        console.error('Error in createBanner:', error);
        res.status(500).json({ success: false, message: 'Failed to create banner' });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, image_url, target_url, is_active, start_date, end_date } = req.body;

        const result = await pool.query(`
            UPDATE ad_banners 
            SET brand_name = COALESCE($1, brand_name),
                image_url = COALESCE($2, image_url),
                target_url = COALESCE($3, target_url),
                is_active = COALESCE($4, is_active),
                start_date = COALESCE($5, start_date),
                end_date = COALESCE($6, end_date)
            WHERE banner_id = $7 
            RETURNING *;
        `, [brand_name, image_url, target_url, is_active, start_date, end_date, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        res.json({ success: true, banner: result.rows[0], message: 'Banner updated successfully' });
    } catch (error) {
        console.error('Error in updateBanner:', error);
        res.status(500).json({ success: false, message: 'Failed to update banner' });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM ad_banners WHERE banner_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }
        
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error in deleteBanner:', error);
        res.status(500).json({ success: false, message: 'Failed to delete banner' });
    }
};

export const getAdminBanners = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ad_banners ORDER BY created_at DESC');
        res.json({ success: true, banners: result.rows });
    } catch (error) {
        console.error('Error in getAdminBanners:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banners' });
    }
};

export const getActiveBanners = async (req, res) => {
    try {
        // Fetch banners that are active and within their valid date ranges (if dates are provided)
        const query = `
            SELECT * FROM ad_banners 
            WHERE is_active = true 
            AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
            AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query);
        res.json({ success: true, banners: result.rows });
    } catch (error) {
        console.error('Error in getActiveBanners:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active banners' });
    }
};
