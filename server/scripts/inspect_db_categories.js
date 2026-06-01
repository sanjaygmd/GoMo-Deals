import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("=== ALL CATEGORIES ===");
        const cats = await pool.query(`
            SELECT category_id, name, parent_category_id FROM categories
        `);
        console.log(cats.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
