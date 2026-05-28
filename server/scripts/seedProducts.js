import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

const defaultCategories = [
    { name: 'Electronics', desc: 'Premium cutting-edge gadgets, audio systems, and smart accessories.' },
    { name: 'Fashion', desc: 'High-end apparel, designer wear, and premium activewear.' },
    { name: 'Home & Living', desc: 'Elegant kitchenware, home decor, modern furniture, and premium bedding.' },
    { name: 'Books', desc: 'Curated fiction, self-help guides, textbooks, and memoirs.' },
    { name: 'Beauty', desc: 'Luxury skincare, fine fragrances, designer cosmetics, and premium haircare.' },
    { name: 'Sports & Fitness', desc: 'Top tier sports gear, high performance fitness accessories, and apparel.' }
];

const mockProducts = [
    // 1. Electronics
    {
        categoryName: 'Audio Devices',
        name: 'AeroSound Pro ANC Headphones',
        brand: 'AcousticLab',
        desc: 'Immersive noise-cancelling headphones with high-fidelity acoustics and 40-hour battery life.',
        price: 14999,
        mrp: 19999,
        stock: 50,
        tags: 'anc, headphones, bluetooth, gadget, premium',
        color: 'Midnight Black',
        size: 'Standard',
        recipient: 'him, her, girlfriend, boyfriend',
        occasion: 'birthday, graduation',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Smart Wearables',
        name: 'ChronoMax Premium Smartwatch',
        brand: 'Vanguard Tech',
        desc: 'Advanced luxury smartwatch featuring heart-rate monitoring, visual GPS tracking, and a gorgeous sapphire screen.',
        price: 24999,
        mrp: 29999,
        stock: 35,
        tags: 'smartwatch, fitness, gadget, wearable',
        color: 'Titanium Gray',
        size: '44mm',
        recipient: 'him, boyfriend',
        occasion: 'anniversary, birthday',
        images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Lighting',
        name: 'GlowSmart Ambient Light Bar',
        brand: 'Lumina',
        desc: 'Smart WiFi light bar with responsive sound syncing, custom app controls, and infinite HSL colors.',
        price: 3499,
        mrp: 4999,
        stock: 120,
        tags: 'lighting, smarthome, ambient, rgb, gadget',
        color: 'Sleek Black',
        size: 'Pack of 2',
        recipient: 'boyfriend, girlfriend, teenager',
        occasion: 'housewarming, birthday',
        images: [
            'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=600'
        ]
    },
    // 2. Fashion
    {
        categoryName: "Women's Wear",
        name: 'Signature Cashmere Knit Sweater',
        brand: 'Aurelia Weaves',
        desc: 'Ultra-soft sustainable Mongolian cashmere sweater styled for effortless premium luxury.',
        price: 8999,
        mrp: 12999,
        stock: 40,
        tags: 'apparel, clothing, sweater, knitwear, cashmere',
        color: 'Oatmeal Beige',
        size: 'M',
        recipient: 'her, girlfriend, mother',
        occasion: 'birthday, anniversary',
        images: [
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Footwear',
        name: 'Vanguard Leather Chelsea Boots',
        brand: 'Cobbler & Co',
        desc: 'Handcrafted full-grain Italian leather Chelsea boots with double-stitched welting for eternal elegance.',
        price: 11999,
        mrp: 15999,
        stock: 25,
        tags: 'shoes, boots, leather, footwear, premium',
        color: 'Chestnut Brown',
        size: '10',
        recipient: 'him, boyfriend, father',
        occasion: 'birthday, promotion',
        images: [
            'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Accessories',
        name: 'Classic Silk Evening Scarf',
        brand: 'Loom & Silk',
        desc: '100% premium mulberry silk scarf printed with artistic botanical patterns, packed in a premium gift box.',
        price: 2499,
        mrp: 3999,
        stock: 80,
        tags: 'accessories, scarf, silk, clothing, gift',
        color: 'Emerald Green',
        size: 'One Size',
        recipient: 'her, girlfriend, mother, sister',
        occasion: 'anniversary, birthday, mothers-day',
        images: [
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600'
        ]
    },
    // 3. Home & Living
    {
        categoryName: 'Kitchenware',
        name: 'Minimalist Ceramic Pour-Over Set',
        brand: 'Terra Coffee',
        desc: 'Elegant Japanese-styled ceramic dripper and glass carafe set for the perfect morning slow-drip brew.',
        price: 1899,
        mrp: 2999,
        stock: 65,
        tags: 'kitchen, coffee, ceramic, pour-over, minimalist, mug',
        color: 'Sand White',
        size: '600ml',
        recipient: 'him, her, girlfriend, boyfriend',
        occasion: 'housewarming, birthday',
        images: [
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Bedding & Bath',
        name: 'Organic Cotton Waffle Duvet Cover',
        brand: 'Nest & Haven',
        desc: 'Premium high-density Turkish organic cotton duvet cover set with a beautiful waffle-weave tactile texture.',
        price: 6499,
        mrp: 8999,
        stock: 30,
        tags: 'bedding, cotton, duvet, linen, home',
        color: 'Clay Terracotta',
        size: 'King',
        recipient: 'her, couple, mother',
        occasion: 'wedding, housewarming',
        images: [
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Home Decor',
        name: 'AromaTherapy Reed Diffuser Set',
        brand: 'Zen Garden',
        desc: 'Natural essential oil reed diffuser set with notes of lavender, sage, and deep sandalwood to soothe the senses.',
        price: 1299,
        mrp: 1999,
        stock: 150,
        tags: 'decor, fragrance, lavender, diffuser, wellness, housewarming',
        color: 'Amber Glass',
        size: '200ml',
        recipient: 'her, girlfriend, mother, coworker',
        occasion: 'housewarming, birthday, thank-you',
        images: [
            'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600'
        ]
    },
    // 4. Books
    {
        categoryName: 'Non-Fiction',
        name: 'The Art of Intentional Living',
        brand: 'Chronicle Press',
        desc: 'A gorgeous hardbound masterwork discussing mindfulness, design, and decluttering your mental environment.',
        price: 799,
        mrp: 1299,
        stock: 200,
        tags: 'book, hardbound, self-help, philosophy, gift',
        color: 'Linen Cream',
        size: 'Hardcover',
        recipient: 'him, her, coworker, student',
        occasion: 'graduation, birthday',
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Fiction & Novels',
        name: 'Visions of the Future: Sci-Fi Anthology',
        brand: 'Nebula Worlds',
        desc: 'A collector’s leatherbound gold-embossed edition containing twelve chilling cyberpunk and cosmic novellas.',
        price: 2199,
        mrp: 2999,
        stock: 45,
        tags: 'book, fiction, scifi, leatherbound, collector',
        color: 'Deep Sapphire Blue',
        size: 'Luxury Edition',
        recipient: 'boyfriend, boyfriend, sibling',
        occasion: 'birthday, christmas',
        images: [
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600'
        ]
    },
    // 5. Beauty
    {
        categoryName: 'Fragrances',
        name: 'Velvet Rose Eau De Parfum',
        brand: 'Maison de Parfum',
        desc: 'Exquisite signature perfume featuring delicate notes of Damascus rose, white musk, and golden amberwood.',
        price: 5499,
        mrp: 7500,
        stock: 35,
        tags: 'perfume, fragrance, beauty, luxury, gift',
        color: 'Crystal Flacon',
        size: '100ml',
        recipient: 'her, girlfriend, mother',
        occasion: 'anniversary, valentine',
        images: [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Skincare',
        name: 'Bakuchiol Cellular Renewal Serum',
        brand: 'Orbis Botanicals',
        desc: 'Youth-boosting face elixir powered by natural retinol alternative, cold-pressed rosehip, and squalane.',
        price: 2899,
        mrp: 3800,
        stock: 90,
        tags: 'skincare, serum, beauty, vegan, organic',
        color: 'Frosted Emerald',
        size: '50ml',
        recipient: 'her, girlfriend',
        occasion: 'birthday, thank-you',
        images: [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600'
        ]
    },
    // 6. Sports & Fitness
    {
        categoryName: 'Yoga & Pilates',
        name: 'Apex Comfort Grip Yoga Mat',
        brand: 'ZenAthleta',
        desc: 'Non-slip eco-friendly natural rubber yoga mat with beautiful laser-etched posture alignment guidelines.',
        price: 3899,
        mrp: 5000,
        stock: 60,
        tags: 'fitness, yoga, workout, mat, sports',
        color: 'Slate Slate',
        size: '6mm Thick',
        recipient: 'her, girlfriend, sibling',
        occasion: 'birthday, housewarming',
        images: [
            'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600'
        ]
    },
    {
        categoryName: 'Fitness Gear',
        name: 'Smart Hydration Insulated Flask',
        brand: 'HydroPulse',
        desc: 'Insulated stainless steel water flask with a sleek LCD touch lid showing real-time fluid temperature.',
        price: 1999,
        mrp: 2999,
        stock: 110,
        tags: 'bottle, flask, gadget, sports, gym',
        color: 'Satin Chrome',
        size: '750ml',
        recipient: 'him, her, boyfriend, girlfriend',
        occasion: 'birthday, graduation',
        images: [
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600'
        ]
    }
];

async function seed() {
    console.log("=== STARTING PRODUCT DATABASE SEEDING ===");
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");

        // 1. Ensure a default seller exists in the system to satisfy DB foreign keys
        console.log("Seeding or fetching a default seller...");
        let sellerId;
        const sellerCheck = await client.query("SELECT seller_id FROM sellers LIMIT 1");
        if (sellerCheck.rows.length > 0) {
            sellerId = sellerCheck.rows[0].seller_id;
            console.log(`Found existing seller ID: ${sellerId}`);
        } else {
            const passHash = await bcrypt.hash("SellerPassword@123", 10);
            const newSeller = await client.query(`
                INSERT INTO sellers 
                (seller_id, full_name, email, phone, password_hash, store_name, is_verified, is_active, onboarding_completed)
                VALUES (gen_random_uuid(), 'Premium Brands Inc', 'premium@gomo.deals', '9988776655', $1, 'GoMo Premium Boutique', true, true, true)
                RETURNING seller_id
            `, [passHash]);
            sellerId = newSeller.rows[0].seller_id;
            console.log(`Created new default seller ID: ${sellerId}`);
        }

        // 2. Do not clear catalog tables if they contain orders. We will upsert safely.
        console.log("Upserting catalog tables safely...");

        // 3. Seed Categories
        console.log("Upserting categories...");
        const categoryMap = {};
        for (const cat of defaultCategories) {
            const check = await client.query(
                "SELECT category_id FROM categories WHERE name = $1 AND parent_category_id IS NULL",
                [cat.name]
            );
            if (check.rows.length > 0) {
                categoryMap[cat.name] = check.rows[0].category_id;
                console.log(`Found existing Category: ${cat.name} [${check.rows[0].category_id}]`);
            } else {
                const res = await client.query(`
                    INSERT INTO categories (category_id, name, description, is_active)
                    VALUES (gen_random_uuid(), $1, $2, true)
                    RETURNING category_id, name
                `, [cat.name, cat.desc]);
                categoryMap[res.rows[0].name] = res.rows[0].category_id;
                console.log(`Created Category: ${res.rows[0].name} [${res.rows[0].category_id}]`);
            }
        }

        // 3b. Seed Subcategories
        console.log("Upserting subcategories...");
        const subCategoriesList = {
            'Electronics': [
                { name: 'Mobiles & Accessories', slug: 'mobiles', desc: 'Mobiles and accessories.' },
                { name: 'Laptops & Tablets', slug: 'laptops', desc: 'Laptops and tablets.' },
                { name: 'Smart Wearables', slug: 'wearables', desc: 'Smart watches and smart wearables.' },
                { name: 'Audio Devices', slug: 'audio', desc: 'Headphones, earphones, and audio devices.' },
                { name: 'Cameras & Photography', slug: 'cameras', desc: 'Cameras and photography gear.' },
                { name: 'Gaming', slug: 'gaming', desc: 'Gaming consoles, accessories, and games.' }
            ],
            'Fashion': [
                { name: "Men's Wear", slug: 'men', desc: "Men's apparel and wear." },
                { name: "Women's Wear", slug: 'women', desc: "Women's apparel and wear." },
                { name: 'Footwear', slug: 'footwear', desc: 'Premium footwear and shoes.' },
                { name: 'Accessories', slug: 'accessories', desc: 'Fashion accessories and details.' },
                { name: 'Ethnic Wear', slug: 'ethnic', desc: 'Traditional and ethnic wear.' },
                { name: 'Activewear', slug: 'activewear', desc: 'High performance activewear.' }
            ],
            'Home & Living': [
                { name: 'Furniture', slug: 'furniture', desc: 'Home and modern office furniture.' },
                { name: 'Home Decor', slug: 'decor', desc: 'Luxury home decor details.' },
                { name: 'Kitchenware', slug: 'kitchen', desc: 'Premium kitchenware and dining.' },
                { name: 'Bedding & Bath', slug: 'bedding', desc: 'Comfy bedding and bath essentials.' },
                { name: 'Lighting', slug: 'lighting', desc: 'Elegant lighting and ambient light.' },
                { name: 'Garden & Outdoor', slug: 'garden', desc: 'Garden and outdoor premium collections.' }
            ],
            'Books': [
                { name: 'Fiction & Novels', slug: 'fiction', desc: 'Fiction novels and stories.' },
                { name: 'Non-Fiction', slug: 'non-fiction', desc: 'Non-fiction books and biographies.' },
                { name: 'Stationery', slug: 'stationery', desc: 'Premium school and office stationery.' },
                { name: 'Textbooks', slug: 'textbooks', desc: 'Educational textbooks.' },
                { name: 'Comics & Manga', slug: 'comics', desc: 'Comics and manga books.' },
                { name: 'Children Books', slug: 'children-books', desc: 'Children books and learning.' }
            ],
            'Beauty': [
                { name: 'Skincare', slug: 'skincare', desc: 'Skincare creams and products.' },
                { name: 'Cosmetics', slug: 'cosmetics', desc: 'Cosmetics and premium makeup.' },
                { name: 'Fragrances', slug: 'fragrance', desc: 'Fine perfumes and fragrances.' },
                { name: 'Haircare', slug: 'haircare', desc: 'Shampoo and haircare products.' },
                { name: 'Men Grooming', slug: 'grooming', desc: 'Men grooming products.' },
                { name: 'Wellness', slug: 'wellness', desc: 'Healthy skin and wellness.' }
            ],
            'Sports & Fitness': [
                { name: 'Fitness Gear', slug: 'fitness', desc: 'Gym and fitness gear.' },
                { name: 'Activewear', slug: 'activewear', desc: 'Fitness apparel and activewear.' },
                { name: 'Outdoor & Camping', slug: 'outdoor', desc: 'Outdoor camping and trekking gear.' },
                { name: 'Sports Equipment', slug: 'equipment', desc: 'High performance sports equipment.' },
                { name: 'Yoga & Pilates', slug: 'yoga', desc: 'Yoga mats and accessories.' },
                { name: 'Nutrition & Supplements', slug: 'nutrition', desc: 'Health supplements and nutrition.' }
            ]
        };

        for (const [parentName, subs] of Object.entries(subCategoriesList)) {
            const parentId = categoryMap[parentName];
            if (!parentId) continue;
            for (const sub of subs) {
                const check = await client.query(
                    "SELECT category_id FROM categories WHERE name = $1 AND parent_category_id = $2",
                    [sub.name, parentId]
                );
                if (check.rows.length > 0) {
                    categoryMap[sub.name] = check.rows[0].category_id;
                    console.log(`Found existing Subcategory: ${sub.name} (Parent: ${parentName}) [${check.rows[0].category_id}]`);
                } else {
                    const res = await client.query(`
                        INSERT INTO categories (category_id, name, description, parent_category_id, is_active)
                        VALUES (gen_random_uuid(), $1, $2, $3, true)
                        RETURNING category_id, name
                    `, [sub.name, sub.desc, parentId]);
                    categoryMap[sub.name] = res.rows[0].category_id;
                    console.log(`Created Subcategory: ${res.rows[0].name} (Parent: ${parentName}) [${res.rows[0].category_id}]`);
                }
            }
        }

        // 4. Seed Products and Product Images
        console.log("Upserting products...");
        for (const p of mockProducts) {
            const catId = categoryMap[p.categoryName];
            if (!catId) {
                console.warn(`Skipping ${p.name}: Category ${p.categoryName} not found.`);
                continue;
            }

            const cleanSku = `GMD-${p.brand.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
            const cleanSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
            const discountPercent = Math.round(((p.mrp - p.price) / p.mrp) * 100);

            const ratingsPreset = {
                'AeroSound Pro ANC Headphones': [4.8, 34],
                'ChronoMax Premium Smartwatch': [4.7, 19],
                'GlowSmart Ambient Light Bar': [4.2, 42],
                'Signature Cashmere Knit Sweater': [4.9, 15],
                'Vanguard Leather Chelsea Boots': [4.6, 28],
                'Classic Silk Evening Scarf': [4.5, 50],
                'Minimalist Ceramic Pour-Over Set': [4.8, 62],
                'Organic Cotton Waffle Duvet Cover': [4.4, 11],
                'AromaTherapy Reed Diffuser Set': [4.7, 88],
                'The Art of Intentional Living': [4.9, 120],
                'Visions of the Future: Sci-Fi Anthology': [4.8, 37],
                'Velvet Rose Eau De Parfum': [4.6, 25],
                'Bakuchiol Cellular Renewal Serum': [4.7, 54],
                'Apex Comfort Grip Yoga Mat': [4.5, 41],
                'Smart Hydration Insulated Flask': [4.3, 75]
            };
            const [pRating, pReviews] = ratingsPreset[p.name] || [4.5, 15];

            // Check if product exists by name or SKU
            const prodCheck = await client.query("SELECT product_id FROM products WHERE name = $1", [p.name]);
            if (prodCheck.rows.length > 0) {
                const productId = prodCheck.rows[0].product_id;
                // Update category and details
                await client.query(`
                    UPDATE products 
                    SET category_id = $1, is_active = true 
                    WHERE product_id = $2
                `, [catId, productId]);
                console.log(`Updated Product: ${p.name} [${productId}] → Category: ${p.categoryName}`);
            } else {
                // Insert into products table
                const prodRes = await client.query(`
                    INSERT INTO products 
                    (product_id, category_id, seller_id, name, description, sku, price, mrp, stock_quantity, brand, images, slug, color, size, discount_percent, recipient, occasion, rating, reviews_count, is_active) 
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
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
                    p.occasion,
                    pRating,
                    pReviews
                ]);

                const productId = prodRes.rows[0].product_id;
                console.log(`Inserted Product: ${prodRes.rows[0].name} [${productId}]`);

                // Insert into product_images table to map image relations correctly
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
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Database seeding failed:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
