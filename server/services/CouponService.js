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
            "SELECT coupon_id, code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, category FROM coupons WHERE is_active = true AND (valid_until IS NULL OR (valid_until + interval '23 hours 59 minutes 59 seconds') >= NOW()) ORDER BY created_at DESC"
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
    static async validateCoupon(code, subtotal, customerId = null, items = []) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const cleanCode = code ? code.trim().toUpperCase() : '';
            
            const result = await client.query(
                "SELECT * FROM coupons WHERE code = $1",
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

            // Exclude fetching the join table on initial validation query since we need the coupon first
            // Category & Eligible Subtotal Check
            let eligibleSubtotal = subtotal || 0;
            
            // Fetch category_ids for this coupon
            const catRes = await client.query("SELECT category_id FROM coupon_categories WHERE coupon_id = $1", [coupon.coupon_id]);
            const couponCategoryIds = catRes.rows.map(r => r.category_id);

            // Keep backward compatibility: if coupon_CategoryIds is empty but coupon.category exists and is not 'all', try legacy mapping? 
            // We'll enforce the new data model where `coupon_categories` stores the eligible categories.
            if (couponCategoryIds.length > 0) {
                if (!items || items.length === 0) {
                    await client.query('ROLLBACK');
                    return { isValid: false, message: "Your cart is empty", statusCode: 400 };
                }

                // Fetch category info for all items in cart to get their category_id and parent_category_id
                const productIds = items.map(i => i.product_id).filter(Boolean);
                let itemCategories = {};
                if (productIds.length > 0) {
                    const prodCatRes = await client.query(
                        "SELECT p.product_id, p.category_id, c.parent_category_id FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = ANY($1)",
                        [productIds]
                    );
                    prodCatRes.rows.forEach(r => {
                        itemCategories[r.product_id] = { cat: r.category_id, parentCat: r.parent_category_id };
                    });
                }

                eligibleSubtotal = items.reduce((acc, item) => {
                    const pCat = itemCategories[item.product_id];
                    let isMatch = false;
                    if (pCat && (couponCategoryIds.includes(pCat.cat) || couponCategoryIds.includes(pCat.parentCat))) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        const itemPrice = parseFloat(item.price || item.discountPrice || 0);
                        const itemQty = parseInt(item.quantity || 1);
                        return acc + (itemPrice * itemQty);
                    }
                    return acc;
                }, 0);

                if (eligibleSubtotal <= 0) {
                    await client.query('ROLLBACK');
                    return { isValid: false, message: `This coupon is not valid for the products in your cart.`, statusCode: 400 };
                }
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
                    return { isValid: false, message: "You already used this coupon", statusCode: 400 };
                }
            }

            // Min Order Value Check (Against eligible items only)
            if (eligibleSubtotal < parseFloat(coupon.min_order_value || 0)) {
                await client.query('ROLLBACK');
                return { 
                    isValid: false, 
                    message: `Minimum eligible order value of ₹${coupon.min_order_value} required for this coupon`,
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
        const result = await pool.query(
            `SELECT c.*, array_remove(array_agg(cc.category_id), NULL) as category_ids 
             FROM coupons c 
             LEFT JOIN coupon_categories cc ON c.coupon_id = cc.coupon_id 
             GROUP BY c.coupon_id 
             ORDER BY c.created_at DESC`
        );
        return result.rows;
    }

    static async createCoupon(data, adminId, isAdmin) {
        const { code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, category, category_ids } = data;
        const db_admin_id = isAdmin ? adminId : null;

        if (type === 'percentage' && parseFloat(discount_percent) > 90) {
            throw new Error("Percentage discount cannot exceed 90%");
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO coupons (coupon_id, code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, category, admin_id, created_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                 RETURNING *`,
                [code.toUpperCase(), type || 'percentage', discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active ?? true, category || 'all', db_admin_id]
            );
            
            const coupon = result.rows[0];
            
            if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
                for (const catId of category_ids) {
                    await client.query("INSERT INTO coupon_categories (coupon_id, category_id) VALUES ($1, $2)", [coupon.coupon_id, catId]);
                }
            }
            
            await client.query('COMMIT');
            return { ...coupon, category_ids: category_ids || [] };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateCoupon(id, data, adminId, isAdmin) {
        const { code, type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, category, category_ids } = data;
        const db_admin_id = isAdmin ? adminId : null;

        if (type === 'percentage' && parseFloat(discount_percent) > 90) {
            throw new Error("Percentage discount cannot exceed 90%");
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Get old values for auditing
            const oldRes = await client.query("SELECT * FROM coupons WHERE coupon_id = $1", [id]);
            if (oldRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const result = await client.query(
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
                     category = COALESCE($10, category),
                     admin_id = COALESCE($11, admin_id),
                     updated_at = NOW()
                 WHERE coupon_id = $12
                 RETURNING *`,
                [code?.toUpperCase(), type, discount_percent, discount_amount, max_discount, min_order_value, valid_until, max_usage, is_active, category, db_admin_id, id]
            );
            
            if (category_ids && Array.isArray(category_ids)) {
                await client.query("DELETE FROM coupon_categories WHERE coupon_id = $1", [id]);
                for (const catId of category_ids) {
                    await client.query("INSERT INTO coupon_categories (coupon_id, category_id) VALUES ($1, $2)", [id, catId]);
                }
            }

            await client.query('COMMIT');
            return { old: oldRes.rows[0], updated: { ...result.rows[0], category_ids: category_ids || [] } };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async deleteCoupon(id) {
        const result = await pool.query("DELETE FROM coupons WHERE coupon_id = $1 RETURNING *", [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}
