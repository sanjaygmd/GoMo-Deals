import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const prodRes = await pool.query("SELECT product_id FROM products LIMIT 1");
        if (prodRes.rows.length === 0) {
            console.log("No products in database.");
            return;
        }
        const product_id = prodRes.rows[0].product_id;
        console.log(`Testing with product_id: ${product_id}`);

        const result = await pool.query(`
            SELECT p.*, 
            c.name as category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = $1
        `, [product_id]);

        console.log("=== FETCH SUCCESS ===");
        console.log(JSON.stringify(result.rows[0], null, 2));

    } catch (err) {
        console.error("=== FETCH FAILED ===");
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
