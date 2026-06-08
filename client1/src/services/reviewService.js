import { api } from "./api";

export const getProductReviews = async (productId, variantId = null) => {
    // Intercept mock Flea Market items
    if (productId && String(productId).startsWith('fm') && !String(productId).startsWith('fm_')) {
        return { success: true, data: [] }; // Mock items have no reviews yet
    }
    
    // Strip fm_ prefix for real products mapped to flea market
    const realId = String(productId).startsWith('fm_') ? String(productId).replace('fm_', '') : productId;

    try {
        const url = variantId ? `/reviews/product/${realId}?variantId=${variantId}` : `/reviews/product/${realId}`;
        const res = await api.get(url);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const checkCanReview = async (productId) => {
    if (productId && String(productId).startsWith('fm') && !String(productId).startsWith('fm_')) {
        return { success: true, canReview: false }; // Cannot review mock products
    }

    const realId = String(productId).startsWith('fm_') ? String(productId).replace('fm_', '') : productId;

    try {
        const res = await api.get(`/reviews/check/${realId}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const addReview = async (reviewData) => {
    try {
        const res = await api.post('/reviews/add', reviewData);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const updateReview = async (id, reviewData) => {
    try {
        const res = await api.put(`/reviews/${id}`, reviewData);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const moderateReview = async (id, status) => {
    try {
        const res = await api.put(`/reviews/${id}/moderate`, { status });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const replyToReview = async (id, seller_reply) => {
    try {
        const res = await api.put(`/reviews/${id}/reply`, { seller_reply });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
