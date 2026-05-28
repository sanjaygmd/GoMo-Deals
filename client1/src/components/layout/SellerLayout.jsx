import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Settings, MessageSquare, LogOut, Menu, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SellerLayout = () => {
    const { user, loading, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-orange-500 uppercase tracking-widest text-xs font-bold">Loading Workspace...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/seller-login" state={{ from: location }} replace />;
    }

    const isSeller = user?.role === 'seller' || user?.type === 'seller';

    if (!isSeller) {
        return <Navigate to="/" replace />;
    }

    const navigation = [
        { name: 'Overview', href: '/seller-dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/seller-dashboard/products', icon: Package },
        { name: 'Orders', href: '/seller-dashboard/orders', icon: ShoppingBag },
        { name: 'Analytics', href: '/seller-dashboard/analytics', icon: BarChart2 },
        { name: 'Messages', href: '/seller-dashboard/messages', icon: MessageSquare },
        { name: 'Settings', href: '/seller-dashboard/settings', icon: Settings },
    ];

    const isActive = (path) => {
        if (path === '/seller-dashboard' && location.pathname !== '/seller-dashboard') return false;
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/seller-login');
    };

    return (
        <div className="min-h-screen bg-orange-50 flex overflow-hidden font-sans">

            {/* ── MOBILE OVERLAY ─────────────────────────────── */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-orange-900/50 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* ── MOBILE DRAWER ──────────────────────────────── */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', duration: 0.25 }}
                        className="fixed top-0 left-0 z-50 h-screen w-72 bg-orange-950 text-white flex flex-col shadow-2xl lg:hidden"
                    >
                        <SidebarContent
                            user={user}
                            navigation={navigation}
                            isActive={isActive}
                            handleLogout={handleLogout}
                            onClose={() => setIsSidebarOpen(false)}
                            showClose
                        />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── DESKTOP STATIC SIDEBAR ─────────────────────── */}
            <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-orange-950 text-white shrink-0 shadow-2xl">
                <SidebarContent
                    user={user}
                    navigation={navigation}
                    isActive={isActive}
                    handleLogout={handleLogout}
                    onClose={() => {}}
                    showClose={false}
                />
            </aside>

            {/* ── MAIN CONTENT ───────────────────────────────── */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Mobile top bar */}
                <header className="lg:hidden bg-white border-b border-orange-200 h-16 flex items-center justify-between px-4 shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-orange-500 hover:text-orange-900 transition-colors">
                            <Menu size={24} />
                        </button>
                        <span className="text-sm font-serif tracking-widest uppercase text-orange-900">GoMo Vendor</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-orange-50">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

// ── Shared Sidebar Content ──────────────────────────────────────────────────
const SidebarContent = ({ user, navigation, isActive, handleLogout, onClose, showClose }) => (
    <>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
            <Link to="/seller-dashboard" onClick={onClose} className="flex items-center gap-3">
                <Gift size={22} className="text-orange-400" />
                <span className="text-base font-serif tracking-widest uppercase">GoMo Vendor</span>
            </Link>
            {showClose && (
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            )}
        </div>

        <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-900 flex items-center justify-center border-2 border-orange-700 shrink-0">
                    <span className="text-sm font-bold uppercase">
                        {(user?.store_name || user?.full_name || 'S').charAt(0)}
                    </span>
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-wide truncate">{user?.store_name || user?.full_name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-orange-400 mt-0.5">
                        {user?.is_verified ? 'Verified Partner' : 'Pending Verification'}
                    </p>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group ${
                            active
                                ? 'bg-orange-800/60 text-white border border-orange-700/50'
                                : 'text-white/55 hover:bg-orange-900/40 hover:text-white'
                        }`}
                    >
                        <item.icon
                            size={17}
                            className={active ? 'text-orange-300' : 'text-white/35 group-hover:text-orange-400 transition-colors'}
                        />
                        <span className="text-[11px] uppercase tracking-widest font-bold">{item.name}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                    </Link>
                );
            })}
        </nav>

        <div className="p-3 border-t border-white/10">
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/55 hover:bg-red-900/30 hover:text-red-400 transition-colors group"
            >
                <LogOut size={17} className="text-white/35 group-hover:text-red-400 transition-colors" />
                <span className="text-[11px] uppercase tracking-widest font-bold">Sign Out</span>
            </button>
        </div>
    </>
);

export default SellerLayout;
