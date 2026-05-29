const fs = require('fs');
const env = fs.readFileSync('./.env', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].trim().replace(/^"|"$/g, '');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: dbUrl });

(async () => {
  const result = await pool.query("SELECT * FROM coupons LIMIT 1");
  if (result.rows.length === 0) { console.log("No coupons"); process.exit(0); }
  const coupon = result.rows[0];
  console.log("Coupon:", coupon.code, coupon.category);

  // simulate validation logic
  const items = [{ category_name: 'Gaming', price: 100, quantity: 1 }];
  let eligibleSubtotal = 0;
  if (coupon.category && coupon.category !== 'all') {
      eligibleSubtotal = items.reduce((acc, item) => {
          const itemCategory = item.category || item.category_name || '';
          if (itemCategory.toLowerCase().replace(/ /g, '-') === coupon.category.toLowerCase().replace(/ /g, '-')) {
              return acc + (item.price * item.quantity);
          }
          return acc;
      }, 0);
  } else {
      eligibleSubtotal = 100;
  }
  console.log("Eligible:", eligibleSubtotal);
  process.exit(0);
})();
