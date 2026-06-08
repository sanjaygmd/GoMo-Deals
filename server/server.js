import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import crypto from 'crypto';
import morgan from 'morgan';

import { testDB, pool } from './config/db.js';
import { initSchema } from './config/initDb.js';
import { validateEnv } from './config/validateEnv.js';
import { pruneExpiredRecords } from './utils/cleanupTask.js';
import { runLowStockCheck } from './utils/stockAlertCron.js';
import cron from 'node-cron';

// Validate environment variables on startup
validateEnv();

import authRoutes from './routes/AuthRoutes.js';
import cartRoutes from './routes/CartRoutes.js';
import wishlistRoutes from './routes/WishlistRoutes.js';
import productRoutes from './routes/ProductRoutes.js';
import couponRoutes from './routes/CouponRoutes.js';
import orderRoutes from './routes/OrderRoutes.js';
import notificationRoutes from './routes/NotificationRoutes.js';
import shiprocketRoutes from './routes/ShiprocketRoutes.js';
import pickupRoutes from './routes/PickupRoutes.js';
import payoutRoutes from './routes/PayoutRoutes.js';
import reviewRoutes from './routes/ReviewRoutes.js';
import chatbotRoutes from './routes/ChatbotRoutes.js';
import webhookRoutes from './routes/WebhookRoutes.js';
import offerRoutes from './routes/OfferRoutes.js';
import meetingRoutes from './routes/MeetingRoutes.js';
import membershipRoutes from './routes/MembershipRoutes.js';
import sellerSubscriptionRoutes from './routes/SellerSubscriptionRoutes.js';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';


const port = process.env.PORT || 3000;
const app = express();

// Trust proxy for rate limiting behind reverse proxies (Nginx, Render, etc.)
app.set('trust proxy', 1);

// Dynamic CORS configuration
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server calls).
        // While this bypasses CORS (which is a browser-only mechanism), these requests 
        // are still subject to our custom CSRF header protection for mutating methods.
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.indexOf(origin) !== -1;
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(apiLimiter);

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for easier debugging
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Enforce HSTS
}));

app.use(cookieParser())

// Security Hardening: CSRF Protection using Double-Submit Cookie Pattern (Priority 10)
// This middleware implements the double-submit cookie pattern. It generates a token in a cookie
// and verifies that state-changing requests include the exact same token in the X-XSRF-TOKEN header.
app.use((req, res, next) => {
    // 1. Generate and set CSRF token if it doesn't exist
    let csrfToken = req.cookies['XSRF-TOKEN'];
    if (!csrfToken) {
        csrfToken = crypto.randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', csrfToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: false // Must be false so the frontend JS can read it to set the header
        });
    }

    // 2. Verify CSRF token for mutating methods
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    // Webhooks are server-to-server and rely on cryptographic HMAC validation, not CSRF.
    const skipCsrfPaths = [
        '/api/v1/orders/razorpay/webhook', 
        '/api/v1/shipping/webhook',
        '/api/v1/customer/login',
        '/api/v1/customer/register',
        '/api/v1/customer/send-otp',
        '/api/v1/customer/verify-otp',
        '/api/v1/seller/login',
        '/api/v1/seller/register',
        '/api/v1/seller/send-otp',
        '/api/v1/seller/verify-otp',
        '/api/v1/admin/login',
        '/api/v1/admin/register',
        '/api/v1/admin/send-otp',
        '/api/v1/admin/verify-otp',
        '/api/v1/admin/setup',
        '/api/v1/admin/request-password-reset',
        '/api/v1/admin/verify-password-reset'
    ];
    
    if (mutatingMethods.includes(req.method)) {
        if (skipCsrfPaths.some(p => req.path.startsWith(p))) {
            return next();
        }

        const origin = req.headers.origin || req.headers.referer;
        let isSafeOrigin = false;
        
        if (origin) {
            try {
                const originUrl = new URL(origin);
                isSafeOrigin = allowedOrigins.includes(originUrl.origin);
            } catch (e) {
                // Ignore parsing errors
            }
        }

        const headerToken = req.headers['x-xsrf-token'];
        
        if (!isSafeOrigin || !headerToken || headerToken !== csrfToken) {
            console.warn(`[SECURITY ALERT] Blocked ${req.method} request to ${req.url} from origin: ${origin || 'Unknown'}.`);
            console.warn(`Expected Token (from cookie/new): ${csrfToken}`);
            console.warn(`Received Header Token: ${headerToken}`);
            console.warn(`Cookies received: ${JSON.stringify(req.cookies)}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Security validation failed. Invalid CSRF token.' 
            });
        }
    }
    next();
});

// HTTP Request Logging
app.use(morgan('combined'));

// Mount Razorpay webhook BEFORE express.json() so we can retrieve the raw buffer for HMAC validation
app.use('/api/v1/orders/razorpay/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use('/api/v1', authRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/shipping', shiprocketRoutes);
app.use('/api/v1/pickup', pickupRoutes);
app.use('/api/v1/payouts', payoutRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/membership', membershipRoutes);
app.use('/api/v1/seller-subscription', sellerSubscriptionRoutes);

// Centralized error handling middleware
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
    testDB().then(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.log("Development environment detected. Running initSchema()...");
            initSchema();
        } else {
            console.log("Production environment. Skipping initSchema(). Run 'npm run db:migrate' to apply schema changes.");
        }

        // Run cleanup tasks
        pruneExpiredRecords().catch(err => console.error("Initial cleanup error:", err));
        
        cron.schedule('0 2 * * *', () => {
            pruneExpiredRecords().catch(err => console.error("Periodic cleanup error:", err));
        });

        // Nightly Orphaned Payments Alert (3:00 AM)
        cron.schedule('0 3 * * *', async () => {
            try {
                const res = await pool.query("SELECT COUNT(*) FROM orphaned_payments WHERE status = 'Captured' AND created_at < NOW() - INTERVAL '24 hours'");
                if (parseInt(res.rows[0].count) > 0) {
                    console.warn(`[SYSTEM ALERT] There are ${res.rows[0].count} unresolved orphaned payments older than 24 hours requiring admin review.`);
                }
            } catch(err) {
                console.error("Orphaned payments cron error:", err);
            }
        });

        // Daily Low-Stock Alerts (4:00 AM)
        cron.schedule('0 4 * * *', () => {
            runLowStockCheck().catch(err => console.error("Low stock cron error:", err));
        });

    }).catch(err => {
        console.error("FATAL: Database connection failed. Shutting down.", err);
        process.exit(1);
    });
});

// Force restart to reload .env configuration