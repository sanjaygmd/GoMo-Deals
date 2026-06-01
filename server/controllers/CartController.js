import { pool } from '../config/db.js';
import { logAction } from '../utils/auditLogger.js';

// Helper: get or create cart for customer
const getOrCreateCart = async (client, customer_id) => {
  const existing = await client.query('SELECT cart_id FROM cart WHERE customer_id = $1', [customer_id]);
  if (existing.rows.length > 0) {
    return existing.rows[0].cart_id;
  }
  const result = await client.query(
    `INSERT INTO cart (cart_id, customer_id)
     VALUES (gen_random_uuid(), $1)
     RETURNING cart_id`,
    [customer_id]
  );
  return result.rows[0].cart_id;
};

// Helper: sync cart total_amount and item_count
const syncCartSummary = async (client, cart_id) => {
  const summary = await client.query(
    `SELECT 
        COALESCE(SUM(quantity), 0) as total_items,
        COALESCE(SUM(quantity * price), 0) as total_amount
     FROM cart_items 
     WHERE cart_id = $1`,
    [cart_id]
  );

  const { total_items, total_amount } = summary.rows[0];

  await client.query(
    `UPDATE cart 
     SET total_amount = $1, 
         item_count = $2, 
         updated_at = NOW() 
     WHERE cart_id = $3`,
    [total_amount, total_items, cart_id]
  );
};


// GET /cart/:customer_id
export const getCart = async (req, res) => {
    const { customer_id } = req.params;

    if (req.user.id !== customer_id) {
        if (!['admin', 'super_admin'].includes(req.user.type)) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to cart' });
        }
    }

    try {
        if (req.user.id !== customer_id) {
            // Security Fix: Audit log when an administrator views another customer's shopping cart
            await logAction(req, 'VIEW_USER_CART', { customer_id });
        }
        const result = await pool.query(
            `SELECT 
                ci.cart_item_id,
                ci.quantity,
                ci.price,
                ci.variant_id,
                p.product_id,
                p.name,
                p.slug,
                p.brand,
                p.mrp,
                p.color,
                p.seller_id,
                cat.name AS category_name,
                cat.parent_category_id,
                (SELECT name FROM categories WHERE category_id = cat.parent_category_id) AS parent_category_name,
                COALESCE(
                    (SELECT image_url FROM product_images 
                     WHERE product_id = p.product_id 
                     AND (variant_id = ci.variant_id OR variant_id IS NULL) 
                     ORDER BY sort_order LIMIT 1),
                    '/fallback-product.png'
                ) AS thumbnail,
                pv.variant_name,
                pv.variant_value
            FROM cart c
            JOIN cart_items ci ON c.cart_id = ci.cart_id
            LEFT JOIN products p ON ci.product_id = p.product_id
            LEFT JOIN product_variants pv ON ci.variant_id = pv.variant_id
            LEFT JOIN categories cat ON p.category_id = cat.category_id
            WHERE c.customer_id = $1
            ORDER BY ci.created_at ASC`,
            [customer_id]
        );

        // Fetch cart summary
        const cartInfo = await pool.query('SELECT total_amount, item_count, updated_at FROM cart WHERE customer_id = $1', [customer_id]);
        
        return res.status(200).json({ 
            success: true, 
            cart_summary: cartInfo.rows[0] || { total_amount: 0, item_count: 0 },
            data: result.rows 
        });
    } catch (error) {
        console.error('FETCH CART ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error fetching cart' });
    }
};

