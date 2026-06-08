import { api } from "./api";

export const openDispute = async (orderId, reason) => {
    try {
        const res = await api.post('/disputes', { order_id: orderId, reason });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const getCustomerDisputes = async () => {
    try {
        const res = await api.get('/disputes/customer');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const getSellerDisputes = async () => {
    try {
        const res = await api.get('/disputes/seller');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const getAllDisputes = async () => {
    try {
        const res = await api.get('/disputes');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const updateDisputeSeller = async (disputeId, resolution, status) => {
    try {
        const res = await api.put(`/disputes/${disputeId}/seller`, { resolution, status });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const updateDisputeAdmin = async (disputeId, resolution, status) => {
    try {
        const res = await api.put(`/disputes/${disputeId}/admin`, { resolution, status });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
