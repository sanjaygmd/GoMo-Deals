import { api } from "./api";

/**
 * Creates or updates an offer for a product.
 * @param {string} productId - Product UUID
 * @param {number} offeredPrice - Bargain offer amount
 */
export const createOffer = async (productId, offeredPrice) => {
    try {
        const res = await api.post('/offers', { productId, offeredPrice });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Retrieves the logged-in customer's bargain negotiation offers.
 */
export const getCustomerOffers = async () => {
    try {
        const res = await api.get('/offers/customer');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Retrieves the logged-in seller's received offers.
 */
export const getSellerOffers = async () => {
    try {
        const res = await api.get('/offers/seller');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Allows a seller to respond (Accept, Reject, Counter) to an offer.
 * @param {string} offerId - Offer UUID
 * @param {string} action - 'Accept' | 'Reject' | 'Counter'
 * @param {number|null} counterPrice - Required if action is 'Counter'
 */
export const respondToOffer = async (offerId, action, counterPrice = null) => {
    try {
        const res = await api.put(`/offers/${offerId}/respond`, { action, counterPrice });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Validates an offer checkout token.
 * @param {string} token - Custom checkout bargain token
 */
export const validateOfferToken = async (token) => {
    try {
        const res = await api.get(`/offers/validate/${token}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
