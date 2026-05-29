import { pool } from '../config/db.js';
import { sanitizeText } from '../utils/sanitizer.js';
import crypto from 'crypto';

/**
 * Schedule a new Flea Market Video Conference
 * POST /api/meetings
 */
export const createMeeting = async (req, res, next) => {
    try {
        const { productId, kgAmount, purpose, scheduledAt } = req.body;
        const customerId = req.user.id; // Logged-in customer UUID

        if (!productId || !kgAmount || !scheduledAt) {
            return res.status(400).json({ 
                success: false, 
                message: "Product ID, quantity (kg), and scheduled date/time are required." 
            });
        }

        const quantity = parseFloat(kgAmount);
        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Please provide a valid, positive quantity." });
        }

        const scheduledTime = new Date(scheduledAt);
        if (isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide a valid future date and time for the conference." 
            });
        }

        // 1. Verify customer's premium membership
        const custRes = await pool.query(
            "SELECT membership FROM customers WHERE customer_id = $1",
            [customerId]
        );
        const membership = custRes.rows[0]?.membership || 'free';
        // Normalize membership value for comparison, trimming whitespace
        const membershipNormalized = String(membership).trim().toLowerCase();
        // Allow any tier other than 'free' to schedule video conferences
        if (membershipNormalized === 'free') {
            return res.status(403).json({
                success: false,
                message: "Video conference scheduling is a premium feature. Please upgrade your membership plan to participate!"
            });
        }

        // 2. Verify product exists and retrieve seller details
        const prodRes = await pool.query(
            "SELECT name, seller_id, is_active, is_deleted FROM products WHERE product_id = $1",
            [productId]
        );

        if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active || prodRes.rows[0].is_deleted) {
            return res.status(404).json({ success: false, message: "Commodity product not found or currently unavailable." });
        }

        const sellerId = prodRes.rows[0].seller_id;
        const productName = prodRes.rows[0].name;

        // 3. Slot Conflict Validation (Overlapping meetings checking - 30 minutes buffer block)
        // Checks if another meeting is scheduled with the same seller within 30 minutes (1800 seconds)
        const conflictRes = await pool.query(`
            SELECT meeting_id, scheduled_at 
            FROM flea_market_meetings 
            WHERE seller_id = $1 
              AND status = 'Scheduled'
              AND ABS(EXTRACT(EPOCH FROM (scheduled_at - $2::timestamp))) < 1800
        `, [sellerId, scheduledTime.toISOString()]);

        if (conflictRes.rows.length > 0) {
            const conflictTime = new Date(conflictRes.rows[0].scheduled_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return res.status(409).json({
                success: false,
                message: `This seller has another video conference scheduled around ${conflictTime}. Please select a different slot at least 30 minutes apart.`
            });
        }

        // 4. Generate premium virtual room meeting link
        const meetingId = crypto.randomUUID();
        const cleanProductName = sanitizeText(productName).replace(/[^a-zA-Z0-9]/g, '');
        const meetingLink = `https://meet.jit.si/GoMoDeals-FleaMarket-${cleanProductName}-${meetingId.slice(0, 8)}`;

        const sanitizedPurpose = purpose ? sanitizeText(purpose) : "Commodity Bargain Discussion";

        // 5. Insert scheduled meeting atomically
        const result = await pool.query(`
            INSERT INTO flea_market_meetings (
                meeting_id, product_id, customer_id, seller_id, kg_amount, purpose, scheduled_at, meeting_link, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Scheduled')
            RETURNING *
        `, [meetingId, productId, customerId, sellerId, quantity, sanitizedPurpose, scheduledTime.toISOString(), meetingLink]);

        // Log creation for visibility checks (seller and admin can now retrieve this record)
        console.log('Meeting created:', result.rows[0]);

        // Insert notifications for seller and admin
        // Notify seller about new video conference
        await pool.query(
            `INSERT INTO notifications (notification_id, seller_id, type, message, created_at, is_read)
             VALUES (gen_random_uuid(), $1, 'meeting_scheduled', $2, NOW(), false)`,
            [sellerId, `A new video conference (${meetingId.slice(0, 8)}) has been scheduled by a customer.`]
        );
        // Notify admin about new video conference
        await pool.query(
            `INSERT INTO notifications (notification_id, admin_id, type, message, created_at, is_read)
             SELECT gen_random_uuid(), admin_id, 'meeting_scheduled', $1, NOW(), false FROM admins`,
            [`A new video conference (${meetingId.slice(0, 8)}) has been scheduled.`]
        );
        
        // Return success response with meeting details
        return res.status(201).json({
            success: true,
            message: "Video conference successfully scheduled!",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating flea market meeting:", error);
        // Postgres UNIQUE violation code check (just in case concurrent transactions slip through the SELECT query)
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: "This seller is already booked for this exact time slot. Please choose another time."
            });
        }
        return res.status(500).json({ success: false, message: "Failed to schedule conference." });
    }
};

/**
 * Retrieve scheduled video conferences for the currently logged-in seller
 * GET /api/meetings/seller
 */
export const getSellerMeetings = async (req, res, next) => {
    try {
        // Verify requester is a seller or admin
        const userRole = req.user.role || req.user.type;
        const requesterId = req.user.id;
        // Admin can specify sellerId query param to view any seller's meetings
        const sellerId = userRole === 'admin' && req.query.sellerId ? req.query.sellerId : requesterId;
        if (userRole !== 'seller' && userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: only sellers or admins can view seller meetings.' });
        }
        // Debug: log seller ID being used for query
        console.log('Fetching meetings for sellerId:', sellerId);

        const result = await pool.query(`
            SELECT 
                m.meeting_id,
                m.kg_amount,
                m.purpose,
                m.scheduled_at,
                m.meeting_link,
                m.status,
                m.earnings,
                m.meeting_notes,
                m.created_at,
                p.product_id,
                p.name AS product_name,
                p.images[1] AS product_thumbnail,
                c.full_name AS customer_name
            FROM flea_market_meetings m
            JOIN products p ON m.product_id = p.product_id
            JOIN customers c ON m.customer_id = c.customer_id
            WHERE m.seller_id = $1
            ORDER BY m.scheduled_at ASC
        `, [sellerId]);

        return res.status(200).json({
            success: true,
            meetings: result.rows
        });
    } catch (error) {
        console.error("Error fetching seller meetings:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch scheduled conferences." });
    }
};

