import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const result = await pool.query("SELECT * FROM products WHERE name ILIKE '%meta quest%'");
        console.log("=== META QUEST IN DB ===");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
