import { pool } from '../config/db.js';
import { pushOrderToShiprocket, cancelShipment } from './ShipmentController.js';
import { processAutoPayout } from './PayoutController.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { sendOrderConfirmationEmail } from '../utils/mailer.js';
import { sendOrderStatusNotifications } from '../utils/notifications.js';

export const createOrder = async (req, res, next) => {
  const client = await pool.connect();
  let actual_paid_amount = null;
  try {
    const {
      address_details, // { full_name, phone, address_line_1, city, state, pincode }
      items, // [{ product_id, variant_id, quantity, seller_id }]
      payment_method,
      payment_id, // Razorpay payment ID
      razorpay_order_id,
      razorpay_signature,
      shipping_charges = 0,
      discount_amount = 0,
      coupon_id = null,
      offer_token = null,
      payment_split = 'full'
    } = req.body;

    // Validate UUID to prevent purchasing mock products
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const item of items) {
      if (!uuidRegex.test(item.product_id)) {
        return res.status(400).json({ success: false, message: "Sample products cannot be purchased. Please add real products to your cart." });
      }
    }

    const customer_id = req.user.id;

    // Ensure payment details are provided
    if (payment_method === 'online' || payment_method === 'razorpay') {
      if (!payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing payment verification details" });
      }
    }

    if (!address_details || !payment_method) {
      return res.status(400).json({ success: false, message: "address_details and payment_method are required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item." });
    }

    // Failsafe: Check if user is an admin
    const adminCheck = await pool.query("SELECT admin_id FROM admins WHERE admin_id = $1", [customer_id]);
    if (adminCheck.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: "Administrators are restricted from placing orders. Please use a customer account."
      });
    }

    await client.query('BEGIN');

    // 1. Get or Create Address ID
    let address_id = address_details.address_id;
    if (!address_id) {
      const addrRes = await client.query(
        `INSERT INTO addresses (address_id, user_id, user_type, full_name, phone, address_line_1, city, state, pincode, is_default)
         VALUES (gen_random_uuid(), $1, 'customer', $2, $3, $4, $5, $6, $7, false)
         RETURNING address_id`,
        [customer_id, address_details.name, address_details.phone, address_details.address, address_details.city, address_details.state, address_details.pincode]
      );
      address_id = addrRes.rows[0].address_id;
    }

    // 2. Initial order values (will be updated after item loop)
    const order_id = crypto.randomUUID();
    const payment_status = payment_method === 'cod' ? 'Pending' : 'Paid';
    
    // 3. Process items and calculate totals (Security Fix: Server-side price validation)
    let serverCalculatedSubtotal = 0;
    const sellerSubtotals = {};
    const processedItems = [];
    // Retrieve dynamic platform fees from admin settings (with default fallbacks)
    let customerPlatformFee = 10.00;
    let sellerPlatformFee = 15.00;
    try {
      const settingsQuery = await client.query(
        "SELECT key, value FROM admin_settings WHERE key IN ('customer_platform_fee', 'seller_platform_fee')"
      );
      for (const row of settingsQuery.rows) {
        const val = typeof row.value === 'object' && row.value !== null ? parseFloat(row.value.fee || row.value) : parseFloat(JSON.parse(row.value));
        if (!isNaN(val) && val >= 0) {
          if (row.key === 'customer_platform_fee') customerPlatformFee = val;
          if (row.key === 'seller_platform_fee') sellerPlatformFee = val;
        }
      }
    } catch (err) {
      console.warn("[SETTINGS] Failed to read platform fees from database, using fallbacks:", err.message);
    }

    for (const item of items) {
      let qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) throw new Error(`Invalid quantity for one or more items.`);

      const rawVId = item.variant_id || item.variantId;
      const vId = (rawVId && rawVId !== 'null' && rawVId !== '') ? rawVId : null;

      let dbPrice = 0;
      let dbSellerId = null;
      let categoryName = null;
      let parentCategoryName = null;
      let categoryId = null;
      let parentCategoryId = null;

      if (vId) {
        const vCheck = await client.query(
          "SELECT pv.price, p.seller_id, pv.stock_quantity, p.name as product_name, c.name as category_name, c.category_id, c.parent_category_id, (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name, pv.variant_name, pv.variant_value FROM product_variants pv JOIN products p ON pv.product_id = p.product_id LEFT JOIN categories c ON p.category_id = c.category_id WHERE pv.variant_id = $1 FOR UPDATE OF pv, p",
          [vId]
        );
        if (vCheck.rows.length === 0) throw new Error(`Product variant not found.`);
        
        const row = vCheck.rows[0];
        categoryName = row.category_name;
        parentCategoryName = row.parent_category_name;
        categoryId = row.category_id;
        parentCategoryId = row.parent_category_id;
        const itemName = `${row.product_name} (${row.variant_name}: ${row.variant_value})`;
        
        if (row.stock_quantity < qty) throw new Error(`Insufficient stock for ${itemName}. Available: ${row.stock_quantity}`);
        
        dbPrice = parseFloat(row.price);
        dbSellerId = row.seller_id;

        const updateRes = await client.query("UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE variant_id = $2 AND stock_quantity >= $1", [qty, vId]);
        if (updateRes.rowCount === 0) throw new Error(`Insufficient stock for ${itemName}.`);
      } else {
        const pCheck = await client.query(
          "SELECT p.price, p.seller_id, p.stock_quantity, p.name as product_name, c.name as category_name, c.category_id, c.parent_category_id, (SELECT name FROM categories WHERE category_id = c.parent_category_id) as parent_category_name FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = $1 FOR UPDATE OF p",
          [item.product_id]
        );
        if (pCheck.rows.length === 0) throw new Error(`Product not found.`);
        
        const row = pCheck.rows[0];
        categoryName = row.category_name;
        parentCategoryName = row.parent_category_name;
        categoryId = row.category_id;
        parentCategoryId = row.parent_category_id;
        if (row.stock_quantity < qty) throw new Error(`Insufficient stock for ${row.product_name}. Available: ${row.stock_quantity}`);

        dbSellerId = row.seller_id;

        // Secure dynamic bargaining check
        let isBargained = false;
        if (offer_token) {
          const offerCheck = await client.query(
            "SELECT offered_price, agreed_quantity, expires_at, status FROM product_offers WHERE offer_token = $1 AND product_id = $2 AND customer_id = $3 AND status = 'Accepted'",
            [offer_token, item.product_id, customer_id]
          );
          if (offerCheck.rows.length > 0) {
            const offer = offerCheck.rows[0];
            if (!offer.expires_at || new Date(offer.expires_at) > new Date()) {
              dbPrice = parseFloat(offer.offered_price);
              if (offer.agreed_quantity) {
                  qty = parseInt(offer.agreed_quantity); // Overrides frontend quantity with mediated agreed quantity
              }
              isBargained = true;
            } else {
              throw new Error("Bargain offer token has expired.");
            }
          } else {
            throw new Error("Bargain offer token is invalid for this customer or product.");
          }
        }

        if (!isBargained) {
          dbPrice = parseFloat(row.price);
        }

        const updateRes = await client.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2 AND stock_quantity >= $1", [qty, item.product_id]);
        if (updateRes.rowCount === 0) throw new Error(`Insufficient stock for ${row.product_name}.`);
      }

      const itemTotal = dbPrice * qty;
      serverCalculatedSubtotal += itemTotal;
      
      if (dbSellerId) {
        sellerSubtotals[dbSellerId] = (sellerSubtotals[dbSellerId] || 0) + itemTotal;
      }

      processedItems.push({
        product_id: item.product_id,
        variant_id: vId,
        seller_id: dbSellerId,
        quantity: qty,
        unit_price: dbPrice,
        total_price: itemTotal,
        category_name: categoryName,
        parent_category_name: parentCategoryName,
        category_id: categoryId,
        parent_category_id: parentCategoryId
      });
    }

    // 3.1 Security Fix: Server-side Shipping Calculation
    // For now, implement a flat rate or simple logic. Never trust req.body.shipping_charges.
    const calculatedShipping = serverCalculatedSubtotal > 999 ? 0 : 49; // Free shipping over 999, else 49

    // 4. Validate Coupon and Calculate Discount
    let serverDiscountAmount = 0;
    if (coupon_id && coupon_id !== 'null' && coupon_id !== 'undefined') {
      const couponCheck = await client.query(
        "SELECT type, discount_percent, discount_amount, max_discount, min_order_value, max_usage, used_count, category FROM coupons WHERE coupon_id = $1 FOR UPDATE",
        [coupon_id]
      );

      if (couponCheck.rows.length > 0) {
        const coupon = couponCheck.rows[0];

        // Security Fix: Server-side category validation for coupons
        let eligibleSubtotal = 0;
        let hasEligibleItem = false;

        const catRes = await client.query("SELECT category_id FROM coupon_categories WHERE coupon_id = $1", [coupon_id]);
        const couponCategoryIds = catRes.rows.map(r => r.category_id);

        for (const pItem of processedItems) {
            let isMatch = true;
            if (couponCategoryIds.length > 0) {
                isMatch = couponCategoryIds.includes(pItem.category_id) || couponCategoryIds.includes(pItem.parent_category_id);
            }
            if (isMatch) {
                eligibleSubtotal += pItem.total_price;
                hasEligibleItem = true;
            }
        }

        if (!hasEligibleItem && coupon.category && coupon.category !== 'all') {
             throw new Error(`This coupon is not valid for any items in your cart.`);
        }
        
        if (eligibleSubtotal < parseFloat(coupon.min_order_value || 0)) {
          throw new Error(`Minimum eligible order value for this coupon is ₹${coupon.min_order_value}`);
        }

        const customerUsage = await client.query(
          "SELECT 1 FROM coupon_usage WHERE coupon_id = $1 AND customer_id = $2",
          [coupon_id, customer_id]
        );
        if (customerUsage.rows.length > 0) throw new Error("You already used this coupon");
        if (coupon.max_usage && coupon.used_count >= coupon.max_usage) throw new Error("Coupon expired.");

        if (coupon.type === 'percentage') {
          serverDiscountAmount = (eligibleSubtotal * parseFloat(coupon.discount_percent)) / 100;
          if (coupon.max_discount) {
            serverDiscountAmount = Math.min(serverDiscountAmount, parseFloat(coupon.max_discount));
          }
        } else {
          serverDiscountAmount = parseFloat(coupon.discount_amount || 0);
          serverDiscountAmount = Math.min(serverDiscountAmount, eligibleSubtotal);
        }
      }
    }

    // 5. Final Order Calculations
    const final_tax_amount = Math.round(serverCalculatedSubtotal * 0.05); // 5% Tax
    const final_platform_fee = 10;
    const final_cod_fee = payment_method === 'cod' ? 50 : 0;
    const final_total_amount = serverCalculatedSubtotal + calculatedShipping + final_tax_amount + final_platform_fee + final_cod_fee - serverDiscountAmount;

    // 5b. Verify Payment Amount & Signature
    if (payment_method === 'online' || payment_method === 'razorpay') {
      const isMock = process.env.NODE_ENV !== 'production' && razorpay_order_id.startsWith('order_mock_');
      if (!isMock) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const key_id = process.env.RAZORPAY_KEY_ID;
        
        if (!secret || secret === 'your_razorpay_secret_here') {
          console.error("CRITICAL: Razorpay secret not configured. Blocking order.");
          throw new Error("Payment verification failed: razorpay secret not configured");
        }

        const generated_signature = crypto
          .createHmac('sha256', secret)
          .update(razorpay_order_id + "|" + payment_id)
          .digest('hex');

        if (generated_signature !== razorpay_signature) {
          throw new Error("Invalid payment signature");
        }
        
        // CRITICAL SECURITY FIX: Validate that the Razorpay order amount strictly matches the server-calculated total
        try {
          const razorpay = new Razorpay({ key_id, key_secret: secret });
          const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
          const expectedAmount = Math.round(final_total_amount * 100);
          
          if (rzpOrder.amount !== expectedAmount) {
             throw new Error(`Payment amount mismatch. Expected ₹${expectedAmount / 100}, but order was for ₹${rzpOrder.amount / 100}`);
          }
        } catch (rzpErr) {
          console.error("Razorpay Fetch Error:", rzpErr);
          throw new Error(rzpErr.message?.includes("mismatch") ? rzpErr.message : "Failed to verify payment amount with Razorpay");
        }
      }
    }

    let pending_balance = 0;
    actual_paid_amount = final_total_amount;
    
    if (payment_split === 'advance_20') {
      actual_paid_amount = final_total_amount * 0.20;
      pending_balance = final_total_amount - actual_paid_amount;
    }

    // 6. Insert into orders
    await client.query(
      `INSERT INTO orders (
        order_id, customer_id, address_id, subtotal, shipping_charges, 
        tax_amount, total_amount, discount_amount, coupon_id, platform_fee, 
        cod_fee, order_status, payment_status, payment_method, payment_split, pending_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending', $12, $13, $14, $15)`,
      [
        order_id, customer_id, address_id, serverCalculatedSubtotal, calculatedShipping, 
        final_tax_amount, final_total_amount, serverDiscountAmount, coupon_id, final_platform_fee, 
        final_cod_fee, payment_status, payment_method, payment_split, pending_balance
      ]
    );

    // 7. Insert processed items
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO order_items (order_item_id, order_id, product_id, variant_id, seller_id, quantity, unit_price, total_price, item_status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'Pending')`,
        [order_id, item.product_id, item.variant_id, item.seller_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    // 8. Insert into order_sellers and notifications
    for (const seller_id in sellerSubtotals) {
      const seller_subtotal = parseFloat(sellerSubtotals[seller_id]);
      const effective_fee = Math.min(sellerPlatformFee, seller_subtotal * 0.15);
      const seller_earnings = Math.max(0, seller_subtotal - effective_fee);

      await client.query(
        `INSERT INTO order_sellers (
          order_seller_id, order_id, seller_id, seller_subtotal, 
          seller_platform_fee, seller_earnings, payout_status
         ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'Pending')`,
        [order_id, seller_id, seller_subtotal, effective_fee, seller_earnings]
      );

      await client.query(
        `INSERT INTO notifications (notification_id, customer_id, seller_id, order_id, is_read, type, message, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, false, 'new_order', $4, NOW())`,
        [customer_id, seller_id, order_id, `New order received! Order Total: ₹${sellerSubtotals[seller_id]}`]
      );
    }

    // 9. Payment records
    const paymentRes = await client.query(
      `INSERT INTO payments (payment_id, customer_id, order_id, amount, payment_method, payment_status, transaction_id, paid_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING payment_id`,
      [customer_id, order_id, actual_paid_amount, payment_method, payment_status, payment_id || null, payment_status === 'Paid' ? new Date() : null]
    );
    const internal_payment_id = paymentRes.rows[0].payment_id;

    if (payment_status === 'Paid') {
      await client.query(
        `INSERT INTO finance_transactions (finance_transactions_id, order_id, payment_id, transaction_type, amount, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'order_payment', $3, NOW())`,
        [order_id, internal_payment_id, actual_paid_amount]
      );
    }

    await client.query(
      `INSERT INTO order_status_history (history_id, order_id, changed_by, status, notes)
       VALUES (gen_random_uuid(), $1, $2, 'Pending', 'Order placed successfully')`,
      [order_id, customer_id]
    );

    // 10. Cleanup Cart
    const cartRes = await client.query("SELECT cart_id FROM cart WHERE customer_id = $1", [customer_id]);
    if (cartRes.rows.length > 0) {
      const cart_id = cartRes.rows[0].cart_id;
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id]);
      await client.query("UPDATE cart SET item_count = 0, total_amount = 0, updated_at = NOW() WHERE cart_id = $1", [cart_id]);
    }

    await client.query(
      `INSERT INTO notifications (notification_id, customer_id, order_id, is_read, type, message, created_at)
       VALUES (gen_random_uuid(), $1, $2, false, 'order_placed', $3, NOW())`,
      [customer_id, order_id, `Your order #${order_id.slice(0, 8).toUpperCase()} has been placed successfully!`]
    );

    await client.query(
      `INSERT INTO notifications (notification_id, type, message, created_at, is_read)
       VALUES (gen_random_uuid(), 'new_order', $1, NOW(), false)`,
      [`New Order #${order_id.slice(0, 8).toUpperCase()} received! Total: ₹${final_total_amount}`]
    );

    // 9b. Update coupon usage and increments on successful path only (right before COMMIT)
    if (coupon_id && coupon_id !== 'null' && coupon_id !== 'undefined' && serverDiscountAmount > 0) {
      await client.query("UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = $1", [coupon_id]);
      await client.query(
        "INSERT INTO coupon_usage (usage_id, coupon_id, customer_id, order_id, used_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW())",
        [coupon_id, customer_id, order_id]
      );
    }
    // 9c. Update bargain offer usage if applicable
    if (offer_token) {
      await client.query("UPDATE product_offers SET status = 'Expired' WHERE offer_token = $1", [offer_token]);
    }

    await client.query('COMMIT');

    pushOrderToShiprocket(order_id).catch(srError => {
        console.error(`[SHIPROCKET BACKGROUND ERROR] Order ${order_id}:`, srError.message);
    });

    res.status(201).json({ success: true, message: "Order placed successfully", order_id });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[ORDER FATAL ERROR]`, error);

    // Transaction Safety: Auto-Refund Orphaned Payments
    const { payment_method, payment_id, razorpay_order_id } = req.body;
    if ((payment_method === 'online' || payment_method === 'razorpay') && payment_id) {
        const isMock = process.env.NODE_ENV !== 'production' && razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
        if (!isMock) {
            try {
                const razorpay = new Razorpay({ 
                    key_id: process.env.RAZORPAY_KEY_ID, 
                    key_secret: process.env.RAZORPAY_KEY_SECRET 
                });
                if (actual_paid_amount) {
                    await razorpay.payments.refund(payment_id, { amount: Math.round(actual_paid_amount * 100) });
                } else {
                    await razorpay.payments.refund(payment_id);
                }
                console.log(`[TRANSACTION SAFETY] Auto-refunded orphaned payment ${payment_id}`);
            } catch (refundErr) {
                console.error(`[CRITICAL ALERT] Failed to auto-refund orphaned payment ${payment_id}:`, refundErr);
            }
        }
    }

    // Security Fix: Mask raw technical errors but allow through known business errors
    const businessErrors = ["Insufficient stock", "Minimum order value", "Payment amount mismatch", "Failed to verify payment amount", "Coupon already used", "You already used this coupon", "Coupon expired", "Invalid payment signature", "Administrators are restricted", "Invalid quantity", "Product not found"];
    const isBusinessError = businessErrors.some(msg => error.message?.includes(msg));
    const userMessage = isBusinessError ? error.message : "Failed to place order. Please try again later.";
    res.status(isBusinessError ? 400 : 500).json({ success: false, message: userMessage });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { customer_id: paramId } = req.params;
    const isRestricted = req.user.type === 'customer';
    const customer_id = isRestricted ? req.user.id : (paramId || req.user.id);

    const result = await pool.query(
      `SELECT o.*, 
             (
               SELECT json_agg(
                 json_build_object(
                   'order_item_id', oi.order_item_id,
                   'product_id', oi.product_id,
                   'variant_id', oi.variant_id,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price,
                   'item_status', oi.item_status,
                   'product_name', p.name,
                   'slug', p.slug,
                   'thumbnail', COALESCE(
                       (SELECT image_url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order LIMIT 1),
                       'https://via.placeholder.com/150'
                   ),
                   'variant_name', pv.variant_name,
                   'variant_value', pv.variant_value
                 )
               ) 
               FROM order_items oi 
               LEFT JOIN products p ON oi.product_id = p.product_id
               LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
               WHERE oi.order_id = o.order_id
             ) as items,
             COALESCE((SELECT json_agg(rr.*) FROM return_requests rr WHERE rr.order_id = o.order_id), '[]'::json) as return_requests
             FROM orders o 
             WHERE o.customer_id = $1 
             ORDER BY o.placed_at DESC`,
      [customer_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("FETCH ORDERS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}


export const getOrderById = async (req, res, next) => {
  try {
    const { order_id } = req.params;

    // Fetch order details
    const orderRes = await pool.query(
      `SELECT o.*, a.full_name as shipping_name, a.phone as shipping_phone, a.address_line_1, a.city, a.state, a.pincode
             FROM orders o
             JOIN addresses a ON o.address_id = a.address_id
             WHERE o.order_id = $1`,
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];

    // Ownership/Role Check
    // Allowed if: User is the customer WHO placed it, OR an Admin, OR a Seller who has items in this order
    let isAuthorized = false;
    if (req.user.type === 'admin' || req.user.type === 'super_admin') {
      isAuthorized = true;
    } else if (req.user.type === 'customer' && order.customer_id === req.user.id) {
      isAuthorized = true;
    } else if (req.user.type === 'seller') {
      const sellerItemCheck = await pool.query(
        "SELECT 1 FROM order_items WHERE order_id = $1 AND seller_id = $2 LIMIT 1",
        [order_id, req.user.id]
      );
      if (sellerItemCheck.rows.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Unauthorized access to order details" });
    }

    // Fetch order items with product details and commission info
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name as product_name, p.slug, p.images, pv.variant_name, pv.variant_value,
                    os.seller_platform_fee, os.seller_earnings
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
             LEFT JOIN order_sellers os ON oi.order_id = os.order_id AND p.seller_id = os.seller_id
             WHERE oi.order_id = $1`,
      [order_id]
    );

    // Fetch status history
    const historyRes = await pool.query(
      `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY changed_at DESC`,
      [order_id]
    );

    // Fetch payment details
    const paymentRes = await pool.query(
      `SELECT * FROM payments WHERE order_id = $1`,
      [order_id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...orderRes.rows[0],
        items: itemsRes.rows,
        status_history: historyRes.rows,
        payment: paymentRes.rows[0] || null
      }
    });
  } catch (error) {
    console.error("FETCH ORDER DETAILS ERROR:", error);
    next(error);
  }


}

