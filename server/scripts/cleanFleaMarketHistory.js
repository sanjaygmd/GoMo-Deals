import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

const KEEP_PRODUCTS = [
    'Premium Himalayan Basmati Rice',
    'Organic Sharbati Whole Wheat Atta',
    'Organic Unpolished Toor Dal',
    'Split Skinless Moong Dal',
    'Traditional Sona Masoori Rice'
];

async function cleanHistory() {
    console.log("=== STARTING DBMARKET HISTORY CLEANUP ===");
    const client = await pool.connect();
    
    try {
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log("Tables present:", tables.length);

        await client.query("BEGIN");

        // 1. Delete all records from product_offers table if it exists
        if (tables.includes('product_offers')) {
            const deleteOffers = await client.query("DELETE FROM product_offers");
            console.log(`Deleted ${deleteOffers.rowCount} previous product bargaining offers.`);
        }

        // 2. Find old flea market / grocery products
        if (tables.includes('products')) {
            // Get category IDs for "Daily Essentials & Groceries" parent & subcategories
            const catRes = await client.query(`
                SELECT category_id FROM categories 
                WHERE name IN ('Daily Essentials & Groceries', 'Grains & Rice', 'Lentils & Dals')
            `);
            const catIds = catRes.rows.map(r => r.category_id);

            // Fetch old products in those categories or products whose names are NOT in our seeded list but are grains/rice/dal
            const oldProdsRes = await client.query(`
                SELECT product_id, name FROM products 
                WHERE (category_id = ANY($1) 
                   OR name LIKE '%Rice%' 
                   OR name LIKE '%Dal%' 
                   OR name LIKE '%Atta%' 
                   OR name LIKE '%Lentils%')
                AND name NOT IN ($2, $3, $4, $5, $6)
            `, [catIds, ...KEEP_PRODUCTS]);

            const oldProdIds = oldProdsRes.rows.map(r => r.product_id);
            console.log(`Found ${oldProdIds.length} old flea market items to delete:`, oldProdsRes.rows.map(r => r.name));

            if (oldProdIds.length > 0) {
                if (tables.includes('product_images')) {
                    await client.query("DELETE FROM product_images WHERE product_id = ANY($1)", [oldProdIds]);
                }
                if (tables.includes('product_variants')) {
                    await client.query("DELETE FROM product_variants WHERE product_id = ANY($1)", [oldProdIds]);
                }
                if (tables.includes('cart_items')) {
                    await client.query("DELETE FROM cart_items WHERE product_id = ANY($1)", [oldProdIds]);
                }
                if (tables.includes('wishlist_items')) {
                    await client.query("DELETE FROM wishlist_items WHERE product_id = ANY($1)", [oldProdIds]);
                }
                if (tables.includes('order_items')) {
                    await client.query("DELETE FROM order_items WHERE product_id = ANY($1)", [oldProdIds]);
                }

                const deleteProducts = await client.query("DELETE FROM products WHERE product_id = ANY($1)", [oldProdIds]);
                console.log(`Successfully deleted ${deleteProducts.rowCount} old products.`);
            }
        }

        await client.query("COMMIT");
        console.log("=== DBMARKET HISTORY CLEANUP COMPLETED ===");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Cleanup failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanHistory();
