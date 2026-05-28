import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Footer from './Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from './Chatbot/ChatbotWidget';
import MembershipWelcomeModal from '../common/MembershipWelcomeModal';

const CustomerLayout = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-orange-500 uppercase tracking-widest text-xs font-bold">Loading...</p>
            </div>
        );
    }

    const userRole = user?.role || user?.type;
    if (user && userRole === 'seller') {
        return <Navigate to="/seller-dashboard" replace />;
    }

    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    return (
        <div className="font-sans antialiased text-orange-900 bg-white min-h-screen flex flex-col">
            {!isAuthPage && <Navbar />}
            <main className="flex-grow relative">
                <Outlet />
            </main>
            {!isAuthPage && <Footer />}
            <ChatbotWidget />
            <MembershipWelcomeModal />
        </div>
    );
};

export default CustomerLayout;
