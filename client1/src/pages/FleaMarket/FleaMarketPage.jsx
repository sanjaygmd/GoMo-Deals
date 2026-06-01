import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Video, Calendar, Clock, Globe, Package, Shield,
  ChevronDown, ChevronRight, X, Check, CheckCircle, Star, Crown,
  AlertTriangle, Loader2, Filter, Search, ArrowRight,
  Scale, Truck, Award, Info, Lock, StopCircle
} from 'lucide-react';
import FleaMarketTermsModal from '../../components/common/FleaMarketTermsModal';
import ScheduleModal from '../../components/common/ScheduleModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getCustomerMeetings, cancelMeeting, endMeeting } from '../../services/meetingService';
import { getCustomerOffers, cancelCustomerOffer } from '../../services/offerService';
import { useToast } from '../../context/ToastContext';
import { ProductContext } from '../../context/ProductContext/ProductContext';

// ─── Commodity Categories ────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'all',          label: 'All Commodities',  emoji: '🌐' },
  { slug: 'dal',          label: 'Dal',               emoji: '🫘' },
  { slug: 'paruppu',      label: 'Paruppu',           emoji: '🟤' },
  { slug: 'rice',         label: 'Rice',              emoji: '🌾' },
  { slug: 'wheat',        label: 'Wheat',             emoji: '🌿' },
  { slug: 'maize',        label: 'Maize / Corn',      emoji: '🌽' },
  { slug: 'groundnut',    label: 'Groundnut',         emoji: '🥜' },
  { slug: 'sesame',       label: 'Sesame Seeds',      emoji: '🌱' },
  { slug: 'black-pepper', label: 'Black Pepper',      emoji: '⚫' },
  { slug: 'turmeric',     label: 'Turmeric',          emoji: '🟡' },
  { slug: 'coriander',    label: 'Coriander Seeds',   emoji: '🌿' },
  { slug: 'cumin',        label: 'Cumin',             emoji: '🟫' },
  { slug: 'sugar',        label: 'Sugar',             emoji: '🍬' },
];

