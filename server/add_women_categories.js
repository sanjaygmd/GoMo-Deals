import { pool } from './config/db.js';

async function run() {
  try {
    const res = await pool.query("SELECT category_id, name FROM categories WHERE name ILIKE 'clothing'");
    
    if (res.rows.length === 0) {
      console.log("Clothing category not found!");
      process.exit(1);
    }
    
    const clothingId = res.rows[0].category_id;
    console.log("Found Clothing category ID:", clothingId);

    const subcats = ['Dresses', 'Kurtis', 'Leggings', 'Sarees', 'Skirts', 'Tops'];
    
    for (const sub of subcats) {
      // Check if it already exists to avoid duplicates
      const check = await pool.query("SELECT * FROM categories WHERE name = $1 AND parent_category_id = $2", [sub, clothingId]);
      if (check.rows.length === 0) {
        await pool.query(
          "INSERT INTO categories (name, parent_category_id, is_active) VALUES ($1, $2, true)",
          [sub, clothingId]
        );
        console.log(`Inserted subcategory: ${sub}`);
      } else {
        console.log(`Subcategory ${sub} already exists under Clothing.`);
      }
    }
    console.log("Done");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
