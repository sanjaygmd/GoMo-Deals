import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Normalization helper to map snake_case database properties to camelCase frontend expectations
    const normalizeUserData = (userData) => {
        if (!userData) return null;
        return {
            ...userData,
            hasAgreedToFleaMarketTerms: userData.hasAgreedToFleaMarketTerms ?? userData.has_agreed_to_flea_market_terms ?? false
        };
    };

    // Security Helper: Only save non-sensitive, visual display details to localStorage.
    // Privileged fields like roles, email, phone, and customer IDs are kept strictly in-memory.
    const saveSanitizedUser = (userData) => {
        if (!userData) {
            localStorage.removeItem('user');
            return;
        }
        const sanitized = {
            full_name: userData.full_name || userData.name || '',
            profile_picture_url: userData.profile_picture_url || '',
            membership: userData.membership || 'free'
        };
        localStorage.setItem('user', JSON.stringify(sanitized));
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                const response = await authService.getMe();
                if (response.success) {
                    const normalized = normalizeUserData(response.data);
                    setUser(normalized);
                    saveSanitizedUser(normalized);
                }
            } catch (err) {
                console.log("No active session found");
                // If token is invalid/expired, clear local storage
                saveSanitizedUser(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (userData) => {
        const normalized = normalizeUserData(userData);
        setUser(normalized);
        saveSanitizedUser(normalized);
    };

    const logout = async () => {
        try {
            const role = user?.role;
            if (role === 'admin' || role === 'super_admin') {
                await authService.adminLogout();
            } else if (role === 'seller') {
                await authService.sellerLogout();
            } else {
                await authService.customerLogout();
            }
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            if (user?.id) {
                localStorage.removeItem(`gomo_chat_history_${user.id}`);
            }
            localStorage.removeItem('gomo_chat_history_guest');
            localStorage.removeItem('gomo_chat_history');
            localStorage.removeItem('gomo_show_membership_welcome');
            
            setUser(null);
            // Clear all possible auth-related local storage items
            saveSanitizedUser(null);
            localStorage.removeItem('auth');
            localStorage.removeItem('seller');
            localStorage.removeItem('token');
            // Redirect to home after clearing state
            window.location.href = '/';
        }
    };

    const updateUser = (userData) => {
        const newUser = normalizeUserData({ ...user, ...userData });
        setUser(newUser);
        saveSanitizedUser(newUser);
    };

    const refreshUser = async () => {
        try {
            const response = await authService.getMe();
            if (response.success) {
                const normalized = normalizeUserData(response.data);
                setUser(normalized);
                saveSanitizedUser(normalized);
            }
        } catch (err) {
            console.error("Failed to refresh user session:", err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            updateUser,
            refreshUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
