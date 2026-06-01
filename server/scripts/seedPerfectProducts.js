import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';
import { categorySubcategories } from '../../client1/src/data/categories.js';

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
        console.log("Starting definitive dummy product seeder...");
        
        // Delete all old dummy products to start fresh and avoid duplicates
        await pool.query("DELETE FROM products WHERE brand = 'GoMo Brand'");
        
        const existingCatsRes = await pool.query("SELECT * FROM categories");
        const dbCategories = existingCatsRes.rows;
        
        let inserted = 0;
        
        // Helper to insert a product
        const insertDummyProduct = async (catId, catName, catSlug, parentSlug) => {
            let img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop';
            for (const [key, value] of Object.entries(categoryImages)) {
                if (catSlug.toLowerCase().includes(key) || (parentSlug && parentSlug.toLowerCase().includes(key))) {
                    img = value;
                    break;
                }
            }
            
            const desc = `Dummy product for ${parentSlug || catSlug} ${catSlug}. Premium quality ${catName}. ${parentSlug ? parentSlug.replace(/[^a-z0-9]/g, '') : ''} ${catSlug.replace(/[^a-z0-9]/g, '')}`;
            const name = `Premium ${catName} Sample`;
            const price = Math.floor(Math.random() * 5000) + 500;
            
            await pool.query(`
                INSERT INTO products (
                    product_id, category_id, name, description, price, stock_quantity, 
                    brand, images, is_active, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, 
                    $6, $7, true, NOW(), NOW()
                )
            `, [
                catId, name, desc, price, 50, 'GoMo Brand', [img]
            ]);
            inserted++;
        };

        // For every category in categories.js
        for (const [mainSlug, subcats] of Object.entries(categorySubcategories)) {
            
            // 1. Find or create the main category in DB
            let mainCatId = null;
            const existingMain = dbCategories.find(c => c.name.toLowerCase() === mainSlug.replace(/-/g, ' '));
            
            if (existingMain) {
                mainCatId = existingMain.category_id;
            } else {
                // Check if it exists with just slug name
                const slugMain = dbCategories.find(c => c.name.toLowerCase() === mainSlug);
                if (slugMain) {
                    mainCatId = slugMain.category_id;
                } else {
                    // Create it
                    const res = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING category_id", [mainSlug]);
                    mainCatId = res.rows[0].category_id;
                    dbCategories.push({ category_id: mainCatId, name: mainSlug, parent_category_id: null });
                }
            }
            
            // Insert ONE product for the MAIN category
            const mainName = dbCategories.find(c => c.category_id === mainCatId).name;
            await insertDummyProduct(mainCatId, mainName, mainSlug, null);
            
            // 2. Find or create the subcategories and insert one product each
            for (const sub of subcats) {
                let subCatId = null;
                const existingSub = dbCategories.find(c => c.name.toLowerCase() === sub.label.toLowerCase() && c.parent_category_id === mainCatId);
                
                if (existingSub) {
                    subCatId = existingSub.category_id;
                } else {
                    // Create it
                    const res = await pool.query("INSERT INTO categories (name, parent_category_id) VALUES ($1, $2) RETURNING category_id", [sub.label, mainCatId]);
                    subCatId = res.rows[0].category_id;
                    dbCategories.push({ category_id: subCatId, name: sub.label, parent_category_id: mainCatId });
                }
                
                await insertDummyProduct(subCatId, sub.label, sub.slug, mainSlug);
            }
        }
        
        // Ensure "Daily Essentials & Groceries" has one too, since it's in the navbar
        const fleaMain = dbCategories.find(c => c.name.toLowerCase() === 'daily essentials & groceries' || c.name.toLowerCase() === 'daily-essentials');
        if (fleaMain) {
            await insertDummyProduct(fleaMain.category_id, 'Daily Essentials & Groceries', 'daily-essentials', null);
        } else {
            const res = await pool.query("INSERT INTO categories (name) VALUES ($1) RETURNING category_id", ['Daily Essentials & Groceries']);
            await insertDummyProduct(res.rows[0].category_id, 'Daily Essentials & Groceries', 'daily-essentials', null);
        }
        
        console.log(`Finished! Inserted exactly ${inserted} dummy products. 1 for each Main and 1 for each Subcategory.`);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
