import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1', // Hardcoded temporarily to bypass Vite .env cache
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add a request interceptor to handle any last-minute config needs
api.interceptors.request.use((config) => {
    // withCredentials: true ensures that cookies are automatically sent.
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Axios does not automatically attach the xsrf token for cross-origin requests
    // (e.g. localhost:5173 -> localhost:3000) even with withCredentials: true.
    // We must manually read the cookie and attach the header.
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    if (match) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[2]);
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});