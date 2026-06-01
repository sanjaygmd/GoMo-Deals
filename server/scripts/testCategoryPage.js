import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';
import { categorySubcategories } from '../../client1/src/data/categories.js';

const run = async () => {
    const productsRes = await pool.query(`
        SELECT p.*, 
            c.name as category_name, 
            pc.name as parent_category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN categories pc ON c.parent_category_id = pc.category_id
            WHERE p.deleted_at IS NULL AND p.is_active = true
    `);
    
    const sellerProducts = productsRes.rows;
    
    const fieldContains = (field, search) => {
      if (!field || !search) return false;
      const cleanField = String(field).toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSearch = String(search).toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanField.includes(cleanSearch);
    };

    const getBaseProducts = (type) => {
        const typeLower = type.toLowerCase();
        const cleanType = typeLower.replace(/[^a-z0-9]/g, '');
        const isFleaMarket = typeLower === 'fleamarket' || typeLower === 'flea-market' || typeLower === 'daily-essentials-groceries';

        return sellerProducts.filter(p => {
          if (isFleaMarket) {
            const cat = (p.category_name || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            const tags = (p.tags || '').toLowerCase();
            return cat.includes('grocery') || 
                   cat.includes('groceries') || 
                   cat.includes('staple') || 
                   cat.includes('grain') || 
                   cat.includes('lentil') ||
                   cat.includes('rice') ||
                   cat.includes('dal') ||
                   tags.includes('grocery') || 
                   tags.includes('flea market') || 
                   name.includes('rice') || 
                   name.includes('dal') || 
                   name.includes('atta') || 
                   name.includes('wheat');
          }

          const matchOccasionOrRecipient =
            fieldContains(p.recipient, typeLower) ||
            fieldContains(p.occasion, typeLower);

          const subcats = categorySubcategories[typeLower] || [];
          const matchSubcategory = subcats.some(sub => 
              fieldContains(p.category_name, sub.label) || 
              fieldContains(p.category_name, sub.slug) ||
              fieldContains(p.tags, sub.label) ||
              fieldContains(p.tags, sub.slug) ||
              fieldContains(p.room, sub.label) ||
              fieldContains(p.room, sub.slug) ||
              fieldContains(p.name, sub.label)
          );

          const matchCategory =
            fieldContains(p.category_name, typeLower) ||
            fieldContains(p.parent_category_name, typeLower) ||
            (String(p.category_id) === typeLower) ||
            (String(p.parent_category_id) === typeLower) ||
            fieldContains(p.tags, typeLower) ||
            fieldContains(p.name, typeLower) ||
            fieldContains(p.room, typeLower) ||
            matchSubcategory ||
            (cleanType === 'homeliving' && (fieldContains(p.category_name, 'home') || fieldContains(p.category_name, 'living') || fieldContains(p.category_name, 'kitchen') || fieldContains(p.parent_category_name, 'home') || fieldContains(p.parent_category_name, 'living') || fieldContains(p.parent_category_name, 'kitchen'))) ||
            (cleanType === 'sportsfitness' && (fieldContains(p.category_name, 'sports') || fieldContains(p.category_name, 'fitness') || fieldContains(p.category_name, 'gym') || fieldContains(p.category_name, 'yoga') || fieldContains(p.parent_category_name, 'sports') || fieldContains(p.parent_category_name, 'fitness') || fieldContains(p.parent_category_name, 'gym') || fieldContains(p.parent_category_name, 'yoga')));

          return matchOccasionOrRecipient || matchCategory;
        });
    };

    let emptyCount = 0;
    
    // Departments from NavMain.jsx
    const departments = ['fashion', 'electronics', 'home-living', 'beauty', 'books', 'sports-fitness', 'pooja-items', 'healthy-foods', 'kids', 'toys', 'gifts', 'daily-essentials'];
    
    for (const main of departments) {
        if (getBaseProducts(main).length === 0) {
            console.log(`EMPTY MAIN CATEGORY (CategoryPage): ${main}`);
            emptyCount++;
        }
    }
    
    for (const [main, subs] of Object.entries(categorySubcategories)) {
        for (const sub of subs) {
            // Test subcategory slug
            if (getBaseProducts(sub.slug).length === 0) {
                console.log(`EMPTY SUBCATEGORY (CategoryPage URL): ${sub.slug}`);
                emptyCount++;
            }
        }
    }
    
    console.log(`CategoryPage Testing complete. Found ${emptyCount} empty combinations.`);
    process.exit(0);
};
run();
