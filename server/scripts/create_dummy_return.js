import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        // 1. Get a valid order_item and customer
        const itemRes = await pool.query(`
            SELECT oi.order_item_id, oi.order_id, o.customer_id, oi.unit_price, oi.quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            LIMIT 1
        `);
        
        if (itemRes.rows.length === 0) {
            console.log("No orders/items found to create return request.");
            return;
        }
        
        const item = itemRes.rows[0];
        console.log("Found order item:", item);
        
        // 2. Ensure order_status is 'Delivered' so return constraints are consistent
        await pool.query("UPDATE orders SET order_status = 'Delivered' WHERE order_id = $1", [item.order_id]);
        
        // 3. Clear existing return requests to prevent unique/existing constraints issues
        await pool.query("DELETE FROM return_requests WHERE order_item_id = $1", [item.order_item_id]);
        
        // 4. Insert dummy return request
        const refundAmount = item.unit_price * item.quantity;
        const res = await pool.query(`
            INSERT INTO return_requests (
                return_request_id, order_id, order_item_id, customer_id, 
                reason, return_type, refund_amount, refund_status, requested_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, 'Damaged product received', 'Refund', $4, 'Pending', NOW())
            RETURNING return_request_id
        `, [item.order_id, item.order_item_id, item.customer_id, refundAmount]);
        
        console.log("Inserted return request ID:", res.rows[0].return_request_id);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
