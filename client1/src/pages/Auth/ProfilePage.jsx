import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { User, Mail, Phone, Calendar, Shield, MapPin, ShoppingBag, Heart, LogOut, Edit2, Plus, ChevronRight, Truck, ArrowLeft, Tag, Clock, Crown, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as cartService from '../../services/cartService';
import * as wishlistService from '../../services/wishlistService';
import * as authService from '../../services/authService';
import * as offerService from '../../services/offerService';
import { api } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomerConferences from './CustomerConferences';

const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const { cart, wishlist, formatPrice } = useShop();
    const navigate = useNavigate();
    const location = useLocation();
    const [addresses, setAddresses] = React.useState([]);
    const [orders, setOrders] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        full_name: user?.full_name || user?.name || '',
        phone: user?.phone || '',
        date_of_birth: user?.date_of_birth || '',
        gender: user?.gender || '',
        profile_picture_url: user?.profile_picture_url || ''
    });
    const [editError, setEditError] = React.useState('');
    const [offers, setOffers] = React.useState([]);
    const [bargainsLoading, setBargainsLoading] = React.useState(true);

    const [notifPrefs, setNotifPrefs] = React.useState({
        notif_orderStatus: localStorage.getItem('notif_orderStatus') !== 'false',
        notif_returns: localStorage.getItem('notif_returns') !== 'false',
        notif_promotions: localStorage.getItem('notif_promotions') !== 'false',
    });

    const handleTogglePref = (key) => {
        const newVal = !notifPrefs[key];
        setNotifPrefs(prev => ({ ...prev, [key]: newVal }));
        localStorage.setItem(key, String(newVal));
    };

    React.useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name || user.name || '',
                phone: user.phone || '',
                date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
                gender: user.gender || '',
                profile_picture_url: user.profile_picture_url || ''
            });
        }
    }, [user]);

    const stats = {
        cart: cart.length,
        wishlist: wishlist.length
    };

    React.useEffect(() => {
        const fetchProfileData = async () => {
            if (user?.id) {
                try {
                    // Removed redundant stats fetching

                    const addressData = await authService.getCustomerAddresses(user.customer_id || user.id);
                    setAddresses(addressData.data || []);

                    const ordersData = await api.get(`/orders/customer/${user.customer_id || user.id}`);
                    setOrders(ordersData.data.data || []);

                    // Fetch user bargaining offers
                    setBargainsLoading(true);
                    const bargainsData = await offerService.getCustomerOffers();
                    setOffers(bargainsData.offers || []);
                } catch (error) {
                    console.error("Failed to fetch profile data:", error);
                } finally {
                    setLoading(false);
                    setBargainsLoading(false);
                }
            }
        };
        fetchProfileData();
    }, [user]);

    // Automatically scroll to active bargains if tab=bargains is specified in URL query params
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('tab') === 'bargains') {
            const bargainsSection = document.getElementById('my-bargains-section');
            if (bargainsSection) {
                setTimeout(() => {
                    bargainsSection.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
    }, [location.search]);

    const handleAcceptCounterPrice = async (productId, counterPrice) => {
        try {
            setBargainsLoading(true);
            const res = await offerService.createOffer(productId, counterPrice);
            if (res.success) {
                // Refresh offers list
                const bargainsData = await offerService.getCustomerOffers();
                setOffers(bargainsData.offers || []);
            }
        } catch (error) {
            console.error("Failed to accept counter offer:", error);
        } finally {
            setBargainsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!user?.customer_id && !user?.id) {
            setEditError('User session error. Please log in again.');
            return;
        }
        setLoading(true);
        setEditError('');
        try {
            // Update process initiated
            const response = await api.put(`/customer/${user.customer_id || user.id}`, editForm);
            if (response.data.success) {
                updateUser(response.data.data);
                setIsEditModalOpen(false);
            }
        } catch (error) {
            console.error("Update profile failed:", error);
            const serverMessage = error.response?.data?.message;
            setEditError(serverMessage || 'Failed to update profile. Please check all fields.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-orange-500 uppercase tracking-widest text-xs">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50/50 pt-16 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Back to Home Navigation */}
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-orange-400 hover:text-orange-950 font-bold transition-all group"
                    >
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform duration-300" /> Back to Home
                    </button>
                </div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {/* Sidebar / Profile Header */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white border border-orange-100 p-8 text-center shadow-sm">
                            <div className="relative inline-block mb-6">
                                {user.profile_picture_url ? (
                                    <img 
                                        src={user.profile_picture_url} 
                                        alt={user.name} 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-orange-50 shadow-inner"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-50">
                                        <User size={48} className="text-orange-300" strokeWidth={1} />
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
                            </div>
                            <h2 className="text-xl font-serif tracking-widest uppercase mb-1">{user?.full_name || user?.name || 'User'}</h2>
                            {/* Membership Tier Badge */}
                            {(() => {
                                const tier = user?.membership || 'free';
                                const tierConfig = {
                                    free:     { label: 'Free Member',     emoji: '🛍️',  cls: 'bg-orange-50 text-orange-400 border-orange-100' },
                                    silver:   { label: 'Silver Member',   emoji: '⭐',  cls: 'bg-gradient-to-r from-slate-100 to-gray-200 text-slate-600 border-slate-300' },
                                    gold:     { label: 'Gold Member',     emoji: '👑',  cls: 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-700 border-amber-300 shadow-[0_2px_12px_rgba(245,158,11,0.25)]' },
                                    platinum: { label: 'Platinum Member', emoji: '💎',  cls: 'bg-gradient-to-r from-slate-200 to-gray-300 text-slate-700 border-slate-400 shadow-[0_2px_12px_rgba(100,116,139,0.3)]' },
                                }[tier];
                                return (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest mt-1 ${tierConfig.cls}`}>
                                        <span>{tierConfig.emoji}</span>
                                        <span>{tierConfig.label}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="bg-white border border-orange-100 p-6 shadow-sm">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-900 mb-4 pb-2 border-b border-orange-50">Security</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Shield size={16} className="text-orange-400" />
                                    <span className="text-xs text-orange-600">Account Verified</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-orange-400" />
                                    <span className="text-xs text-orange-600">Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate('/membership')}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 text-[9px] uppercase tracking-widest font-black shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
                        >
                            <Crown size={13} /> Manage Membership
                        </button>

                        <button 
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-orange-50 border border-orange-100 text-orange-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300 text-[10px] uppercase tracking-widest font-bold group"
                        >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            Sign Out
                        </button>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Personal Information</h3>
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-orange-400 hover:text-orange-900 transition-colors"
                                >
                                    <Edit2 size={12} /> Edit
                                </button>
                            </div>
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 flex items-center gap-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    <p className="text-sm tracking-wide text-orange-900 font-medium">{user?.full_name || user?.name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 flex items-center gap-2">
                                        <Mail size={12} /> Email Address
                                    </label>
                                    <p className="text-sm tracking-wide text-orange-900 font-medium">{user.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 flex items-center gap-2">
                                        <Phone size={12} /> Phone Number
                                    </label>
                                    <p className="text-sm tracking-wide text-orange-900 font-medium">{user.phone || 'Not provided'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 flex items-center gap-2">
                                        <Calendar size={12} /> Birthday
                                    </label>
                                    <p className="text-sm tracking-wide text-orange-900 font-medium">
                                        {user?.date_of_birth 
                                            ? new Date(user.date_of_birth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                                            : 'Add birthday'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 flex items-center gap-2">
                                        <User size={12} /> Gender
                                    </label>
                                    <p className="text-sm tracking-wide text-orange-900 font-medium capitalize">
                                        {user?.gender || 'Not provided'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag size={14} className="text-orange-400" />
                                        <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Cart</h3>
                                    </div>
                                    <span className="text-[10px] font-bold bg-orange-100 px-2 py-1 rounded">{stats.cart} Items</span>
                                </div>
                                <div className="p-8">
                                    <p className="text-xs text-orange-500 mb-4">You have {stats.cart} items waiting in your cart.</p>
                                    <button 
                                        onClick={() => navigate('/cart')}
                                        className="w-full py-3 bg-orange-900 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg"
                                    >
                                        View Cart
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                    <div className="flex items-center gap-2">
                                        <Heart size={14} className="text-orange-400" />
                                        <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Wishlist</h3>
                                    </div>
                                    <span className="text-[10px] font-bold bg-orange-100 px-2 py-1 rounded">{stats.wishlist} Items</span>
                                </div>
                                <div className="p-8">
                                    <p className="text-xs text-orange-500 mb-4">Manage your {stats.wishlist} saved items.</p>
                                    <button 
                                        onClick={() => navigate('/wishlist')}
                                        className="w-full py-3 border border-orange-900 text-orange-900 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg"
                                    >
                                        Manage Wishlist
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Recent Orders</h3>
                                <button 
                                    onClick={() => navigate('/my-orders')}
                                    className="text-[10px] uppercase tracking-widest font-bold text-orange-400 hover:text-orange-900 transition-colors flex items-center gap-2"
                                >
                                    View All <ChevronRight size={12} />
                                </button>
                            </div>
                            <div className="p-8">
                                {orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.slice(0, 3).map((order) => (
                                            <div key={order.order_id} className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-400">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-900">Order #{order.order_id.slice(0, 8).toUpperCase()}</p>
                                                        <p className="text-[9px] text-orange-400 uppercase tracking-widest mt-1">
                                                            {new Date(order.placed_at).toLocaleDateString()} • {order.order_status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {order.tracking_id && (
                                                        <a 
                                                            href={`https://shiprocket.co/tracking/${order.tracking_id}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="h-10 px-4 rounded-lg bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2"
                                                        >
                                                            <Truck size={12} /> Track
                                                        </a>
                                                    )}
                                                    <span className="text-[10px] font-black text-orange-900 italic">{formatPrice(order.total_amount)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[10px] uppercase tracking-widest text-orange-400">No orders placed yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Conferences Panel */}
                        <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <div className="flex items-center gap-2">
                                    <Video size={14} className="text-orange-505" />
                                    <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900 font-sans">Scheduled Conferences</h3>
                                </div>
                            </div>
                            <div className="p-8">
                                <CustomerConferences />
                            </div>
                        </div>

                        {/* Dynamic Bargains Panel */}
                        <div id="my-bargains-section" className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-orange-505" />
                                    <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900 font-sans">My Bargains (Flex Offers)</h3>
                                </div>
                                <span className="text-[10px] font-bold bg-orange-100 px-2 py-1 rounded font-sans">{offers.length} Active</span>
                            </div>
                            <div className="p-8">
                                {offers.length > 0 ? (
                                    <div className="space-y-6">
                                        {offers.map((offer) => {
                                            const originalPrice = parseFloat(offer.list_price);
                                            const offeredPrice = parseFloat(offer.offered_price);
                                            const counterPrice = offer.seller_counter_price ? parseFloat(offer.seller_counter_price) : null;
                                            
                                            return (
                                                <div key={offer.offer_id} className="p-5 bg-orange-50/50 border border-orange-100/60 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-orange-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-white border border-orange-100/40 p-1 flex-shrink-0">
                                                            <img 
                                                                src={offer.product_thumbnail} 
                                                                alt={offer.product_name} 
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="text-xs font-serif font-black text-orange-955 uppercase tracking-wider">{offer.product_name}</h4>
                                                            <p className="text-[8px] text-orange-400 uppercase tracking-widest mt-1 font-sans">
                                                                Store: {offer.store_name}
                                                            </p>
                                                            {offer.agreed_quantity && (
                                                                <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-1 font-sans">
                                                                    Mediated Quantity: {offer.agreed_quantity} kg
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-2 font-sans">
                                                                <span className="text-[10px] text-orange-400 line-through">{formatPrice(originalPrice)}</span>
                                                                <span className="text-xs font-extrabold text-orange-900">Offered: {formatPrice(offeredPrice)}</span>
                                                                {counterPrice && (
                                                                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5">Counter: {formatPrice(counterPrice)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end md:self-center">
                                                        {/* Status Pills */}
                                                        <span className={`text-[8.5px] uppercase tracking-widest font-black px-3 py-1.5 border text-center font-sans ${
                                                            offer.status === 'Accepted' 
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                : offer.status === 'Rejected'
                                                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                                                : offer.status === 'Countered'
                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                                : 'bg-amber-50 border-amber-200 text-amber-600'
                                                        }`}>
                                                            {offer.status}
                                                        </span>

                                                        {/* Actions */}
                                                        {offer.status === 'Accepted' && (
                                                            <button
                                                                onClick={() => navigate(`/checkout?offerToken=${offer.offer_token}`)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase tracking-widest font-black py-2 px-4 rounded-none shadow-md transition-colors font-sans"
                                                            >
                                                                Checkout Bargain
                                                            </button>
                                                        )}

                                                        {offer.status === 'Countered' && counterPrice && (
                                                            <button
                                                                onClick={() => handleAcceptCounterPrice(offer.product_id, counterPrice)}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] uppercase tracking-widest font-black py-2 px-4 rounded-none shadow-md transition-colors font-sans"
                                                            >
                                                                Accept Counter
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[10px] uppercase tracking-widest text-orange-400 font-sans">No active bargain offers proposed yet</p>
                                        <button 
                                            onClick={() => navigate('/')}
                                            className="mt-4 text-[9px] uppercase tracking-widest text-orange-600 font-extrabold hover:text-orange-950 underline font-sans"
                                        >
                                            Browse Boutique Products
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Saved Addresses</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                {addresses.slice(0, 1).map((address, index) => (
                                    <div key={index} className="group relative bg-orange-50 p-6 border border-orange-100 hover:border-orange-900 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-orange-900" />
                                                <span className="text-[10px] uppercase tracking-widest font-bold">Address {index + 1}</span>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/onboarding/${user.customer_id || user.id}`)}
                                                className="text-[10px] uppercase tracking-widest font-bold text-orange-300 hover:text-orange-900 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-xs text-orange-600 leading-relaxed">
                                            {address.address_line_1}<br />
                                            {address.address_line_2 && <>{address.address_line_2}<br /></>}
                                            {address.city}, {address.state} {address.pincode}<br />
                                            {address.country}
                                        </p>
                                    </div>
                                ))}
                                {addresses.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-orange-100">
                                        <p className="text-[10px] uppercase tracking-widest text-orange-400">No addresses saved</p>
                                    </div>
                                )}
                                <button 
                                    onClick={() => navigate(`/onboarding/${user.customer_id || user.id}`)}
                                    className="w-full py-4 border border-orange-200 text-orange-900 text-[10px] uppercase tracking-widest font-bold hover:border-orange-900 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={12} /> Change Address
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-orange-50 flex justify-between items-center bg-orange-50/30">
                                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-orange-900">Notification Preferences</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { key: 'notif_orderStatus', label: 'Order Status Alerts', desc: 'Receive real-time notifications for order placement, packaging, and dispatch.' },
                                        { key: 'notif_returns', label: 'Return Request Updates', desc: 'Get notified instantly when return requests are reviewed, approved, or rejected.' },
                                        { key: 'notif_promotions', label: 'Offers & Promotions', desc: 'Be the first to hear about luxury drops, exclusive discounts, and gift sales.' }
                                    ].map((pref) => {
                                        const enabled = notifPrefs[pref.key];
                                        return (
                                            <div key={pref.key} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                                <div className="space-y-1 pr-4 text-left">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-900">{pref.label}</p>
                                                    <p className="text-[9px] text-orange-400 uppercase tracking-widest leading-relaxed">{pref.desc}</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleTogglePref(pref.key)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 flex items-center ${enabled ? 'bg-orange-900' : 'bg-orange-200'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-orange-600/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white shadow-2xl rounded-sm overflow-hidden z-10"
                        >
                            <div className="bg-orange-900 px-8 py-6 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm uppercase tracking-[0.3em] font-bold">Edit Profile</h3>
                                    <p className="text-[9px] uppercase tracking-widest text-orange-400 mt-1">Update your personal details</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                                    <Plus size={20} className="rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                                {editError && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest font-bold text-center">
                                        {editError}
                                    </div>
                                )}
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                        className="w-full bg-orange-50 border border-orange-100 px-4 py-3 text-xs focus:outline-none focus:border-orange-900 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Phone</label>
                                    <input 
                                        type="text" 
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full bg-orange-50 border border-orange-100 px-4 py-3 text-xs focus:outline-none focus:border-orange-900 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Date of Birth</label>
                                        <input 
                                            type="date" 
                                            value={editForm.date_of_birth}
                                            onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                                            className="w-full bg-orange-50 border border-orange-100 px-4 py-3 text-xs focus:outline-none focus:border-orange-900 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Gender</label>
                                        <select 
                                            value={editForm.gender}
                                            onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                                            className="w-full bg-orange-50 border border-orange-100 px-4 py-3 text-xs focus:outline-none focus:border-orange-900 transition-colors"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-orange-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold py-4 hover:bg-orange-600 transition-colors shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
