import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Crown, Award, User, Check, X, ChevronDown,
  ArrowRight, Zap, Truck, Tag, MessageSquare, ShoppingBag,
  Star, Lock, AlertTriangle, CheckCircle2, Loader2, Info,
  ArrowUpRight, Calendar, RefreshCw, Video
} from 'lucide-react';
import {
  loadRazorpay,
  createMembershipRazorpayOrder,
  confirmMembershipSubscription,
  scheduleMembershipDowngrade,
  cancelMembership,
  getEndOfMonth,
} from '../../services/membershipService';
import FleaMarketTermsModal from '../../components/common/FleaMarketTermsModal';

// ─── Tier Hierarchy ───────────────────────────────────────────────────────────
const TIER_ORDER = ['free', 'silver', 'gold', 'platinum'];
const getTierRank = (id) => TIER_ORDER.indexOf(id);

// ─── Tier Definitions (NO decorative emojis — professional icons) ─────────────
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    Icon: User,
    price: 0,
    yearlyPrice: 0,
    badge: null,
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-200',
    accentText: 'text-slate-500',
    accentRing: 'ring-slate-300',
    btnClass: 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300',
    activeBtnClass: 'bg-slate-100 text-slate-500 border border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    discountPct: 0,
    features: [
      { icon: ShoppingBag,   text: 'Browse agricultural commodities',        included: true  },
      { icon: Tag,           text: 'View live market prices & grades',       included: true  },
      { icon: Shield,        text: 'Access to verified sellers',             included: true  },
      { icon: Video,         text: 'Schedule video conferences',             included: false },
    ],
    fleaMarket: 'Browse listings only',
    videoConference: 'Not available',
  },
  {
    id: 'silver',
    name: 'Silver',
    Icon: Shield,
    price: 299,
    yearlyPrice: 2999,
    badge: null,
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-300',
    accentText: 'text-slate-600',
    accentRing: 'ring-slate-400',
    btnClass: 'bg-slate-700 text-white hover:bg-slate-800 border border-slate-700',
    activeBtnClass: 'bg-slate-100 text-slate-600 border border-slate-300',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    discountPct: 0,
    features: [
      { icon: ShoppingBag,   text: 'Browse agricultural commodities',        included: true  },
      { icon: Tag,           text: 'View live market prices & grades',       included: true  },
      { icon: Shield,        text: 'Access to verified sellers',             included: true  },
      { icon: Video,         text: 'Schedule up to 3 video conferences/mo',  included: true  },
    ],
    fleaMarket: 'Full browsing + 3 negotiations',
    videoConference: '3 sessions per month',
  },
  {
    id: 'gold',
    name: 'Gold',
    Icon: Crown,
    price: 599,
    yearlyPrice: 5999,
    badge: 'Most Popular',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-300',
    accentText: 'text-amber-700',
    accentRing: 'ring-amber-400',
    btnClass: 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500',
    activeBtnClass: 'bg-amber-50 text-amber-700 border border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    discountPct: 0,
    features: [
      { icon: ShoppingBag,   text: 'Browse agricultural commodities',        included: true  },
      { icon: Tag,           text: 'View live market prices & grades',       included: true  },
      { icon: Shield,        text: 'Access to verified sellers',             included: true  },
      { icon: Video,         text: 'Unlimited video conferences',            included: true  },
    ],
    fleaMarket: 'Unlimited negotiations',
    videoConference: 'Unlimited + Priority scheduling',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    Icon: Award,
    price: 999,
    yearlyPrice: 9999,
    badge: 'Premium',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-300',
    accentText: 'text-violet-700',
    accentRing: 'ring-violet-400',
    btnClass: 'bg-violet-700 text-white hover:bg-violet-800 border border-violet-700',
    activeBtnClass: 'bg-violet-50 text-violet-700 border border-violet-300',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    discountPct: 0,
    features: [
      { icon: ShoppingBag,   text: 'Browse agricultural commodities',        included: true  },
      { icon: Tag,           text: 'View live market prices & grades',       included: true  },
      { icon: Shield,        text: 'Access to verified sellers',             included: true  },
      { icon: Video,         text: 'Unlimited video conferences',            included: true  },
    ],
    fleaMarket: 'Premium access + featured buyer badge',
    videoConference: 'Unlimited + Dedicated support',
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is payment required to change plans?', a: 'Yes. Upgrading requires immediate payment via Razorpay. Downgrades are scheduled — your current plan stays active until the end of your billing cycle, so you are never charged twice.' },
  { q: 'What happens when I downgrade?', a: 'When you downgrade, your current benefits remain active until your billing period ends. After that, the new lower tier activates automatically with no further charge.' },
  { q: 'What is the GoMo Import/Export Exchange?', a: 'The exchange is our B2B marketplace for agricultural commodities (like Dal, Rice, Wheat). It connects buyers directly with verified sellers via secure video conferences for bulk orders (minimum 10kg).' },
  { q: 'Why do I need a membership?', a: 'While anyone can browse the commodity listings, a Silver, Gold, or Platinum membership is required to schedule video conferences and negotiate terms with sellers.' },
  { q: 'Can I chat or call sellers directly?', a: 'No. To ensure security and compliance, all communication between buyers and sellers must happen through scheduled video conferences on our platform. Direct messaging and audio calls are disabled.' },
  { q: 'Are prices shown in my currency?', a: 'Yes. All prices are converted to your selected currency using live exchange rates via our currency engine.' },
];

