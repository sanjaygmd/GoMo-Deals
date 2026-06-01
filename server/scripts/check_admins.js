import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const admins = await pool.query("SELECT admin_id, name, email, role, is_active FROM admins");
        console.log("=== ADMINS ===");
        console.log(admins.rows);

        const superAdmins = await pool.query("SELECT super_admin_id, name, email, role, is_active FROM super_admins");
        console.log("=== SUPER ADMINS ===");
        console.log(superAdmins.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
