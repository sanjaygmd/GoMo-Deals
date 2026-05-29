import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("=== PRODUCTS TABLE COLUMNS ===");
        const prodCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products'
        `);
        console.log(prodCols.rows);

        console.log("=== SAMPLE PRODUCTS ===");
        const prods = await pool.query(`
            SELECT * FROM products LIMIT 2
        `);
        console.log(JSON.stringify(prods.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
