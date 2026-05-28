import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Scale, 
  Cookie, 
  ArrowLeft, 
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  ChevronDown,
  Info,
  Calendar,
  Lock
} from 'lucide-react';

const links = [
  { id: 'shipping-policy', label: 'Shipping Policy', icon: Truck },
  { id: 'return-policy', label: 'Return & Refunds', icon: RefreshCw },
  { id: 'privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'terms', label: 'Terms of Service', icon: Scale },
  { id: 'cookies', label: 'Cookie Policy', icon: Cookie }
];

const faqData = [
  { question: 'How can I track my order?', answer: 'You can easily track active shipments in the "My Orders" tab under your Profile account page.', category: 'shipping' },
  { question: 'Do you offer international shipping?', answer: 'Currently, GoMo Deals only fulfills shipping and delivery services within India.', category: 'shipping' },
  { question: 'Can I change my delivery address?', answer: 'Address updates can be submitted before dispatch. Once an order is handed to the shipping courier, changes cannot be made.', category: 'shipping' },
  { question: 'What payment methods do you accept?', answer: 'We accept UPI (Google Pay, PhonePe, Paytm), all major Credit/Debit Cards, Net Banking, and select digital wallets.', category: 'payments' },
  { question: 'Is express shipping available?', answer: 'Yes, premium express shipping options can be toggled on during the checkout phase.', category: 'shipping' },
  { question: 'How do returns work?', answer: 'Returns can be initiated within 7 days of delivery. Once verified, pickups are scheduled at no cost.', category: 'returns' },
  { question: 'Is my data secure?', answer: 'Yes, all transaction details are encrypted using industry-standard SSL tokens and we never store raw payment credentials.', category: 'security' }
];

const LegalPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  // 1. Shipping Policy State
  const [pinCode, setPinCode] = useState('');
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [pinResult, setPinResult] = useState(null);

  // 2. Return Eligibility State
  const [returnCategory, setReturnCategory] = useState('fashion');
  const [daysPast, setDaysPast] = useState(3);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  // 3. Privacy Policy Consent State
  const [consents, setConsents] = useState({
    essential: true,
    analytics: true,
    personalization: false
  });

  // 4. FAQ State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaqCat, setActiveFaqCat] = useState('all');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Handlers
  const handlePinCheck = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinCode)) {
      setPinResult({ success: false, message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }

    setIsCheckingPin(true);
    setTimeout(() => {
      setIsCheckingPin(false);
      const firstDigit = pinCode[0];
      if (['1', '2', '3'].includes(firstDigit)) {
        setPinResult({
          success: true,
          zone: 'Zone A (North & West Metro)',
          standard: '2-3 Business Days',
          express: '1 Business Day (Available)',
          cost: 'Free over ₹1,000'
        });
      } else if (['4', '5', '6'].includes(firstDigit)) {
        setPinResult({
          success: true,
          zone: 'Zone B (South & Central India)',
          standard: '3-4 Business Days',
          express: '1-2 Business Days',
          cost: 'Free over ₹1,000'
        });
      } else {
        setPinResult({
          success: true,
          zone: 'Zone C (East & Regional Hubs)',
          standard: '4-5 Business Days',
          express: '2-3 Business Days',
          cost: 'Free over ₹1,000'
        });
      }
    }, 600);
  };

  const handleEligibilityCheck = () => {
    let eligible = false;
    let reason = '';
    let action = '';

    if (returnCategory === 'fashion') {
      if (daysPast <= 10) {
        eligible = true;
        reason = 'Fashion items enjoy a flexible 10-day return policy.';
        action = 'Initiate free courier pickup in "My Orders".';
      } else {
        eligible = false;
        reason = 'Returns expired. Fashion items must be returned within 10 days of delivery.';
        action = 'Contact Customer Support for store credit exceptions.';
      }
    } else if (returnCategory === 'electronics') {
      if (daysPast <= 7) {
        eligible = true;
        reason = 'Electronics are eligible for a 7-day replacement/refund in case of manufacturing defects.';
        action = 'Upload unboxing video & original tags to start validation.';
      } else {
        eligible = false;
        reason = 'Standard return window of 7 days closed. Covered under manufacturer warranty.';
        action = 'Download Brand Warranty receipt in your order panel.';
      }
    } else if (returnCategory === 'grocery') {
      eligible = false;
      reason = 'Consumables, grocery, and personal care products are non-returnable due to hygiene regulations.';
      action = 'If items arrived damaged, submit photo proof within 24 hours for instant refund.';
    } else {
      if (daysPast <= 7) {
        eligible = true;
        reason = 'General catalog items are returnable within 7 days of delivery.';
        action = 'Pack in original brand box for hassle-free check.';
      } else {
        eligible = false;
        reason = 'Standard return window has expired for this item.';
        action = 'Contact seller for post-delivery warranty repair.';
      }
    }

    setEligibilityResult({ eligible, reason, action });
  };

  const toggleConsent = (key) => {
    if (key === 'essential') return; // Cannot turn off essential
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Render components
  const renderShippingPolicy = () => (
    <div className="space-y-12">
      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50/20 border border-orange-100/50 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-4">
              <Truck size={22} />
            </div>
            <h4 className="font-serif italic text-lg text-orange-950 mb-1">Standard Delivery</h4>
            <p className="text-xs text-orange-600 leading-relaxed mb-4">Perfect for non-urgent shipments. Secure & reliable shipping across India.</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-2">Transit Time</div>
            <div className="text-sm font-sans font-black text-orange-950">3-5 Business Days</div>
            <div className="text-xs text-emerald-600 font-bold mt-1">FREE (Above ₹1,000)</div>
          </div>
        </div>

        <div className="bg-orange-950 text-white p-6 rounded-2xl flex flex-col justify-between shadow-xl shadow-orange-950/10">
          <div>
            <div className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center text-orange-400 shadow-sm mb-4">
              <Clock size={22} />
            </div>
            <h4 className="font-serif italic text-lg text-orange-100 mb-1">Express Shipping</h4>
            <p className="text-xs text-orange-200/80 leading-relaxed mb-4">Expedited courier priority. Your package moves to the front of the queue.</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-300 font-bold mb-2">Transit Time</div>
            <div className="text-sm font-sans font-black text-white">1-2 Business Days</div>
            <div className="text-xs text-orange-300 font-bold mt-1">Flat ₹99 Carrier Fee</div>
          </div>
        </div>

        <div className="bg-orange-50/20 border border-orange-100/50 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-4">
              <MapPin size={22} />
            </div>
            <h4 className="font-serif italic text-lg text-orange-950 mb-1">Same-Day Dispatch</h4>
            <p className="text-xs text-orange-600 leading-relaxed mb-4">Available in select tier-1 metropolitan cities for orders placed before 12 PM.</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-2">Transit Time</div>
            <div className="text-sm font-sans font-black text-orange-950">Within 24 Hours</div>
            <div className="text-xs text-emerald-600 font-bold mt-1">Flat ₹149 Priority Fee</div>
          </div>
        </div>
      </div>

      {/* PIN Estimator Widget */}
      <div className="bg-[#faf8f6] border border-orange-100/30 p-8 rounded-3xl space-y-6">
        <div className="max-w-xl">
          <h4 className="font-serif italic text-xl text-orange-950 mb-2">Interactive Delivery Estimator</h4>
          <p className="text-xs text-orange-600 leading-relaxed">
            Enter your 6-digit Indian PIN code to view customized delivery schedules, express service eligibility, and minimum carrier fees.
          </p>
        </div>

        <form onSubmit={handlePinCheck} className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="relative flex-grow">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
            <input 
              type="text" 
              placeholder="e.g. 110001 or 400001" 
              maxLength={6}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-white border border-orange-200 focus:border-orange-500 focus:outline-none rounded-xl py-3 pl-12 pr-4 text-sm text-orange-950 font-medium placeholder-orange-300"
            />
          </div>
          <button 
            type="submit"
            disabled={isCheckingPin}
            className="bg-orange-950 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-orange-900 transition-colors shadow-md disabled:bg-orange-900/60 cursor-pointer"
          >
            {isCheckingPin ? 'Checking...' : 'Check Availability'}
          </button>
        </form>

        {pinResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border ${pinResult.success ? 'bg-emerald-50/30 border-emerald-100 text-emerald-950' : 'bg-red-50/30 border-red-100 text-red-950'} max-w-lg`}
          >
            {pinResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-800 tracking-wider">
                  <CheckCircle2 size={16} />
                  <span>Delivery Available</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-orange-950 border-t border-emerald-100/50">
                  <div>
                    <span className="text-orange-400 font-bold block mb-0.5">Region Hub</span>
                    <strong className="font-extrabold">{pinResult.zone}</strong>
                  </div>
                  <div>
                    <span className="text-orange-400 font-bold block mb-0.5">Standard Dispatch</span>
                    <strong className="font-extrabold">{pinResult.standard}</strong>
                  </div>
                  <div>
                    <span className="text-orange-400 font-bold block mb-0.5">Express Dispatch</span>
                    <strong className="font-extrabold text-orange-900">{pinResult.express}</strong>
                  </div>
                  <div>
                    <span className="text-orange-400 font-bold block mb-0.5">Shipping Charges</span>
                    <strong className="font-extrabold text-emerald-600">{pinResult.cost}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-xs font-bold text-red-800">
                <XCircle size={16} />
                <span>{pinResult.message}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Rules */}
      <div className="space-y-4">
        <h4 className="font-serif italic text-lg text-orange-950">Important Shipping Protocols</h4>
        <ul className="space-y-3.5 text-xs text-orange-600 leading-relaxed font-normal">
          <li className="flex gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></span>
            <span><strong>Order Tracking:</strong> A live carrier tracking link is texted and emailed instantly upon pickup.</span>
          </li>
          <li className="flex gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></span>
            <span><strong>OTP Verification:</strong> Deliveries for orders exceeding ₹5,000 require secure 4-digit PIN verification sent to your registered phone number.</span>
          </li>
          <li className="flex gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></span>
            <span><strong>Holiday Shipments:</strong> Carrier delays can occur during major national festivals. We appreciate your patience and promise active tracking.</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderReturnPolicy = () => (
    <div className="space-y-12">
      {/* Workflow Timeline */}
      <div className="space-y-6">
        <h4 className="font-serif italic text-xl text-orange-950 text-center mb-8">4-Step Quick Returns Cycle</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-orange-100 -translate-y-1/2 z-0 hidden md:block" />
          
          <div className="bg-white border border-orange-100/60 p-5 rounded-2xl flex flex-col items-center text-center relative z-10 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold mb-3 shadow-inner">1</div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1">Submit Request</h5>
            <p className="text-[10px] text-orange-600 leading-relaxed">Initiate returns on the order page within active limits.</p>
          </div>

          <div className="bg-white border border-orange-100/60 p-5 rounded-2xl flex flex-col items-center text-center relative z-10 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold mb-3 shadow-inner">2</div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1">Free Pickup</h5>
            <p className="text-[10px] text-orange-600 leading-relaxed">Our shipping courier partner arrives for home verification in 24-48 hrs.</p>
          </div>

          <div className="bg-white border border-orange-100/60 p-5 rounded-2xl flex flex-col items-center text-center relative z-10 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold mb-3 shadow-inner">3</div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1">Quality Inspection</h5>
            <p className="text-[10px] text-orange-600 leading-relaxed">Returned package is verified for intact original tags & packaging.</p>
          </div>

          <div className="bg-white border border-orange-100/60 p-5 rounded-2xl flex flex-col items-center text-center relative z-10 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold mb-3 shadow-inner">4</div>
            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-950 mb-1">Instant Refund</h5>
            <p className="text-[10px] text-emerald-600 leading-relaxed">Funds credited directly back to your secure original payment method.</p>
          </div>
        </div>
      </div>

      {/* Interactive Eligibility checker */}
      <div className="bg-[#faf8f6] border border-orange-100/30 p-8 rounded-3xl space-y-6">
        <div className="max-w-xl">
          <h4 className="font-serif italic text-xl text-orange-950 mb-2">Interactive Returns Eligibility Widget</h4>
          <p className="text-xs text-orange-600 leading-relaxed">
            Specify your product category and how many days ago delivery was completed to immediately evaluate return guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-orange-400 block mb-2">Product Category</label>
            <select 
              value={returnCategory}
              onChange={(e) => setReturnCategory(e.target.value)}
              className="w-full bg-white border border-orange-200 focus:border-orange-500 focus:outline-none rounded-xl py-3 px-4 text-sm text-orange-950 font-bold"
            >
              <option value="fashion">👗 Apparel & Fashion Accessories</option>
              <option value="electronics">🔌 Electronics & Gadgets</option>
              <option value="grocery">🍎 Pantry & Consumables</option>
              <option value="home">🏡 Home & Kitchen Decor</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-orange-400">Days Since Delivery</label>
              <span className="text-xs font-black text-orange-950">{daysPast} {daysPast === 1 ? 'Day' : 'Days'} ago</span>
            </div>
            <div className="flex items-center gap-4 py-2">
              <input 
                type="range" 
                min={1} 
                max={30} 
                value={daysPast}
                onChange={(e) => setDaysPast(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleEligibilityCheck}
          className="bg-orange-950 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-orange-900 transition-colors shadow-md cursor-pointer"
        >
          Check Eligibility status
        </button>

        {eligibilityResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border ${eligibilityResult.eligible ? 'bg-emerald-50/30 border-emerald-100 text-emerald-950' : 'bg-red-50/30 border-red-100 text-red-950'} max-w-lg`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                {eligibilityResult.eligible ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-emerald-800">Return Approved</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-600" />
                    <span className="text-red-800">Return Ineligible</span>
                  </>
                )}
              </div>
              <p className="text-xs text-orange-950 leading-relaxed font-medium">
                {eligibilityResult.reason}
              </p>
              <div className="pt-2 text-[10px] uppercase tracking-wider font-bold text-orange-400">
                Recommended Action: <span className="text-orange-950 font-black normal-case text-xs block mt-0.5">{eligibilityResult.action}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="space-y-12">
      {/* Privacy highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50/20 border border-orange-100/50 p-6 rounded-2xl">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-4">
            <Lock size={18} />
          </div>
          <h4 className="font-serif italic text-base text-orange-950 mb-1">Strict Encryption</h4>
          <p className="text-xs text-orange-600 leading-relaxed">256-bit bank-grade SSL secure keys encrypt checkout tokens and personal data paths.</p>
        </div>

        <div className="bg-orange-50/20 border border-orange-100/50 p-6 rounded-2xl">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-4">
            <ShieldCheck size={18} />
          </div>
          <h4 className="font-serif italic text-base text-orange-950 mb-1">Zero Seller Selling</h4>
          <p className="text-xs text-orange-600 leading-relaxed">We strictly veto third-party analytical brokering. Your data is your property.</p>
        </div>

        <div className="bg-orange-50/20 border border-orange-100/50 p-6 rounded-2xl">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm mb-4">
            <Info size={18} />
          </div>
          <h4 className="font-serif italic text-base text-orange-950 mb-1">Erase Requests</h4>
          <p className="text-xs text-orange-600 leading-relaxed">A customer holds absolute priority to claim prompt, clean data erasure in one click.</p>
        </div>
      </div>

      {/* Consent Center Panel */}
      <div className="bg-[#faf8f6] border border-orange-100/30 p-8 rounded-3xl space-y-6">
        <div className="max-w-xl">
          <h4 className="font-serif italic text-xl text-orange-950 mb-2">Privacy Shield Consent Center</h4>
          <p className="text-xs text-orange-600 leading-relaxed">
            Customize which analytics cookies, browser trackers, and notification engines you allow us to leverage during shopping sessions.
          </p>
        </div>

        <div className="space-y-4 max-w-lg">
          {/* Item 1 */}
          <div className="bg-white border border-orange-100/60 p-4 rounded-xl flex items-center justify-between">
            <div className="pr-4">
              <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1 flex items-center gap-1.5">
                Essential System Cookies
                <span className="bg-orange-100 text-orange-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Required</span>
              </h5>
              <p className="text-[10px] text-orange-500 leading-relaxed">Manages cart persistence, checkout sessions, and login security credentials.</p>
            </div>
            <div className="relative">
              <button 
                disabled
                className="w-11 h-6 bg-emerald-500 rounded-full p-1 cursor-not-allowed opacity-80"
              >
                <div className="w-4 h-4 bg-white rounded-full translate-x-5" />
              </button>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-white border border-orange-100/60 p-4 rounded-xl flex items-center justify-between">
            <div className="pr-4">
              <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1">Analytical Metrics Tracking</h5>
              <p className="text-[10px] text-orange-500 leading-relaxed">Helps compile anonymized page-load speed benchmarks, scroll metrics, and error logs.</p>
            </div>
            <div>
              <button 
                onClick={() => toggleConsent('analytics')}
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${consents.analytics ? 'bg-orange-950' : 'bg-orange-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${consents.analytics ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Item 3 */}
          <div className="bg-white border border-orange-100/60 p-4 rounded-xl flex items-center justify-between">
            <div className="pr-4">
              <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-orange-950 mb-1">Personalization Engine</h5>
              <p className="text-[10px] text-orange-500 leading-relaxed">Tailors homepage banner promotions, quick search recommendations, and coupon matches.</p>
            </div>
            <div>
              <button 
                onClick={() => toggleConsent('personalization')}
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${consents.personalization ? 'bg-orange-950' : 'bg-orange-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${consents.personalization ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-orange-50/20 border border-orange-100/30 rounded-2xl max-w-lg flex gap-3 text-xs text-orange-850">
          <Info size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Changes are saved instantly in your local browser storage. You can edit this policy or opt-out completely at any time.
          </p>
        </div>
      </div>
    </div>
  );

  const renderFAQs = () => {
    // FAQ Filters logic
    const filteredFaqs = faqData.filter(faq => {
      const matchQuery = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeFaqCat === 'all' || faq.category === activeFaqCat;
      return matchQuery && matchCat;
    });

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
            <input 
              type="text" 
              placeholder="Search help topics or keywords..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenFaqIndex(null); // Close active when searching
              }}
              className="w-full bg-white border border-orange-200 focus:border-orange-500 focus:outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-orange-950 font-medium placeholder-orange-300 shadow-sm"
            />
          </div>

          {/* Quick Categories */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['all', 'shipping', 'payments', 'returns', 'security'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveFaqCat(cat);
                  setOpenFaqIndex(null);
                }}
                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all duration-300 rounded-full cursor-pointer ${
                  activeFaqCat === cat 
                    ? 'bg-orange-950 text-white shadow-md' 
                    : 'bg-white border border-orange-100 hover:bg-orange-50/50 text-orange-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List Accordion */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white border border-orange-100/60 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left font-sans font-bold text-xs sm:text-sm uppercase tracking-wider text-orange-950 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-orange-500 font-serif italic font-extrabold normal-case">Q.</span>
                      {faq.question}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`text-orange-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-950' : ''}`} 
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-orange-700/80 leading-relaxed font-normal border-t border-orange-50 pl-8 flex gap-2">
                          <span className="text-emerald-500 font-serif italic font-extrabold">A.</span>
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white border border-orange-100/40 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-orange-300 mx-auto mb-3" />
              <p className="text-xs sm:text-sm text-orange-950 font-bold uppercase tracking-wider">No matches found</p>
              <p className="text-xs text-orange-400 mt-1">Try entering alternate search queries or clearing keywords.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getActiveView = () => {
    switch (type) {
      case 'shipping-policy':
        return renderShippingPolicy();
      case 'return-policy':
        return renderReturnPolicy();
      case 'privacy-policy':
        return renderPrivacyPolicy();
      case 'faqs':
        return renderFAQs();
      default:
        // Basic Fallback for terms and cookies
        const currentData = getContentFallback();
        return (
          <div className="space-y-8 animate-fadeIn">
            {currentData.content.map((item, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm uppercase tracking-wider font-bold text-orange-950">
                  {item.heading}
                </h3>
                <p className="text-xs sm:text-sm text-orange-600 leading-relaxed font-normal">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        );
    }
  };

  const getContentFallback = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms of Service',
          subtitle: 'Core rules, customer usage conditions, and cancellation policies.',
          content: [
            { heading: 'User Agreement', text: 'By using GoMo Deals, you agree to our comprehensive Terms of Service, policies, and community guidelines.' },
            { heading: 'Intellectual Property', text: 'All designs, catalogs, illustrations, and software code on this platform are proprietary to GoMo Deals and partners.' },
            { heading: 'Price Alterations', text: 'Prices and active deals are subject to sudden shifts without notice to match flash sale limits.' },
            { heading: 'Account Registration', text: 'Users are fully responsible for maintaining confidential account passwords and providing verified registration detail updates.' }
          ]
        };
      case 'cookies':
        return {
          title: 'Cookie Policy',
          subtitle: 'Our usage of cookies to speed up checkout and analyze site metrics.',
          content: [
            { heading: 'Performance Tracking', text: 'We utilize tracking cookies to analyze general visitor statistics, load balance page speeds, and improve interface interactions.' },
            { heading: 'Shopping Cart Cookies', text: 'Essential cookies keep your active shopping cart items saved and maintain profile access tokens while browsing collections.' },
            { heading: 'Browser Settings', text: 'You can disable cookie usage directly within your device browser settings, though some layout functions may be impacted.' }
          ]
        };
      default:
        return {
          title: 'Support Center',
          subtitle: 'General guidelines, terms, and agreements of GoMo Deals.',
          content: [
            { heading: 'Welcome to our Support Hub', text: 'Please choose any of the document sections listed in the sidebar navigation or footer links to review its contents.' }
          ]
        };
    }
  };

  const pageTitle = type === 'shipping-policy' ? 'Shipping Policy' 
                  : type === 'return-policy' ? 'Return & Refunds' 
                  : type === 'privacy-policy' ? 'Privacy Policy' 
                  : type === 'faqs' ? 'Frequently Asked Questions' 
                  : getContentFallback().title;

  const pageSubtitle = type === 'shipping-policy' ? 'Our delivery services, processing times, and shipping rates.'
                     : type === 'return-policy' ? 'Hassle-free return policy, refunds timeline, and inspection terms.'
                     : type === 'privacy-policy' ? 'How we collect, secure, and use your personal information.'
                     : type === 'faqs' ? 'Answers to common questions about tracking, shipping, and payments.'
                     : getContentFallback().subtitle;

  return (
    <div className="min-h-screen bg-[#faf8f6] pt-32 pb-24 font-sans text-orange-950">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            to="/" 
            className="group flex items-center gap-2 text-xs uppercase tracking-widest font-black text-orange-950 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Shop
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
            GoMo Deals / Support Hub
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Left Sidebar Menu */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-white p-6 rounded-2xl border border-orange-100/50 shadow-sm">
              <h3 className="text-xs uppercase tracking-[0.25em] text-orange-950 font-black mb-6 px-3">
                Support Hub
              </h3>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = type === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => navigate(`/legal/${link.id}`)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-xl group text-left cursor-pointer ${
                        isActive 
                          ? 'bg-orange-950 text-white shadow-lg shadow-orange-950/10 font-extrabold' 
                          : 'text-orange-600 hover:bg-orange-50/50 hover:text-orange-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={isActive ? 'text-orange-400' : 'text-orange-400 group-hover:text-orange-950'} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight size={14} className={`opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100 text-white' : 'group-hover:opacity-100 text-orange-400'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Content Column */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="bg-white p-8 sm:p-12 rounded-3xl border border-orange-100/50 shadow-xl shadow-orange-950/[0.02] flex flex-col justify-between min-h-[500px]"
              >
                <div>
                  <div className="border-b border-orange-50 pb-8 mb-10">
                    <h1 className="text-3xl sm:text-4xl font-serif italic text-orange-950 font-light mb-3">
                      {pageTitle}
                    </h1>
                    <p className="text-sm text-orange-500 font-light leading-relaxed">
                      {pageSubtitle}
                    </p>
                  </div>

                  <div className="space-y-8">
                    {getActiveView()}
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-orange-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">
                    Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-orange-400 uppercase tracking-widest font-medium">
                    &copy; GoMo Deals Support Hub
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LegalPage;
