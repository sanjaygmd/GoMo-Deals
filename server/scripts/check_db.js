import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const tables = ['customers', 'sellers', 'products', 'categories', 'addresses', 'bank_accounts', 'orders', 'order_sellers', 'reviews'];
        console.log("=== TABLE ROW COUNTS ===");
        for (const t of tables) {
            const res = await pool.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`${t}: ${res.rows[0].count}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
