import { pool } from './config/db.js';
async function test() {
  try {
    const res = await pool.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'flea_market_meetings'`);
    console.log("SCHEMA:");
    console.log(res.rows);

    const meetings = await pool.query(`SELECT * FROM flea_market_meetings`);
    console.log("\nMEETINGS:");
    console.log(meetings.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
