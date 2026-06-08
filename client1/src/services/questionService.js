import { api } from "./api";

export const getProductQuestions = async (product_id) => {
    try {
        const res = await api.get(`/questions/product/${product_id}`);
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const askQuestion = async (product_id, question) => {
    try {
        const res = await api.post('/questions/ask', { product_id, question });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const getSellerQuestions = async () => {
    try {
        const res = await api.get('/questions/seller');
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};

export const answerQuestion = async (question_id, action, answer = '') => {
    try {
        const res = await api.post('/questions/answer', { question_id, action, answer });
        return res.data;
    } catch (error) {
        return { success: false, error: error?.response?.data?.message || error.message };
    }
};
