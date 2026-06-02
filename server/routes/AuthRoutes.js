import express from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';
import { loginCustomer, registerCustomer, logout, getMe, customerOnboarding, getCustomerAddresses, updateCustomer, agreeToFleaMarketTerms } from '../controllers/AuthController/customerController.js';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/AuthController/otpController.js';
import { 
    loginSeller, 
    logoutSeller,
    registerSeller, 
    sellerOnboarding, 
    getSellerOnboardingData,
    getSellerStats,
    getSellerDashboardData,
    getSellerOrders,
    getSellerCustomers,
    getSellerProfile,
    updateSellerProfile,
    getSellerPayments,
    getSellerFinanceAnalytics,
    getSellerNotifications,
    markNotificationRead,
    getSellerReturns,
    resolveSellerReturnRequest
} from '../controllers/AuthController/sellerController.js';
import { 
    loginAdmin, 
    setupAdmin,
    registerAdmin,
    sendAdminRegisterOTP,
    logoutAdmin,
    updateAdminProfile,
    requestAdminPasswordReset,
    verifyAdminPasswordReset,
    getAdminDashboardData,
    getSellersData,
    getFinanceData,
    exportFinanceReport,
    getAnalyticsData,
    getAllOrders,
    bulkUpdateOrders,
    autoDispatchOrders,
    getAllCustomers,
    toggleCustomerStatus,
    toggleSellerStatus,
    deleteSeller,
    getAllPayments,
    getAllReturns,
    resolveReturnRequest,
    changeAdminPassword,
    updateAdminPasswordSelf,
    updateMasterKey,
    getAuditLogs,
    getAllAdministrators,
    updateAdminStatus,
    deleteAdministrator,
    getCustomerDetails,
    deleteCustomer,
    verifySeller,
    getSellerDetails
} from '../controllers/AuthController/adminController.js';
import { getAllAdminProducts } from '../controllers/ProductController.js';
import { 
    getAdminSettings,
    updateAdminSettings,
    getAdminNotifications,

} from '../controllers/AdminSettingsController.js';
import { 
    getAllReviews,
    deleteReview,

} from '../controllers/ReviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

import { loginLimiter, otpLimiter, setupLimiter } from '../middleware/rateLimiter.js';

const authRoutes = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // limit each IP to 50 requests per windowMs
    message: { success: false, message: "Too many authentication attempts, please try again after 15 minutes" }
});

authRoutes.use('/customer/login', authLimiter);
authRoutes.use('/customer/send-otp', authLimiter);
authRoutes.use('/customer/verify-otp', authLimiter);
authRoutes.use('/customer/register', authLimiter);
authRoutes.use('/seller/login', authLimiter);
authRoutes.use('/seller/send-otp', authLimiter);
authRoutes.use('/seller/verify-otp', authLimiter);
authRoutes.use('/seller/register', authLimiter);
authRoutes.use('/admin/login', authLimiter);
authRoutes.use('/admin/setup', authLimiter);

// Customer Routes
authRoutes.post('/customer/send-otp', otpLimiter, sendOTP);
authRoutes.post('/customer/verify-otp', otpLimiter, verifyOTP);
authRoutes.post('/customer/register', loginLimiter, registerCustomer);
authRoutes.post('/customer/login', loginLimiter, loginCustomer);

// Seller Routes
authRoutes.post('/seller/send-otp', otpLimiter, sendOTP);
authRoutes.post('/seller/verify-otp', otpLimiter, verifyOTP);
authRoutes.post('/seller/register', loginLimiter, registerSeller);
authRoutes.post('/seller/login', loginLimiter, loginSeller);

// Admin Routes (Login and Public Reset)
authRoutes.post('/admin/send-otp', otpLimiter, sendOTP);
authRoutes.post('/admin/verify-otp', otpLimiter, verifyOTP);
authRoutes.post('/admin/login', loginLimiter, loginAdmin);
authRoutes.post('/admin/logout', requireAuth(['admin', 'super_admin']), logoutAdmin);
authRoutes.post('/admin/request-password-reset', otpLimiter, requestAdminPasswordReset);
authRoutes.post('/admin/verify-password-reset', otpLimiter, verifyAdminPasswordReset);

// Global Reset Password (uses OTP)
authRoutes.post('/reset-password', otpLimiter, resetPassword);

// Protected Routes
authRoutes.get('/me', requireAuth(['customer', 'seller', 'admin', 'super_admin']), getMe);
authRoutes.put('/agree-terms', requireAuth(['customer', 'seller']), agreeToFleaMarketTerms);
authRoutes.post('/customer/logout', requireAuth(['customer', 'seller', 'admin', 'super_admin']), logout);
authRoutes.post('/seller/logout', requireAuth(['customer', 'seller', 'admin', 'super_admin']), logoutSeller);
authRoutes.post('/customer-onboarding/:id', requireAuth(['customer']), customerOnboarding);
authRoutes.get('/customer/addresses/:id', requireAuth(['customer']), getCustomerAddresses);
authRoutes.put('/customer/:id', requireAuth(['customer']), updateCustomer);
authRoutes.put('/admin/user/:id', requireAuth(['admin', 'super_admin']), updateCustomer);