// POST /cart/add
export const addToCart = async (req, res) => {
    let { product_id, variant_id, quantity } = req.body;
    
    if (variant_id === 'null' || variant_id === 'undefined' || !variant_id) {
        variant_id = null;
    }
    
    // Security Fix: Derive customer_id exclusively from the verified session context (req.user.id)
    // to prevent Insecure Direct Object Reference (IDOR) attacks.
    const customer_id = req.user.id;
    
    quantity = parseInt(quantity) || 1;
    if (quantity < 1) {
        quantity = 1;
    }

    if (!product_id) {
        return res.status(400).json({ success: false, message: 'product_id is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
        return res.status(400).json({ success: false, message: 'Sample products cannot be added to cart. Please choose a real product.' });
    }


    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const cart_id = await getOrCreateCart(client, customer_id);

        // Security Fix: Fetch the real price, stock, and name from the database, do NOT trust inputs from the body
        let dbPrice = 0;
        let dbStock = 0;
        let dbName = '';
        if (variant_id) {
            const vRes = await client.query(
                `SELECT pv.price, pv.stock_quantity, p.name AS product_name, pv.variant_value 
                 FROM product_variants pv 
                 JOIN products p ON pv.product_id = p.product_id 
                 WHERE pv.variant_id = $1`,
                [variant_id]
            );
            if (vRes.rows.length === 0) throw new Error("Product variant not found");
            dbPrice = parseFloat(vRes.rows[0].price);
            dbStock = parseInt(vRes.rows[0].stock_quantity) || 0;
            dbName = `${vRes.rows[0].product_name} (${vRes.rows[0].variant_value})`;
        } else {
            const pRes = await client.query("SELECT price, stock_quantity, name FROM products WHERE product_id = $1", [product_id]);
            if (pRes.rows.length === 0) throw new Error("Product not found");
            dbPrice = parseFloat(pRes.rows[0].price);
            dbStock = parseInt(pRes.rows[0].stock_quantity) || 0;
            dbName = pRes.rows[0].name;
        }

        // Check if same product+variant already in cart
        const existing = await client.query(
            `SELECT cart_item_id, quantity FROM cart_items 
             WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
            [cart_id, product_id, variant_id || null]
        );

        const currentCartQty = existing.rows.length > 0 ? parseInt(existing.rows[0].quantity) || 0 : 0;
        const targetQty = currentCartQty + quantity;

        if (targetQty > dbStock) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                success: false, 
                message: `Cannot add ${quantity} units. You already have ${currentCartQty} in your cart, and only ${dbStock} units of '${dbName}' are currently in stock.` 
            });
        }

        if (existing.rows.length > 0) {
            // Increment quantity
            await client.query(
                'UPDATE cart_items SET quantity = quantity + $1, price = $3, updated_at = NOW() WHERE cart_item_id = $2',
                [quantity, existing.rows[0].cart_item_id, dbPrice]
            );
        } else {
            // Insert new item with explicit UUID
            await client.query(
                `INSERT INTO cart_items (cart_item_id, cart_id, product_id, variant_id, quantity, price)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                [cart_id, product_id, variant_id || null, quantity, dbPrice]
            );
        }

        // Sync cart totals
        await syncCartSummary(client, cart_id);

        await client.query('COMMIT');
        // Fetch updated cart items
        const cartResult = await pool.query(
            `SELECT 
                ci.cart_item_id,
                ci.quantity,
                ci.price,
                ci.variant_id,
                p.product_id,
                p.name,
                p.slug,
                p.brand,
                p.mrp,
                p.color,
                p.seller_id,
                cat.name AS category_name,
                cat.parent_category_id,
                (SELECT name FROM categories WHERE category_id = cat.parent_category_id) AS parent_category_name,
                COALESCE(
                    (SELECT image_url FROM product_images 
                     WHERE product_id = p.product_id 
                     AND (variant_id = ci.variant_id OR variant_id IS NULL) 
                     ORDER BY sort_order LIMIT 1),
                    'https://via.placeholder.com/400'
                ) AS thumbnail,
                pv.variant_name,
                pv.variant_value
            FROM cart c
            JOIN cart_items ci ON c.cart_id = ci.cart_id
            LEFT JOIN products p ON ci.product_id = p.product_id
            LEFT JOIN product_variants pv ON ci.variant_id = pv.variant_id
            LEFT JOIN categories cat ON p.category_id = cat.category_id
            WHERE c.cart_id = $1
            ORDER BY ci.created_at ASC`,
            [cart_id]
        );
        
        const cartInfo = await pool.query('SELECT total_amount, item_count, updated_at FROM cart WHERE cart_id = $1', [cart_id]);

        return res.status(200).json({ 
            success: true, 
            message: 'Item added to cart', 
            cart_summary: cartInfo.rows[0],
            data: cartResult.rows 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ADD TO CART ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
    } finally {
        client.release();
    }
};

// PATCH /cart/update
export const updateCartItem = async (req, res) => {
    const { cart_item_id, quantity } = req.body;

    if (!cart_item_id || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'cart_item_id and quantity are required' });
    }

    const client = await pool.connect();
    try {
        // Ownership Check
        const ownershipCheck = await client.query(
            "SELECT c.customer_id FROM cart c JOIN cart_items ci ON c.cart_id = ci.cart_id WHERE ci.cart_item_id = $1",
            [cart_item_id]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        if (req.user.id !== ownershipCheck.rows[0].customer_id && !['admin', 'super_admin'].includes(req.user.type)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this cart item' });
        }

        const qty = parseInt(quantity);
        if (!isNaN(qty) && qty > 100) {
            return res.status(400).json({ success: false, message: 'Quantity cannot exceed 100 units per item.' });
        }

        let dbPrice = 0;
        if (!isNaN(qty) && qty > 0) {
            // Fetch actual stock and price
            const stockCheck = await client.query(
                `SELECT 
                    ci.product_id, 
                    ci.variant_id,
                    p.name AS product_name,
                    COALESCE(pv.stock_quantity, p.stock_quantity) AS stock_quantity,
                    COALESCE(pv.price, p.price) AS current_price
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.product_id
                 LEFT JOIN product_variants pv ON ci.variant_id = pv.variant_id
                 WHERE ci.cart_item_id = $1`,
                [cart_item_id]
            );

            if (stockCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cart item or associated product not found.' });
            }

            const { stock_quantity, product_name, current_price } = stockCheck.rows[0];
            if (qty > stock_quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot update quantity to ${qty}. Only ${stock_quantity} units of '${product_name}' are currently in stock.` 
                });
            }
            dbPrice = parseFloat(current_price);
        }

        await client.query('BEGIN');

        let result;
        if (qty <= 0) {
            result = await client.query('DELETE FROM cart_items WHERE cart_item_id = $1 RETURNING cart_id', [cart_item_id]);
        } else {
            // Update quantity and price in cart_items using latest DB price
            result = await client.query(
                'UPDATE cart_items SET quantity = $1, price = $2, updated_at = NOW() WHERE cart_item_id = $3 RETURNING cart_id',
                [qty, dbPrice, cart_item_id]
            );
        }

        if (result.rows.length > 0) {
            const cart_id = result.rows[0].cart_id;
            await syncCartSummary(client, cart_id);
        }

        await client.query('COMMIT');
        return res.status(200).json({ 
            success: true, 
            message: quantity <= 0 ? 'Item removed from cart' : 'Cart item updated' 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('UPDATE CART ITEM ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error updating cart item', error: error.message });
    } finally {
        client.release();
    }
};

// DELETE /cart/remove/:cart_item_id
export const removeFromCart = async (req, res) => {
    const { cart_item_id } = req.params;
    const client = await pool.connect();
    try {
        // Ownership Check
        const ownershipCheck = await client.query(
            "SELECT c.customer_id FROM cart c JOIN cart_items ci ON c.cart_id = ci.cart_id WHERE ci.cart_item_id = $1",
            [cart_item_id]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        if (req.user.id !== ownershipCheck.rows[0].customer_id && !['admin', 'super_admin'].includes(req.user.type)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this cart item' });
        }

        await client.query('BEGIN');

        const result = await client.query('DELETE FROM cart_items WHERE cart_item_id = $1 RETURNING cart_id', [cart_item_id]);
        
        if (result.rows.length > 0) {
            const cart_id = result.rows[0].cart_id;
            await syncCartSummary(client, cart_id);
        }
        
        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('REMOVE FROM CART ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error removing from cart' });
    } finally {
        client.release();
    }
};

// DELETE /cart/clear/:customer_id
export const clearCart = async (req, res) => {
    const { customer_id } = req.params;

    if (req.user.id !== customer_id && !['admin', 'super_admin'].includes(req.user.type)) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only clear your own cart' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        
        const cartRes = await client.query('SELECT cart_id FROM cart WHERE customer_id = $1', [customer_id]);
        if (cartRes.rows.length > 0) {
            const cart_id = cartRes.rows[0].cart_id;
            await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);
            await client.query(
                `UPDATE cart SET total_amount = 0, item_count = 0, updated_at = NOW() WHERE cart_id = $1`,
                [cart_id]
            );
        }
        
        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('CLEAR CART ERROR:', error);
        return res.status(500).json({ success: false, message: 'Error clearing cart' });
    } finally {
        client.release();
    }
};
