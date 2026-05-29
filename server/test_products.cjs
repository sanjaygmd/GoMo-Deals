const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('./.env', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].trim().replace(/^"|"$/g, '');
const pool = new Pool({ connectionString: dbUrl });

pool.query(`
  SELECT p.name, p.category_id, c.name as category_name, p.tags
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.category_id
  ORDER BY p.created_at DESC LIMIT 5
`)
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
