import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const hash = bcrypt.hashSync('password123', 10);

pool.query('UPDATE sellers SET password_hash = $1 WHERE email = $2', [hash, 'test.seller.1779272480000@gomo.com'])
    .then(() => {
        console.log('success');
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
