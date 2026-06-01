import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';
import crypto from 'crypto';

const categories = {
    'beauty': [
        { label: 'Cosmetics', slug: 'cosmetics' },
        { label: 'Fragrances', slug: 'fragrance' },
        { label: 'Haircare', slug: 'haircare' },
        { label: 'Men Grooming', slug: 'grooming' },
        { label: 'Skincare', slug: 'skincare' },
        { label: 'Wellness', slug: 'wellness' },
    ],
    'books': [
        { label: 'Children Books', slug: 'children-books' },
        { label: 'Comics & Manga', slug: 'comics' },
        { label: 'Fiction & Novels', slug: 'fiction' },
        { label: 'Non-Fiction', slug: 'non-fiction' },
        { label: 'Stationery', slug: 'stationery' },
        { label: 'Textbooks', slug: 'textbooks' },
    ],
    'clothing': [
        { label: 'Jackets', slug: 'jackets' },
        { label: 'Jeans', slug: 'jeans' },
        { label: 'Shirts', slug: 'shirts' },
        { label: 'Shorts', slug: 'shorts' },
        { label: 'T-Shirts', slug: 't-shirts' },
        { label: 'Trousers', slug: 'trousers' },
    ],
    'electronics': [
        { label: 'Audio Devices', slug: 'audio' },
        { label: 'Cameras & Photography', slug: 'cameras' },
        { label: 'Gaming', slug: 'gaming' },
        { label: 'Laptops & Tablets', slug: 'laptops' },
        { label: 'Mobiles & Accessories', slug: 'mobiles' },
        { label: 'Smart Wearables', slug: 'wearables' },
    ],
    'fashion': [
        { label: 'Accessories', slug: 'accessories' },
        { label: 'Activewear', slug: 'activewear' },
        { label: 'Ethnic Wear', slug: 'ethnic' },
        { label: 'Footwear', slug: 'footwear' },
        { label: "Men's Wear", slug: 'men' },
        { label: "Women's Wear", slug: 'women' },
    ],
    'gifts': [
        { label: 'Anniversary', slug: 'anniversary' },
        { label: 'Birthday', slug: 'birthday' },
        { label: 'Corporate', slug: 'corporate' },
        { label: 'Festive', slug: 'festive' },
        { label: 'Personalized', slug: 'personalized' },
        { label: 'Wedding', slug: 'wedding' },
    ],
    'healthy-foods': [
        { label: 'Diet & Nutrition', slug: 'diet-nutrition' },
        { label: 'Gluten-Free', slug: 'gluten-free' },
        { label: 'Healthy Beverages', slug: 'healthy-beverages' },
        { label: 'Organic Snacks', slug: 'organic-snacks' },
        { label: 'Superfoods', slug: 'superfoods' },
        { label: 'Vegan Essentials', slug: 'vegan-essentials' },
    ],
    'home-living': [
        { label: 'Bedding & Bath', slug: 'bedding' },
        { label: 'Furniture', slug: 'furniture' },
        { label: 'Garden & Outdoor', slug: 'garden' },
        { label: 'Home Decor', slug: 'decor' },
        { label: 'Kitchenware', slug: 'kitchen' },
        { label: 'Lighting', slug: 'lighting' },
    ],
    'kids': [
        { label: 'Baby Clothes', slug: 'baby-clothes' },
        { label: 'Boys Clothing', slug: 'boys-clothing' },
        { label: 'Girls Clothing', slug: 'girls-clothing' },
        { label: 'School Supplies', slug: 'school-supplies' },
        { label: 'Toys', slug: 'toys' },
    ],
    'mens': [
        { label: 'Accessories', slug: 'accessories' },
        { label: 'Shirts', slug: 'shirts' },
        { label: 'Shoes', slug: 'shoes' },
        { label: 'T-Shirts', slug: 't-shirts' },
        { label: 'Watches', slug: 'watches' },
    ],
    'pooja-items': [
        { label: 'Camphor', slug: 'camphor' },
        { label: 'Diyas', slug: 'diyas' },
        { label: 'Idols', slug: 'idols' },
        { label: 'Incense Sticks', slug: 'incense' },
        { label: 'Lamps', slug: 'lamps' },
        { label: 'Thali Sets', slug: 'thali-sets' },
    ],
    'sports-fitness': [
        { label: 'Activewear', slug: 'activewear' },
        { label: 'Fitness Gear', slug: 'fitness' },
        { label: 'Nutrition & Supplements', slug: 'nutrition' },
        { label: 'Outdoor & Camping', slug: 'outdoor' },
        { label: 'Sports Equipment', slug: 'equipment' },
        { label: 'Yoga & Pilates', slug: 'yoga' },
    ],
    'toys': [
        { label: 'Action Figures', slug: 'action-figures' },
        { label: 'Board Games', slug: 'board-games' },
        { label: 'Educational', slug: 'educational' },
        { label: 'Puzzles', slug: 'puzzles' },
        { label: 'Remote Control', slug: 'remote-control' },
        { label: 'Soft Toys', slug: 'soft-toys' },
    ],
    'women': [
        { label: 'Dresses', slug: 'dresses' },
        { label: 'Handbags', slug: 'handbags' },
        { label: 'Jewelry', slug: 'jewelry' },
        { label: 'Kurtis', slug: 'kurtis' },
        { label: 'Sarees', slug: 'sarees' },
        { label: 'Tops', slug: 'tops' },
    ],
};

