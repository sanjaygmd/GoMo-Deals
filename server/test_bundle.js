import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT pb.*, 
             COALESCE(json_agg(json_build_object(
                 'product_id', p.product_id,
                 'name', p.name,
                 'price', p.price,
                 'thumbnail', p.images[1]
             )) FILTER (WHERE p.product_id IS NOT NULL), '[]') as items,
             s.name as seller_name, s.store_name
      FROM product_bundles pb
      LEFT JOIN bundle_items bi ON pb.bundle_id = bi.bundle_id
      LEFT JOIN products p ON bi.product_id = p.product_id
      LEFT JOIN sellers s ON pb.seller_id = s.seller_id
      WHERE pb.is_active = TRUE
      GROUP BY pb.bundle_id, s.name, s.store_name
      ORDER BY pb.created_at DESC
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('SQL ERROR:', err);
  } finally {
    await client.end();
  }
}

run();
