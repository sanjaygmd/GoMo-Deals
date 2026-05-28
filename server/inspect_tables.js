import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("=== ADMINS COLUMNS ===");
        const adminsCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admins'
        `);
        console.log(adminsCols.rows);

        console.log("=== SUPER ADMINS COLUMNS ===");
        const saCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'super_admins'
        `);
        console.log(saCols.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
