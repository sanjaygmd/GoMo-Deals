import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true
});

// Add a request interceptor to handle any last-minute config needs
api.interceptors.request.use((config) => {
    // withCredentials: true ensures that HttpOnly cookies are automatically sent.
    // Set project-specific security headers to act as a global CSRF guard.
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-GoMo-Protection'] = 'active';
    return config;
}, (error) => {
    return Promise.reject(error);
});