import { api } from './api';

const handleApiCall = async (method, url, data = null) => {
    try {
        const res = await api[method](url, data);
        return res.data;
    } catch (error) {
        console.error(`Seller API ERROR [${method} ${url}]:`, error);
        return { 
            success: false, 
            message: error?.response?.data?.message || error.message || "An unexpected error occurred" 
        };
    }
};

export const getSellerStats = (sellerId) => handleApiCall('get', `/seller/stats/${sellerId}`);

export const getSellerDashboardData = (sellerId) => handleApiCall('get', `/seller/dashboard/${sellerId}`);

export const getSellerOrders = (sellerId) => handleApiCall('get', `/seller/orders/${sellerId}`);

export const getSellerCustomers = (sellerId) => handleApiCall('get', `/seller/customers/${sellerId}`);

export const getSellerProfile = (sellerId) => handleApiCall('get', `/seller/profile/${sellerId}`);

export const updateSellerProfile = (sellerId, data) => handleApiCall('put', `/seller/profile/${sellerId}`, data);

export const getSellerPayments = (sellerId) => handleApiCall('get', `/seller/payments/${sellerId}`);

export const getSellerFinanceAnalytics = (sellerId) => handleApiCall('get', `/seller/analytics/${sellerId}`);

export const getOrderDetails = (orderId) => handleApiCall('get', `/orders/order/${orderId}`);

export const updateOrderStatus = (orderId, data) => handleApiCall('patch', `/orders/status/${orderId}`, data);

export const getSellerNotifications = (sellerId) => handleApiCall('get', `/seller/notifications/${sellerId}`);

export const markNotificationRead = (notificationId) => handleApiCall('patch', `/seller/notifications/read/${notificationId}`);

export const getSellerReturns = (sellerId) => handleApiCall('get', `/seller/returns/${sellerId}`);

export const resolveSellerReturnRequest = (sellerId, data) => handleApiCall('post', `/seller/returns/${sellerId}/resolve`, data);

export const getSellerPickups = (sellerId) => handleApiCall('get', `/pickup/seller/${sellerId}`);

export const addPickupLocation = (data) => handleApiCall('post', `/pickup/add`, data);
