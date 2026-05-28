import { api } from './api';

export const getSellerEarningsSummary = async (sellerId) => {
    try {
        const res = await api.get(`/payouts/summary/${sellerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const getSellerPayoutHistory = async (sellerId) => {
    try {
        const res = await api.get(`/payouts/history/${sellerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const getPendingCommissions = async (sellerId) => {
    try {
        const res = await api.get(`/payouts/pending/${sellerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const initiatePayout = async (payoutData) => {
    try {
        const res = await api.post('/payouts/initiate', payoutData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const requestPayout = async (requestData) => {
    try {
        const res = await api.post('/payouts/request', requestData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const getAllPayouts = async () => {
    try {
        const res = await api.get('/payouts/all');
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const updatePayoutStatus = async (payoutId, statusData) => {
    try {
        const res = await api.patch(`/payouts/status/${payoutId}`, statusData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};
