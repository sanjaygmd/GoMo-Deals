import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const catRes = await pool.query("SELECT * FROM categories");
        console.log("=== CATEGORIES ===");
        console.log(JSON.stringify(catRes.rows, null, 2));

        const prodCount = await pool.query("SELECT COUNT(*), category_id FROM products GROUP BY category_id");
        console.log("=== PRODUCT COUNTS BY CATEGORY ===");
        console.log(JSON.stringify(prodCount.rows, null, 2));

        const sampleProd = await pool.query("SELECT product_id, name, category_id, recipient, occasion FROM products LIMIT 5");
        console.log("=== SAMPLE PRODUCTS ===");
        console.log(JSON.stringify(sampleProd.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
