import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  Crown, Star, Gem, ShoppingBag, Truck, Tag, X, CheckCircle2,
  ChevronRight, Sparkles, ArrowRight, Zap
} from 'lucide-react';

// Storage key
const FLAG_KEY = 'gomo_show_membership_welcome';

// Tier highlight data for the welcome modal
const WELCOME_TIERS = [
  {
    id: 'free',
    name: 'Free',
    emoji: '🛍️',
    price: 0,
    gradient: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    headerGrad: 'from-orange-400 to-amber-400',
    textColor: 'text-orange-500',
    highlight: 'Basic access to all products',
    discountPct: 0,
  },
  {
    id: 'silver',
    name: 'Silver',
    emoji: '⭐',
    price: 299,
    gradient: 'from-slate-50 to-gray-50',
    border: 'border-slate-300',
    headerGrad: 'from-slate-500 to-gray-400',
    textColor: 'text-slate-600',
    highlight: '5% off every order + Free shipping > ₹499',
    discountPct: 5,
  },
  {
    id: 'gold',
    name: 'Gold',
    emoji: '👑',
    price: 599,
    gradient: 'from-amber-50 to-yellow-50',
    border: 'border-amber-300',
    headerGrad: 'from-amber-500 to-yellow-400',
    textColor: 'text-amber-700',
    highlight: '10% off + Always free shipping',
    discountPct: 10,
    recommended: true,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    emoji: '💎',
    price: 999,
    gradient: 'from-slate-100 to-gray-100',
    border: 'border-slate-400',
    headerGrad: 'from-slate-700 to-gray-500',
    textColor: 'text-slate-700',
    highlight: '15% off + Free express shipping + Exclusive deals',
    discountPct: 15,
  },
];

// Exported helper to trigger the modal after login/register
export const triggerMembershipWelcome = () => {
  try { localStorage.setItem(FLAG_KEY, '1'); } catch (_) {}
};

