import { pool } from '../config/db.js';
import { sendLowStockAlertEmail } from './mailer.js';

export const runLowStockCheck = async () => {
    try {
        console.log("[CRON] Running daily low-stock check...");

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Find all products whose stock is at or below the threshold
            // and that are active.
            const query = `
                SELECT 
                    p.product_id,
                    p.name as product_name,
                    p.stock_quantity,
                    p.low_stock_threshold,
                    s.seller_id,
                    s.store_name,
                    s.email as seller_email
                FROM products p
                JOIN sellers s ON p.seller_id = s.seller_id
                WHERE p.is_active = true 
                  AND p.stock_quantity <= COALESCE(p.low_stock_threshold, 5)
            `;

            const res = await client.query(query);

            if (res.rows.length === 0) {
                console.log("[CRON] No low-stock products found.");
                await client.query('COMMIT');
                return;
            }

            console.log(`[CRON] Found ${res.rows.length} products below threshold. Processing alerts...`);

            // Group by seller to avoid sending multiple emails
            const sellerAlerts = {};
            for (const row of res.rows) {
                if (!sellerAlerts[row.seller_id]) {
                    sellerAlerts[row.seller_id] = {
                        store_name: row.store_name,
                        email: row.seller_email,
                        products: []
                    };
                }
                sellerAlerts[row.seller_id].products.push(row);
            }

            for (const [sellerId, alertData] of Object.entries(sellerAlerts)) {
                const productListString = alertData.products.map(p => `- ${p.product_name} (Stock: ${p.stock_quantity}, Threshold: ${p.low_stock_threshold})`).join('\n');
                
                // 1. Create In-App Notification
                const msg = `Low Stock Alert: You have ${alertData.products.length} product(s) below their minimum stock threshold. Please restock to avoid losing sales.`;
                await client.query(`
                    INSERT INTO notifications (notification_id, seller_id, message, type, is_read, created_at)
                    VALUES (gen_random_uuid(), $1, $2, 'low_stock_alert', false, NOW())
                `, [sellerId, msg]);

                // 2. Send Email
                try {
                    await sendLowStockAlertEmail(alertData.email, alertData.store_name, alertData.products);
                } catch (e) {
                    console.error("Failed to send low stock email to seller:", e);
                }
            }

            await client.query('COMMIT');
            console.log("[CRON] Low-stock check completed successfully.");

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("[CRON ERROR] Low-stock check failed:", error);
    }
};
