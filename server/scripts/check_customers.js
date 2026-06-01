import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("=== TABLES ===");
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(tables.rows.map(t => t.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