/**
 * Retrieve scheduled video conferences for the currently logged-in customer
 * GET /api/meetings/customer
 */
export const getCustomerMeetings = async (req, res, next) => {
    try {
        const customerId = req.user.id; // Authenticated customer UUID

        // Auto-expire meetings older than 40 minutes before fetching
        await pool.query(`
            UPDATE flea_market_meetings
            SET status = 'Expired'
            WHERE scheduled_at < (NOW() - INTERVAL '40 minutes') AND status = 'Scheduled'
        `);

        const result = await pool.query(`
            SELECT 
                m.meeting_id,
                m.kg_amount,
                m.purpose,
                m.scheduled_at,
                m.meeting_link,
                m.status,
                m.earnings,
                m.meeting_notes,
                m.created_at,
                p.product_id,
                p.name AS product_name,
                p.images[1] AS product_thumbnail,
                s.store_name AS seller_store_name,
                s.full_name AS seller_name,
                s.email AS seller_email
            FROM flea_market_meetings m
            JOIN products p ON m.product_id = p.product_id
            JOIN sellers s ON m.seller_id = s.seller_id
            WHERE m.customer_id = $1
            ORDER BY m.scheduled_at ASC
        `, [customerId]);

        return res.status(200).json({
            success: true,
            meetings: result.rows
        });
    } catch (error) {
        console.error("Error fetching customer meetings:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch scheduled conferences." });
    }
};

/**
 * Cancel a scheduled meeting
 * PUT /api/meetings/:id/cancel
 */
export const cancelMeeting = async (req, res, next) => {
    try {
        const meetingId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role || req.user.type;

        // Fetch meeting details to authorize cancellation
        const meetingRes = await pool.query(
            "SELECT customer_id, seller_id, status FROM flea_market_meetings WHERE meeting_id = $1",
            [meetingId]
        );

        if (meetingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Conference booking not found." });
        }

        const meeting = meetingRes.rows[0];

        // Authorization check: Only participant customer, participant seller or admin can cancel
        if (meeting.customer_id !== userId && meeting.seller_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: "You are not authorized to cancel this conference." });
        }

        if (meeting.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: "This video conference has already been cancelled." });
        }

        // Cancel meeting
        await pool.query(
            "UPDATE flea_market_meetings SET status = 'Cancelled' WHERE meeting_id = $1",
            [meetingId]
        );

        return res.status(200).json({
            success: true,
            message: "Conference booking cancelled successfully."
        });
    } catch (error) {
        console.error("Error cancelling conference:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel conference booking." });
    }
};

/**
 * Retrieve all scheduled video conferences for admins to monitor and mediate
 * GET /api/meetings/admin
 */
export const getAdminMeetings = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.meeting_id,
                m.kg_amount,
                m.purpose,
                m.scheduled_at,
                m.meeting_link,
                m.status,
                m.created_at,
                p.product_id,
                p.name AS product_name,
                p.images[1] AS product_thumbnail,
                c.full_name AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                s.store_name AS seller_store_name,
                s.full_name AS seller_name,
                s.email AS seller_email,
                s.phone AS seller_phone
            FROM flea_market_meetings m
            JOIN products p ON m.product_id = p.product_id
            JOIN customers c ON m.customer_id = c.customer_id
            JOIN sellers s ON m.seller_id = s.seller_id
            ORDER BY m.scheduled_at DESC
        `);

        return res.status(200).json({
            success: true,
            meetings: result.rows
        });
    } catch (error) {
        console.error("Error fetching admin meetings:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch all scheduled conferences for mediation." });
    }
};

/**
 * Complete a scheduled meeting with earnings and notes
 * PUT /api/meetings/seller/:id/complete
 */
export const completeMeeting = async (req, res, next) => {
    try {
        const meetingId = req.params.id;
        const sellerId = req.user.id;
        const { earnings, meeting_notes } = req.body;

        if (req.user.type !== 'seller') {
            return res.status(403).json({ success: false, message: "Only sellers can complete a meeting." });
        }

        // Verify ownership and status
        const meetingRes = await pool.query(
            "SELECT seller_id, status FROM flea_market_meetings WHERE meeting_id = $1",
            [meetingId]
        );

        if (meetingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Conference booking not found." });
        }

        const meeting = meetingRes.rows[0];

        if (meeting.seller_id !== sellerId) {
            return res.status(403).json({ success: false, message: "You are not authorized to complete this conference." });
        }

        if (meeting.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: "This video conference was cancelled." });
        }

        // Update meeting
        const updateRes = await pool.query(
            `UPDATE flea_market_meetings 
             SET status = 'Completed', earnings = $1, meeting_notes = $2 
             WHERE meeting_id = $3
             RETURNING *`,
            [earnings || 0, meeting_notes || '', meetingId]
        );

        return res.status(200).json({
            success: true,
            message: "Conference marked as completed.",
            meeting: updateRes.rows[0]
        });
    } catch (error) {
        console.error("Error completing conference:", error);
        return res.status(500).json({ success: false, message: "Failed to complete conference booking." });
    }
};
