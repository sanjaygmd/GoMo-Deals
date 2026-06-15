import { pool } from './server/config/db.js';

async function migrate() {
  try {
    await pool.query('ALTER TABLE sellers ADD COLUMN blocked_until TIMESTAMP WITH TIME ZONE;');
    console.log('Migration successful');
  } catch (error) {
    if (error.code === '42701') {
      console.log('Column already exists');
    } else {
      console.error('Migration failed', error);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
