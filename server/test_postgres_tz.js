import { pool } from './config/db.js';
async function test() {
  try {
    const res = await pool.query(`SELECT '2026-05-29T11:52:00.000Z'::timestamp without time zone AS tz_less, NOW() AS now_tz`);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