// ─── Membership Gate Modal ────────────────────────────────────────────────────
const MembershipGateModal = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-white text-xl font-black tracking-tight">Membership Required</h2>
          <p className="text-amber-100 text-[12px] mt-2 leading-relaxed">
            Access to the GoMo Import/Export Exchange requires an active membership plan.
          </p>
        </div>
        <div className="px-8 py-6">
          <div className="space-y-3 mb-6">
            {['Schedule video conferences with sellers', 'Browse verified import/export listings', 'Access commodity price data & grades', 'Connect with verified exporters globally'].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px] text-gray-700">
                <Check size={14} className="text-amber-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/membership')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[12px] uppercase tracking-widest hover:brightness-105 transition-all shadow-lg">
            View Membership Plans →
          </button>
          <button onClick={onClose} className="w-full mt-3 py-2.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-semibold">
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Listing Card ─────────────────────────────────────────────────────────────
const ListingCard = ({ listing, isMember, onSchedule, onGate, onCheckout }) => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/product/${listing.id}`)}
      className="bg-white rounded-[24px] border border-orange-100/50 shadow-sm hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden group flex flex-col h-full cursor-pointer relative"
    >
      {/* Image Header */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
        <img src={listing.image} alt={listing.title}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000'; }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out bg-amber-50" />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-amber-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-100 border border-amber-700 shadow-xl flex items-center gap-1.5">
            <Award size={10} className="text-amber-400" /> {listing.grade} Grade
          </div>
        </div>
        {listing.seller.verified && (
          <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md px-2.5 py-1.5 rounded-full text-[8px] font-black text-white flex items-center gap-1 shadow-lg">
            <Shield size={9} /> Verified
          </div>
        )}

        {/* Bottom Details over Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between items-end gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-300 mb-1 drop-shadow-md truncate">
                {CATEGORIES.find(c => c.slug === listing.category)?.emoji} {CATEGORIES.find(c => c.slug === listing.category)?.label}
              </p>
              <h3 className="text-[17px] font-black text-white leading-tight drop-shadow-lg line-clamp-1 group-hover:text-amber-300 transition-colors">
                {listing.title}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-white/80 font-black mb-0.5">Price</p>
              <p className="text-[16px] font-black text-white drop-shadow-md">₹{listing.pricePerKg}<span className="text-[10px] font-bold text-white/70">/kg</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 bg-white relative">
        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-5 font-medium group-hover:text-gray-700 transition-colors">
          {listing.description}
        </p>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <div className="flex items-center gap-1.5 bg-orange-50/80 rounded-lg px-2.5 py-1.5 border border-orange-100/50">
            <Scale size={12} className="text-orange-500" />
            <span className="text-[10px] font-bold text-gray-700">Min {listing.minOrderKg} kg</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50/80 rounded-lg px-2.5 py-1.5 border border-blue-100/50">
            <Globe size={12} className="text-blue-500" />
            <span className="text-[10px] font-bold text-gray-700 truncate max-w-[90px]">{listing.origin}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50/80 rounded-lg px-2.5 py-1.5 border border-emerald-100/50">
            <Clock size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-700">{listing.available}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-[13px] shadow-sm ring-2 ring-white">
              {listing.seller.name.charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900 line-clamp-1">{listing.seller.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{listing.seller.country}</span>
                <div className="flex items-center gap-0.5">
                  <Star size={8} className="text-amber-500 fill-amber-500" />
                  <span className="text-[9px] font-black text-amber-600">{listing.seller.rating}</span>
                </div>
              </div>
            </div>
          </div>
          
          {onCheckout ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onCheckout(); }}
              className="px-4 h-10 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 z-20"
            >
               Checkout Deal
            </button>
          ) : (
            <button className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm hover:shadow-orange-600/30">
               <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main FleaMarketPage ──────────────────────────────────────────────────────
export default function FleaMarketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { products: realProducts, fetchProducts } = React.useContext(ProductContext) || { products: [] };

  const params = new URLSearchParams(location.search);
  const initialCategory = params.get('category') || 'all';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [membershipGate, setMembershipGate] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [meetings, setMeetings] = useState([]);
  const [fetchingMeetings, setFetchingMeetings] = useState(false);
  const [offers, setOffers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null });

  const fetchUserOffers = async () => {
    if (!user) return;
    try {
      const res = await getCustomerOffers();
      if (res.success) {
        setOffers(res.offers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserMeetings = async () => {
    if (!user) return;
    setFetchingMeetings(true);
    try {
      const res = await getCustomerMeetings();
      if (res.success) {
        setMeetings(res.meetings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingMeetings(false);
    }
  };

  const executeCancelMeeting = async (meetingId) => {
    try {
      const res = await cancelMeeting(meetingId);
      if (res.success) {
        fetchUserMeetings();
        toast({ title: 'Success', description: 'Conference booking cancelled.' });
      } else {
        toast({ title: 'Error', description: res.error || "Failed to cancel conference booking.", variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: "Error cancelling conference.", variant: 'destructive' });
    }
  };

  const executeEndMeeting = async (meetingId) => {
    try {
      const res = await endMeeting(meetingId);
      if (res.success) {
        fetchUserMeetings();
        toast({ title: 'Success', description: 'Conference ended.' });
      } else {
        toast({ title: 'Error', description: res.error || "Failed to end conference.", variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: "Error ending conference.", variant: 'destructive' });
    }
  };

  const executeRejectDeal = async (offerId) => {
    try {
      const res = await cancelCustomerOffer(offerId);
      if (res.success) {
        toast({ title: 'Success', description: 'Deal rejected successfully.' });
        fetchUserOffers();
        fetchUserMeetings(); // To refresh the meeting notes if needed
      } else {
        toast({ title: 'Error', description: res.error || "Failed to reject deal.", variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: "Error rejecting deal.", variant: 'destructive' });
    }
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === 'cancel') executeCancelMeeting(confirmModal.id);
    if (confirmModal.type === 'end') executeEndMeeting(confirmModal.id);
    if (confirmModal.type === 'reject') executeRejectDeal(confirmModal.id);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  useEffect(() => {
    fetchUserMeetings();
    fetchUserOffers();
  }, [user]);

  useEffect(() => {
    if (typeof fetchProducts === 'function') {
      fetchProducts();
    }
  }, [fetchProducts]);

  const isMember = user?.membership && user.membership !== 'free';

  useEffect(() => {
    if (isMember && !user?.hasAgreedToFleaMarketTerms) {
      setShowTermsModal(true);
    } else {
      setShowTermsModal(false);
    }
  }, [isMember, user?.hasAgreedToFleaMarketTerms]);

  useEffect(() => {
    const cat = params.get('category') || 'all';
    setActiveCategory(cat);
  }, [location.search]);

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    navigate(`/flea-market?category=${slug}`, { replace: true });
  };

  // Combine Mock Listings with Real Database Products that match Flea Market criteria
  const combinedListings = React.useMemo(() => {
    const fleaCategories = CATEGORIES.map(c => c.slug).filter(c => c !== 'all');
    
    const dbFleaProducts = (realProducts || []).filter(p => {
      const cat = (p.category_name || '').toLowerCase();
      const tags = (p.tags || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return fleaCategories.some(fc => cat.includes(fc) || tags.includes(fc) || name.includes(fc)) || cat.includes('flea') || tags.includes('flea') || name.includes('flea');
    }).map(p => ({
      id: p.product_id, // Ensure real database UUID is used directly without fm_ prefix
      title: p.name,
      description: p.description || p.name,
      pricePerKg: p.price,
      minOrderKg: 10, // default minimum
      origin: 'India',
      category: fleaCategories.find(fc => (p.category_name || '').toLowerCase().includes(fc) || (p.tags || '').toLowerCase().includes(fc) || (p.name || '').toLowerCase().includes(fc)) || 'all',
      grade: p.brand || 'Standard Grade',
      image: p.thumbnail || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.images) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000',
      available: p.stock_quantity ? `${p.stock_quantity > 1000 ? p.stock_quantity / 1000 + ' Tonnes' : p.stock_quantity + ' kg'}` : 'In Stock',
      seller: {
        name: p.brand || 'GoMo Verified Seller',
        country: 'India',
        rating: p.rating || 4.5,
        verified: true,
      }
    }));

    // Deduplicate by ID
    const unique = [];
    const seen = new Set();
    for (const item of dbFleaProducts) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  }, [realProducts]);

  const filteredListings = combinedListings.filter(l => {
    const matchesCategory = activeCategory === 'all' || l.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || l.title.toLowerCase().includes(q) || l.origin.toLowerCase().includes(q) || l.seller.name.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-gray-900 via-amber-950 to-gray-900 pt-16 pb-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0px, #f59e0b 1px, transparent 0px, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 mb-5">
              <Globe size={12} className="text-amber-400" />
              <span className="text-amber-300 text-[9px] font-black uppercase tracking-[0.3em]">GoMo Import / Export Exchange</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Agricultural Commodity<br />
              <span className="text-amber-400">Marketplace</span>
            </h1>
            <p className="text-gray-400 text-[14px] max-w-xl mx-auto leading-relaxed">
              Connect directly with verified exporters and importers. Schedule video conferences, negotiate terms, and source agricultural commodities — all in one platform.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
              {[
                { icon: Shield, text: 'Verified Sellers' },
                { icon: Video, text: 'Video Conference Only' },
                { icon: Scale, text: 'Min 10 kg / Order' },
                { icon: Award, text: 'Quality Certified' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-gray-300 font-semibold">
                  <item.icon size={13} className="text-amber-400" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Search + Categories ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sticky top-0 z-30 shadow-sm">
        <div className="w-full max-w-[1920px] px-2 md:px-6 mx-auto flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by commodity, origin, seller..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[12px] font-semibold outline-none focus:border-amber-400 transition-colors bg-gray-50/50"
            />
          </div>
          {/* Categories scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat.slug} onClick={() => handleCategoryChange(cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat.slug
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-800 border border-transparent hover:border-amber-200'
                }`}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Info Banner (non-members) ── */}
      {!isMember && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="w-full max-w-[1920px] px-2 md:px-6 mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Crown size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-[12px] font-bold text-amber-800">
                You're browsing as a guest. <span className="font-black">Upgrade your membership</span> to schedule video conferences with sellers.
              </p>
            </div>
            <button onClick={() => navigate('/membership')}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap">
              Get Membership →
            </button>
          </div>
        </div>
      )}

      {/* ── Terms & Conditions Notice ── */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
        <div className="w-full max-w-[1920px] px-2 md:px-6 mx-auto flex items-center gap-2">
          <Info size={13} className="text-blue-500 flex-shrink-0" />
          <p className="text-[11px] text-blue-700">
            All flea market transactions are subject to our{' '}
            <Link to="/flea-market/terms" className="font-black underline hover:text-blue-900">
              Flea Market Terms & Conditions
            </Link>
            . No personal contact information may be shared during video conferences.
          </p>
        </div>
      </div>

      {/* ── Upcoming B2B Conferences (Modern & Professional) ── */}
      {user && meetings.filter(m => m.status === 'Scheduled').length > 0 && (
        <section className="w-full max-w-[1920px] px-4 md:px-10 mx-auto pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Video size={20} className="text-amber-500" />
                Scheduled Conferences
              </h3>
              <p className="text-sm text-gray-500 mt-1">Manage your upcoming B2B negotiations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.filter(m => m.status === 'Scheduled').map(m => {
              const now = new Date();
              const meetingTime = new Date(m.scheduled_at);
              const diffMinutes = (now - meetingTime) / (1000 * 60);
              const canJoin = diffMinutes >= 0 && diffMinutes <= 40;
              
              return (
                <div 
                  key={m.meeting_id} 
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Date and Status */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Calendar size={14} className={canJoin ? "text-amber-500" : "text-gray-400"} />
                        <span>
                          {new Date(m.scheduled_at).toLocaleString("en-IN", { 
                            weekday: 'short', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {canJoin ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Live Now
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Product & Seller Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                        <img 
                          src={m.product_thumbnail || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.product_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <Crown size={12} className="text-amber-500" /> {m.seller_store_name || m.seller_name}
                        </p>
                      </div>
                    </div>

                    {/* Purpose */}
                    {m.purpose && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          <span className="font-semibold text-gray-700 mr-1">Purpose:</span>
                          {m.purpose}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                    <button 
                      onClick={(e) => {
                        if (!canJoin) {
                          e.preventDefault();
                          toast({ title: 'Access Restricted', description: 'You can only join the video conference during the assigned time (up to 40 minutes after scheduled time).', variant: 'destructive' });
                        } else {
                          navigate(`/flea-market/conference/${m.meeting_id}`);
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        canJoin 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Video size={16} /> {canJoin ? 'Join Conference' : 'Wait for Host'}
                    </button>
                    
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'end', id: m.meeting_id })}
                      className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                      title="End Meeting">
                      <StopCircle size={18} />
                    </button>
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'cancel', id: m.meeting_id })}
                      className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      title="Cancel Meeting">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Deals Ready for Checkout ── */}
      {user && offers.filter(o => o.status === 'Accepted').length > 0 && (
        <section className="w-full max-w-[1920px] px-4 md:px-10 mx-auto pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-500" />
                Completed Deals (Ready to Checkout)
              </h3>
              <p className="text-sm text-gray-500 mt-1">Review your finalized B2B deals from video conferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.filter(o => o.status === 'Accepted').map(offer => (
              <div 
                key={offer.offer_id} 
                className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[100%] z-0"></div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                      <CheckCircle size={12} />
                      Deal Recorded
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(offer.updated_at || offer.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                      <img 
                        src={offer.product_thumbnail || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{offer.product_name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                        {offer.agreed_quantity || 0} kg @ ₹{parseFloat(offer.offered_price || 0).toFixed(2)}/kg
                      </p>
                    </div>
                  </div>

                  {offer.contract_terms && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mt-2">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Contract Terms:</p>
                      <p className="text-xs text-gray-700 line-clamp-2">{offer.contract_terms}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 relative z-10">
                  <button 
                    onClick={() => navigate(`/checkout?offerToken=${offer.offer_token}`)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmModal({ isOpen: true, type: 'reject', id: offer.offer_id })}
                    className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                    title="Reject & Cancel Deal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Listings Grid ── */}
      <section className="w-full max-w-[1920px] px-4 md:px-10 mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {activeCategory === 'all' ? 'All Commodities' : CATEGORIES.find(c => c.slug === activeCategory)?.label}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} available</p>
          </div>
          <Link to="/flea-market/terms"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-900 transition-colors px-3 py-1.5 border border-amber-200 rounded-full bg-amber-50 hover:bg-amber-100">
            <Shield size={11} /> Terms & Conditions
          </Link>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing, idx) => (
              <motion.div key={listing.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                {(() => {
                  const acceptedOffer = offers.find(o => o.product_id === listing.id && o.status === 'Accepted');
                  return (
                    <ListingCard
                      listing={listing}
                      isMember={isMember}
                      onSchedule={setScheduleModal}
                      onGate={() => setMembershipGate(true)}
                      onCheckout={acceptedOffer ? () => navigate(`/checkout?offerToken=${acceptedOffer.offer_token}`) : null}
                    />
                  );
                })()}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🌾</div>
            <p className="text-[14px] font-black text-gray-400 uppercase tracking-widest">No listings found</p>
            <p className="text-[12px] text-gray-300 mt-1">Try a different category or search term</p>
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">How It Works</p>
          <h2 className="text-3xl font-black text-white tracking-tight">The GoMo Exchange Process</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: Crown, title: 'Get Membership', desc: 'Choose a Silver, Gold, or Platinum plan to access the import/export exchange.' },
            { step: '02', icon: Search, title: 'Browse Listings', desc: 'Find verified agricultural commodity listings from across India.' },
            { step: '03', icon: Calendar, title: 'Request Conference', desc: 'Submit a request to meet the seller. Our admin team will schedule the video call.' },
            { step: '04', icon: Video, title: 'Negotiate & Confirm', desc: 'Connect via GoMo\'s secure video platform. Finalize terms. All payments through GoMo.' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <item.icon size={22} className="text-amber-400" />
              </div>
              <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-1">Step {item.step}</p>
              <h3 className="text-white font-black text-[14px] mb-2">{item.title}</h3>
              <p className="text-gray-400 text-[11px] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showTermsModal && (
          <FleaMarketTermsModal 
            onClose={() => { setShowTermsModal(false); navigate('/'); }} 
            onSuccess={() => setShowTermsModal(false)} 
          />
        )}
        {membershipGate && <MembershipGateModal onClose={() => setMembershipGate(false)} />}
        {scheduleModal && (
          <ScheduleModal
            product={scheduleModal}
            onClose={() => setScheduleModal(null)}
            onSuccess={() => { setScheduleModal(null); }}
          />
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'cancel' ? 'Cancel Conference' : 
          confirmModal.type === 'end' ? 'End Conference' : 'Reject Deal'
        }
        message={
          confirmModal.type === 'cancel' ? 'Are you sure you want to cancel this scheduled video conference?' : 
          confirmModal.type === 'end' ? 'Are you sure you want to end this video conference?' : 'Are you sure you want to reject this deal? The reserved stock will be released and the deal will be cancelled.'
        }
        isDestructive={true}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

