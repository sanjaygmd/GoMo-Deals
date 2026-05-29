import { pool } from '../config/db.js';

async function alterCoupons() {
  try {
    await pool.query("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'all'");
    console.log("Successfully added category column to coupons table.");
  } catch (error) {
    console.error("Error altering coupons table:", error.message);
  } finally {
    process.exit(0);
  }
}

alterCoupons();
