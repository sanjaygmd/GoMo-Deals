import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("=== ALL PRODUCTS ===");
        const prods = await pool.query(`
            SELECT p.product_id, p.name, p.category_id, c.name as category_name, c.parent_category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ORDER BY p.created_at DESC
        `);
        console.log(JSON.stringify(prods.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
