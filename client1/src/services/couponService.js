import { api } from './api';

export const getActiveCoupons = async () => {
    try {
        const res = await api.get('/coupons/active');
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const validateCoupon = async (code, subtotal) => {
    try {
        const res = await api.post('/coupons/validate', { code, subtotal });
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const getAllCoupons = async () => {
    try {
        const res = await api.get('/coupons/all');
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const createCoupon = async (couponData) => {
    try {
        const res = await api.post('/coupons/create', couponData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const updateCoupon = async (id, couponData) => {
    try {
        const res = await api.put(`/coupons/update/${id}`, couponData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const deleteCoupon = async (id) => {
    try {
        const res = await api.delete(`/coupons/delete/${id}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};
