const fs = require('fs');
const env = fs.readFileSync('./.env', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].trim().replace(/^"|"$/g, '');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: dbUrl });

pool.query("SELECT p.name, p.category_id, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.name ILIKE '%quest%'")
.then(r => { 
  console.log(JSON.stringify(r.rows, null, 2)); 
  process.exit(0); 
})
.catch(e => { 
  console.error(e); 
  process.exit(1); 
});
