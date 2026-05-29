import crypto from 'crypto';
import { pool } from '../config/db.js';

/**
 * Subscribe a seller to a subscription plan.
 * Expects Razorpay payment verification payload.
 */
export const subscribe = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, amount } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const isMock = process.env.NODE_ENV !== 'production' && razorpay_order_id.startsWith('order_mock_');
    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!secret || secret === 'your_razorpay_secret_here') {
        console.error("CRITICAL: Razorpay secret not configured. Blocking subscription.");
        return res.status(500).json({ success: false, message: "Payment verification failed: razorpay secret not configured" });
      }

      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
      }
    }

    // Give 30 days of subscription access
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Record the transaction
    await pool.query(
      `INSERT INTO seller_subscriptions_history 
        (seller_id, plan_id, amount, razorpay_order_id, razorpay_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')`,
      [req.user.id, plan_id, amount, razorpay_order_id, razorpay_payment_id]
    );

    // Update seller's subscription status
    const result = await pool.query(
      `UPDATE sellers SET seller_subscription = $1, seller_subscription_expiry = $2 WHERE seller_id = $3 RETURNING seller_id, seller_subscription, seller_subscription_expiry`,
      [plan_id, expiryDate, req.user.id]
    );

    return res.json({ success: true, message: `Subscribed to ${plan_id} plan.`, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel seller subscription and revert to free plan.
 */
export const cancel = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE sellers SET seller_subscription = 'free', seller_subscription_expiry = NULL WHERE seller_id = $1 RETURNING seller_id, seller_subscription`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'Subscription cancelled, reverted to free plan.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
