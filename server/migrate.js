import { pool } from './config/db.js';

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE flea_market_meetings 
            ADD COLUMN IF NOT EXISTS earnings DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS meeting_notes TEXT;
        `);
        console.log("Migration successful");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed", e);
        process.exit(1);
    }
}
migrate();