// The modal itself — reads the flag on mount, clears it on close
const MembershipWelcomeModal = () => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState('gold'); // default highlight
  const { user, updateUser } = useAuth();
  const { formatPrice } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Small delay so the page fully loads before the modal appears
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(FLAG_KEY) === '1') {
          setVisible(true);
        }
      } catch (_) {}
    }, 800);
    return () => clearTimeout(timer);
  }, [user, location.pathname]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  const handleClose = () => {
    localStorage.removeItem(FLAG_KEY);
    setVisible(false);
  };

  const handleContinueFree = () => {
    handleClose();
  };

  const handleApplyTier = (tierId) => {
    if (tierId === 'free') {
      handleClose();
      return;
    }
    handleClose();
    // Navigate to membership page for payment flow
    navigate('/membership');
  };

  if (!visible) return null;

  const selectedTier = WELCOME_TIERS.find(t => t.id === selected) || WELCOME_TIERS[2];

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.05 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-hide bg-white rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.25)] pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 hover:bg-orange-100 text-orange-400 hover:text-orange-700 transition-all border border-orange-100"
              >
                <X size={14} />
              </button>

              {/* ── Hero Header ── */}
              <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 px-6 py-6 text-center">
                {/* Decorative glow orbs */}
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
                  className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg backdrop-blur-sm"
                >
                  👑
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-1"
                >
                  Welcome to GoMo Deals!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-white/80 text-[11px] font-medium max-w-md mx-auto leading-relaxed"
                >
                  {user?.full_name || user?.name
                    ? `Hey ${(user.full_name || user.name).split(' ')[0]}! 🎉 `
                    : ''}
                  Choose your membership plan and unlock exclusive savings, free shipping, and premium benefits from day one.
                </motion.p>

                {/* Perks pills */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-wrap justify-center gap-2 mt-3"
                >
                  {[
                    { icon: <Tag size={8} />, text: 'Up to 15% Off' },
                    { icon: <Truck size={8} />, text: 'Free Shipping' },
                    { icon: <Zap size={8} />, text: 'Early Sale Access' },
                    { icon: <Sparkles size={8} />, text: 'Exclusive Deals' },
                  ].map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 rounded-full text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                      {p.icon} {p.text}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* ── Tier Cards Grid ── */}
              <div className="px-6 md:px-8 py-4">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-orange-400 text-center mb-3">
                  Select your plan
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {WELCOME_TIERS.map((tier, idx) => (
                    <motion.button
                      key={tier.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.07 }}
                      onClick={() => setSelected(tier.id)}
                      className={`relative rounded-2xl border-2 p-3 text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                        selected === tier.id
                          ? `${tier.border} ring-2 ring-offset-1 ring-orange-400 bg-gradient-to-br ${tier.gradient} shadow-sm`
                          : `border-orange-100 bg-white hover:bg-orange-50/30`
                      }`}
                    >
                      {tier.recommended && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                          Best Value
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.headerGrad} flex items-center justify-center text-base mb-2 shadow`}>
                        {tier.emoji}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${selected === tier.id ? tier.textColor : 'text-orange-900'}`}>
                        {tier.name}
                      </p>
                      {tier.price === 0 ? (
                        <p className={`text-base font-black ${selected === tier.id ? tier.textColor : 'text-orange-400'}`}>Free</p>
                      ) : (
                        <p className={`text-[12px] font-black ${selected === tier.id ? tier.textColor : 'text-orange-700'}`}>
                          {formatPrice(tier.price)}<span className="text-[8px] text-orange-400 font-bold">/mo</span>
                        </p>
                      )}
                      {tier.discountPct > 0 && (
                        <div className={`mt-1 text-[7px] font-black uppercase tracking-wider ${selected === tier.id ? tier.textColor : 'text-orange-400'}`}>
                          {tier.discountPct}% off all orders
                        </div>
                      )}
                      {selected === tier.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={12} className={tier.textColor} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* ── Selected Tier Benefits Detail ── */}
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`mt-3 rounded-xl border p-4 bg-gradient-to-br ${selectedTier.gradient} ${selectedTier.border}`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedTier.headerGrad} flex items-center justify-center text-lg shadow-md`}>
                      {selectedTier.emoji}
                    </div>
                    <div>
                      <p className={`text-[12px] font-black uppercase tracking-wider ${selectedTier.textColor}`}>{selectedTier.name} Plan</p>
                      <p className="text-[8px] text-orange-400 uppercase tracking-widest font-bold">{selectedTier.highlight}</p>
                    </div>
                    <div className="ml-auto text-right">
                      {selectedTier.price === 0 ? (
                        <p className={`text-xl font-black ${selectedTier.textColor}`}>Free</p>
                      ) : (
                        <>
                          <p className={`text-xl font-black ${selectedTier.textColor}`}>{formatPrice(selectedTier.price)}</p>
                          <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider">per month</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      selectedTier.discountPct > 0 ? `${selectedTier.discountPct}% discount on every order` : 'Access to all products',
                      selectedTier.id === 'free' ? 'Standard shipping (₹49 under ₹999)' :
                      selectedTier.id === 'silver' ? 'Free shipping on orders above ₹499' : 'Always free shipping',
                      selectedTier.id === 'platinum' || selectedTier.id === 'gold' ? 'Priority / Dedicated support' : 'Standard customer support',
                      selectedTier.id === 'platinum' ? '72-hour early sale access' :
                      selectedTier.id === 'gold' ? '48-hour early sale access' : 'Standard sale access',
                      selectedTier.id === 'platinum' ? 'Exclusive members-only deals' : 'Unlimited wishlist',
                      'Cancel anytime, no questions asked',
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-[9px] text-orange-900 font-bold">
                        <CheckCircle2 size={10} className={selectedTier.textColor} />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ── Action Buttons ── */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {selectedTier.id === 'free' ? (
                    <button
                      onClick={handleContinueFree}
                      className="flex-1 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 font-black uppercase tracking-widest text-[9px] hover:bg-orange-100 transition-colors"
                    >
                      Continue with Free Plan
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleContinueFree}
                        className="flex-1 py-3 rounded-xl bg-orange-50 border border-orange-100 text-orange-400 font-black uppercase tracking-widest text-[9px] hover:bg-orange-100 transition-colors"
                      >
                        Maybe Later
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApplyTier(selectedTier.id)}
                        className={`flex-[2] py-3 rounded-xl bg-gradient-to-r ${selectedTier.headerGrad} text-white font-black uppercase tracking-widest text-[9px] shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                      >
                        Get {selectedTier.name} — {formatPrice(selectedTier.price)}/mo
                        <ArrowRight size={12} />
                      </motion.button>
                    </>
                  )}
                </div>

                <p className="text-center text-[7px] text-orange-300 uppercase tracking-widest font-bold mt-2">
                  No commitment · Cancel anytime · Prices shown in your local currency
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MembershipWelcomeModal;
