import { pool } from '../config/db.js';
import { sanitizeText } from '../utils/sanitizer.js';

// Customer: Open a new dispute
export const openDispute = async (req, res, next) => {
    const { order_id, reason } = req.body;
    const customer_id = req.user.id;

    if (!order_id || !reason) {
        return res.status(400).json({ success: false, message: "Order ID and reason are required" });
    }

    try {
        // Verify order belongs to customer
        const orderCheck = await pool.query(`
            SELECT order_id 
            FROM orders 
            WHERE order_id = $1 AND customer_id = $2
        `, [order_id, customer_id]);

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
        }

        // Get sellers involved in the order
        const sellersCheck = await pool.query(`
            SELECT DISTINCT seller_id FROM order_items WHERE order_id = $1
        `, [order_id]);

        if (sellersCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No sellers found for this order" });
        }

        const cleanReason = sanitizeText(reason);

        // Check if dispute already exists for this order
        const existing = await pool.query("SELECT * FROM disputes WHERE order_id = $1", [order_id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: "A dispute is already open for this order" });
        }

        // Since disputes has a UNIQUE(order_id) constraint, we insert only ONE dispute per order.
        // We link it to the primary seller of the order.
        const primarySellerId = sellersCheck.rows[0].seller_id;

        const result = await pool.query(`
            INSERT INTO disputes (order_id, customer_id, seller_id, reason, status)
            VALUES ($1, $2, $3, $4, 'open')
            RETURNING *
        `, [order_id, customer_id, primarySellerId, cleanReason]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Customer: Get own disputes
export const getCustomerDisputes = async (req, res, next) => {
    try {
        const customer_id = req.user.id;
        const result = await pool.query(`
            SELECT d.*, o.total_amount as amount, o.order_status
            FROM disputes d
            JOIN orders o ON d.order_id = o.order_id
            WHERE d.customer_id = $1
            ORDER BY d.created_at DESC
        `, [customer_id]);
        
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// Seller: Get disputes against their store
export const getSellerDisputes = async (req, res, next) => {
    try {
        const seller_id = req.user.id;
        const result = await pool.query(`
            SELECT d.*, o.total_amount as amount, c.full_name as customer_name
            FROM disputes d
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON d.customer_id = c.customer_id
            WHERE d.seller_id = $1
            ORDER BY d.created_at DESC
        `, [seller_id]);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};

// Seller: Reply to dispute / Admin: Resolve dispute
export const updateDispute = async (req, res, next) => {
    const { dispute_id } = req.params;
    const { resolution, status } = req.body;
    const { id, type: role } = req.user;

    try {
        // Validate dispute existence and ownership
        const check = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [dispute_id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Dispute not found" });
        }

        const dispute = check.rows[0];

        if (role === 'seller' && dispute.seller_id !== id) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Validate status values based on role
        const adminAllowedStatuses = ['open', 'resolved', 'closed'];
        const sellerAllowedStatuses = ['seller_replied'];
        const allowedStatuses = (role === 'admin' || role === 'super_admin') ? adminAllowedStatuses : sellerAllowedStatuses;

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status for your role. Allowed: ${allowedStatuses.join(', ')}` });
        }

        const cleanResolution = resolution ? sanitizeText(resolution) : dispute.resolution;
        const newStatus = status || dispute.status;

        const result = await pool.query(`
            UPDATE disputes 
            SET resolution = $1, status = $2, updated_at = NOW()
            WHERE dispute_id = $3
            RETURNING *
        `, [cleanResolution, newStatus, dispute_id]);

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Admin: Get all disputes
export const getAllDisputes = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT d.*, 
                   o.total_amount as amount, 
                   c.full_name as customer_name,
                   s.store_name
            FROM disputes d
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON d.customer_id = c.customer_id
            JOIN sellers s ON d.seller_id = s.seller_id
            ORDER BY d.created_at DESC
        `);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
};
