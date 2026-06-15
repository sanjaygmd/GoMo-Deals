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
 * Fetch a single meeting by ID.
 * @param {string} meetingId - Meeting UUID
 */
export const getMeetingById = async (meetingId) => {
    try {
        const res = await api.get(`/meetings/${meetingId}`);
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

/**
 * End a scheduled video conference manually.
 * @param {string} meetingId - Meeting UUID
 */
export const endMeeting = async (meetingId) => {
    try {
        const res = await api.put(`/meetings/${meetingId}/end`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Record a meeting outcome as Admin (Creates an accepted offer).
 * @param {string} meetingId - Meeting UUID
 * @param {object} data - { final_price, final_quantity }
 */
export const recordMeetingOutcome = async (meetingId, data) => {
    try {
        const res = await api.post(`/meetings/${meetingId}/admin/record-outcome`, data);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

/**
 * Reschedule a video conference.
 * @param {string} meetingId - Meeting UUID
 * @param {string} newScheduledAt - ISO Date-Time string for new time
 */
export const rescheduleMeeting = async (meetingId, newScheduledAt) => {
    try {
        const res = await api.put(`/meetings/${meetingId}/reschedule`, { new_scheduled_at: newScheduledAt });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
