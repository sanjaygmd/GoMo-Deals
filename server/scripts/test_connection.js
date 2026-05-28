import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const passwordEncoded = encodeURIComponent("Sanjay@888016");
const connectionString = `postgres://postgres:${passwordEncoded}@localhost:5433/gomo_deals_db`;

console.log("Connecting with encoded string...");

const pool = new pg.Pool({
    connectionString
});

async function main() {
    try {
        const catRes = await pool.query("SELECT * FROM categories");
        console.log("=== CATEGORIES ===");
        console.log(JSON.stringify(catRes.rows, null, 2));

        const prodCount = await pool.query("SELECT COUNT(*), category_id FROM products GROUP BY category_id");
        console.log("=== PRODUCT COUNTS BY CATEGORY ===");
        console.log(JSON.stringify(prodCount.rows, null, 2));

        const sampleProd = await pool.query(`
            SELECT p.product_id, p.name, p.category_id, c.name as category_name, p.recipient, p.occasion 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LIMIT 5
        `);
        console.log("=== SAMPLE PRODUCTS ===");
        console.log(JSON.stringify(sampleProd.rows, null, 2));
    } catch (err) {
        console.error("Connection Error:", err);
    } finally {
        await pool.end();
    }
}
main();
