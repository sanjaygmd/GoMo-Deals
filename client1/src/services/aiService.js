import { api } from './api';

export const generateVirtualTryOn = async (humanImage, garmentImage) => {
    try {
        const res = await api.post('/ai/virtual-try-on', { humanImage, garmentImage });
        return res.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Network error during AI generation." };
    }
};
