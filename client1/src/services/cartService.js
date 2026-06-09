import { api } from "./api";

export const getCart = async (customer_id) => {
    try {
        const res = await api.get(`/cart/${customer_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const addToCart = async ({ customer_id, product_id, variant_id, quantity, price }) => {
    try {
        const res = await api.post('/cart/add', { customer_id, product_id, variant_id, quantity, price });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};



export const updateQuantity = async (cart_item_id, quantity) => {
    try {
        const res = await api.patch('/cart/update', { cart_item_id, quantity });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const removeItem = async (cart_item_id) => {
    try {
        const res = await api.delete(`/cart/remove/${cart_item_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const clearCart = async (customer_id) => {
    try {
        const res = await api.delete(`/cart/clear/${customer_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
