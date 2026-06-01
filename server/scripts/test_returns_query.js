import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const returnsQuery = `
          SELECT 
            rr.return_request_id as id,
            c.full_name as customer,
            rr.refund_amount as amount,
            rr.refund_status as status,
            rr.requested_at as date,
            rr.reason,
            rr.order_id,
            rr.return_type,
            p.name as product_name
          FROM return_requests rr
          JOIN customers c ON rr.customer_id = c.customer_id
          JOIN order_items oi ON rr.order_item_id = oi.order_item_id
          JOIN products p ON oi.product_id = p.product_id
          ORDER BY rr.requested_at DESC
        `;
        console.log("Running returns query...");
        const result = await pool.query(returnsQuery);
        console.log("Success! Row count:", result.rows.length);
        console.log("Rows:", result.rows);
    } catch (err) {
        console.error("Database Query Error:", err);
    } finally {
        await pool.end();
    }
}
main();
