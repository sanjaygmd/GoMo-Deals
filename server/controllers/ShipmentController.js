import { pool } from '../config/db.js';
import { 
    createShiprocketOrder, 
    getShiprocketTracking, 
    cancelShiprocketOrder,
    getShiprocketServiceability,
    assignShiprocketAWB,
    generateShiprocketPickup,
    createShiprocketReturn as srCreateReturn,
    getShiprocketPickupLocations,
    addShiprocketPickupLocation
} from '../utils/shiprocket.js';

export const createShiprocketReturn = async (payload) => {
    return await srCreateReturn(payload);
};
import { sendOrderStatusNotifications } from '../utils/notifications.js';

/**
 * Intelligent Auto-Pilot: Create SR Order -> Choose Best Courier -> Assign AWB -> Schedule Pickup
 * @param {string} orderId 
 * @param {object} client - Optional DB client for transaction
 */
export const pushOrderToShiprocket = async (orderId, client = pool) => {
    try {

        // 0. IDEMPOTENCY: Check if this order already exists in Shiprocket
        const existingSR = await client.query(
            'SELECT sr_order_id, shipment_id, awb_code FROM shiprocket_orders WHERE order_id = $1',
            [orderId]
        );

        let srOrderId, shipmentId, awbCode = null;

        // 1. Fetch Order Details with Customer Address
        const orderRes = await client.query(`
            SELECT o.*, a.full_name, a.phone, a.address_line_1, a.city, a.state, a.pincode, c.email
            FROM orders o
            JOIN addresses a ON o.address_id = a.address_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = $1
        `, [orderId]);

        if (orderRes.rows.length === 0) {
            console.error(`[SHIPROCKET] Error: Order ${orderId} not found in DB.`);
            throw new Error('Order not found');
        }

        const order = orderRes.rows[0];

        // 2. Fetch Order Items with Product Weight/Dimensions
        const itemsRes = await client.query(`
            SELECT oi.*, p.name as product_name, p.sku, p.weight, p.length, p.breadth, p.height
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = $1
        `, [orderId]);

        const items = itemsRes.rows;
        if (items.length === 0) {
            console.error(`[SHIPROCKET] Error: No items found for order ${orderId}.`);
            throw new Error('No order items found');
        }

        // 3. Get Default Pickup Location for the primary seller
        const firstSellerId = items[0].seller_id;
        const pickupRes = await client.query(`
            SELECT * FROM seller_pickup_location 
            WHERE seller_id = $1 AND is_default = true
            LIMIT 1
        `, [firstSellerId]);

        if (pickupRes.rows.length === 0) {
            throw new Error(`Seller ${firstSellerId} has no default pickup location configured. Please add one in Seller Settings.`);
        }

        const pickupLocation = pickupRes.rows[0];

        // 3b. Verify the pickup location exists in Shiprocket; if not, auto-register it
        const srPickupRes = await getShiprocketPickupLocations();
        const srPickups = srPickupRes?.data?.shipping_address || srPickupRes?.shipping_address || [];
        const srPickupNames = srPickups.map(p => (p.pickup_location || p.name || '').toLowerCase().trim());
        const ourPickupName = (pickupLocation.location_name || '').trim();

        let finalPickupName = ourPickupName;
        if (!srPickupNames.includes(ourPickupName.toLowerCase())) {
            console.log(`[SHIPROCKET] Pickup location '${ourPickupName}' not found in SR. Attempting auto-register...`);
            const syncRes = await addShiprocketPickupLocation(pickupLocation);
            if (syncRes && (syncRes.success || syncRes.status_code === 200 || syncRes.data)) {
                console.log(`[SHIPROCKET] Auto-registered pickup location '${ourPickupName}'`);
                // Wait for Shiprocket to propagate
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                // Fallback: use first available SR pickup location
                if (srPickups.length > 0) {
                    finalPickupName = srPickups[0].pickup_location || srPickups[0].name;
                    console.warn(`[SHIPROCKET] Using fallback SR pickup: '${finalPickupName}'`);
                } else {
                    throw new Error('No pickup locations available in Shiprocket. Please configure one in your Shiprocket account.');
                }
            }
        }

        // 4. Prepare Payload
        const nameParts = (order.full_name || "Customer User").trim().split(/\s+/);
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
        
        let cleanedPhone = order.phone ? order.phone.replace(/\D/g, '') : '';
        if (cleanedPhone.length > 10 && cleanedPhone.startsWith('91')) {
            cleanedPhone = cleanedPhone.substring(cleanedPhone.length - 10);
        }
        const validPhone = cleanedPhone.length >= 10 ? cleanedPhone.substring(0, 10) : "9876543210";
        
        let customerAddress = (order.address_line_1 || '').trim().replace(/[^\w\s\-,./#():;]/g, '');
        if (customerAddress.length < 10) customerAddress = `House No. 1, ${customerAddress}`;
        if (customerAddress.length < 10) customerAddress = "Default Address Street 1";

        const srOrderItems = items.map(item => ({
            name: (item.product_name || "Product").slice(0, 50),
            sku: (item.sku || (item.product_id ? item.product_id.slice(0, 8) : "PROD")).toString().slice(0, 20).replace(/[^a-zA-Z0-9_-]/g, ''),
            units: item.quantity,
            selling_price: Math.max(1, Number(item.unit_price))
        }));

        const additionalFees = Number(order.tax_amount || 0) + Number(order.platform_fee || 0) + Number(order.cod_fee || 0);
        if (additionalFees > 0) {
            srOrderItems.push({ name: "Taxes and Fees", sku: "TAX-FEE", units: 1, selling_price: additionalFees });
        }

        const uniqueId = order.order_id.toString().split('-')[0].toUpperCase();
        const displayId = `ORD-${uniqueId}`;

        const srPayload = {
            order_id: displayId,
            order_date: new Date(order.placed_at).toISOString().split('T')[0],
            pickup_location: finalPickupName,
            billing_customer_name: firstName.slice(0, 30),
            billing_last_name: lastName.slice(0, 30),
            billing_address: customerAddress.slice(0, 250),
            billing_city: (order.city || "City").slice(0, 30),
            billing_pincode: (order.pincode || "110001").toString().replace(/\s/g, '').slice(0, 6),
            billing_state: (order.state || "State").slice(0, 30),
            billing_country: "India",
            billing_email: (order.email || "customer@example.com").slice(0, 50),
            billing_phone: validPhone,
            shipping_is_billing: true,
            order_items: srOrderItems,
            payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
            sub_total: Math.max(1, Number(order.subtotal) + additionalFees),
            shipping_charges: Number(order.shipping_charges || 0),
            total_discount: Number(order.discount_amount || 0),
            length: Math.max(1, ...items.map(i => { const v = Number(i.length); return (isNaN(v) || v <= 0) ? 10 : v; })),
            breadth: Math.max(1, ...items.map(i => { const v = Number(i.breadth); return (isNaN(v) || v <= 0) ? 10 : v; })),
            height: Math.max(1, ...items.map(i => { const v = Number(i.height); return (isNaN(v) || v <= 0) ? 10 : v; })),
            weight: Math.max(0.1, items.reduce((acc, i) => acc + (Number(i.weight) || 0.5) * i.quantity, 0))
        };

        // 5. Create or reuse existing SR order
        if (existingSR.rows.length > 0 && existingSR.rows[0].sr_order_id) {
            // Already created in SR — reuse existing IDs
            srOrderId = existingSR.rows[0].sr_order_id;
            shipmentId = existingSR.rows[0].shipment_id;
            awbCode = existingSR.rows[0].awb_code;
            console.log(`[SHIPROCKET] Reusing existing SR order ${srOrderId}, shipment ${shipmentId}`);
        } else {
            // Create fresh order
            let srOrderRes = await createShiprocketOrder(srPayload);
            console.log(`[SHIPROCKET] Create order response:`, JSON.stringify(srOrderRes));

            if (!srOrderRes || !srOrderRes.order_id) {
                throw new Error(srOrderRes?.message || "Shiprocket: Failed to create order.");
            }
            srOrderId = srOrderRes.order_id;
            shipmentId = srOrderRes.shipment_id;
        }

        // 6. If AWB already assigned, skip courier selection
        if (!awbCode) {
            // STEP 2: Intelligent Courier Selection
            const svcParams = {
                pickup_postcode: String(pickupLocation.pincode),
                delivery_postcode: String(order.pincode),
                weight: srPayload.weight,
                cod: order.payment_method === 'cod' ? 1 : 0,
                is_return: 0,
                declared_value: Math.max(1, Math.round(Number(order.subtotal) || Number(order.total_amount) || 100))
            };

            const svcRes = await getShiprocketServiceability(svcParams);
            let selectedCourierId = null;
            let courierName = "Shiprocket Auto";

            console.log(`[SHIPROCKET] Serviceability response:`, JSON.stringify(svcRes).slice(0, 500));

            // Shiprocket returns HTTP 200 but uses inner body 'status' field for errors
            const svcSuccess = svcRes?.status === 200 && svcRes?.data?.available_courier_companies?.length > 0;
            if (svcSuccess) {
                const best = svcRes.data.available_courier_companies.sort((a, b) => Number(a.rate) - Number(b.rate))[0];
                selectedCourierId = best.courier_company_id;
                courierName = best.courier_name;
                console.log(`[SHIPROCKET] Best courier: ${courierName} (id: ${selectedCourierId})`);
            } else {
                console.warn(`[SHIPROCKET] Serviceability failed: ${svcRes?.message || JSON.stringify(svcRes)}. Will try AWB assignment with shipment defaults.`);
            }

            // STEP 3: Assign AWB
            if (selectedCourierId && shipmentId) {
                const awbRes = await assignShiprocketAWB({
                    shipment_id: shipmentId,
                    courier_id: selectedCourierId
                });
                console.log(`[SHIPROCKET] AWB assign response:`, JSON.stringify(awbRes));

                // Handle multiple possible response structures
                awbCode = awbRes?.response?.data?.awb_code
                    || awbRes?.data?.awb_code
                    || awbRes?.awb_code
                    || null;

                if (awbCode) {
                    console.log(`[SHIPROCKET] AWB assigned: ${awbCode}`);
                    // STEP 4: Generate Pickup
                    const pickupResult = await generateShiprocketPickup([shipmentId]);
                    console.log(`[SHIPROCKET] Pickup generated:`, JSON.stringify(pickupResult));
                } else {
                    console.warn(`[SHIPROCKET] AWB assignment failed or returned no code. Full response:`, JSON.stringify(awbRes));
                }

                // Save courier name even if AWB failed
                await client.query(`
                    INSERT INTO shiprocket_orders (
                        sr_order_id, order_id, shipment_id, sr_status, awb_code, courier_name, sr_created_at, updated_at
                    ) VALUES ($1, $2, $3, 'READY_TO_SHIP', $4, $5, NOW(), NOW())
                    ON CONFLICT (order_id) DO UPDATE SET 
                        shipment_id = EXCLUDED.shipment_id,
                        sr_status = EXCLUDED.sr_status,
                        awb_code = COALESCE(EXCLUDED.awb_code, shiprocket_orders.awb_code),
                        courier_name = EXCLUDED.courier_name,
                        updated_at = NOW()
                `, [srOrderId.toString(), order.order_id, shipmentId.toString(), awbCode, courierName]);

                return {
                    sr_order_id: srOrderId,
                    shipment_id: shipmentId,
                    awb_code: awbCode,
                    courier: courierName
                };
            }
        }

        // Fallback: save whatever we have
        await client.query(`
            INSERT INTO shiprocket_orders (
                sr_order_id, order_id, shipment_id, sr_status, awb_code, courier_name, sr_created_at, updated_at
            ) VALUES ($1, $2, $3, 'READY_TO_SHIP', $4, $5, NOW(), NOW())
            ON CONFLICT (order_id) DO UPDATE SET 
                shipment_id = EXCLUDED.shipment_id,
                sr_status = EXCLUDED.sr_status,
                awb_code = COALESCE(EXCLUDED.awb_code, shiprocket_orders.awb_code),
                courier_name = EXCLUDED.courier_name,
                updated_at = NOW()
        `, [srOrderId.toString(), order.order_id, shipmentId.toString(), awbCode, "Shiprocket Auto"]);

        return {
            sr_order_id: srOrderId,
            shipment_id: shipmentId,
            awb_code: awbCode,
            courier: "Shiprocket Auto"
        };
    } catch (error) {
        console.error(`[SHIPROCKET FATAL ERROR] Order ${orderId}:`, error.message);
        throw error;
    }
};

/**
 * Initiate shipment manually via API
 */
export const initiateShipment = async (req, res) => {
    const { orderId } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const srResponse = await pushOrderToShiprocket(orderId, client);

        // Update order status locally to Shipped with AWB tracking
        const trackingId = srResponse.awb_code || srResponse.shipment_id?.toString() || 'PENDING';
        await client.query(`
            UPDATE orders SET order_status = 'Shipped', courier = $1, tracking_id = $2, updated_at = NOW() WHERE order_id = $3
        `, [srResponse.courier || 'Shiprocket', trackingId, orderId]);

        // Sync deliveries table
        await client.query(`
            INSERT INTO deliveries (delivery_id, order_id, courier_name, awb_code, shipping_status, dispatched_at, updated_at, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, 'Shipped', NOW(), NOW(), NOW())
            ON CONFLICT (order_id) DO UPDATE SET
                courier_name = EXCLUDED.courier_name,
                awb_code = COALESCE(EXCLUDED.awb_code, deliveries.awb_code),
                shipping_status = 'Shipped',
                dispatched_at = COALESCE(deliveries.dispatched_at, NOW()),
                updated_at = NOW()
        `, [orderId, srResponse.courier || 'Shiprocket', srResponse.awb_code]);

        // Dispatch notifications
        await sendOrderStatusNotifications(orderId, 'Shipped', client, srResponse.courier, srResponse.awb_code);

        await client.query('COMMIT');

        return res.status(200).json({ success: true, message: "Shipment initiated and order marked as Shipped", data: srResponse });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`\n[SHIPROCKET ERROR] Failed to dispatch order ${orderId}:`, error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to initiate shipment. Please try again."
        });
    } finally {
        client.release();
    }
};

