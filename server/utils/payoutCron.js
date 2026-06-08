import { pool } from '../config/db.js';

export const runAutoPayouts = async () => {
    try {
        console.log("[CRON] Running daily auto-payout check...");
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
            const dateOfMonth = today.getDate(); // 1-31
            
            let eligibleSchedules = ['daily'];
            
            // Run weekly and bi-weekly schedules on Mondays
            if (dayOfWeek === 1) { 
                eligibleSchedules.push('weekly');
                eligibleSchedules.push('bi-weekly'); 
            }
            // Run monthly schedules on the 1st of the month
            if (dateOfMonth === 1) {
                eligibleSchedules.push('monthly');
            }

            if (eligibleSchedules.length === 0) {
                console.log("[CRON] No auto-payout schedules to run today.");
                await client.query('COMMIT');
                return;
            }

            // Find all sellers with an eligible schedule who have Pending balances from Delivered orders
            const query = `
                SELECT 
                    s.seller_id,
                    s.store_name,
                    COALESCE(SUM(os.seller_earnings), 0) as balance, 
                    MIN(os.created_at) as start_date, 
                    MAX(os.created_at) as end_date
                FROM sellers s
                JOIN order_sellers os ON s.seller_id = os.seller_id
                JOIN orders o ON os.order_id = o.order_id
                WHERE s.payout_schedule = ANY($1)
                  AND LOWER(os.payout_status) = 'pending'
                  AND o.order_status = 'Delivered'
                GROUP BY s.seller_id, s.store_name
                HAVING COALESCE(SUM(os.seller_earnings), 0) > 0
            `;

            const res = await client.query(query, [eligibleSchedules]);

            if (res.rows.length === 0) {
                console.log(`[CRON] No eligible pending balances for schedules: ${eligibleSchedules.join(', ')}`);
                await client.query('COMMIT');
                return;
            }

            console.log(`[CRON] Processing auto-payouts for ${res.rows.length} sellers...`);

            for (const row of res.rows) {
                const { seller_id, store_name, balance, start_date, end_date } = row;
                const amount = parseFloat(balance);

                // Check for existing pending payouts to prevent double requesting
                const activePayoutCheck = await client.query(
                    "SELECT payout_id FROM seller_payouts WHERE seller_id = $1 AND status IN ('Requested', 'Processing')",
                    [seller_id]
                );

                if (activePayoutCheck.rows.length > 0) {
                    console.log(`[CRON] Skipping ${store_name} due to an already active payout request.`);
                    continue;
                }

                // Create payout request record
                const payoutRes = await client.query(`
                    INSERT INTO seller_payouts (
                        payout_id, seller_id, amount, payout_period_start, payout_period_end, status, notes, created_at
                    ) VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Requested', 'Automated Scheduled Payout', NOW())
                    RETURNING payout_id
                `, [seller_id, amount, start_date, end_date]);

                const payoutId = payoutRes.rows[0].payout_id;

                // Mark order_sellers as processing
                await client.query(`
                    UPDATE order_sellers 
                    SET payout_status = 'processing',
                        payout_id = $1::uuid
                    WHERE seller_id = $2::uuid 
                    AND LOWER(payout_status) = 'pending' 
                    AND order_id IN (SELECT order_id FROM orders WHERE order_status = 'Delivered')
                `, [payoutId, seller_id]);

                // Insert Notifications
                await client.query(`
                    INSERT INTO notifications (notification_id, seller_id, type, message, is_read, created_at)
                    VALUES (gen_random_uuid(), $1, 'payout_request', $2, false, NOW())
                `, [seller_id, `Your scheduled automated payout of ₹${Number(amount).toLocaleString('en-IN')} has been generated and submitted for approval.`]);

                await client.query(`
                    INSERT INTO notifications (notification_id, type, message, is_read, created_at)
                    VALUES (gen_random_uuid(), 'payout_request', $1, false, NOW())
                `, [`System generated scheduled payout for "${store_name}" for ₹${Number(amount).toLocaleString('en-IN')}.`]);
            }

            await client.query('COMMIT');
            console.log("[CRON] Auto-payouts generated successfully.");

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("[CRON] Error in runAutoPayouts:", error);
    }
};
