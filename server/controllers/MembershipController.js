import { pool } from '../config/db.js';
import { verifyRazorpaySignature } from '../utils/razorpay.js'; // assume helper exists

/**
 * Subscribe a customer to a membership tier.
 * Expects Razorpay payment verification payload.
 */
export const subscribe = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    // Verify signature (utility should throw on failure)
    const isValid = verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
    // Update customer's membership tier
    const result = await pool.query(
      `UPDATE customers SET membership = $1 WHERE customer_id = $2 RETURNING *`,
      [tier, req.user.id]
    );
    return res.json({ success: true, message: `Subscribed to ${tier} tier.`, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Downgrade a customer's membership tier.
 */
export const downgrade = async (req, res, next) => {
  try {
    const { newTier } = req.body;
    if (!newTier) {
      return res.status(400).json({ success: false, message: 'Target tier not specified.' });
    }
    const result = await pool.query(
      `UPDATE customers SET membership = $1 WHERE customer_id = $2 RETURNING *`,
      [newTier, req.user.id]
    );
    return res.json({ success: true, message: `Downgraded to ${newTier}.`, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel membership and revert to free tier.
 */
export const cancel = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE customers SET membership = 'free' WHERE customer_id = $1 RETURNING *`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'Membership cancelled, reverted to free tier.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
