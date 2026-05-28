import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { testDB } from './config/db.js';
import { initSchema } from './config/initDb.js';
import { validateEnv } from './config/validateEnv.js';

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

// Security Hardening: Project-specific CSRF Protection (Priority 10)
// This middleware blocks state-changing requests (POST, PUT, DELETE) unless they come from 
// an authorized origin AND include a custom security header.
app.use((req, res, next) => {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
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

        // We require the purpose-built X-GoMo-Protection header for all browser-based mutating requests.
        // We do NOT accept X-Requested-With: XMLHttpRequest as it is a legacy fallback that 
        // can be spoofed in certain older environments or via specific browser plugins.
        const hasSecurityHeader = req.headers['x-gomo-protection'] === 'active';
        
        if (!isSafeOrigin && !hasSecurityHeader) {
            console.warn(`[SECURITY ALERT] Blocked ${req.method} request to ${req.url} from origin: ${origin || 'Unknown'}. Missing X-GoMo-Protection header.`);
            return res.status(403).json({ 
                success: false, 
                message: 'Security validation failed. Please ensure the X-GoMo-Protection header is present.' 
            });
        }
    }
    next();
});

// Mount Razorpay webhook BEFORE express.json() so we can retrieve the raw buffer for HMAC validation
app.use('/api/orders/razorpay/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.use('/api', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shipping', shiprocketRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/offers', offerRoutes);

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
    });
});

// Force restart to reload .env configuration