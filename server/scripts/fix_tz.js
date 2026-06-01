import { pool } from './config/db.js';
async function test() {
  try {
    await pool.query(`ALTER TABLE flea_market_meetings ALTER COLUMN scheduled_at TYPE timestamp with time zone USING scheduled_at AT TIME ZONE 'UTC'`);
    await pool.query(`ALTER TABLE flea_market_meetings ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC'`);
    console.log("Fixed columns");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
