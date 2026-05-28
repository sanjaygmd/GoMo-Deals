import { api } from './api';

export const getCustomerNotifications = async (customerId) => {
    try {
        const res = await api.get(`/notifications/customer/${customerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const res = await api.patch(`/notifications/read/${notificationId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const markAllNotificationsAsRead = async (customerId) => {
    try {
        const res = await api.patch(`/notifications/read-all/customer/${customerId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};

export const deleteNotification = async (notificationId) => {
    try {
        const res = await api.delete(`/notifications/${notificationId}`);
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error" };
    }
};