const run = async () => {
    try {
        console.log("Seeding products...");
        
        // 1. Get existing categories
        const catQuery = await pool.query("SELECT * FROM categories");
        const existingCats = catQuery.rows;
        
        // 2. Map main categories by name
        const dbCatMap = {};
        for (const cat of existingCats) {
            dbCatMap[cat.name.toLowerCase()] = cat.category_id;
        }

        // 3. For each main category, insert 1 dummy product per subcategory
        for (const [mainCatSlug, subcats] of Object.entries(categories)) {
            // Find parent category ID
            // mainCatSlug like 'home-living'
            let parentCatId = null;
            for (const cat of existingCats) {
                if (cat.name.toLowerCase().includes(mainCatSlug.replace('-', ' ')) || mainCatSlug.includes(cat.name.toLowerCase().replace(' ', '-'))) {
                    parentCatId = cat.category_id;
                    break;
                }
            }

            if (!parentCatId) {
                // Insert main category if not found
                const res = await pool.query(
                    "INSERT INTO categories (name) VALUES ($1) RETURNING category_id", 
                    [mainCatSlug]
                );
                parentCatId = res.rows[0].category_id;
            }

            for (const sub of subcats) {
                // Find or insert subcategory
                let subCatId = null;
                for (const cat of existingCats) {
                    if (cat.name.toLowerCase() === sub.label.toLowerCase()) {
                        subCatId = cat.category_id;
                        break;
                    }
                }
                if (!subCatId) {
                    const res = await pool.query(
                        "INSERT INTO categories (name, parent_category_id) VALUES ($1, $2) RETURNING category_id", 
                        [sub.label, parentCatId]
                    );
                    subCatId = res.rows[0].category_id;
                    existingCats.push({ category_id: subCatId, name: sub.label });
                }

                const productName = `Premium ${sub.label} Item`;
                const price = Math.floor(Math.random() * 5000) + 500;
                
                // Add a product for this subcategory
                await pool.query(`
                    INSERT INTO products (
                        product_id, category_id, name, description, price, stock_quantity, 
                        brand, images, is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, 
                        $6, $7, true, NOW(), NOW()
                    )
                `, [
                    subCatId, // use subcategory
                    productName,
                    `This is a high quality ${sub.label} for your daily needs. Premium boutique quality.`,
                    price,
                    50, // stock
                    'GoMo Brand', // brand
                    ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop'], // images
                ]);
            }
        }
        
        console.log("Seeding complete!");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

run();
