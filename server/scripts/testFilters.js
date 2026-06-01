import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from '../config/db.js';
import { categorySubcategories as categoriesData } from '../../client1/src/data/categories.js';

const run = async () => {
    // Fetch all products exactly as ProductController does
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

    const fleaMarketCategories = ['dal', 'paruppu', 'rice', 'wheat', 'maize', 'groundnut', 'sesame', 'black-pepper', 'turmeric', 'coriander', 'cumin', 'sugar'];

    // Test a given filterCategory and filterSubcategory
    const testFilter = (filterCategory, filterSubcategory) => {
        let result = sellerProducts.filter(p => {
            const pCat = (p.category_name || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pTags = (p.tags || '').toLowerCase();
            if (fleaMarketCategories.some(fCat => pCat.includes(fCat) || pCat === fCat || pName.includes(fCat) || pTags.includes(fCat))) return false;

            let matchCategory = true;
            if (filterCategory !== 'all') {
                const cat = filterCategory.toLowerCase();
                const catClean = cat.replace(/[^a-z0-9]/g, '');
                const catCleanSpaced = catClean.replace(/-/g, ' ');
                
                let matchSubcategoryTree = false;
                if (categoriesData[cat]) {
                    matchSubcategoryTree = categoriesData[cat].some(sub => 
                        fieldContains(p.category_name, sub.slug) || 
                        fieldContains(p.category_name, sub.slug.replace(/-/g, ' ')) ||
                        fieldContains(p.tags, sub.slug) || 
                        fieldContains(p.name, sub.slug) ||
                        fieldContains(p.name, sub.slug.replace(/-/g, ' '))
                    );
                }

                matchCategory = fieldContains(p.category_name, catClean) || 
                                fieldContains(p.category_name, catCleanSpaced) ||
                                fieldContains(p.parent_category_name, catClean) || 
                                fieldContains(p.parent_category_name, catCleanSpaced) ||
                                fieldContains(p.tags, catClean) || 
                                fieldContains(p.name, catClean) ||
                                fieldContains(p.name, catCleanSpaced) ||
                                fieldContains(p.description, catClean) ||
                                fieldContains(p.description, catCleanSpaced) ||
                                fieldContains(p.recipient, catClean) ||
                                fieldContains(p.room, catClean) ||
                                matchSubcategoryTree ||
                                (catClean === 'homeliving' && (fieldContains(p.category_name, 'home') || fieldContains(p.category_name, 'living') || fieldContains(p.parent_category_name, 'home') || fieldContains(p.parent_category_name, 'living'))) ||
                                (catClean === 'sportsfitness' && (fieldContains(p.category_name, 'sports') || fieldContains(p.category_name, 'fitness') || fieldContains(p.parent_category_name, 'sports') || fieldContains(p.parent_category_name, 'fitness'))) ||
                                (catClean === 'fashion' && ['apparel', 'clothing', 'shirt', 'dress', 'him', 'her', 'girlfriend', 'boyfriend'].some(t => fieldContains(p.recipient, t) || fieldContains(p.name, t) || fieldContains(p.tags, t))) ||
                                (catClean === 'homeliving' && ['home', 'kitchen', 'decor', 'housewarming', 'living'].some(t => fieldContains(p.occasion, t) || fieldContains(p.name, t) || fieldContains(p.tags, t)));
            }

            let matchSubcategory = true;
            if (filterSubcategory !== 'all') {
                const subClean = filterSubcategory.toLowerCase().replace(/[^a-z0-9-]/g, '');
                const subCleanSpaced = subClean.replace(/-/g, ' ');
                matchSubcategory = fieldContains(p.category_name, subClean) || 
                                   fieldContains(p.category_name, subCleanSpaced) ||
                                   fieldContains(p.tags, subClean) || 
                                   fieldContains(p.name, subClean) || 
                                   fieldContains(p.name, subCleanSpaced) || 
                                   fieldContains(p.description, subClean) ||
                                   fieldContains(p.description, subCleanSpaced) ||
                                   fieldContains(p.recipient, subClean) ||
                                   fieldContains(p.occasion, subClean);
            }

            return matchCategory && matchSubcategory;
        });
        return result.length;
    };

    let emptyCount = 0;
    
    for (const [main, subs] of Object.entries(categoriesData)) {
        const mainCount = testFilter(main, 'all');
        if (mainCount === 0) {
            console.log(`EMPTY MAIN CATEGORY: ${main}`);
            emptyCount++;
        }
        
        for (const sub of subs) {
            const subCount = testFilter(main, sub.slug);
            if (subCount === 0) {
                console.log(`EMPTY SUBCATEGORY (sidebar): ${main} -> ${sub.slug}`);
                emptyCount++;
            }
            
            const urlCount = testFilter(sub.slug, 'all');
            if (urlCount === 0) {
                console.log(`EMPTY SUBCATEGORY (URL): ${sub.slug}`);
                emptyCount++;
            }
        }
    }
    
    console.log(`Testing complete. Found ${emptyCount} empty combinations.`);
    process.exit(0);
};

run();
