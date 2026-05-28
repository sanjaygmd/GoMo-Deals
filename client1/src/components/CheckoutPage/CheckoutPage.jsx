import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { useAuth } from "../../context/AuthContext.jsx";

// Membership tier config: discount percent and free-shipping threshold (INR base)
const MEMBERSHIP_CONFIG = {
  free:     { discountPct: 0,  freeShippingThreshold: 999 },
  silver:   { discountPct: 5,  freeShippingThreshold: 499 },
  gold:     { discountPct: 10, freeShippingThreshold: 0   },
  platinum: { discountPct: 15, freeShippingThreshold: 0   },
};
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, Search, Loader2 } from "lucide-react";
import * as offerService from "../../services/offerService";

import PersonalDetails from "./PersonalDetails";
import PaymentMethod from "./PaymentMethod";
import ReviewOrder from "./ReviewOrder";
import OrderSummary from "./OrderSummary";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, t } = useShop();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [userDetails, setUserDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Bargaining states
  const [bargainOffer, setBargainOffer] = useState(null);
  const [offerToken, setOfferToken] = useState(null);
  const [offerValidationLoading, setOfferValidationLoading] = useState(false);
  const [offerValidationError, setOfferValidationError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('offerToken');
    if (token) {
      setOfferToken(token);
      const validateToken = async () => {
        setOfferValidationLoading(true);
        setOfferValidationError("");
        try {
          const res = await offerService.validateOfferToken(token);
          if (res.success && res.valid) {
            setBargainOffer(res);
          } else {
            setOfferValidationError(res.message || "Bargain offer token is invalid or expired.");
          }
        } catch (err) {
          setOfferValidationError("Connection error while validating bargain token.");
        } finally {
          setOfferValidationLoading(false);
        }
      };
      validateToken();
    }
  }, [location]);

  const buyNowProduct = location?.state?.buyNowProduct;
  const checkoutItems = location?.state?.checkoutItems;
  
  // Items to checkout (overridden by bargain validation details if active)
  const items = bargainOffer 
    ? [{
        product_id: bargainOffer.productId,
        name: bargainOffer.productName,
        price: bargainOffer.bargainedPrice,
        originalPrice: bargainOffer.originalPrice,
        thumbnail: bargainOffer.productThumbnail,
        image: bargainOffer.productThumbnail,
        quantity: 1,
        seller_id: bargainOffer.sellerId
      }]
    : (buyNowProduct ? [buyNowProduct] : (checkoutItems || cart));

  if (offerValidationLoading) {
    return (
      <div className="pt-40 pb-20 px-6 text-center bg-orange-50 min-h-screen flex flex-col items-center justify-center text-orange-600">
        <Loader2 className="animate-spin mb-4" size={40} strokeWidth={1} />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold">{t("Verifying dynamic bargain offer token...")}</p>
      </div>
    );
  }

  if (offerValidationError) {
    return (
      <div className="pt-40 pb-20 px-6 bg-orange-50 min-h-screen flex flex-col items-center justify-center max-w-md mx-auto text-center">
        <h2 className="text-2xl font-serif italic mb-4 text-orange-955">{t("Bargain Verification Failed")}</h2>
        <p className="text-xs text-rose-500 font-bold uppercase tracking-widest leading-relaxed mb-8">
          {t(offerValidationError)}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-3 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-black rounded-none hover:bg-orange-700 transition-colors"
        >
          {t("Return to Boutique")}
        </button>
      </div>
    );
  }

  if (items.length === 0 && !buyNowProduct) {
      return (
          <div className="pt-40 pb-20 px-6 text-center">
              <h2 className="text-2xl font-serif italic mb-6 text-orange-900">{t("Your collection is empty")}</h2>
              <button 
                  onClick={() => navigate('/')}
                  className="px-8 py-3 bg-orange-950 text-white text-[10px] uppercase tracking-widest font-black rounded-sm hover:bg-orange-600 transition-all"
              >
                  {t("Return to Boutique")}
              </button>
          </div>
      );
  }

  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price || item.discountPrice || 0);
    return acc + price * (item.quantity || 1);
  }, 0);

  // Helper to identify flea market / staple products
  const isMarketItem = (item) => {
    if (!item) return false;
    // Bargain offers are strictly flea market daily essentials
    if (bargainOffer && item.product_id === bargainOffer.productId) {
      return true;
    }
    const cat = (item.category_name || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const tags = (item.tags || "").toLowerCase();
    return cat.includes("grocery") || 
           cat.includes("groceries") || 
           cat.includes("staple") || 
           cat.includes("grain") || 
           cat.includes("lentil") ||
           cat.includes("rice") ||
           cat.includes("dal") ||
           tags.includes("grocery") || 
           tags.includes("flea market") || 
           tags.includes("rice") || 
           tags.includes("dal") ||
           name.includes("rice") || 
           name.includes("dal") || 
           name.includes("atta") || 
           name.includes("wheat");
  };

  const marketSubtotal = items.reduce((acc, item) => {
    const price = Number(item.price || item.discountPrice || 0);
    return acc + (isMarketItem(item) ? price * (item.quantity || 1) : 0);
  }, 0);

  // Membership tier benefit calculations (restricted ONLY to flea market products)
  const membershipTier = user?.membership || 'free';
  const tierConfig = MEMBERSHIP_CONFIG[membershipTier] || MEMBERSHIP_CONFIG.free;
  const membershipDiscountAmount = Math.round((marketSubtotal * tierConfig.discountPct) / 100);

  const hasMarketItems = items.some(isMarketItem);
  const delivery = (hasMarketItems && marketSubtotal > tierConfig.freeShippingThreshold) || (subtotal > 999) ? 0 : 49;
  const platformFee = 10;
  const codFee = paymentMethod === 'cod' ? 50 : 0;
  const gst = Math.round(subtotal * 0.05);
  
  const couponDiscountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'flat' || appliedCoupon.type === 'fixed' || parseFloat(appliedCoupon.discount_amount || 0) > 0)
      ? parseFloat(appliedCoupon.discount_amount)
      : Math.min(
          (subtotal * (appliedCoupon.discount_percent || 0)) / 100, 
          appliedCoupon.max_discount || Infinity
        ) 
    : 0;
  const discountAmount = couponDiscountAmount; // keep coupon separate from membership

  const total = subtotal + delivery + platformFee + codFee + gst - discountAmount - membershipDiscountAmount;

  const steps = [
    { id: 1, label: "Delivery", icon: <MapPin size={16} /> },
    { id: 2, label: "Payment", icon: <CreditCard size={16} /> },
    { id: 3, label: "Confirmation", icon: <Search size={16} /> }
  ];

  return (
    <div className="pt-32 pb-20 bg-orange-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <div>
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-orange-400 hover:text-orange-900 transition-colors mb-4 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t("Return")}
                </button>
                <h1 className="text-3xl font-serif italic text-orange-900">{t("Secure Checkout")}</h1>
            </div>
            
            {/* Steps Progress */}
            <div className="flex items-center gap-6 sm:gap-10">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className={`flex items-center gap-3 ${step >= s.id ? 'text-orange-900 font-bold' : 'text-orange-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs ${step >= s.id ? 'border-orange-900 bg-orange-900 text-white' : 'border-orange-200 bg-white'}`}>
                                {s.icon}
                            </div>
                            <span className="hidden sm:inline text-[10px] uppercase tracking-widest">{t(s.label)}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-[1px] w-8 sm:w-16 ${step > s.id ? 'bg-orange-900' : 'bg-orange-200'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 sm:p-12 rounded-sm shadow-sm border border-orange-100"
              >
                {step === 1 && (
                  <PersonalDetails
                    onNext={(data) => {
                      setUserDetails(data);
                      setStep(2);
                    }}
                  />
                )}

                {step === 2 && (
                  <PaymentMethod
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                  />
                )}

                {step === 3 && (
                  <ReviewOrder
                    onBack={() => setStep(2)}
                    paymentMethod={paymentMethod}
                    total={total}
                    userDetails={userDetails}
                    items={items}
                    appliedCoupon={appliedCoupon}
                    offerToken={offerToken}
                    membershipTier={membershipTier}
                    membershipDiscountAmount={membershipDiscountAmount}
                    delivery={delivery}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-40">
                <OrderSummary
                  subtotal={subtotal}
                  delivery={delivery}
                  total={total}
                  platformFee={platformFee}
                  codFee={codFee}
                  paymentMethod={paymentMethod}
                  onCouponApply={setAppliedCoupon}
                  items={items}
                  gst={gst}
                  isBargain={!!bargainOffer}
                  membershipTier={membershipTier}
                  membershipDiscountAmount={membershipDiscountAmount}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;