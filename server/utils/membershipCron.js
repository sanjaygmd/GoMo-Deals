import cron from 'node-cron';
import { pool } from '../config/db.js';

export const initMembershipCron = () => {
    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running membership expiry check...');
        try {
            const result = await pool.query(
                `UPDATE customers 
                 SET membership = 'free', membership_expires_at = NULL 
                 WHERE membership_expires_at < NOW() AND membership != 'free'`
            );
            
            if (result.rowCount > 0) {
                console.log(`[CRON] Downgraded ${result.rowCount} expired memberships to free tier.`);
            }
        } catch (error) {
            console.error('[CRON ERROR] Failed to run membership expiry check:', error);
        }
    });
    console.log('[CRON] Membership cron job initialized.');
};
