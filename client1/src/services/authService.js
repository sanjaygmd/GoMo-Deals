import { api } from "./api.js";

const normalizeEmail = (email) => {
    if (typeof email === 'string') return email.toLowerCase().trim();
    if (email && typeof email === 'object' && email.email) {
        return { ...email, email: email.email.toLowerCase().trim() };
    }
    return email;
};

const handleApiCall = async (method, url, data) => {
    try {
        const res = await api[method](url, data);
        return res.data;
    } catch (error) {
        // Suppress 401 logging for /me as it's a common session check for guests
        if (!(url === '/me' && error?.response?.status === 401)) {
            console.error(`API ERROR [${method} ${url}]:`, error);
        }
        throw error; // Re-throw to allow component-level try/catch to work
    }
};

// Customer Auth
export const sendOtp = (email) => {
    const payload = typeof email === 'object' ? normalizeEmail(email) : { email: normalizeEmail(email) };
    return handleApiCall('post', `/customer/send-otp`, payload);
};

export const verifyOtp = (email, otp) => {
    const payload = typeof email === 'object' ? normalizeEmail(email) : { email: normalizeEmail(email), otp };
    return handleApiCall('post', `/customer/verify-otp`, payload);
};

export const customerRegister = (registerData) => {
    const normalizedData = { ...registerData, email: registerData.email?.toLowerCase().trim() };
    return handleApiCall('post', '/customer/register', normalizedData);
};

export const register = customerRegister; // Generic alias

export const customerLogin = (email, password) => {
    const payload = typeof email === 'object' ? normalizeEmail(email) : { email: normalizeEmail(email), password };
    return handleApiCall('post', '/customer/login', payload);
};

export const login = customerLogin; // Generic alias

// Seller Auth
export const sendSellerOtp = (email) => {
    const payload = typeof email === 'object' ? { ...normalizeEmail(email), user_type: 'seller' } : { email: normalizeEmail(email), user_type: 'seller' };
    return handleApiCall('post', `/seller/send-otp`, payload);
};

export const verifySellerOtp = (email, otp) => {
    const payload = typeof email === 'object' ? { ...normalizeEmail(email), user_type: 'seller' } : { email: normalizeEmail(email), otp, user_type: 'seller' };
    return handleApiCall('post', `/seller/verify-otp`, payload);
};

export const sellerRegister = (registerData) => {
    const normalizedData = { ...registerData, email: registerData.email?.toLowerCase().trim() };
    return handleApiCall('post', `/seller/register`, normalizedData);
};

export const registerSeller = sellerRegister; // Alias

export const loginSeller = (loginData) => {
    const normalizedData = { ...loginData, email: loginData.email?.toLowerCase().trim() };
    return handleApiCall('post', '/seller/login', normalizedData);
};

// Admin Auth
export const adminLogin = (email, password, role) => {
    const payload = typeof email === 'object' ? normalizeEmail(email) : { email: normalizeEmail(email), password, role };
    return handleApiCall('post', '/admin/login', payload);
};

export const loginAdmin = adminLogin; // Alias

export const sendAdminRegisterOTP = (data) => {
    const normalizedData = { ...data, email: data.email?.toLowerCase().trim() };
    return handleApiCall('post', '/admin/send-register-otp', normalizedData);
};

export const adminRegister = (registerData) => {
    const normalizedData = { ...registerData, email: registerData.email?.toLowerCase().trim() };
    return handleApiCall('post', '/admin/register', normalizedData);
};

export const registerAdmin = adminRegister; // Alias

export const verifySuperAdminLogin = (email, otp) => {
    const payload = typeof email === 'object' ? normalizeEmail(email) : { email: normalizeEmail(email), otp };
    return handleApiCall('post', '/admin/verify-super-admin-login', payload);
};

export const requestAdminPasswordReset = (email) => {
    return handleApiCall('post', '/admin/request-password-reset', { email: normalizeEmail(email) });
};

export const verifyAdminPasswordReset = (payload) => {
    return handleApiCall('post', '/admin/verify-password-reset', payload);
};

// User Profile & Stats
export const getMe = () => handleApiCall('get', '/me');

export const getCustomerById = (id) => handleApiCall('get', `/customer/${id}`);
export const getCustomerAddresses = (id) => handleApiCall('get', `/customer/addresses/${id}`);

export const customerLogout = () => handleApiCall('post', '/customer/logout');
export const sellerLogout = () => handleApiCall('post', '/seller/logout');
export const adminLogout = () => handleApiCall('post', '/admin/logout');
export const logout = customerLogout; 
export const logoutUser = customerLogout;

export const customerOnboarding = (customerId, data) =>
    handleApiCall('post', `/customer-onboarding/${customerId}`, data);

export const agreeToTerms = () => handleApiCall('put', '/agree-terms');
