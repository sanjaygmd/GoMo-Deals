import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// Category tree from client categories.js
const categorySubcategories = {
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

const fieldContains = (field, search) => {
  if (!field || !search) return false;
  const cleanField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSearch = search.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanField.includes(cleanSearch);
};

async function main() {
    try {
        const res = await pool.query(`
            SELECT p.*, c.name as category_name, c.parent_category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.deleted_at IS NULL
        `);
        const products = res.rows;
        
        console.log(`Total Products: ${products.length}`);
        const vrHeadset = products.find(p => p.name.includes("vr headset"));
        if (!vrHeadset) {
            console.log("Could not find VR headset in DB!");
            return;
        }

        console.log("\nVR Headset details:", {
            name: vrHeadset.name,
            category_id: vrHeadset.category_id,
            category_name: vrHeadset.category_name,
            parent_category_id: vrHeadset.parent_category_id,
            tags: vrHeadset.tags,
            room: vrHeadset.room
        });

        // Test filtering by CategoryPage logic: type = 'electronics'
        const typeLower = 'electronics';
        const cleanType = 'electronics';

        const subcats = categorySubcategories[typeLower] || [];
        const matchSubcategory = subcats.some(sub => 
            fieldContains(vrHeadset.category_name, sub.label) || 
            fieldContains(vrHeadset.category_name, sub.slug) ||
            fieldContains(vrHeadset.tags, sub.label) ||
            fieldContains(vrHeadset.tags, sub.slug) ||
            fieldContains(vrHeadset.room, sub.label) ||
            fieldContains(vrHeadset.room, sub.slug) ||
            fieldContains(vrHeadset.name, sub.label)
        );

        const matchCategory =
            fieldContains(vrHeadset.category_name, typeLower) ||
            (vrHeadset.category_id?.toString() === typeLower) ||
            fieldContains(vrHeadset.tags, typeLower) ||
            fieldContains(vrHeadset.name, typeLower) ||
            fieldContains(vrHeadset.room, typeLower) ||
            matchSubcategory;

        console.log("\nCategoryPage Matching Results for 'electronics':");
        console.log(`matchSubcategory: ${matchSubcategory}`);
        console.log(`matchCategory: ${matchCategory}`);

        // Test subcategory filtering
        const selectedSubcategory = 'gaming';
        const subClean = selectedSubcategory.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const fieldContainsHyphen = (field, search) => {
            if (!field || !search) return false;
            return field.toLowerCase().replace(/[^a-z0-9-]/g, '').includes(search);
        };
        
        const matchesGamingSubcategory = 
            fieldContainsHyphen(vrHeadset.category_name, subClean) || 
            fieldContainsHyphen(vrHeadset.tags, subClean) || 
            fieldContainsHyphen(vrHeadset.name, subClean) || 
            fieldContainsHyphen(vrHeadset.description, subClean) ||
            fieldContainsHyphen(vrHeadset.room, subClean) ||
            (vrHeadset.category_name && vrHeadset.category_name.toLowerCase().replace(/[^a-z0-9-]/g, '') === subClean);

        console.log(`matchesGamingSubcategory: ${matchesGamingSubcategory}`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
