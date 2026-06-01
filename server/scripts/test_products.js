import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const query = `
            SELECT p.*, 
            c.name as category_name,
            COALESCE((SELECT AVG(rating)::numeric(10,1) FROM reviews WHERE product_id = p.product_id), 0) as rating,
            (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) as reviews_count,
            (SELECT json_agg(pi.* ORDER BY pi.sort_order) FROM product_images pi WHERE pi.product_id = p.product_id) as pi_images,
            (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.product_id) as variants
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.deleted_at IS NULL
            LIMIT 5
        `;
        const result = await pool.query(query);
        console.log("=== DETAILED PRODUCTS FROM QUERY ===");
        result.rows.forEach(p => {
            console.log({
                product_id: p.product_id,
                name: p.name,
                category_name: p.category_name,
                recipient: p.recipient,
                occasion: p.occasion,
                tags: p.tags
            });
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