export const updateOrderStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { order_id } = req.params;
    const { status, notes, courier, tracking_id, est_delivery } = req.body;
    const changed_by = req.user.id;

    // Ownership/Role Check
    // Ownership/Role Check
    if (req.user.type === 'customer' && status.trim() !== 'Cancelled') {
      console.warn("Update blocked: Customer attempted non-cancellation update");
      return res.status(403).json({ success: false, message: "Customers can only cancel their own orders." });
    }

    const orderCheck = await client.query("SELECT customer_id, order_status FROM orders WHERE order_id = $1", [order_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (req.user.type === 'customer' && orderCheck.rows[0].customer_id !== req.user.id) {
      console.warn("Update blocked: Ownership mismatch", { orderCust: orderCheck.rows[0].customer_id, user: req.user.id });
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const currentStatus = orderCheck.rows[0].order_status;
    if (status.trim() === 'Cancelled') {
      if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
        return res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${currentStatus}.` });
      }
      if (req.user.type === 'customer' && currentStatus === 'Shipped') {
        return res.status(400).json({ success: false, message: "Cannot cancel an order that has already been shipped. Please request a return upon delivery." });
      }
    }

    if (req.user.type === 'seller') {
      const sellerAllowedStatuses = ['Processing', 'Shipped', 'Cancelled'];
      if (!sellerAllowedStatuses.includes(status)) {
        return res.status(403).json({ success: false, message: "Sellers are only permitted to update status to Processing, Shipped, or Cancelled." });
      }

      const sellerItemCheck = await client.query(
        "SELECT 1 FROM order_items WHERE order_id = $1 AND seller_id = $2 LIMIT 1",
        [order_id, req.user.id]
      );
      if (sellerItemCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this order" });
      }
    }

    await client.query('BEGIN');

    // 1. Update order status and logistics
    await client.query(
      `UPDATE orders 
             SET order_status = $1, 
                 cancellation_reason = $2, 
                 courier = $3, 
                 tracking_id = $4, 
                 estimated_delivery = $5,
                 updated_at = NOW() 
             WHERE order_id = $6`,
      [status, status === 'Cancelled' ? notes : null, courier, tracking_id, est_delivery, order_id]
    );

    // 1b. Sync with deliveries table
    if (status === 'Shipped' || status === 'Delivered' || status === 'Processing') {
      await client.query(`
                INSERT INTO deliveries (
                    delivery_id, order_id, courier_name, awb_code, shipping_status, 
                    dispatched_at, delivered_at, updated_at, created_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4::varchar,
                    CASE WHEN $4::varchar = 'Shipped' OR $4::varchar = 'Delivered' THEN NOW() ELSE NULL END,
                    CASE WHEN $4::varchar = 'Delivered' THEN NOW() ELSE NULL END,
                    NOW(), NOW()
                )
                ON CONFLICT (order_id) DO UPDATE SET
                    courier_name = EXCLUDED.courier_name,
                    awb_code = EXCLUDED.awb_code,
                    shipping_status = EXCLUDED.shipping_status,
                    dispatched_at = COALESCE(deliveries.dispatched_at, EXCLUDED.dispatched_at),
                    delivered_at = COALESCE(deliveries.delivered_at, EXCLUDED.delivered_at),
                    updated_at = NOW()
            `, [order_id, courier || 'Manual', tracking_id || 'N/A', status]);
    }

    // 2. Logistics & Finance sync on delivery
    if (status === 'Delivered') {
      // Mark Customer Payment as Paid
      const payRes = await client.query(
        "UPDATE payments SET payment_status = 'Paid', paid_at = NOW() WHERE order_id = $1 RETURNING payment_id, amount",
        [order_id]
      );

      if (payRes.rows.length > 0) {
        // [FIX] Duplicate Transaction Guard: Only log 'order_payment' for COD on delivery. 
        // Online payments are already logged at creation (createOrder step 5b).
        const orderInfo = await client.query('SELECT payment_method FROM orders WHERE order_id = $1', [order_id]);
        
        if (orderInfo.rows[0]?.payment_method === 'cod') {
          await client.query(
            `INSERT INTO finance_transactions (finance_transactions_id, order_id, payment_id, transaction_type, amount, created_at)
                       VALUES (gen_random_uuid(), $1, $2, 'order_payment', $3, NOW())`,
            [order_id, payRes.rows[0].payment_id, payRes.rows[0].amount]
          );
        }

        // Update order payment status
        await client.query("UPDATE orders SET payment_status = 'Paid' WHERE order_id = $1", [order_id]);

        // [DISABLED] Automated Payout Logic on Delivery is turned off.
        // Sellers must manually click "Request Instant Payout" from their dashboard to trigger withdrawals.
        // await processAutoPayout(order_id);
      }
    } else if (status === 'Cancelled') {
      await client.query(
        "UPDATE order_sellers SET payout_status = 'Cancelled' WHERE order_id = $1",
        [order_id]
      );

      // Restore Stock
      const orderItems = await client.query("SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = $1", [order_id]);
      for (const item of orderItems.rows) {
        if (item.variant_id) {
          await client.query("UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE variant_id = $2", [item.quantity, item.variant_id]);
        } else {
          await client.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2", [item.quantity, item.product_id]);
        }
      }

      // Update daily_finances to subtract revenue using stored seller financials from order_sellers
      const orderInfo = await client.query("SELECT DATE(placed_at) as date FROM orders WHERE order_id = $1", [order_id]);
      if (orderInfo.rows.length > 0) {
        const sellerDetails = await client.query(
          "SELECT seller_id, seller_subtotal, seller_platform_fee, seller_earnings FROM order_sellers WHERE order_id = $1",
          [order_id]
        );
        for (const s of sellerDetails.rows) {
          await client.query(`
                        UPDATE daily_finances 
                        SET total_revenue = total_revenue - $1, 
                            platform_commission = platform_commission - $2, 
                            net_seller_earnings = net_seller_earnings - $3
                        WHERE seller_id = $4 AND date = $5
                    `, [parseFloat(s.seller_subtotal), parseFloat(s.seller_platform_fee), parseFloat(s.seller_earnings), s.seller_id, orderInfo.rows[0].date]);
        }
      }
    }

    // 3. Handle Shiprocket Cancellation if applicable
    if (status === 'Cancelled') {
      await cancelShipment(order_id);
    }

    // 4. Add to history
    await client.query(
      "INSERT INTO order_status_history (history_id, order_id, changed_by, status, notes) VALUES (gen_random_uuid(), $1, $2, $3, $4)",
      [order_id, changed_by, status, notes || `Order status updated to ${status}`]
    );

    // 5. Notify
    await sendOrderStatusNotifications(order_id, status, client, courier, tracking_id);

    await client.query('COMMIT');
    res.status(200).json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("UPDATE ORDER STATUS ERROR:", error);
    next(error);
  } finally {
    if (client) client.release();
  }
};

/**
 * Create a Return Request (Customer Side)
 */
export const createReturnRequest = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { order_id, order_item_id, reason, return_type } = req.body;
        const customer_id = req.user.id;

        if (!order_id || !order_item_id || !customer_id || !reason || !return_type) {
            return res.status(400).json({ success: false, message: "Missing required fields for return request." });
        }

        await client.query('BEGIN');

        // 1. Verify the order belongs to the customer and is delivered
        const orderCheck = await client.query(
            "SELECT order_status FROM orders WHERE order_id = $1 AND customer_id = $2",
            [order_id, customer_id]
        );

        if (orderCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Order not found or does not belong to you." });
        }

        if (orderCheck.rows[0].order_status !== 'Delivered') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "Only delivered orders can be returned." });
        }

        // 1b. Check if a return request already exists for this item
        const existingRR = await client.query(
            "SELECT refund_status FROM return_requests WHERE order_item_id = $1",
            [order_item_id]
        );
        if (existingRR.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `A return request for this item is already ${existingRR.rows[0].refund_status}.` });
        }

        // 2. Verify the order item exists
        const itemCheck = await client.query(
            "SELECT unit_price, quantity, seller_id FROM order_items WHERE order_item_id = $1 AND order_id = $2",
            [order_item_id, order_id]
        );

        if (itemCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Order item not found." });
        }

        const { unit_price, quantity, seller_id } = itemCheck.rows[0];
        const refund_amount = unit_price * quantity;

        // 3. Insert into return_requests
        const returnRes = await client.query(
            `INSERT INTO return_requests (
                return_request_id, order_id, order_item_id, customer_id, 
                reason, return_type, refund_amount, refund_status, requested_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'Pending', NOW())
            RETURNING return_request_id`,
            [order_id, order_item_id, customer_id, reason, return_type, refund_amount]
        );
        const return_request_id = returnRes.rows[0].return_request_id;

        // 4. Create notification for admin
        await client.query(
            `INSERT INTO notifications (notification_id, type, message, created_at, is_read)
             VALUES (gen_random_uuid(), 'return_request', $1, NOW(), false)`,
            [`New Return Request #${return_request_id.slice(0, 8).toUpperCase()} received for Order #${order_id.slice(0, 8).toUpperCase()}`]
        );

        // 5. Create notification for the seller of this product
        if (seller_id) {
            await client.query(
                `INSERT INTO notifications (notification_id, seller_id, order_id, type, message, created_at, is_read)
                 VALUES (gen_random_uuid(), $1, $2, 'return_request', $3, NOW(), false)`,
                [
                    seller_id, 
                    order_id, 
                    `New Return Request received for your product of Order #${order_id.slice(0, 8).toUpperCase()} (Return Reference: RET-${return_request_id.slice(0, 8).toUpperCase()}).`
                ]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Return request submitted successfully.", return_id: return_request_id });

    } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("CREATE RETURN REQUEST ERROR:", error);
    next(error);
    } finally {

        client.release();
    }
};

/**
 * Send order confirmation email via nodemailer.
 * Called by the frontend after a successful order placement.
 */
export const sendOrderEmail = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing orderId.' });
    }

    // 1. Fetch order ownership check to make sure the requesting client actually placed this order
    const orderOwnerQuery = await pool.query(
      "SELECT customer_id FROM orders WHERE order_id = $1",
      [orderId]
    );
    if (orderOwnerQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Enforce ownership check for customers (admins/super_admins are authorized to bypass ownership)
    if (req.user.type === 'customer' && orderOwnerQuery.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order.' });
    }

    // 2. Fetch completed details directly from DB (JOINS with addresses tables)
    const orderDetails = await pool.query(
      `SELECT o.total_amount, o.payment_method, o.customer_id,
              a.full_name as shipping_name, a.phone as shipping_phone, a.address_line_1, a.city, a.state, a.pincode
       FROM orders o
       JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderDetails.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order details or recipient address not found.' });
    }

    const oData = orderDetails.rows[0];
    const fullAddress = `${oData.shipping_name}, ${oData.shipping_phone}, ${oData.address_line_1}, ${oData.city}, ${oData.state} - ${oData.pincode}`;

    // 3. Fetch customer email from auth_sessions user_profile
    const sessionRes = await pool.query(
        "SELECT user_profile FROM auth_sessions WHERE user_ref_id = $1 ORDER BY created_at DESC LIMIT 1",
        [oData.customer_id]
    );
    const customerName = sessionRes.rows.length > 0 ? (sessionRes.rows[0].user_profile?.name || 'Customer') : 'Customer';
    const customerEmail = sessionRes.rows.length > 0 ? (sessionRes.rows[0].user_profile?.email || '') : '';

    if (!customerEmail) {
        console.warn(`[SEND ORDER EMAIL] No email found in auth_sessions for customer_id ${oData.customer_id}`);
    }

    const result = await sendOrderConfirmationEmail({
      customerName: customerName,
      customerEmail: customerEmail,
      orderId: orderId,
      total: oData.total_amount,
      paymentMethod: oData.payment_method,
      address: fullAddress
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Order confirmation email sent.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send confirmation email.' });
    }
  } catch (error) {
    console.error('[SEND ORDER EMAIL ERROR]', error);
    next(error);
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const key_id = process.env.RAZORPAY_KEY_ID;

    // Detect placeholder keys or development bypass
    const isPlaceholder = !secret || secret.includes('your_razorpay') || secret === 'razorpay_secret_2026';
    if (isPlaceholder) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error("Critical: Real payment credentials are required in production.");
      }
      console.warn('[RAZORPAY WARNING] Using placeholder credentials. Activating secure Sandbox Bypass mode for development.');
      return res.status(200).json({
        success: true,
        isMock: true,
        order: {
          id: `order_mock_${crypto.randomBytes(8).toString('hex')}`
        }
      });
    }

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: secret
    });

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("RAZORPAY ORDER CREATION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
  }
};
