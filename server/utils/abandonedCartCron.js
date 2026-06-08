import { pool } from '../config/db.js';
import { sendAbandonedCartEmail } from './mailer.js';

export const runAbandonedCartCheck = async () => {
    try {
        console.log("[CRON] Running daily abandoned cart check...");
        const client = await pool.connect();
        try {
            // Find carts that:
            // 1. Have items
            // 2. Haven't been updated in 24 hours
            // 3. Haven't had a recovery email sent yet
            const query = `
                SELECT 
                    c.cart_id,
                    cu.email,
                    cu.full_name as name,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'product_name', p.name,
                            'quantity', ci.quantity
                        )
                    ) as items
                FROM cart c
                JOIN customers cu ON c.customer_id = cu.customer_id
                JOIN cart_items ci ON c.cart_id = ci.cart_id
                JOIN products p ON ci.product_id = p.product_id
                WHERE c.updated_at < NOW() - INTERVAL '24 hours'
                AND c.item_count > 0
                AND c.recovery_email_sent = FALSE
                GROUP BY c.cart_id, cu.email, cu.full_name
            `;

            const res = await client.query(query);

            if (res.rows.length === 0) {
                console.log("[CRON] No abandoned carts to process today.");
                return;
            }

            console.log(`[CRON] Found ${res.rows.length} abandoned carts. Processing emails...`);

            await client.query('BEGIN');

            for (const row of res.rows) {
                const { cart_id, email, name, items } = row;

                // Send email
                const emailResult = await sendAbandonedCartEmail(email, name, items);

                if (emailResult.success) {
                    // Mark as sent
                    await client.query(`
                        UPDATE cart 
                        SET recovery_email_sent = TRUE 
                        WHERE cart_id = $1
                    `, [cart_id]);
                }
            }

            await client.query('COMMIT');
            console.log("[CRON] Abandoned cart recovery emails sent successfully.");

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("[CRON] Error in runAbandonedCartCheck:", error);
    }
};
