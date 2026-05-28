import { api } from "./api";

export const getWishlist = async (customer_id) => {
    try {
        const res = await api.get(`/wishlist/${customer_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const addToWishlist = async (customer_id, product_id, variant_id = null) => {
    try {
        // Handle both object and positional arguments for flexibility
        const payload = typeof customer_id === 'object' 
            ? customer_id 
            : { customer_id, product_id, variant_id };
            
        const res = await api.post('/wishlist/add', payload);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const removeItem = async (wishlist_item_id) => {
    try {
        const res = await api.delete(`/wishlist/remove/${wishlist_item_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const clearWishlist = async (customer_id) => {
    try {
        const res = await api.delete(`/wishlist/clear/${customer_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
