import { api } from "./api";

export const getSellerBundles = async () => {
    try {
        const res = await api.get('/bundles/seller');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const createBundle = async (bundleData) => {
    try {
        const res = await api.post('/bundles', bundleData);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const deleteBundle = async (bundleId) => {
    try {
        const res = await api.delete(`/bundles/${bundleId}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const toggleBundleStatus = async (bundleId) => {
    try {
        const res = await api.put(`/bundles/${bundleId}/toggle`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const getProductBundles = async (productId) => {
    try {
        const res = await api.get(`/bundles/product/${productId}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
