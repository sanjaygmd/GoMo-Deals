import { api } from "./api";

/**
 * Schedule a new Flea Market Video Conference.
 * @param {string} productId - Product UUID
 * @param {number} kgAmount - Quantity in kg (min order threshold)
 * @param {string} purpose - Purpose of conference
 * @param {string} scheduledAt - ISO Date-Time string for scheduling
 */
export const createMeeting = async (productId, kgAmount, purpose, scheduledAt) => {
    try {
        const res = await api.post('/meetings', { productId, kgAmount, purpose, scheduledAt });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Retrieve scheduled video conferences for the currently logged-in seller.
 */
export const getSellerMeetings = async () => {
    try {
        const res = await api.get('/meetings/seller');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Retrieve scheduled video conferences for the currently logged-in customer.
 */
export const getCustomerMeetings = async () => {
    try {
        const res = await api.get('/meetings/customer');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Cancel a scheduled video conference.
 * @param {string} meetingId - Meeting UUID
 */
export const cancelMeeting = async (meetingId) => {
    try {
        const res = await api.put(`/meetings/${meetingId}/cancel`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Retrieve all scheduled video conferences for mediation (Admin required).
 */
export const getAdminMeetings = async () => {
    try {
        const res = await api.get('/meetings/admin');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Complete a scheduled video conference with earnings (Seller required).
 * @param {string} meetingId - Meeting UUID
 * @param {object} data - { earnings, meeting_notes }
 */
export const completeSellerMeeting = async (meetingId, data) => {
    try {
        const res = await api.put(`/meetings/seller/${meetingId}/complete`, data);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
