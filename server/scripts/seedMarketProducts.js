import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

const marketCategory = {
    name: 'Daily Essentials & Groceries',
    desc: 'Flea market daily essentials, premium quality staples, organic lentils, and fresh grains.'
};

const marketSubcategories = [
    { name: 'Grains & Rice', desc: 'Premium basmati, raw rice, wheat, and grains.', slug: 'grains-rice' },
    { name: 'Lentils & Dals', desc: 'Organic toor dal, polished moong, urad, and lentils.', slug: 'lentils-dals' }
];

const marketProducts = [
    {
        subcategoryName: 'Grains & Rice',
        name: 'Premium Himalayan Basmati Rice',
        brand: 'Boutique Farm',
        desc: 'Aged long-grain basmati rice with exquisite aroma and fluffy texture, perfect for premium biryanis.',
        price: 180,
        mrp: 220,
        stock: 500,
        tags: 'rice, grains, basmati, daily essentials, grocery, flea market',
        color: 'Pure White',
        size: '1 KG Pack',
        recipient: 'common',
        occasion: 'common',
        images: [
            'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        subcategoryName: 'Grains & Rice',
        name: 'Organic Sharbati Whole Wheat Atta',
        brand: 'Boutique Farm',
        desc: 'Traditional stone-ground sharbati whole wheat flour, high in nutrition, producing soft and fluffy rotis.',
        price: 320,
        mrp: 380,
        stock: 300,
        tags: 'wheat, atta, flour, grains, daily essentials, grocery, flea market',
        color: 'Off-White',
        size: '5 KG Bag',
        recipient: 'common',
        occasion: 'common',
        images: [
            'https://images.unsplash.com/photo-1574325131874-a78b0877ebde?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        subcategoryName: 'Lentils & Dals',
        name: 'Organic Unpolished Toor Dal',
        brand: 'Boutique Farm',
        desc: 'Naturally processed, unpolished pigeon peas rich in proteins and dietary fibers. Free from synthetic coloring.',
        price: 190,
        mrp: 230,
        stock: 450,
        tags: 'dal, toor dal, lentils, daily essentials, grocery, flea market',
        color: 'Golden Yellow',
        size: '1 KG Pack',
        recipient: 'common',
        occasion: 'common',
        images: [
            'https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        subcategoryName: 'Lentils & Dals',
        name: 'Split Skinless Moong Dal',
        brand: 'Boutique Farm',
        desc: 'Premium split and husked mung lentils. Fast cooking and highly digestible daily kitchen staple.',
        price: 165,
        mrp: 195,
        stock: 400,
        tags: 'dal, moong, lentils, daily essentials, grocery, flea market',
        color: 'Yellow',
        size: '1 KG Pack',
        recipient: 'common',
        occasion: 'common',
        images: [
            'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        subcategoryName: 'Grains & Rice',
        name: 'Traditional Sona Masoori Rice',
        brand: 'Boutique Farm',
        desc: 'Lightweight and aromatic medium-grain rice, aged to perfection. A staple for everyday healthy meals.',
        price: 95,
        mrp: 115,
        stock: 600,
        tags: 'rice, sona masoori, grains, daily essentials, grocery, flea market',
        color: 'White',
        size: '5 KG Bag',
        recipient: 'common',
        occasion: 'common',
        images: [
            'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600'
        ]
    }
];

async function seedMarket() {
    console.log("=== STARTING MARKET CATEGORY AND PRODUCT SEEDING ===");
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");

        // 1. Get or create a default seller
        let sellerId;
        const sellerCheck = await client.query("SELECT seller_id FROM sellers LIMIT 1");
        if (sellerCheck.rows.length > 0) {
            sellerId = sellerCheck.rows[0].seller_id;
        } else {
            console.error("No default seller found in system database. Please make sure database is initialized!");
            return;
        }

        // 2. Create the Grocery Parent Category
        let parentCategoryId;
        const parentCheck = await client.query("SELECT category_id FROM categories WHERE name = $1 AND parent_category_id IS NULL", [marketCategory.name]);
        if (parentCheck.rows.length > 0) {
            parentCategoryId = parentCheck.rows[0].category_id;
            console.log(`Found existing Category: ${marketCategory.name} [${parentCategoryId}]`);
        } else {
            const parentRes = await client.query(`
                INSERT INTO categories (category_id, name, description, is_active)
                VALUES (gen_random_uuid(), $1, $2, true)
                RETURNING category_id
            `, [marketCategory.name, marketCategory.desc]);
            parentCategoryId = parentRes.rows[0].category_id;
            console.log(`Created Category: ${marketCategory.name} [${parentCategoryId}]`);
        }

        // 3. Create Subcategories
        const subcategoryMap = {};
        for (const sub of marketSubcategories) {
            const subCheck = await client.query(
                "SELECT category_id FROM categories WHERE name = $1 AND parent_category_id = $2",
                [sub.name, parentCategoryId]
            );
            if (subCheck.rows.length > 0) {
                subcategoryMap[sub.name] = subCheck.rows[0].category_id;
                console.log(`Found existing Subcategory: ${sub.name} [${subCheck.rows[0].category_id}]`);
            } else {
                const subRes = await client.query(`
                    INSERT INTO categories (category_id, name, description, parent_category_id, is_active)
                    VALUES (gen_random_uuid(), $1, $2, $3, true)
                    RETURNING category_id
                `, [sub.name, sub.desc, parentCategoryId]);
                subcategoryMap[sub.name] = subRes.rows[0].category_id;
                console.log(`Created Subcategory: ${sub.name} [${subRes.rows[0].category_id}]`);
            }
        }

        // 4. Seed Products
        for (const p of marketProducts) {
            const catId = subcategoryMap[p.subcategoryName];
            if (!catId) {
                console.warn(`Category mapping failed for ${p.subcategoryName}`);
                continue;
            }

            const cleanSku = `GMD-MKT-${p.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const cleanSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
            const discountPercent = Math.round(((p.mrp - p.price) / p.mrp) * 100);

            const prodCheck = await client.query("SELECT product_id FROM products WHERE name = $1", [p.name]);
            if (prodCheck.rows.length > 0) {
                console.log(`Product already exists: ${p.name}`);
            } else {
                const prodRes = await client.query(`
                    INSERT INTO products 
                    (product_id, category_id, seller_id, name, description, sku, price, mrp, stock_quantity, brand, images, slug, color, size, discount_percent, recipient, occasion, rating, reviews_count, is_active) 
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 4.8, 12, true)
                    RETURNING product_id, name
                `, [
                    catId,
                    sellerId,
                    p.name,
                    p.desc,
                    cleanSku,
                    p.price,
                    p.mrp,
                    p.stock,
                    p.brand,
                    p.images,
                    cleanSlug,
                    p.color,
                    p.size,
                    discountPercent,
                    p.recipient,
                    p.occasion
                ]);

                const productId = prodRes.rows[0].product_id;
                console.log(`Inserted Product: ${p.name} [${productId}]`);

                // Seed product_images
                if (p.images && p.images.length > 0) {
                    for (let i = 0; i < p.images.length; i++) {
                        await client.query(`
                            INSERT INTO product_images (image_id, product_id, image_url, is_primary, sort_order)
                            VALUES (gen_random_uuid(), $1, $2, $3, $4)
                        `, [productId, p.images[i], i === 0, i]);
                    }
                }
            }
        }

        await client.query("COMMIT");
        console.log("=== SEEDING COMPLETED SUCCESSFULLY! ===");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Database seeding failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

seedMarket();
