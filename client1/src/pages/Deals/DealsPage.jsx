import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Tag, Clock, Scissors, AlertCircle, Sparkles } from 'lucide-react';
import { getActiveCoupons } from '../../services/couponService';

const DealsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      const res = await getActiveCoupons();
      if (res.success && res.data) {
        setCoupons(res.data.map(c => ({
          ...c,
          _id: c.coupon_id,
          discountType: c.type,
          discountValue: c.type === 'percentage' ? c.discount_percent : c.discount_amount,
          expiryDate: c.valid_until,
          minPurchaseAmount: c.min_order_value,
          isClaimed: false
        })));
      }
      setLoading(false);
    };
    fetchCoupons();
  }, []);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClaim = (id) => {
    setCoupons(coupons.map(c => c._id === id ? { ...c, isClaimed: true } : c));
  };

  const filteredCoupons = filter === 'all' 
    ? coupons 
    : coupons.filter(c => {
        return (c.category || 'all') === filter;
      });

  const availableCategories = ['all', ...new Set(coupons.map(c => c.category).filter(c => c && c !== 'all'))];

  const formatCategory = (cat) => {
    if (cat === 'all') return 'All';
    return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-16 pb-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Compact Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 mt-4 border-b border-orange-100/50 pb-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-black text-[9px] uppercase tracking-[0.2em] mb-3"
            >
              <Sparkles size={12} className="text-orange-500" /> Exclusive GMD Drops
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-black text-neutral-900 tracking-tight"
            >
              Active Deals & Coupons
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-neutral-500 max-w-sm md:text-right font-medium leading-relaxed"
          >
            Official promo codes and limited-time coupons straight from our team. Claim them instantly.
          </motion.p>
        </div>

        {/* Filter Section */}
        {availableCategories.length > 1 && (
          <div className="flex justify-start mb-8 overflow-x-auto pb-4 no-scrollbar">
            <div className="flex gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap border ${
                    filter === cat 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {formatCategory(cat)}
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
              <AnimatePresence mode="popLayout">
                {filteredCoupons.map((coupon, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 120, damping: 20 }}
                    key={coupon._id || coupon.code}
                    className="group bg-white rounded-2xl shadow-sm border border-neutral-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Top Content */}
                    <div className="p-6 flex flex-col flex-grow relative overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-[0.03] pointer-events-none">
                        <Scissors size={120} className="transform rotate-45" />
                      </div>

                      {/* Header Badges */}
                      <div className="flex items-center flex-wrap gap-2 mb-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">
                          <Tag size={12} />
                          {coupon.category && coupon.category !== 'all' ? formatCategory(coupon.category) : 'All Categories'}
                        </span>
                        {coupon.minPurchaseAmount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Min Spend ₹{coupon.minPurchaseAmount}
                          </span>
                        )}
                      </div>

                      {/* Discount Value */}
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-4xl font-black text-orange-500 tracking-tight">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </span>
                        <span className="text-lg font-bold text-neutral-400">OFF</span>
                      </div>

                      {/* Description */}
                      <h4 className="text-[15px] font-semibold text-neutral-700 mb-6 leading-relaxed">
                        {coupon.description || `Special discount on your upcoming order.`}
                      </h4>

                      {/* Validity */}
                      <div className="mt-auto flex items-center gap-2 text-xs font-medium text-neutral-500">
                        <Clock size={14} className={new Date(coupon.expiryDate) < new Date() && coupon.expiryDate ? 'text-rose-500' : 'text-emerald-500'} />
                        {coupon.expiryDate ? (
                          <span>Valid till {new Date(coupon.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        ) : (
                          <span>No expiration date</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="p-4 border-t border-dashed border-neutral-200 bg-neutral-50/50 rounded-b-2xl flex items-center gap-3">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
                          Code
                        </div>
                        <input 
                          type="text" 
                          readOnly 
                          value={coupon.code} 
                          className="w-full bg-white border border-neutral-200 text-neutral-900 text-sm font-black tracking-widest py-3 pl-14 pr-12 rounded-xl focus:outline-none focus:border-orange-300"
                        />
                        <button
                          onClick={() => handleCopyCode(coupon.code, coupon._id)}
                          className="absolute inset-y-0 right-1 my-1 px-3 flex items-center justify-center bg-neutral-50 border border-neutral-200 hover:border-orange-200 hover:text-orange-600 rounded-lg transition-colors text-neutral-500 cursor-pointer active:scale-95"
                          title="Copy Code"
                        >
                          {copiedCode === coupon._id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredCoupons.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-32"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-xl text-neutral-400 mb-6 border border-neutral-100">
                  <AlertCircle size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-neutral-900 mb-3 tracking-tight">No deals found</h3>
                <p className="text-neutral-500 font-medium">There are no active coupons matching your filter at the moment.</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