// Seller Protected Routes
authRoutes.get('/seller/onboarding-data/:id', requireAuth(['seller']), getSellerOnboardingData);
authRoutes.post('/seller/onboarding/:id', requireAuth(['seller']), sellerOnboarding);
authRoutes.get('/seller/stats/:id', requireAuth(['seller']), getSellerStats);
authRoutes.get('/seller/dashboard/:id', requireAuth(['seller']), getSellerDashboardData);
authRoutes.get('/seller/orders/:id', requireAuth(['seller']), getSellerOrders);
authRoutes.get('/seller/customers/:id', requireAuth(['seller']), getSellerCustomers);
authRoutes.get('/seller/profile/:id', requireAuth(['seller']), getSellerProfile);
authRoutes.put('/seller/profile/:id', requireAuth(['seller']), updateSellerProfile);
authRoutes.get('/seller/payments/:id', requireAuth(['seller']), getSellerPayments);
authRoutes.get('/seller/analytics/:id', requireAuth(['seller']), getSellerFinanceAnalytics);
authRoutes.get('/seller/notifications/:id', requireAuth(['seller']), getSellerNotifications);
authRoutes.patch('/seller/notifications/read/:notification_id', requireAuth(['seller']), markNotificationRead);
authRoutes.get('/seller/returns/:id', requireAuth(['seller']), getSellerReturns);
authRoutes.post('/seller/returns/:id/resolve', requireAuth(['seller']), resolveSellerReturnRequest);


// Admin Auth Routes
authRoutes.post('/admin/setup', setupLimiter, setupAdmin); // First Super Admin only
authRoutes.post('/admin/send-register-otp', otpLimiter, sendAdminRegisterOTP); // Step 1: send OTP
authRoutes.post('/admin/register', async (req, res, next) => {
    try {
        const saCount = await pool.query("SELECT COUNT(*) FROM super_admins");
        const count = parseInt(saCount.rows[0].count);
        if (count === 0) {
            return registerAdmin(req, res, next);
        }
    } catch (err) {
        console.error("ADMIN REGISTRATION BYPASS AUTH ERROR:", err);
        return next(err);
    }
    return requireAuth(['super_admin'])(req, res, next);
}, registerAdmin);
authRoutes.get('/admin/dashboard-data', requireAuth(['admin', 'super_admin']), getAdminDashboardData);
authRoutes.get('/admin/sellers-data', requireAuth(['admin', 'super_admin']), getSellersData);
authRoutes.get('/admin/finance-data', requireAuth(['admin', 'super_admin']), getFinanceData);
authRoutes.get('/admin/finance-report', requireAuth(['admin', 'super_admin']), exportFinanceReport);
authRoutes.get('/admin/analytics-data', requireAuth(['admin', 'super_admin']), getAnalyticsData);
authRoutes.get('/admin/orders', requireAuth(['admin', 'super_admin']), getAllOrders);
authRoutes.post('/admin/orders/bulk-update', requireAuth(['admin', 'super_admin']), bulkUpdateOrders);
authRoutes.post('/admin/orders/auto-dispatch', requireAuth(['admin', 'super_admin']), autoDispatchOrders);
authRoutes.get('/admin/customers', requireAuth(['admin', 'super_admin']), getAllCustomers);
authRoutes.get('/admin/products', requireAuth(['admin', 'super_admin']), getAllAdminProducts);
authRoutes.get('/admin/payments', requireAuth(['admin', 'super_admin']), getAllPayments);
authRoutes.get('/admin/returns', requireAuth(['admin', 'super_admin']), getAllReturns);
authRoutes.post('/admin/returns/:id/resolve', requireAuth(['admin', 'super_admin']), resolveReturnRequest);
authRoutes.get('/admin/customer/:id', requireAuth(['admin', 'super_admin']), getCustomerDetails);
authRoutes.patch('/admin/customer/:id/status', requireAuth(['admin', 'super_admin']), toggleCustomerStatus);
authRoutes.delete('/admin/customer/:id', requireAuth(['super_admin']), deleteCustomer);
authRoutes.get('/admin/seller/:id', requireAuth(['admin', 'super_admin']), getSellerDetails);
authRoutes.patch('/admin/seller/:id/status', requireAuth(['admin', 'super_admin']), toggleSellerStatus);
authRoutes.patch('/admin/seller/:id/verify', requireAuth(['admin', 'super_admin']), verifySeller);
authRoutes.delete('/admin/seller/:id', requireAuth(['super_admin']), deleteSeller);
authRoutes.get('/admin/audit-logs', requireAuth(['admin', 'super_admin']), getAuditLogs);
authRoutes.put('/admin/change-password/:id', requireAuth(['admin', 'super_admin']), changeAdminPassword);
authRoutes.put('/admin/update-password-self', requireAuth(['admin', 'super_admin']), updateAdminPasswordSelf);
authRoutes.put('/admin/profile/:id', requireAuth(['admin', 'super_admin']), updateAdminProfile);

// Super Admin Routes (Admin Management)
authRoutes.get('/super-admin/administrators', requireAuth(['super_admin']), getAllAdministrators);
authRoutes.patch('/super-admin/administrator/:id/status', requireAuth(['super_admin']), updateAdminStatus);
authRoutes.delete('/super-admin/administrator/:id', requireAuth(['super_admin']), deleteAdministrator);
authRoutes.put('/super-admin/master-key', requireAuth(['super_admin']), updateMasterKey);

// Admin Settings & Dynamic Notifications
authRoutes.get('/admin/settings/:adminId', requireAuth(['admin', 'super_admin']), getAdminSettings);
authRoutes.put('/admin/settings/:adminId', requireAuth(['admin', 'super_admin']), updateAdminSettings);
authRoutes.get('/admin/notifications/:adminId', requireAuth(['admin', 'super_admin']), getAdminNotifications);

// Admin Reviews Management
authRoutes.get('/admin/reviews', requireAuth(['admin', 'super_admin']), getAllReviews);
authRoutes.delete('/admin/reviews/:id', requireAuth(['admin', 'super_admin']), deleteReview);


export default authRoutes;