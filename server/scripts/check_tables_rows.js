import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const tables = ['return_requests', 'orders', 'order_items', 'customers', 'products'];
        console.log("=== ROW COUNTS ===");
        for (const t of tables) {
            const res = await pool.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`${t}: ${res.rows[0].count}`);
        }
        
        console.log("=== RAW RETURN REQUESTS ===");
        const rr = await pool.query("SELECT * FROM return_requests");
        console.log(rr.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
