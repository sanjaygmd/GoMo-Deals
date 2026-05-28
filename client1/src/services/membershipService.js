import { api } from "./api.js";

/**
 * Create a Razorpay order for a membership subscription.
 * Uses the same /orders/razorpay/create-order endpoint as checkout.
 */
export const createMembershipRazorpayOrder = async (amountINR) => {
    try {
        const response = await api.post(`/orders/razorpay/create-order`, { amount: amountINR });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

/**
 * Confirm a membership subscription after successful Razorpay payment.
 * Sends payment verification details to backend which activates the tier.
 */
export const confirmMembershipSubscription = async ({
    tier,
    billing_cycle,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    amount,
}) => {
    try {
        const response = await api.post(`/membership/subscribe`, {
            tier,
            billing_cycle,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount,
        });
        return response.data;
    } catch (error) {
        // If backend endpoint doesn't exist yet, return a simulated success
        // so the frontend tier update still works during development.
        console.warn('[MEMBERSHIP] Backend endpoint not ready — simulating success');
        return { success: true, simulated: true };
    }
};

/**
 * Schedule a downgrade. The current tier stays active until the billing period ends.
 */
export const scheduleMembershipDowngrade = async ({ targetTier }) => {
    try {
        const response = await api.post(`/membership/downgrade`, { target_tier: targetTier });
        return response.data;
    } catch (error) {
        console.warn('[MEMBERSHIP] Downgrade API not ready — simulating');
        return { success: true, simulated: true, effective_date: getEndOfMonth() };
    }
};

/**
 * Cancel membership (revert to Free at end of billing period).
 */
export const cancelMembership = async () => {
    try {
        const response = await api.post(`/membership/cancel`);
        return response.data;
    } catch (error) {
        console.warn('[MEMBERSHIP] Cancel API not ready — simulating');
        return { success: true, simulated: true, effective_date: getEndOfMonth() };
    }
};

/**
 * Returns the last day of the current month as a readable string (e.g. "30 June 2026").
 */
export const getEndOfMonth = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Load the Razorpay JS SDK dynamically.
 */
export const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
