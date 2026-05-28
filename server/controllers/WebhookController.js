import crypto from 'crypto';
import { pool } from '../config/db.js';

export const handleRazorpayWebhook = async (req, res) => {
    // 1. Signature Verification (Risk A)
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || secret === 'your_webhook_secret_here') {
        console.error('[WEBHOOK ERROR] RAZORPAY_WEBHOOK_SECRET is not configured.');
        return res.status(500).send('Webhook secret not configured');
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        return res.status(400).send('Missing signature');
    }

    // req.body must be raw string or buffer for precise HMAC validation
    const payload = req.body; // Buffer from express.raw()

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    let isValid = false;
    try {
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const signatureBuffer = Buffer.from(signature, 'hex');
        if (expectedBuffer.length === signatureBuffer.length) {
            isValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
        }
    } catch (e) {
        isValid = false;
    }

    if (!isValid) {
        console.warn(`[WEBHOOK ALERT] Invalid signature received from IP: ${req.ip}`);
        return res.status(400).send('Invalid signature');
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(payload.toString('utf8'));
    } catch (err) {
        return res.status(400).send('Invalid JSON payload');
    }

    const event = parsedBody.event;
    const paymentEntity = parsedBody.payload?.payment?.entity;
    
    if (!paymentEntity) {
        return res.status(200).send('OK'); // Acknowledge unused events
    }

    const payment_id = paymentEntity.id;
    const razorpay_order_id = paymentEntity.order_id;
    const amount = paymentEntity.amount / 100; // Convert paise to INR

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (event === 'payment.captured') {
            // Check if this payment already exists in our system (Idempotency - Risk B)
            // Use FOR UPDATE to lock the row and prevent Race Conditions (Risk C)
            const paymentCheck = await client.query(
                "SELECT payment_id FROM payments WHERE transaction_id = $1 FOR UPDATE", 
                [payment_id]
            );

            if (paymentCheck.rows.length > 0) {
                // Payment was already processed by the frontend or a previous webhook retry
                await client.query('COMMIT');
                return res.status(200).send('Already processed');
            }

            // Payment doesn't exist in our main payments table. This means the webhook beat the frontend,
            // OR the user closed their browser before the frontend could call /api/orders/create.
            // We log it as an orphaned payment.
            
            await client.query(`
                INSERT INTO orphaned_payments (payment_id, razorpay_order_id, amount, status, notes)
                VALUES ($1, $2, $3, 'Captured', 'Webhook received before frontend confirmation')
                ON CONFLICT (payment_id) DO NOTHING
            `, [payment_id, razorpay_order_id, amount]);

        } else if (event === 'refund.processed') {
            // Refund State Mismatches (Risk D)
            const refundEntity = req.body.payload.refund.entity;
            const refund_id = refundEntity.id;

            // Find the order associated with this payment
            const paymentCheck = await client.query(
                "SELECT order_id FROM payments WHERE transaction_id = $1 FOR UPDATE",
                [payment_id]
            );

            if (paymentCheck.rows.length > 0 && paymentCheck.rows[0].order_id) {
                const order_id = paymentCheck.rows[0].order_id;
                
                // Update order payment status
                await client.query(
                    "UPDATE orders SET payment_status = 'Refunded' WHERE order_id = $1", 
                    [order_id]
                );

                // Update payment record
                await client.query(
                    "UPDATE payments SET payment_status = 'Refunded' WHERE transaction_id = $1", 
                    [payment_id]
                );

                // Revert finance ledger
                await client.query(`
                    INSERT INTO finance_transactions (order_id, transaction_type, amount)
                    VALUES ($1, 'refund', $2)
                `, [order_id, -amount]);
            } else {
                // Refund for an orphaned payment
                await client.query(
                    "UPDATE orphaned_payments SET status = 'Refunded', notes = $1 WHERE payment_id = $2",
                    [`Refunded via Razorpay (${refund_id})`, payment_id]
                );
            }

        } else if (event === 'refund.failed') {
            console.error(`[WEBHOOK] Refund failed for payment ${payment_id}`);
            // Find the order and update status to reflect failure if needed
            const paymentCheck = await client.query(
                "SELECT order_id FROM payments WHERE transaction_id = $1",
                [payment_id]
            );
            
            if (paymentCheck.rows.length > 0 && paymentCheck.rows[0].order_id) {
                 await client.query(
                    "INSERT INTO order_status_history (order_id, changed_by, status, notes) VALUES ($1, $2, 'Refund Failed', 'Razorpay reported refund failure')",
                    [paymentCheck.rows[0].order_id, '00000000-0000-0000-0000-000000000000'] // System UUID
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[WEBHOOK ERROR]:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        client.release();
    }
};