// ─── Plan Change Decision Logic ───────────────────────────────────────────────
const getPlanAction = (currentId, targetId) => {
  const curr = getTierRank(currentId);
  const tgt  = getTierRank(targetId);
  if (tgt > curr) return 'upgrade';
  if (tgt < curr) return 'downgrade';
  return 'same';
};

// ─── FaqItem ──────────────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors">
        <span className="text-[12px] font-semibold text-gray-800">{q}</span>
        <ChevronDown size={15} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="px-6 pb-5 text-[12px] text-gray-600 leading-relaxed bg-gray-50/60">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PaymentModal = ({ tier, billing, action, currentTierId, onClose, onSuccess, formatPrice }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const amountINR = billing === 'yearly' ? tier.yearlyPrice : tier.price;
  const endOfMonth = getEndOfMonth();

  const handlePay = async () => {
    if (action === 'downgrade') {
      setProcessing(true);
      try {
        const res = await scheduleMembershipDowngrade({ targetTier: tier.id });
        if (res.success) onSuccess({ type: 'downgrade', tier, effectiveDate: res.effective_date || endOfMonth });
      } catch (e) {
        setError('Could not schedule downgrade. Please try again.');
      } finally { setProcessing(false); }
      return;
    }

    if (action === 'cancel') {
      setProcessing(true);
      try {
        const res = await cancelMembership();
        if (res.success) onSuccess({ type: 'cancel', effectiveDate: res.effective_date || endOfMonth });
      } catch (e) {
        setError('Could not cancel. Please try again.');
      } finally { setProcessing(false); }
      return;
    }

    // Upgrade — payment required
    setProcessing(true);
    setError('');
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) { setError('Payment gateway failed to load. Check your connection.'); setProcessing(false); return; }

      const orderRes = await createMembershipRazorpayOrder(amountINR);
      if (!orderRes.success && !orderRes.order) { setError(orderRes.message || 'Failed to create payment order.'); setProcessing(false); return; }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: amountINR * 100,
        currency: 'INR',
        name: 'GoMo Deals Membership',
        description: `${tier.name} Plan — ${billing === 'yearly' ? 'Annual' : 'Monthly'}`,
        ...(orderRes.isMock ? {} : { order_id: orderRes.order?.id }),
        handler: async (response) => {
          try {
            const confirmRes = await confirmMembershipSubscription({
              tier: tier.id,
              billing_cycle: billing,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpay_order_id: response.razorpay_order_id || orderRes.order?.id || 'mock',
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              amount: amountINR,
            });
            onSuccess({ type: 'upgrade', tier });
          } catch (e) {
            setError('Payment received but activation failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
        prefill: {},
        theme: { color: '#1e293b' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const TierIcon = tier.Icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${tier.iconBg} flex items-center justify-center`}>
              <TierIcon size={18} className={tier.iconColor} />
            </div>
            <div>
              <p className="text-white text-[13px] font-bold">
                {action === 'upgrade' ? `Upgrade to ${tier.name}` :
                 action === 'downgrade' ? `Switch to ${tier.name}` : `Cancel Membership`}
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                {action === 'upgrade' ? 'Payment required' : action === 'downgrade' ? 'Scheduled change' : 'Revert to free'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Info box */}
          {action === 'upgrade' && (
            <div className={`rounded-xl border p-4 mb-5 ${tier.accentBg} ${tier.accentBorder}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${tier.accentText}`}>{billing === 'yearly' ? 'Annual Plan' : 'Monthly Plan'}</span>
                {billing === 'yearly' && (
                  <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Save {Math.round(100 - (tier.yearlyPrice / (tier.price * 12)) * 100)}%
                  </span>
                )}
              </div>
              <p className={`text-3xl font-black ${tier.accentText}`}>{formatPrice(amountINR)}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">per {billing === 'monthly' ? 'month' : 'year'} · Effective immediately</p>
            </div>
          )}

          {action === 'downgrade' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-amber-800">Scheduled downgrade</p>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    Your current plan stays active until <strong>{endOfMonth}</strong>. After that, your plan switches to <strong>{tier.name}</strong> automatically with no further charges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {action === 'cancel' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-red-800">Cancel membership</p>
                  <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                    Your paid benefits continue until <strong>{endOfMonth}</strong>. After that, you'll be on the Free plan with no further charges.
                    <br/><br/>
                    <strong>Please note:</strong> Refunds are not allowed for early cancellations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What you'll get */}
          {action === 'upgrade' && (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">What you unlock</p>
              <div className="space-y-1.5">
                {tier.features.filter(f => f.included).slice(0, 5).map((f, i) => {
                  const FIcon = f.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 text-[11px] text-gray-700 font-medium">
                      <Check size={12} className={`${tier.accentText} flex-shrink-0`} />
                      {f.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <AlertTriangle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 transition-colors">
              Go back
            </button>
            <button onClick={handlePay} disabled={processing}
              className={`flex-[2] py-3 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                action === 'cancel' ? 'bg-red-500 hover:bg-red-600' :
                action === 'downgrade' ? 'bg-amber-500 hover:bg-amber-600' :
                `${tier.btnClass.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('hover:')).join(' ')}`
              } disabled:opacity-60 disabled:cursor-not-allowed`}>
              {processing ? <Loader2 size={14} className="animate-spin" /> : null}
              {processing ? 'Processing…' :
               action === 'upgrade' ? `Pay ${formatPrice(amountINR)} →` :
               action === 'downgrade' ? 'Confirm Downgrade' : 'Confirm Cancellation'}
            </button>
          </div>

          {action === 'upgrade' && (
            <p className="text-center text-[9px] text-gray-400 mt-3">
              Secured by Razorpay · Cancel anytime before renewal
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main MembershipPage ──────────────────────────────────────────────────────
const MembershipPage = () => {
  const { user, updateUser } = useAuth();
  const { formatPrice } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const category = searchParams.get('category');

  const [billing, setBilling] = useState('monthly');
  const [actionModal, setActionModal] = useState(null); // { tier, action }
  const [successBanner, setSuccessBanner] = useState(null); // { type, tier?, effectiveDate? }
  const [showTerms, setShowTerms] = useState(false);

  const currentTierId = user?.membership || 'free';
  const currentTier = TIERS.find(t => t.id === currentTierId) || TIERS[0];

  const handleTierClick = (tier) => {
    if (!user) { navigate('/login'); return; }
    const action = getPlanAction(currentTierId, tier.id);
    if (action === 'same') return;
    setActionModal({ tier, action });
  };

  const handleCancelClick = () => {
    if (currentTierId === 'free') return;
    setActionModal({ tier: TIERS[0], action: 'cancel' });
  };

  const handlePaymentSuccess = (result) => {
    setActionModal(null);
    if (result.type === 'upgrade') {
      const updated = { ...user, membership: result.tier.id };
      updateUser(updated);
      setSuccessBanner({ type: 'upgrade', tier: result.tier });
      // Always navigate to flea market after successful payment
      if (!updated.hasAgreedToFleaMarketTerms) {
          setTimeout(() => setShowTerms(true), 1500);
      } else {
          setTimeout(() => navigate('/flea-market' + (category ? `?category=${category}` : '')), 1500);
      }
    } else if (result.type === 'downgrade') {
      setSuccessBanner({ type: 'downgrade', tier: result.tier, effectiveDate: result.effectiveDate });
    } else if (result.type === 'cancel') {
      setSuccessBanner({ type: 'cancel', effectiveDate: result.effectiveDate });
    }
  };

  const handleTermsSuccess = () => {
    setShowTerms(false);
    navigate('/flea-market' + (category ? `?category=${category}` : ''));
  };

  const CurrentTierIcon = currentTier.Icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="bg-gray-900 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400 mb-3">GoMo Import/Export Exchange</p>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Choose Your Membership
            </h1>
            <p className="text-gray-400 text-[14px] max-w-lg mx-auto leading-relaxed">
              Unlock access to verified exporters, schedule video conferences, and negotiate bulk commodity trades securely on our platform.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-8 inline-flex items-center bg-gray-800 border border-gray-700 rounded-full p-1">
            <button onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${billing === 'monthly' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
              Monthly
            </button>
            <button onClick={() => setBilling('yearly')}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${billing === 'yearly' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
              Annual
              <span className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">SAVE 16%</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── Current Plan Status ── */}
      {user && (
        <div className="max-w-5xl mx-auto px-4 -mt-5">
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-3 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${currentTier.iconBg} flex items-center justify-center`}>
              <CurrentTierIcon size={15} className={currentTier.iconColor} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Current Plan</p>
              <p className={`text-[13px] font-black ${currentTier.accentText}`}>{currentTier.name}</p>
            </div>
            {currentTierId !== 'free' && (
              <>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                  {currentTier.videoConference}
                </p>
                <button onClick={handleCancelClick}
                  className="ml-auto text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                  <X size={11} /> Cancel membership
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Success / Info Banner ── */}
      <AnimatePresence>
        {successBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-4 mt-3">
            <div className={`rounded-xl px-5 py-3.5 border flex items-center gap-3 ${
              successBanner.type === 'upgrade' ? 'bg-green-50 border-green-200 text-green-800' :
              successBanner.type === 'cancel' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {successBanner.type === 'upgrade'
                ? <CheckCircle2 size={15} className="flex-shrink-0" />
                : <Info size={15} className="flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-[11px] font-bold">
                  {successBanner.type === 'upgrade'
                    ? `You are now on the ${successBanner.tier?.name} plan. Benefits are active immediately.`
                    : successBanner.type === 'downgrade'
                    ? `Downgrade scheduled. Your current plan remains active until ${successBanner.effectiveDate}.`
                    : `Membership cancelled. Benefits continue until ${successBanner.effectiveDate}.`}
                </p>
                {successBanner.type === 'upgrade' && from === 'flea-market' && (
                  <p className="text-[10px] text-green-700 mt-1 font-semibold animate-pulse">
                    Redirecting you back to the Flea Market...
                  </p>
                )}
              </div>
              <button onClick={() => setSuccessBanner(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={13} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tier Cards ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((tier, idx) => {
            const TierIcon = tier.Icon;
            const price = billing === 'yearly' ? tier.yearlyPrice : tier.price;
            const isActive = currentTierId === tier.id;
            const action = getPlanAction(currentTierId, tier.id);

            return (
              <motion.div key={tier.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
                className={`relative bg-white rounded-2xl border-2 flex flex-col transition-all duration-300 hover:shadow-lg ${
                  isActive ? `${tier.accentBorder} ring-2 ${tier.accentRing} ring-offset-1` : 'border-gray-200 hover:-translate-y-0.5'
                }`}>

                {/* Badge */}
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${
                    tier.id === 'gold' ? 'bg-amber-500' : 'bg-violet-600'
                  }`}>{tier.badge}</div>
                )}
                {isActive && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Check size={8} /> Active
                  </div>
                )}

                {/* Header */}
                <div className={`rounded-t-[14px] px-5 pt-7 pb-5 border-b ${tier.accentBg} ${tier.accentBorder}`}>
                  <div className={`w-10 h-10 rounded-xl ${tier.iconBg} flex items-center justify-center mb-3`}>
                    <TierIcon size={20} className={tier.iconColor} />
                  </div>
                  <h2 className={`text-[15px] font-black uppercase tracking-wider ${tier.accentText}`}>{tier.name}</h2>
                  <div className="mt-2">
                    {price === 0 ? (
                      <p className="text-2xl font-black text-gray-900">Free</p>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-gray-900">{formatPrice(price)}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">/{billing === 'monthly' ? 'month' : 'year'}</p>
                        {billing === 'yearly' && tier.price > 0 && (
                          <p className="text-[9px] text-green-600 font-bold mt-0.5">
                            Save {formatPrice(tier.price * 12 - tier.yearlyPrice)} vs monthly
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {tier.discountPct > 0 && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border ${tier.accentBorder} ${tier.accentText}`}>
                      <Tag size={8} />{tier.discountPct}% off every order
                    </div>
                  )}
                </div>

                {/* Feature list */}
                <div className="flex-1 px-5 py-4 space-y-2">
                  {tier.features.map((feat, fi) => {
                    const FIcon = feat.icon;
                    return (
                      <div key={fi} className="flex items-start gap-2.5">
                        {feat.included
                          ? <Check size={12} className={`${tier.accentText} flex-shrink-0 mt-0.5`} />
                          : <X size={12} className="text-gray-300 flex-shrink-0 mt-0.5" />}
                        <span className={`text-[10px] font-medium leading-relaxed ${feat.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feat.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Flea Market + Seller Chat callouts */}
                <div className="px-5 space-y-1.5 pb-3">
                  <div className={`rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${tier.accentBg} ${tier.accentText} border ${tier.accentBorder}`}>
                    <ShoppingBag size={9} className="flex-shrink-0" /> {tier.fleaMarket}
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                    tier.videoConference === 'Not available' ? 'bg-gray-50 text-gray-400 border-gray-100' : `${tier.accentBg} ${tier.accentText} border ${tier.accentBorder}`
                  } border`}>
                    <Video size={9} className="flex-shrink-0" /> {tier.videoConference}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button disabled={isActive} onClick={() => handleTierClick(tier)}
                    className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      isActive ? `${tier.activeBtnClass} cursor-default` :
                      action === 'upgrade' ? `${tier.btnClass} shadow-sm hover:shadow-md` :
                      action === 'downgrade' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200' :
                      'bg-gray-100 text-gray-500 border border-gray-200 cursor-default'
                    }`}>
                    {isActive ? <><Check size={12} /> Current Plan</> :
                     action === 'upgrade' ? <>Upgrade <ArrowRight size={12} /></> :
                     'Switch to this plan'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Compare plans</h2>
        <p className="text-[12px] text-gray-500 mb-6">Every feature, side by side.</p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full bg-white text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400 w-2/5">Feature</th>
                {TIERS.map(t => {
                  const TIcon = t.Icon;
                  return (
                    <th key={t.id} className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <TIcon size={14} className={t.iconColor} />
                        <span className={`text-[10px] font-black uppercase tracking-wider ${t.accentText}`}>{t.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Browse Commodities',       values: ['Yes',      'Yes',        'Yes',           'Yes'] },
                { label: 'View Live Prices & Grades',values: ['Yes',      'Yes',        'Yes',           'Yes'] },
                { label: 'Verify Seller Details',    values: ['Yes',      'Yes',        'Yes',           'Yes'] },
                { label: 'Video Conference Limit',   values: ['None',     '3/month',    'Unlimited',     'Unlimited'] },
                { label: 'Scheduling Priority',      values: ['–',        'Standard',   'High Priority', 'Highest Priority'] },
                { label: 'Dedicated Support',        values: ['–',        '–',          '–',             'Account Manager'] },
                { label: 'Featured Buyer Badge',     values: ['–',        '–',          '–',             'Yes'] },
              ].map((row, ri) => (
                <tr key={ri} className={`border-b border-gray-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-5 py-3 text-[11px] font-semibold text-gray-700">{row.label}</td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className={`px-4 py-3 text-center text-[11px] font-bold ${v === '–' || v === 'None' ? 'text-gray-300' : TIERS[vi].accentText}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Frequently asked questions</h2>
        <p className="text-[12px] text-gray-500 mb-6">Everything you need to know before choosing a plan.</p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-gray-900 py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Start trading today</h2>
          <p className="text-gray-400 text-[13px] mb-8 leading-relaxed">
            Join thousands of smart buyers unlocking direct access to verified agricultural exporters with GoMo Membership.
          </p>
          <button onClick={() => handleTierClick(TIERS[2])}
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            <Crown size={15} /> Get Gold — {formatPrice(TIERS[2].price)}/mo
          </button>
        </div>
      </section>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {actionModal && (
          <PaymentModal
            tier={actionModal.tier}
            billing={billing}
            action={actionModal.action}
            currentTierId={currentTierId}
            onClose={() => setActionModal(null)}
            onSuccess={handlePaymentSuccess}
            formatPrice={formatPrice}
          />
        )}
      </AnimatePresence>

      {/* ── Terms Modal ── */}
      <AnimatePresence>
        {showTerms && (
          <FleaMarketTermsModal 
            onClose={() => { setShowTerms(false); navigate('/'); }}
            onSuccess={handleTermsSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MembershipPage;
