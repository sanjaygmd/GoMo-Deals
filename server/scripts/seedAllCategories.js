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
    'healthy': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    'home': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=600&auto=format&fit=crop',
    'kids': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=600&auto=format&fit=crop',
    'mens': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop',
    'pooja': 'https://images.unsplash.com/photo-1605335133604-984bf409c916?q=80&w=600&auto=format&fit=crop',
    'sports': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop',
    'toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=600&auto=format&fit=crop',
    'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
};

const run = async () => {
    try {
        console.log("Checking ALL categories...");
        
        const categoriesRes = await pool.query("SELECT * FROM categories");
        const categories = categoriesRes.rows;
        
        let inserted = 0;
        
        for (const cat of categories) {
            // Check if this specific category has any products
            const prodRes = await pool.query("SELECT COUNT(*) FROM products WHERE category_id = $1", [cat.category_id]);
            const count = parseInt(prodRes.rows[0].count);
            
            if (count === 0) {
                // Determine an image
                let img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop';
                for (const [key, value] of Object.entries(categoryImages)) {
                    if (cat.name.toLowerCase().includes(key)) {
                        img = value;
                        break;
                    }
                }
                
                // Add a product directly to this category
                const desc = `Dummy product for ${cat.name}. High quality premium item. ${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const name = `Premium ${cat.name} Item`;
                const price = Math.floor(Math.random() * 5000) + 500;
                
                await pool.query(`
                    INSERT INTO products (
                        product_id, category_id, name, description, price, stock_quantity, 
                        brand, images, is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, 
                        $6, $7, true, '2000-01-01 00:00:00', NOW()
                    )
                `, [
                    cat.category_id,
                    name,
                    desc,
                    price,
                    50, // stock
                    'GoMo Brand', // brand
                    [img], // images as JS array
                ]);
                
                inserted++;
                console.log(`Inserted product for empty category: ${cat.name}`);
            }
        }
        
        console.log(`Finished! Inserted ${inserted} new products for empty categories.`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
