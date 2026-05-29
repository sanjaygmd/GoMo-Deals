import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Shield, Check, Crown, CreditCard, ChevronRight, AlertTriangle, Monitor, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  loadRazorpay, 
  createSellerSubscriptionOrder, 
  confirmSellerSubscription, 
  cancelSellerSubscription 
} from '../../services/sellerSubscriptionService';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free Listing',
    price: 0,
    features: [
      'Basic product listing',
      'Receive text inquiries (Support only)',
      'Standard seller badge'
    ],
    videoAccess: false,
    color: 'slate'
  },
  {
    id: 'pro',
    name: 'Pro Exporter',
    price: 499,
    features: [
      'Priority product listing',
      'Receive text inquiries',
      'Pro seller badge',
      'Schedule up to 10 video conferences/month'
    ],
    videoAccess: true,
    color: 'amber'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Exporter',
    price: 999,
    features: [
      'Featured product placement',
      'Receive text inquiries',
      'Enterprise verified badge',
      'Unlimited HD video conferences',
      'Dedicated account manager'
    ],
    videoAccess: true,
    color: 'violet'
  }
];

const SellerSubscription = () => {
  const { user, updateUser } = useAuth();
  
  // For demo purposes, we fallback to 'free' if not set
  const currentPlanId = user?.seller_subscription || 'free';
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentPlanId) || SUBSCRIPTION_PLANS[0];

  const handleSubscribe = async (plan) => {
    if (plan.id === currentPlanId) return;
    
    setSelectedPlan(plan);
    setIsProcessing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (plan.id === 'free') {
        // Cancel subscription
        await cancelSellerSubscription();
        updateUser({ ...user, seller_subscription: 'free' });
        setSuccessMsg('Subscription cancelled successfully.');
      } else {
        // Upgrade / Subscribe
        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded) {
          throw new Error('Payment gateway failed to load. Check your connection.');
        }

        const orderRes = await createSellerSubscriptionOrder(plan.price);
        if (!orderRes.success && !orderRes.order) {
          throw new Error(orderRes.message || 'Failed to create payment order.');
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: plan.price * 100,
          currency: 'INR',
          name: 'GoMo Deals Seller Subscription',
          description: `${plan.name} Plan`,
          ...(orderRes.isMock ? {} : { order_id: orderRes.order?.id }),
          handler: async (response) => {
            try {
              const confirmRes = await confirmSellerSubscription({
                plan_id: plan.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpay_order_id: response.razorpay_order_id || orderRes.order?.id || 'mock',
                razorpay_signature: response.razorpay_signature || 'mock_sig',
                amount: plan.price,
              });
              updateUser({ ...user, seller_subscription: plan.id, seller_subscription_expiry: confirmRes.data?.seller_subscription_expiry });
              setSuccessMsg(`Successfully upgraded to ${plan.name} plan!`);
              setSelectedPlan(null);
              setTimeout(() => setSuccessMsg(''), 4000);
            } catch (e) {
              setErrorMsg(e.message || 'Payment received but activation failed. Contact support.');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: { ondismiss: () => setIsProcessing(false) },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone
          },
          theme: { color: '#1e293b' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return; // Processing ends when modal closes or handler finishes
      }
    } catch (error) {
      setErrorMsg(error.message || 'Failed to process subscription.');
    }
    
    setIsProcessing(false);
    setSelectedPlan(null);
    if (plan.id === 'free') {
       setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Video Conference Subscription</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-2xl">
          Upgrade your seller account to unlock video conferencing capabilities. A Pro or Enterprise subscription is required to accept and schedule video meetings with buyers on the Flea Market Exchange.
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            currentPlan.id === 'free' ? 'bg-slate-100 text-slate-500' :
            currentPlan.id === 'pro' ? 'bg-amber-100 text-amber-600' :
            'bg-violet-100 text-violet-600'
          }`}>
            {currentPlan.id === 'free' ? <Shield size={24} /> :
             currentPlan.id === 'pro' ? <Video size={24} /> : <Crown size={24} />}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Status</p>
            <h2 className="text-xl font-black text-gray-900">{currentPlan.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${currentPlan.videoAccess ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-xs font-semibold text-gray-500">
                {currentPlan.videoAccess ? 'Video conferencing active' : 'Video conferencing disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <Check size={16} />
            <span className="text-sm font-bold">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isActive = currentPlanId === plan.id;
          
          return (
            <div key={plan.id} className={`bg-white rounded-3xl border-2 flex flex-col overflow-hidden transition-all duration-300 relative ${
              isActive ? `border-${plan.color}-500 shadow-md ring-2 ring-${plan.color}-100 ring-offset-2` : 'border-gray-100 hover:border-gray-300 hover:shadow-lg'
            }`}>
              
              {isActive && (
                <div className={`absolute top-4 right-4 bg-${plan.color}-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1`}>
                  <Check size={10} /> Active
                </div>
              )}

              <div className={`p-6 border-b ${
                plan.id === 'free' ? 'bg-slate-50 border-slate-100' :
                plan.id === 'pro' ? 'bg-amber-50 border-amber-100' :
                'bg-violet-50 border-violet-100'
              }`}>
                <h3 className={`text-lg font-black uppercase tracking-wide mb-2 ${
                  plan.id === 'free' ? 'text-slate-700' :
                  plan.id === 'pro' ? 'text-amber-700' :
                  'text-violet-700'
                }`}>{plan.name}</h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">₹{plan.price}</span>
                  <span className="text-xs font-semibold text-gray-500">/ month</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={14} className={`mt-0.5 flex-shrink-0 ${
                        plan.id === 'free' ? 'text-slate-400' :
                        plan.id === 'pro' ? 'text-amber-500' :
                        'text-violet-500'
                      }`} />
                      <span className="text-xs text-gray-600 font-medium leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  
                  {!plan.videoAccess && (
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <X size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                      <span className="text-xs text-gray-400 font-medium line-through">Video conference access</span>
                    </div>
                  )}
                </div>

                <button 
                  disabled={isActive || isProcessing}
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full mt-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 ${
                    isActive ? `bg-${plan.color}-50 text-${plan.color}-700 border border-${plan.color}-200 cursor-default` :
                    isProcessing && selectedPlan?.id === plan.id ? 'bg-gray-800 text-white cursor-wait opacity-80' :
                    plan.id === 'free' ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50' :
                    plan.id === 'pro' ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600' :
                    'bg-violet-600 text-white shadow-md hover:bg-violet-700'
                  }`}
                >
                  {isProcessing && selectedPlan?.id === plan.id ? (
                    'Processing...'
                  ) : isActive ? (
                    'Current Plan'
                  ) : (
                    <>Subscribe <ChevronRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
        <Monitor className="text-blue-500 flex-shrink-0" size={24} />
        <div>
          <h4 className="text-sm font-black text-blue-900 mb-1">Why is video conferencing required?</h4>
          <p className="text-xs text-blue-800 leading-relaxed max-w-4xl">
            To maintain a secure and compliant marketplace, all bulk negotiations on the GoMo Import/Export Exchange must be conducted via our monitored video conferencing platform. Direct chat and audio calls are disabled to prevent off-platform transactions and ensure both buyer and seller security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerSubscription;
