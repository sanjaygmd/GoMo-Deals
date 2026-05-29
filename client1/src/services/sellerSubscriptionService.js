import { api } from './api';

/**
 * Ensures the Razorpay checkout script is loaded in the document.
 */
export const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Create a Razorpay Order for a seller subscription.
 * Using the unified generic order creation endpoint.
 */
export const createSellerSubscriptionOrder = async (amount) => {
    try {
        const res = await api.post('/orders/razorpay/create-order', {
            amount,
            currency: 'INR'
        });
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to create subscription order.');
    }
};

/**
 * Confirm a seller subscription payment via Razorpay.
 */
export const confirmSellerSubscription = async (payload) => {
    try {
        const res = await api.post('/seller-subscription/subscribe', payload);
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to confirm subscription payment.');
    }
};

/**
 * Cancel the current seller subscription (reverts to free).
 */
export const cancelSellerSubscription = async () => {
    try {
        const res = await api.post('/seller-subscription/cancel');
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to cancel subscription.');
    }
};
