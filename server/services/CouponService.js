import { pool } from '../config/db.js';

/**
 * CouponService handles the core business logic and database interactions for coupons.
 * This separates the "What to do" (Service) from "How to handle HTTP" (Controller).
 */
export class CouponService {
    
    /**
     * Retrieves all active coupons currently valid.
     */
    static async getActiveCoupons() {
        const result = await pool.query(
            "SELECT coupon_id, code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until FROM coupons WHERE is_active = true AND (valid_until IS NULL OR (valid_until + interval '23 hours 59 minutes 59 seconds') >= NOW()) ORDER BY created_at DESC"
        );
        return result.rows;
    }

    /**
     * Validates a coupon code against business rules.
     * @param {string} code 
     * @param {number} subtotal 
     * @param {string} customerId 
     * @returns {Object} { isValid: boolean, coupon: Object, message: string }
     */
    static async validateCoupon(code, subtotal, customerId = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const cleanCode = code ? code.trim().toUpperCase() : '';
            
            const result = await client.query(
                "SELECT * FROM coupons WHERE code = $1 FOR UPDATE",
                [cleanCode]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return { isValid: false, message: "Invalid coupon code", statusCode: 404 };
            }

            const coupon = result.rows[0];

            if (!coupon.is_active) {
                await client.query('ROLLBACK');
                return { isValid: false, message: "This coupon is currently inactive", statusCode: 400 };
            }

            // Expiry Check
            if (coupon.valid_until) {
                const expiryDate = new Date(coupon.valid_until);
                if (expiryDate.getHours() === 0 && expiryDate.getMinutes() === 0) {
                    expiryDate.setHours(23, 59, 59, 999);
                }
                if (expiryDate < new Date()) {
                    await client.query('ROLLBACK');
                    return { isValid: false, message: "Coupon has expired", statusCode: 400 };
                }
            }

            // Total Usage Check
            if (coupon.max_usage && coupon.used_count >= coupon.max_usage) {
                await client.query('ROLLBACK');
                return { isValid: false, message: "Coupon usage limit reached", statusCode: 400 };
            }

            // Individual Customer Usage Check
            if (customerId) {
                const usageCheck = await client.query(
                    "SELECT 1 FROM coupon_usage WHERE coupon_id = $1 AND customer_id = $2",
                    [coupon.coupon_id, customerId]
                );
                if (usageCheck.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return { isValid: false, message: "You have already used this coupon", statusCode: 400 };
                }
            }

            // Min Order Value Check
            if (subtotal && subtotal < parseFloat(coupon.min_order_value)) {
                await client.query('ROLLBACK');
                return { 
                    isValid: false, 
                    message: `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
                    statusCode: 400
                };
            }

            await client.query('COMMIT');
            return { isValid: true, coupon, message: "Coupon is valid" };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getAllCoupons() {
        const result = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
        return result.rows;
    }

    static async createCoupon(data, adminId, isAdmin) {
        const { code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active } = data;
        const db_admin_id = isAdmin ? adminId : null;

        const result = await pool.query(
            `INSERT INTO coupons (coupon_id, code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, admin_id, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             RETURNING *`,
            [code.toUpperCase(), type || 'percentage', discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active ?? true, db_admin_id]
        );
        return result.rows[0];
    }

    static async updateCoupon(id, data, adminId, isAdmin) {
        const { code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active } = data;
        const db_admin_id = isAdmin ? adminId : null;

        // Get old values for auditing
        const oldRes = await pool.query("SELECT * FROM coupons WHERE coupon_id = $1", [id]);
        if (oldRes.rows.length === 0) return null;

        const result = await pool.query(
            `UPDATE coupons 
             SET code = COALESCE($1, code),
                 type = COALESCE($2, type),
                 discount_percent = COALESCE($3, discount_percent),
                 discount_amount = COALESCE($4, discount_amount),
                 max_discount = COALESCE($5, max_discount),
                 min_order_value = COALESCE($6, min_order_value),
                 valid_until = COALESCE($7, valid_until),
                 max_usage = COALESCE($8, max_usage),
                 is_active = COALESCE($9, is_active),
                 admin_id = COALESCE($10, admin_id),
                 updated_at = NOW()
             WHERE coupon_id = $11
             RETURNING *`,
            [code?.toUpperCase(), type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, db_admin_id, id]
        );
        return { old: oldRes.rows[0], updated: result.rows[0] };
    }

    static async deleteCoupon(id) {
        const result = await pool.query("DELETE FROM coupons WHERE coupon_id = $1 RETURNING *", [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}
