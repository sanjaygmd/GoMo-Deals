import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool } from '../config/db.js';

/**
 * Subscribe a customer to a membership tier.
 * Expects Razorpay payment verification payload.
 */
export const subscribe = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, billing_cycle } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const isMock = process.env.NODE_ENV !== 'production' && razorpay_order_id.startsWith('order_mock_');
    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!secret || secret === 'your_razorpay_secret_here') {
        console.error("CRITICAL: Razorpay secret not configured. Blocking membership subscription.");
        return res.status(500).json({ success: false, message: "Payment verification failed: razorpay secret not configured" });
      }

      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
      }
      
      // CRITICAL SECURITY FIX: Validate that the Razorpay order amount strictly matches the tier price
      const TIERS = {
        'free': { price: 0, yearlyPrice: 0 },
        'silver': { price: 299, yearlyPrice: 2999 },
        'gold': { price: 599, yearlyPrice: 5999 },
        'platinum': { price: 999, yearlyPrice: 9999 },
        'diamond': { price: 1499, yearlyPrice: 14999 },
        'titanium': { price: 2499, yearlyPrice: 24999 },
        'black_elite': { price: 4999, yearlyPrice: 49999 }
      };
      
      const expectedAmount = billing_cycle === 'yearly' ? TIERS[tier]?.yearlyPrice : TIERS[tier]?.price;
      
      if (expectedAmount === undefined) {
          return res.status(400).json({ success: false, message: 'Invalid membership tier.' });
      }

      try {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const razorpay = new Razorpay({ key_id, key_secret: secret });
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        
        if (rzpOrder.amount !== Math.round(expectedAmount * 100)) {
           return res.status(400).json({ success: false, message: `Payment amount mismatch. Expected ₹${expectedAmount}, but order was for ₹${rzpOrder.amount / 100}` });
        }
      } catch (rzpErr) {
        console.error("Razorpay Fetch Error:", rzpErr);
        return res.status(400).json({ success: false, message: rzpErr.message?.includes("mismatch") ? rzpErr.message : "Failed to verify payment amount with Razorpay" });
      }
    }

    // Calculate expiry date
    let expiresAt = new Date();
    if (billing_cycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Update customer's membership tier and expiry date
    const result = await pool.query(
      `UPDATE customers SET membership = $1, membership_expires_at = $2 WHERE customer_id = $3 RETURNING *`,
      [tier, expiresAt, req.user.id]
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
    const { target_tier } = req.body;
    if (!target_tier) {
      return res.status(400).json({ success: false, message: 'Target tier not specified.' });
    }
    
    const validTiers = ['free', 'silver', 'gold', 'platinum', 'diamond', 'titanium', 'black_elite'];
    if (!validTiers.includes(target_tier)) {
      return res.status(403).json({ success: false, message: 'Invalid downgrade tier.' });
    }

    const result = await pool.query(
      `UPDATE customers SET membership = $1, membership_expires_at = CASE WHEN $1 = 'free' THEN NULL ELSE membership_expires_at END WHERE customer_id = $2 RETURNING *`,
      [target_tier, req.user.id]
    );
    return res.json({ success: true, message: `Downgraded to ${target_tier}.`, data: result.rows[0] });
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
      `UPDATE customers SET membership = 'free', membership_expires_at = NULL WHERE customer_id = $1 RETURNING *`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'Membership cancelled, reverted to free tier.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
