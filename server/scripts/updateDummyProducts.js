import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';

const categoryImages = {
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=600&auto=format&fit=crop',
    'books': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
    'clothing': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop',
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=600&auto=format&fit=crop',
    'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop',
    'gifts': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
    'healthy-foods': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    'home-living': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=600&auto=format&fit=crop',
    'kids': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=600&auto=format&fit=crop',
    'mens': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop',
    'pooja-items': 'https://images.unsplash.com/photo-1605335133604-984bf409c916?q=80&w=600&auto=format&fit=crop',
    'sports-fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop',
    'toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=600&auto=format&fit=crop',
    'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
};

const run = async () => {
    try {
        console.log("Updating dummy products...");
        
        const products = await pool.query("SELECT p.product_id, c.name as cat_name FROM products p JOIN categories c ON p.category_id = c.category_id WHERE p.brand = 'GoMo Brand'");
        
        for (const p of products.rows) {
            let img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop'; // default generic
            
            // Try to match parent category
            for (const [key, value] of Object.entries(categoryImages)) {
                if (key.includes(p.cat_name.toLowerCase()) || p.cat_name.toLowerCase().includes(key.replace('-', ' '))) {
                    img = value;
                    break;
                }
            }
            
            // Push created_at to 2000 so it appears LAST, and update image
            await pool.query(
                "UPDATE products SET created_at = '2000-01-01 00:00:00', images = $1 WHERE product_id = $2",
                [[img], p.product_id]
            );
        }
        
        console.log("Update complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
