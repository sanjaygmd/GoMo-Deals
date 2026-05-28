import { pool } from '../config/db.js';

const cleanDatabase = async () => {
  try {
    console.log('Starting database cleanup...');
    await pool.query(`
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS revenues CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
    `);
    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Error during database cleanup:', err);
  } finally {
    await pool.end();
  }
};

cleanDatabase();
