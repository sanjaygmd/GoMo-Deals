import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';
import { categorySubcategories } from '../../client1/src/data/categories.js';

const run = async () => {
    try {
        for (const [main, subs] of Object.entries(categorySubcategories)) {
            for (const sub of subs) {
                const desc = `Dummy product for ${main} ${sub.slug} ${sub.label} ${main.replace('-', '')} ${sub.slug.replace('-', '')}. High quality premium item.`;
                const name = `Premium ${sub.label} Item`;
                await pool.query("UPDATE products SET description = $1 WHERE brand = 'GoMo Brand' AND name = $2", [desc, name]);
            }
        }
        console.log('Descriptions updated for foolproof matching');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
