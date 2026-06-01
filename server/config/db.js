import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {Pool} = pg;
 
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    ...(process.env.NODE_ENV === 'production' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
})

export const testDB = async () => {
  try {
    await pool.query("SELECT NOW()");

    
    // Migration logic moved to initDb.js for better synchronization
    

    
  } catch (err) {
    console.error("DB Error:", err.message);
    throw err;
  }
};
