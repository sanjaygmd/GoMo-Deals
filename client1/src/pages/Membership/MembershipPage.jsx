import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Crown, Award, User, Check, X, ChevronDown,
  ArrowRight, Zap, Truck, Tag, MessageSquare, ShoppingBag,
  Star, Lock, AlertTriangle, CheckCircle2, Loader2, Info,
  ArrowUpRight, Calendar, RefreshCw, Video, Gem, Hexagon
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
import gmdLogo from '../../assets/GMD_Logo.png';

// ─── Tier Hierarchy ───────────────────────────────────────────────────────────
const TIER_ORDER = ['free', 'silver', 'gold', 'platinum', 'diamond', 'titanium', 'black_elite'];
const getTierRank = (id) => TIER_ORDER.indexOf(id);

// ─── Modern Light Tier Definitions ──────────────────────────────────────────────
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    badge: null,
    accentColorHex: '#9ca3af', // gray-400
    logoGradient: 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)',
    cardClass: 'border-gray-200 bg-white hover:border-gray-300',
    headerClass: 'bg-gray-100',
    accentText: 'text-gray-700',
    btnClass: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
    activeBtnClass: 'bg-gray-50 text-gray-400 border border-gray-200',
    discountPct: 0,
    features: [
      { text: 'Apply for 0-5 products',                 included: true  },
      { text: 'View live market prices & grades',       included: true  },
      { text: 'Access to verified sellers',             included: true  },
      { text: 'Schedule video conferences',             included: false },
    ],
    fleaMarket: 'Browse listings only',
    videoConference: 'Not available',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 299,
    yearlyPrice: 2999,
    badge: null,
    accentColorHex: '#64748b', // slate-500
    logoGradient: 'linear-gradient(135deg, #94a3b8 0%, #475569 50%, #1e293b 100%)',
    cardClass: 'border-slate-200 bg-white hover:border-slate-300',
    headerClass: 'bg-slate-100',
    accentText: 'text-slate-700',
    btnClass: 'bg-slate-600 text-white hover:bg-slate-700 border border-slate-600',
    activeBtnClass: 'bg-slate-50 text-slate-400 border border-slate-200',
    discountPct: 0,
    features: [
      { text: 'Apply for 5-10 products',                included: true  },
      { text: 'View live market prices & grades',       included: true  },
      { text: 'Access to verified sellers',             included: true  },
      { text: 'Schedule up to 3 video conferences/mo',  included: true  },
    ],
    fleaMarket: 'Full browsing + 3 negotiations',
    videoConference: '3 sessions per month',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 599,
    yearlyPrice: 5999,
    badge: 'Popular',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    accentColorHex: '#d97706', // amber-600
    logoGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)',
    cardClass: 'border-amber-200 bg-white hover:border-amber-300',
    headerClass: 'bg-amber-100/50',
    accentText: 'text-amber-800',
    btnClass: 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500 shadow-sm font-bold',
    activeBtnClass: 'bg-amber-50 text-amber-400 border border-amber-200',
    discountPct: 0,
    features: [
      { text: 'Apply for 10-20 products',               included: true  },
      { text: 'View live market prices & grades',       included: true  },
      { text: 'Access to verified sellers',             included: true  },
      { text: 'Unlimited video conferences',            included: true  },
    ],
    fleaMarket: 'Unlimited negotiations',
    videoConference: 'Unlimited + Priority scheduling',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 999,
    yearlyPrice: 9999,
    badge: 'Premium',
    badgeClass: 'bg-violet-100 text-violet-700 border border-violet-200',
    accentColorHex: '#7c3aed', // violet-600
    logoGradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)',
    cardClass: 'border-violet-200 bg-white hover:border-violet-300',
    headerClass: 'bg-violet-100/50',
    accentText: 'text-violet-800',
    btnClass: 'bg-violet-600 text-white hover:bg-violet-700 border border-violet-600 shadow-sm',
    activeBtnClass: 'bg-violet-50 text-violet-400 border border-violet-200',
    discountPct: 0,
    features: [
      { text: 'Apply for 20-50 products',               included: true  },
      { text: 'View live market prices & grades',       included: true  },
      { text: 'Access to verified sellers',             included: true  },
      { text: 'Unlimited video conferences',            included: true  },
    ],
    fleaMarket: 'Premium access + featured badge',
    videoConference: 'Unlimited + Dedicated support',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: 1499,
    yearlyPrice: 14999,
    badge: null,
    accentColorHex: '#0284c7', // sky-600
    logoGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #075985 100%)',
    cardClass: 'border-sky-200 bg-white hover:border-sky-300',
    headerClass: 'bg-sky-100/50',
    accentText: 'text-sky-800',
    btnClass: 'bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 shadow-sm',
    activeBtnClass: 'bg-sky-50 text-sky-400 border border-sky-200',
    discountPct: 5,
    features: [
      { text: 'Apply for 50-100 products',              included: true  },
      { text: 'Advanced Trade Analytics',               included: true  },
      { text: '5% extra discount on logistics',         included: true  },
      { text: 'Unlimited video conferences',            included: true  },
    ],
    fleaMarket: 'Diamond status + Advanced analytics',
    videoConference: 'Unlimited + Account Manager',
  },
  {
    id: 'titanium',
    name: 'Titanium',
    price: 2499,
    yearlyPrice: 24999,
    badge: 'Pro',
    badgeClass: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
    accentColorHex: '#52525b', // zinc-600
    logoGradient: 'linear-gradient(135deg, #71717a 0%, #3f3f46 50%, #18181b 100%)',
    cardClass: 'border-zinc-200 bg-white hover:border-zinc-300',
    headerClass: 'bg-zinc-100',
    accentText: 'text-zinc-800',
    btnClass: 'bg-zinc-700 text-white hover:bg-zinc-800 border border-zinc-700 shadow-sm font-bold',
    activeBtnClass: 'bg-zinc-50 text-zinc-400 border border-zinc-200',
    discountPct: 10,
    features: [
      { text: 'Apply for 100-200 products',             included: true  },
      { text: 'API Access for procurement',             included: true  },
      { text: '10% discount on logistics',              included: true  },
      { text: 'Custom Escrow Services',                 included: true  },
    ],
    fleaMarket: 'Titanium status + API Integration',
    videoConference: 'Unlimited + 24/7 Priority Support',
  },
  {
    id: 'black_elite',
    name: 'Black Elite',
    price: 4999,
    yearlyPrice: 49999,
    badge: 'Exclusive',
    badgeClass: 'bg-gray-900 text-white border border-gray-700',
    accentColorHex: '#000000', // black
    logoGradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 30%, #a16207 70%, #fef08a 100%)',
    cardClass: 'border-gray-800 bg-white hover:border-gray-900 shadow-lg',
    headerClass: 'bg-gray-900 text-white',
    accentText: 'text-yellow-400',
    btnClass: 'bg-gray-900 text-white hover:bg-black border border-gray-900 shadow-md font-black',
    activeBtnClass: 'bg-gray-100 text-gray-400 border border-gray-200',
    discountPct: 15,
    features: [
      { text: 'Apply for 201-Unlimited products',       included: true  },
      { text: 'Personal Sourcing Agent',                included: true  },
      { text: '15% discount & priority shipping',       included: true  },
      { text: 'Private Whitelabeling features',         included: true  },
    ],
    fleaMarket: 'Unlimited Corporate Access',
    videoConference: 'Concierge setup & Private nodes',
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

const getPlanAction = (currentId, targetId) => {
  const curr = getTierRank(currentId);
  const tgt  = getTierRank(targetId);
  if (tgt > curr) return 'upgrade';
  if (tgt < curr) return 'downgrade';
  return 'same';
};

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-colors hover:bg-gray-50">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="text-[14px] font-bold text-gray-900">{q}</span>
        <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="px-6 pb-6 text-[14px] text-gray-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
        theme: { color: '#0f172a' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="bg-gray-50 px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div 
                className="w-10 h-10 drop-shadow-sm"
                style={{
                  background: tier.logoGradient,
                  WebkitMaskImage: `url(${gmdLogo})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
            />
            <div>
              <p className="text-gray-900 text-[16px] font-black tracking-tight">
                {action === 'upgrade' ? `Upgrade to ${tier.name}` :
                 action === 'downgrade' ? `Switch to ${tier.name}` : `Cancel Membership`}
              </p>
              <p className="text-gray-500 text-[11px] uppercase tracking-widest mt-0.5 font-bold">
                {action === 'upgrade' ? 'Payment required' : action === 'downgrade' ? 'Scheduled change' : 'Revert to free'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          {action === 'upgrade' && (
            <div className={`rounded-2xl border p-5 mb-6 ${tier.headerClass}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[12px] font-black uppercase tracking-widest ${tier.accentText}`}>{billing === 'yearly' ? 'Annual Plan' : 'Monthly Plan'}</span>
                {billing === 'yearly' && (
                  <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Save {Math.round(100 - (tier.yearlyPrice / (tier.price * 12)) * 100)}%
                  </span>
                )}
              </div>
              <p className={`text-4xl font-black ${tier.accentText}`}>{formatPrice(amountINR)}</p>
              <p className={`text-[12px] mt-1 ${tier.id === 'black_elite' ? 'text-gray-400' : 'text-gray-500'}`}>per {billing === 'monthly' ? 'month' : 'year'} · Effective immediately</p>
            </div>
          )}

          {action === 'downgrade' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-black text-amber-900 tracking-tight">Scheduled downgrade</p>
                  <p className="text-[13px] text-amber-800/80 mt-1.5 leading-relaxed">
                    Your current plan stays active until <strong className="text-amber-900">{endOfMonth}</strong>. After that, your plan switches to <strong className="text-amber-900">{tier.name}</strong> automatically with no further charges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {action === 'cancel' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-black text-red-900 tracking-tight">Cancel membership</p>
                  <p className="text-[13px] text-red-800/80 mt-1.5 leading-relaxed">
                    Your paid benefits continue until <strong className="text-red-900">{endOfMonth}</strong>. After that, you'll be on the Free plan with no further charges.
                    <br/><br/>
                    <strong className="text-red-600">Please note:</strong> Refunds are not allowed for early cancellations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {action === 'upgrade' && (
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">What you unlock</p>
              <div className="space-y-3">
                {tier.features.filter(f => f.included).slice(0, 5).map((f, i) => {
                  return (
                    <div key={i} className="flex items-center gap-3 text-[14px] text-gray-700 font-medium">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border`} style={{ borderColor: tier.accentColorHex, backgroundColor: `${tier.accentColorHex}15` }}>
                        <Check size={12} style={{ color: tier.accentColorHex }} />
                      </div>
                      {f.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 text-[13px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
              Go back
            </button>
            <button onClick={handlePay} disabled={processing}
              className={`flex-[2] py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                action === 'cancel' ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' :
                action === 'downgrade' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300' :
                tier.btnClass
              } disabled:opacity-50 disabled:cursor-not-allowed`}>
              {processing ? <Loader2 size={18} className="animate-spin" /> : null}
              {processing ? 'PROCESSING…' :
               action === 'upgrade' ? `PAY ${formatPrice(amountINR)}` :
               action === 'downgrade' ? 'CONFIRM DOWNGRADE' : 'CONFIRM CANCEL'}
            </button>
          </div>

          {action === 'upgrade' && (
            <p className="text-center text-[11px] text-gray-400 mt-4 font-bold tracking-wide">
              Secured by Razorpay · Cancel anytime before renewal
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MembershipPage = () => {
  const { user, updateUser } = useAuth();
  const { formatPrice } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');
  const category = searchParams.get('category');

  const [billing, setBilling] = useState('monthly');
  const [actionModal, setActionModal] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* ── Hero ── */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-[11px] font-black uppercase tracking-widest text-orange-700 mb-6">
              GoMo Import/Export Exchange
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Elevate Your Trading Power
            </h1>
            <p className="text-gray-600 text-[16px] md:text-[18px] max-w-2xl mx-auto leading-relaxed">
              Unlock exclusive access to verified global exporters, secure video conferencing, and bulk commodity negotiation tools built for serious businesses.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 inline-flex items-center bg-gray-200 border border-gray-300 rounded-full p-1.5 shadow-sm">
            <button onClick={() => setBilling('monthly')}
              className={`px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${billing === 'monthly' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Monthly
            </button>
            <button onClick={() => setBilling('yearly')}
              className={`px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${billing === 'yearly' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Annual
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${billing === 'yearly' ? 'bg-green-100 text-green-700' : 'bg-gray-300 text-gray-700'}`}>SAVE 16%</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── Current Plan Status ── */}
      {user && (
        <div className="max-w-[1400px] mx-auto px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4 shadow-sm">
            <div 
              className="w-10 h-10 drop-shadow-sm"
              style={{
                background: currentTier.logoGradient,
                WebkitMaskImage: `url(${gmdLogo})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-black">Current Membership</p>
              <p className="text-[16px] font-black uppercase tracking-wider mt-0.5 text-gray-900">{currentTier.name}</p>
            </div>
            {currentTierId !== 'free' && (
              <>
                <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2" />
                <div className="hidden sm:block">
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-black">Video Capability</p>
                  <p className="text-[14px] text-gray-800 font-bold mt-0.5">{currentTier.videoConference}</p>
                </div>
                <button onClick={handleCancelClick}
                  className="ml-auto px-5 py-2.5 rounded-xl border border-red-200 text-[12px] font-bold text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-2 transition-all">
                  <X size={16} /> Cancel Plan
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
            className="max-w-[1400px] mx-auto px-4 mb-8">
            <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4 shadow-sm ${
              successBanner.type === 'upgrade' ? 'bg-green-50 border-green-200 text-green-800' :
              successBanner.type === 'cancel' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {successBanner.type === 'upgrade'
                ? <CheckCircle2 size={20} className="flex-shrink-0" />
                : <Info size={20} className="flex-shrink-0" />}
              <div className="flex-1">
                <p className="text-[14px] font-bold">
                  {successBanner.type === 'upgrade'
                    ? `You are now on the ${successBanner.tier?.name} plan. Premium benefits are active.`
                    : successBanner.type === 'downgrade'
                    ? `Downgrade scheduled. Current plan remains active until ${successBanner.effectiveDate}.`
                    : `Membership cancelled. Benefits continue until ${successBanner.effectiveDate}.`}
                </p>
                {successBanner.type === 'upgrade' && from === 'flea-market' && (
                  <p className="text-[13px] text-green-700 mt-1 font-bold tracking-wide animate-pulse">
                    Redirecting you back to the Flea Market...
                  </p>
                )}
              </div>
              <button onClick={() => setSuccessBanner(null)} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tier Cards ── */}
      <section className="w-full max-w-[1400px] mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TIERS.map((tier, idx) => {
            const price = billing === 'yearly' ? tier.yearlyPrice : tier.price;
            const isActive = currentTierId === tier.id;
            const action = getPlanAction(currentTierId, tier.id);

            return (
              <motion.div key={tier.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                className={`relative rounded-[24px] border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isActive ? `${tier.cardClass.replace('border-', '')} border-2 shadow-lg` : `${tier.cardClass}`
                }`}
                style={{ borderColor: isActive ? tier.accentColorHex : undefined }}
              >

                {/* Badge */}
                {tier.badge && (
                  <div className={`absolute -top-3.5 left-6 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm z-10 ${tier.badgeClass}`}>
                    {tier.badge}
                  </div>
                )}
                
                {isActive && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-md bg-green-100 border border-green-200 text-green-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Check size={10} /> Active
                  </div>
                )}

                {/* Header */}
                <div className={`rounded-t-[23px] px-6 pt-8 pb-6 border-b flex-shrink-0 flex flex-col items-center text-center ${tier.headerClass}`}>
                  <div 
                      className="w-24 h-24 mb-5 drop-shadow-md"
                      style={{
                        background: tier.logoGradient,
                        WebkitMaskImage: `url(${gmdLogo})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                      }}
                  />
                  <h2 className={`text-[20px] font-black uppercase tracking-widest ${tier.accentText}`}>{tier.name}</h2>
                  <div className="mt-3 flex flex-col items-center">
                    {price === 0 ? (
                      <p className="text-4xl font-black text-gray-900">Free</p>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <p className={`text-4xl font-black tracking-tight ${tier.id === 'black_elite' ? 'text-white' : 'text-gray-900'}`}>{formatPrice(price)}</p>
                          <p className={`text-[13px] font-bold uppercase tracking-wider ${tier.id === 'black_elite' ? 'text-gray-400' : 'text-gray-500'}`}>/{billing === 'monthly' ? 'mo' : 'yr'}</p>
                        </div>
                        {billing === 'yearly' && tier.price > 0 && (
                          <p className="text-[11px] text-green-600 font-black mt-1.5 uppercase tracking-wide text-center">
                            Save {formatPrice(tier.price * 12 - tier.yearlyPrice)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {tier.discountPct > 0 && (
                    <div className="mt-4 inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
                      <Tag size={12} />{tier.discountPct}% Logistical Discount
                    </div>
                  )}
                </div>

                {/* Feature list */}
                <div className="flex-1 px-6 py-6 space-y-4">
                  {tier.features.map((feat, fi) => {
                    return (
                      <div key={fi} className="flex items-start gap-3">
                        {feat.included ? (
                           <div className="mt-0.5 rounded-full p-0.5 bg-gray-100 flex-shrink-0">
                             <Check size={14} style={{ color: tier.accentColorHex }} />
                           </div>
                        ) : (
                           <X size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-[14px] font-semibold leading-snug ${feat.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feat.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Callouts */}
                <div className="px-6 space-y-2 pb-6">
                  <div className={`rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex flex-col gap-1 border border-gray-100 bg-gray-50`}>
                    <span className="text-gray-500 text-[9px]">Exchange Access</span>
                    <span className={`flex items-center gap-2`} style={{ color: tier.accentColorHex }}><ShoppingBag size={12} /> {tier.fleaMarket}</span>
                  </div>
                  <div className={`rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex flex-col gap-1 border border-gray-100 ${
                    tier.videoConference === 'Not available' ? 'bg-gray-50 text-gray-400' : 'bg-gray-50'
                  }`}>
                    <span className="text-gray-500 text-[9px]">Video Rooms</span>
                    <span className={`flex items-center gap-2 ${tier.videoConference === 'Not available' ? 'text-gray-400' : ''}`} style={tier.videoConference !== 'Not available' ? { color: tier.accentColorHex } : {}}><Video size={12} /> {tier.videoConference}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 mt-auto">
                  <button disabled={isActive} onClick={() => handleTierClick(tier)}
                    className={`w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                      isActive ? `${tier.activeBtnClass} cursor-default` :
                      action === 'upgrade' ? `${tier.btnClass} hover:-translate-y-0.5` :
                      action === 'downgrade' ? 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 hover:text-gray-900' :
                      'bg-gray-50 text-gray-400 border border-transparent cursor-default'
                    }`}>
                    {isActive ? <><Check size={16} /> Current Plan</> :
                     action === 'upgrade' ? <>Upgrade <ArrowRight size={16} /></> :
                     'Switch Plan'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="max-w-[1400px] mx-auto px-4 pb-20 relative">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Compare premium features</h2>
          <p className="text-[16px] text-gray-600">Everything you need to scale your procurement operations.</p>
        </div>
        <div className="overflow-x-auto rounded-[24px] border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-5 text-[12px] font-black uppercase tracking-widest text-gray-500 min-w-[200px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Feature Overview</th>
                {TIERS.map(t => {
                  return (
                    <th key={t.id} className="px-5 py-5 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-3">
                        <div 
                            className="w-10 h-10 drop-shadow-sm"
                            style={{
                              background: t.logoGradient,
                              WebkitMaskImage: `url(${gmdLogo})`,
                              WebkitMaskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                            }}
                        />
                        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: t.accentColorHex }}>{t.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'Maximum Product Inquiries',values: ['0-5',      '5-10',       '10-20',         '20-50',         '50-100',        '100-200',      '201-Unlimited'] },
                { label: 'Live Market Pricing',      values: ['Yes',      'Yes',        'Yes',           'Yes',           'Yes',           'Yes',          'Yes'] },
                { label: 'Verified Seller Access',   values: ['Yes',      'Yes',        'Yes',           'Yes',           'Yes',           'Yes',          'Yes'] },
                { label: 'Video Conference Limit',   values: ['None',     '3/month',    'Unlimited',     'Unlimited',     'Unlimited',     'Unlimited',    'Unlimited'] },
                { label: 'Logistics Discount',       values: ['None',     'None',       'None',          'None',          '5%',            '10%',          '15%'] },
                { label: 'Support Level',            values: ['Community','Standard',   'Priority',      'Account Mgr',   'Account Mgr',   '24/7 Priority','Concierge'] },
                { label: 'API & Custom Integration', values: ['–',        '–',          '–',             '–',             '–',             'Included',     'Included'] },
                { label: 'Whitelabeling',            values: ['–',        '–',          '–',             '–',             '–',             '–',            'Included'] },
              ].map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5 text-[13px] font-bold text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100 transition-colors">{row.label}</td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className={`px-5 py-5 text-center text-[13px] font-black ${v === '–' || v === 'None' ? 'text-gray-400' : 'text-gray-900'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-[16px] text-gray-600">Everything you need to know before upgrading.</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-24 px-4 text-center border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-5 tracking-tight">Ready to dominate the market?</h2>
          <p className="text-gray-600 text-[17px] mb-10 leading-relaxed">
            Join the top 1% of global traders using GoMo Import/Export Exchange to secure better pricing, lower logistics costs, and build verified supply chains.
          </p>
          <button onClick={() => handleTierClick(TIERS[2])}
            className="inline-flex items-center gap-3 px-10 py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-black uppercase tracking-widest text-[13px] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
            <Crown size={18} /> Upgrade to Gold — {formatPrice(TIERS[2].price)}/mo
          </button>
        </div>
      </section>

      {/* ── Modals ── */}
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
