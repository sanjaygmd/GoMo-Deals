import { api } from './api';

export const getSellerPickups = async (sellerId) => {
    try {
        const res = await api.get(`/pickup/seller/${sellerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const addPickupLocation = async (pickupData) => {
    try {
        const res = await api.post('/pickup/add', pickupData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const updatePickupLocation = async (pickupId, pickupData) => {
    try {
        const res = await api.patch(`/pickup/update/${pickupId}`, pickupData);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const deletePickupLocation = async (pickupId) => {
    try {
        const res = await api.delete(`/pickup/${pickupId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};