/**
 * Cancel shipment in Shiprocket
 */
export const cancelShipment = async (orderId, client = pool) => {
    try {
        // 1. Get Shiprocket Order ID from our table
        const srOrderRes = await client.query("SELECT sr_order_id, shipment_id FROM shiprocket_orders WHERE order_id = $1", [orderId]);
        
        if (srOrderRes.rows.length === 0) {

            return;
        }

        const { sr_order_id, shipment_id } = srOrderRes.rows[0];

        // Shiprocket cancel expects Shiprocket Order IDs, not shipment IDs.
        const srResponse = await cancelShiprocketOrder([sr_order_id]);

        if (srResponse.status_code === 200) {
            await client.query("UPDATE shiprocket_orders SET sr_status = 'CANCELLED', updated_at = NOW() WHERE order_id = $1", [orderId]);

        } else {
            console.warn(`Shiprocket Cancellation Warning: ${srResponse.message}`);
        }
    } catch (error) {
        console.error("Cancel Shipment Error:", error.message);
    }
};

/**
 * Get serviceability details for an order
 */
export const getServiceability = async (req, res) => {
    const { orderId } = req.params;
    try {
        // 1. Fetch Order and Pickup Details — pincode lives in addresses table, not orders
        const orderRes = await pool.query(`
            SELECT o.payment_method, o.subtotal, o.total_amount,
                   a.pincode as delivery_pincode,
                   (SELECT spl.pincode FROM seller_pickup_location spl 
                    WHERE spl.seller_id = (SELECT oi.seller_id FROM order_items oi WHERE oi.order_id = o.order_id LIMIT 1) 
                    AND spl.is_default = true LIMIT 1) as pickup_pincode,
                   (SELECT COALESCE(SUM(p.weight * oi.quantity), 0.5) FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = o.order_id) as weight
            FROM orders o
            JOIN addresses a ON o.address_id = a.address_id
            WHERE o.order_id = $1
        `, [orderId]);

        if (orderRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const order = orderRes.rows[0];

        // 2. Call Shiprocket Serviceability API with all required fields
        const svcRes = await getShiprocketServiceability({
            pickup_postcode: String(order.pickup_pincode || '641034'),
            delivery_postcode: String(order.delivery_pincode || '110001'),
            weight: Math.max(0.1, Number(order.weight) || 0.5),
            cod: order.payment_method === 'cod' ? 1 : 0,
            declared_value: Math.max(1, Math.round(Number(order.subtotal) || Number(order.total_amount) || 100)),
            is_return: 0
        });

        if (svcRes?.status === 200 && svcRes?.data) {
            return res.status(200).json({ success: true, data: svcRes.data });
        } else {
            return res.status(400).json({ success: false, message: svcRes?.message || "Failed to fetch serviceability" });
        }
    } catch (error) {
        console.error('[SERVICEABILITY ERROR]', error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Fetch and update tracking info from Shiprocket
 */
export const syncTracking = async (req, res) => {
    const { orderId } = req.params;
    try {
        const srOrder = await pool.query("SELECT awb_code FROM shiprocket_orders WHERE order_id = $1", [orderId]);
        if (srOrder.rows.length === 0 || !srOrder.rows[0].awb_code) {
            return res.status(404).json({ success: false, message: "No AWB assigned yet" });
        }
        const tracking = await getShiprocketTracking(srOrder.rows[0].awb_code);
        return res.status(200).json({ success: true, data: tracking });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Handle incoming webhooks from Shiprocket
 */
export const handleShiprocketWebhook = async (req, res) => {
    // 1. Verify Webhook Token (Security Guard)
    const token = req.headers['x-api-key'] || req.query.token;
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    
    // Only reject if we have a configured token AND it doesn't match
    if (expectedToken && expectedToken !== 'your_webhook_token_here' && token !== expectedToken) {
        console.warn("[WEBHOOK] Unauthorized access attempt detected. Token:", token?.slice(0, 10));
        return res.status(401).send('Unauthorized');
    }

    // Shiprocket expects a 200 OK fast.
    res.status(200).send('OK');

    const payload = req.body;
    console.log('[SHIPROCKET WEBHOOK] Received:', JSON.stringify(payload).slice(0, 300));
    
    if (!payload || (!payload.awb && !payload.order_id)) {
        console.warn('[SHIPROCKET WEBHOOK] Empty or invalid payload, skipping.');
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Log the webhook payload
        await client.query(`
            INSERT INTO shiprocket_webhook_log (webhook_id, sr_order_id, event_type, raw_payload, is_processed, received_at)
            VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
        `, [payload.order_id?.toString() || null, payload.current_status, JSON.stringify(payload)]);

        // 2. Extract Data
        const awb = payload.awb;
        const currentStatus = payload.current_status?.toUpperCase() || '';
        const shipmentId = payload.shipment_id?.toString();
        const srOrderId = payload.order_id?.toString();
        const courierName = payload.courier_name || '';

        // 3. Find our local order ID
        let localOrderId = null;
        if (srOrderId) {
            const srRes = await client.query('SELECT order_id FROM shiprocket_orders WHERE sr_order_id = $1', [srOrderId]);
            if (srRes.rows.length > 0) localOrderId = srRes.rows[0].order_id;
        }

        if (!localOrderId && payload.channel_order_id) {
            localOrderId = payload.channel_order_id; // Usually channel_order_id is our local order UUID
        }

        if (!localOrderId) {
            await client.query('ROLLBACK');
            return;
        }

        // 4. Update shiprocket_orders with AWB if missing
        await client.query(`
            UPDATE shiprocket_orders 
            SET awb_code = $1, courier_name = COALESCE(NULLIF($2, ''), courier_name), sr_status = $3, updated_at = NOW()
            WHERE order_id = $4
        `, [awb, courierName, currentStatus, localOrderId]);

        // 5. Update shiprocket_tracking
        await client.query(`
            INSERT INTO shiprocket_tracking (tracking_id, sr_order_id, awb_code, current_status, activity_log, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
            ON CONFLICT (awb_code, current_status) DO UPDATE SET
            activity_log = EXCLUDED.activity_log,
            updated_at = NOW()
        `, [srOrderId, awb, currentStatus, JSON.stringify(payload.scans || [])]);

        // 6. Map Shiprocket Status to Local Status
        let newLocalStatus = null;
        const srStatus = currentStatus.trim().toUpperCase();
        
        if (['NEW', 'PICKUP SCHEDULED', 'PICKUP GENERATED', 'PICKUP QUEUED', 'PICKUP ERROR', 'MANIFEST GENERATED', 'LABEL GENERATED'].includes(srStatus)) {
            newLocalStatus = 'Processing';
        } else if (['PICKED UP', 'IN TRANSIT', 'SHIPPED', 'REACHED DESTINATION HUB', 'REACHED PICKUP LOCATION', 'OUT FOR PICKUP'].includes(srStatus)) {
            newLocalStatus = 'Shipped';
        } else if (['OUT FOR DELIVERY'].includes(srStatus)) {
            newLocalStatus = 'Shipped'; // Keep as Shipped until confirmed delivered
        } else if (['DELIVERED', 'DELIVERY DONE'].includes(srStatus)) {
            newLocalStatus = 'Delivered';
        } else if (['CANCELED', 'CANCELLED', 'RTO INITIATED', 'RTO DELIVERED'].includes(srStatus)) {
            newLocalStatus = 'Cancelled';
        }
        
        console.log(`[SHIPROCKET WEBHOOK] Status mapping: '${srStatus}' → '${newLocalStatus || 'no change'}' for order ${localOrderId}`);

        // 7. Update Main Orders Table and Deliveries Table
        if (newLocalStatus) {
            // Check if status is actually changing to avoid spamming notifications
            const currentOrder = await client.query('SELECT order_status FROM orders WHERE order_id = $1', [localOrderId]);
            const isStatusChanging = currentOrder.rows.length > 0 && currentOrder.rows[0].order_status !== newLocalStatus;

            if (isStatusChanging) {
                await client.query(`
                    UPDATE orders 
                    SET order_status = $1, tracking_id = $2, courier = COALESCE(NULLIF($3, ''), courier), updated_at = NOW()
                    WHERE order_id = $4
                `, [newLocalStatus, awb, courierName, localOrderId]);

                // Sync Deliveries table
                await client.query(`
                    INSERT INTO deliveries (
                        delivery_id, order_id, courier_name, awb_code, shipping_status, 
                        shiprocket_order_id, shipment_id,
                        dispatched_at, delivered_at, updated_at, created_at
                    )
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6,
                        CASE WHEN $4 = 'Shipped' OR $4 = 'Delivered' THEN NOW() ELSE NULL END,
                        CASE WHEN $4 = 'Delivered' THEN NOW() ELSE NULL END,
                        NOW(), NOW()
                    )
                    ON CONFLICT (order_id) DO UPDATE SET
                        courier_name = EXCLUDED.courier_name,
                        awb_code = EXCLUDED.awb_code,
                        shipping_status = EXCLUDED.shipping_status,
                        shiprocket_order_id = COALESCE(deliveries.shiprocket_order_id, EXCLUDED.shiprocket_order_id),
                        shipment_id = COALESCE(deliveries.shipment_id, EXCLUDED.shipment_id),
                        dispatched_at = COALESCE(deliveries.dispatched_at, EXCLUDED.dispatched_at),
                        delivered_at = COALESCE(deliveries.delivered_at, EXCLUDED.delivered_at),
                        updated_at = NOW()
                `, [localOrderId, courierName || 'Shiprocket', awb, newLocalStatus, srOrderId, shipmentId]);

                // 8. Trigger Notifications
                await sendOrderStatusNotifications(localOrderId, newLocalStatus, client, courierName, awb);
            }
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Shiprocket Webhook Processing Error:", err.message);
    } finally {
        client.release();
    }
};
