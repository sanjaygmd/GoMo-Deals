import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useShop } from "../../context/ShopContext";
import { createOrder, sendOrderConfirmationEmail, createRazorpayOrder } from "../../services/orderService";
import { MapPin, CreditCard, Package, AlertTriangle, Loader2 } from "lucide-react";

const ReviewOrder = ({ onBack, paymentMethod, total, userDetails, items, appliedCoupon, offerToken, membershipTier = 'free', membershipDiscountAmount = 0, delivery = 0 }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  
  // Advance Payment State (Only enabled for Flea Market Deals > ₹10,000)
  const isEligibleForAdvance = offerToken && total >= 10000;
  const [paymentSplit, setPaymentSplit] = useState('full'); // 'full' or 'advance_20'

  const { user } = useAuth();
  const { cart, formatPrice, t } = useShop();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const subtotalValue = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0);

  const eligibleSubtotal = (() => {
    if (!appliedCoupon || !appliedCoupon.category || appliedCoupon.category === 'all') return subtotalValue;

    const getCategoryMapping = (couponCategory) => {
      const mapping = {
        'electronics': ['electronics', 'mobiles and accessories', 'mobiles & accessories', 'laptops and tablets', 'laptops & tablets', 'smart wearables', 'audio devices', 'cameras and photography', 'cameras & photography', 'gaming'],
        'fashion': ['fashion', 'men\'s wear', 'mens wear', 'women\'s wear', 'womens wear', 'footwear', 'accessories', 'ethnic wear', 'activewear'],
        'clothing': ['clothing', 'men\'s wear', 'mens wear', 'women\'s wear', 'womens wear', 'ethnic wear', 'activewear'],
        'mens': ['men\'s wear', 'mens wear', 'footwear', 'accessories'],
        'women': ['women\'s wear', 'womens wear', 'footwear', 'accessories'],
        'kids': ['kids collection', 'children books', 'toys'],
        'toys': ['toys', 'kids collection'],
        'gifts': ['gifts', 'home decor', 'fragrances'],
        'home-living': ['home & living', 'home and living', 'furniture', 'home decor', 'kitchenware', 'bedding & bath', 'bedding and bath', 'lighting', 'garden & outdoor', 'garden and outdoor'],
        'books': ['books', 'fiction & novels', 'fiction and novels', 'non-fiction', 'stationery', 'textbooks', 'comics & manga', 'comics and manga', 'children books'],
        'beauty': ['beauty', 'skincare', 'cosmetics', 'fragrances', 'haircare', 'men grooming', 'wellness'],
        'sports-fitness': ['sports & fitness', 'sports and fitness', 'fitness gear', 'activewear', 'outdoor & camping', 'sports equipment', 'yoga & pilates', 'yoga and pilates', 'nutrition & supplements', 'nutrition and supplements'],
        'healthy-foods': ['daily essentials & groceries', 'daily essentials and groceries', 'grains & rice', 'grains and rice', 'lentils & dals', 'lentils and dals', 'healthy foods']
      };
      return mapping[couponCategory?.toLowerCase()] || [couponCategory?.toLowerCase()];
    };

    const isCategoryMatch = (itemCategory, itemParentCategory, couponCategory) => {
      if (!couponCategory || couponCategory.toLowerCase() === 'all') return true;
      if (!itemCategory) return false;

      const targetCategories = getCategoryMapping(couponCategory);
      const norm = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
      const normalizedTargets = targetCategories.map(norm);
      
      const normItemCat = norm(itemCategory);
      const normItemParentCat = norm(itemParentCategory);
      
      return normalizedTargets.includes(normItemCat) || 
             normalizedTargets.includes(normItemParentCat) ||
             normItemCat.includes(norm(couponCategory)) ||
             normItemParentCat.includes(norm(couponCategory));
    };

    return items.reduce((acc, item) => {
      const itemCategory = item.category || item.category_name || '';
      const itemParentCategory = item.parent_category || item.parent_category_name || '';
      if (isCategoryMatch(itemCategory, itemParentCategory, appliedCoupon.category)) {
        return acc + ((Number(item.price) || 0) * (item.quantity || 1));
      }
      return acc;
    }, 0);
  })();

  const discountValue = appliedCoupon
    ? (appliedCoupon.type === 'flat' || appliedCoupon.type === 'fixed' || parseFloat(appliedCoupon.discount_amount || 0) > 0)
      ? Math.min(parseFloat(appliedCoupon.discount_amount), eligibleSubtotal)
      : Math.min((eligibleSubtotal * (appliedCoupon.discount_percent || 0)) / 100, appliedCoupon.max_discount || Infinity)
    : 0;

  const triggerOrderEmail = async (orderId) => {
    await sendOrderConfirmationEmail({
      customerName: userDetails?.name,
      customerEmail: user?.email,
      orderId,
      total,
      paymentMethod,
      address: `${userDetails?.address}, ${userDetails?.city}, ${userDetails?.state} - ${userDetails?.pincode}`
    });
  };

  const handlePlaceOrder = async () => {
    if (isAdmin) {
      setError(t("Administrators cannot place orders. Please use a customer account."));
      return;
    }
    setError("");
    setIsPlacing(true);
    try {
      const orderData = {
        customer_id: user?.id,
        address_details: userDetails,
        items: items.map(item => ({
          product_id: item.product_id || item.id,
          variant_id: item.variant_id || (item.id !== item.product_id ? item.variant_id : null) || null,
          quantity: item.quantity || 1,
          seller_id: item.seller_id
        })),
        payment_method: paymentMethod,
        subtotal: subtotalValue,
        platform_fee: 10,
        cod_fee: paymentMethod === "cod" ? 50 : 0,
        tax_amount: Math.round(subtotalValue * 0.05),
        shipping_charges: delivery,
        coupon_id: appliedCoupon?.coupon_id || null,
        discount_amount: discountValue + membershipDiscountAmount,
        membership_discount: membershipDiscountAmount,
        membership_tier: membershipTier,
        total_amount: total,
        offer_token: offerToken,
        payment_split: paymentSplit
      };

      const amountToCharge = paymentSplit === 'advance_20' ? total * 0.20 : total;

      if (paymentMethod === "cod") {
        const response = await createOrder(orderData);
        if (response.success) {
          triggerOrderEmail(response.order_id).catch(() => {});
          navigate("/order-success", { state: { orderId: response.order_id } });
        } else {
          setError(response.message || t("Failed to place order. Please try again."));
        }
      } else {
        // Fetch a valid Razorpay order ID before payment (charge only advance amount if selected)
        const razorpayOrderRes = await createRazorpayOrder(amountToCharge);
        if (!razorpayOrderRes.success || !razorpayOrderRes.order?.id) {
          setError(razorpayOrderRes.message || t("Failed to initiate secure online payment. Please try again."));
          setIsPlacing(false);
          return;
        }

        if (razorpayOrderRes.isMock) {
          // Simulate a successful payment immediately without loading Razorpay widget
          try {
            const dbResponse = await createOrder({
              ...orderData,
              payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
              razorpay_order_id: razorpayOrderRes.order.id,
              razorpay_signature: "mock_signature_bypass"
            });
            if (dbResponse.success) {
              triggerOrderEmail(dbResponse.order_id).catch(() => {});
              navigate("/order-success", { state: { orderId: dbResponse.order_id } });
            } else {
              setError(dbResponse.message || t("Payment recorded but order registration failed. Contact support."));
              setIsPlacing(false);
            }
          } catch (err) {
            setError(t("Payment successful but order registration failed. Please contact support."));
            setIsPlacing(false);
          }
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: amountToCharge * 100,
          currency: "INR",
          name: "GoMo Deals Boutique",
          description: "Boutique Order",
          order_id: razorpayOrderRes.order.id,
          handler: async function (response) {
            try {
              const dbResponse = await createOrder({
                ...orderData,
                payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              if (dbResponse.success) {
                triggerOrderEmail(dbResponse.order_id).catch(() => {});
                navigate("/order-success", { state: { orderId: dbResponse.order_id } });
              } else {
                setError(dbResponse.message || t("Payment recorded but order registration failed. Contact support."));
              }
            } catch (err) {
              setError(t("Payment successful but order registration failed. Please contact support."));
            }
          },
          prefill: {
            name: userDetails?.name,
            email: userDetails?.email,
            contact: userDetails?.phone,
          },
          theme: { color: "#171717" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      const errorMsg = err.message || err.error || t("Failed to place order. Please try again.");
      setError(errorMsg);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic text-orange-900 mb-2">{t("Review & Confirm")}</h2>
        <p className="text-[10px] uppercase tracking-widest text-orange-400">{t("Verify your details before placing your order")}</p>
      </div>

      {/* Delivery Info */}
      <div className="p-6 rounded-sm bg-orange-50 border border-orange-100 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <MapPin size={16} strokeWidth={1.5} className="text-orange-400" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-500">{t("deliver_to")}</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-orange-900 uppercase tracking-wider">{userDetails?.name}</p>
          <p className="text-sm text-orange-500 font-light">{userDetails?.address}</p>
          <p className="text-sm text-orange-500 font-light">{userDetails?.city}, {userDetails?.state} — {userDetails?.pincode}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <span className="text-[10px] uppercase tracking-widest text-orange-400">📞 {userDetails?.phone}</span>
            <span className="text-[10px] uppercase tracking-widest text-orange-400">✉ {userDetails?.email}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="p-6 rounded-sm bg-orange-50 border border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard size={16} strokeWidth={1.5} className="text-orange-400" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-500">{t("Payment Method")}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-orange-900 uppercase tracking-widest">
            {paymentMethod === "cod" ? t("Cash on Delivery") : t("Online Payment")}
          </p>
          {paymentMethod === "cod" && (
            <p className="text-[9px] uppercase tracking-widest text-orange-600 font-black mt-0.5">+ {formatPrice(50)} {t("handling fee")}</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-6 rounded-sm bg-orange-50 border border-orange-100 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Package size={16} strokeWidth={1.5} className="text-orange-400" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-500">{t("order_summary")} ({items.length})</span>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-white rounded-sm overflow-hidden border border-orange-100 shrink-0">
                <img src={item.image || item.thumbnail} alt={t(item.name)} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-900 truncate">{t(item.name)}</p>
                <p className="text-[10px] text-orange-400 uppercase tracking-widest">{t("qty")}: {item.quantity || 1}</p>
              </div>
              <p className="text-sm font-light text-orange-900 shrink-0">{formatPrice(Number(item.price) * (item.quantity || 1))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-end p-6 bg-orange-900 text-white rounded-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1">{t("total_price")}</p>
          <p className="text-[9px] uppercase tracking-widest text-white/30 italic">{t("included")}</p>
        </div>
        <span className="text-3xl font-light tracking-tighter">{formatPrice(total)}</span>
      </div>

      {/* Flea Market Escrow / Advance Payment UI */}
      {isEligibleForAdvance && paymentMethod !== "cod" && (
        <div className="p-6 rounded-sm bg-orange-50/50 border border-orange-200/60 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-955">B2B Payment Terms</span>
          </div>
          <p className="text-xs text-orange-700 leading-relaxed mb-4">
            Because this is a large Flea Market bulk deal, you have the option to secure this contract with a 20% advance payment. The remaining balance will be requested upon delivery/dispatch.
          </p>
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentSplit === 'full' ? 'bg-orange-955 border-orange-955 text-white' : 'bg-white border-orange-200'}`}>
              <input 
                type="radio" 
                name="paymentSplit" 
                value="full"
                checked={paymentSplit === 'full'} 
                onChange={() => setPaymentSplit('full')} 
                className="w-4 h-4 accent-white" 
              />
              <div className="flex-1">
                <p className={`text-xs font-black uppercase tracking-widest ${paymentSplit === 'full' ? 'text-white' : 'text-orange-955'}`}>Pay Full Amount</p>
                <p className={`text-[10px] uppercase tracking-widest ${paymentSplit === 'full' ? 'text-white/70' : 'text-orange-500'}`}>{formatPrice(total)}</p>
              </div>
            </label>
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentSplit === 'advance_20' ? 'bg-orange-955 border-orange-955 text-white' : 'bg-white border-orange-200'}`}>
              <input 
                type="radio" 
                name="paymentSplit" 
                value="advance_20"
                checked={paymentSplit === 'advance_20'} 
                onChange={() => setPaymentSplit('advance_20')} 
                className="w-4 h-4 accent-white" 
              />
              <div className="flex-1">
                <p className={`text-xs font-black uppercase tracking-widest ${paymentSplit === 'advance_20' ? 'text-white' : 'text-orange-955'}`}>20% Advance Booking</p>
                <p className={`text-[10px] uppercase tracking-widest ${paymentSplit === 'advance_20' ? 'text-white/70' : 'text-orange-500'}`}>Pay {formatPrice(total * 0.20)} now</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-sm">
          <AlertTriangle size={16} className="text-rose-500 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">{error}</p>
        </div>
      )}

      {isAdmin && (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">⚠ {t("Administrator accounts cannot place customer orders.")}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <button
          onClick={onBack}
          disabled={isPlacing}
          className="flex-1 h-14 border border-orange-200 text-orange-600 text-[11px] uppercase tracking-[0.4em] font-black rounded-sm hover:bg-orange-50 transition-all duration-300 disabled:opacity-40 cursor-pointer"
        >
          ← {t("back")}
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isAdmin || isPlacing}
          className={`flex-1 h-14 text-[11px] uppercase tracking-[0.4em] font-black rounded-sm transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer ${
            isAdmin
              ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
              : isPlacing
              ? 'bg-orange-700 text-white cursor-wait'
              : 'bg-orange-955 text-white hover:bg-orange-600 shadow-xl'
          }`}
        >
          {isPlacing ? (
            <><Loader2 size={16} className="animate-spin" /> {t("submitting")}</>
          ) : isAdmin ? (
            t('Restricted')
          ) : (
            `✓ ${t("proceed_to_checkout")}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewOrder;
