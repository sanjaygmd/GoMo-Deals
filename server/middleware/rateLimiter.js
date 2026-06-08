import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 OTP requests per hour
    message: {
        success: false,
        message: "Too many OTP requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window (increased from 100)
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip global limiting for auth routes that have their own stricter limiters
        const authPaths = [
            '/api/v1/customer/send-otp', '/api/v1/customer/verify-otp', '/api/v1/customer/login', '/api/v1/customer/register',
            '/api/v1/seller/send-otp', '/api/v1/seller/verify-otp', '/api/v1/seller/login', '/api/v1/seller/register',
            '/api/v1/admin/login', '/api/v1/admin/verify-super-admin-login', '/api/v1/admin/request-password-reset', '/api/v1/admin/verify-password-reset'
        ];
        return authPaths.some(path => req.originalUrl.startsWith(path));
    }
});

export const setupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Very strict: only 3 attempts per hour
    message: {
        success: false,
        message: "Too many setup attempts. This is a critical security endpoint."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const chatbotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 messages per 15 minutes
    message: {
        success: false,
        message: "You have reached the chat limit. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});
