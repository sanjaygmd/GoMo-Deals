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
  const { user } = useAuth();
  const { cart, formatPrice, t } = useShop();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const subtotalValue = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const discountValue = appliedCoupon
    ? (appliedCoupon.type === 'flat' || appliedCoupon.type === 'fixed' || parseFloat(appliedCoupon.discount_amount || 0) > 0)
      ? parseFloat(appliedCoupon.discount_amount)
      : Math.min((subtotalValue * (appliedCoupon.discount_percent || 0)) / 100, appliedCoupon.max_discount || Infinity)
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
        offer_token: offerToken
      };

      if (paymentMethod === "cod") {
        const response = await createOrder(orderData);
        if (response.success) {
          triggerOrderEmail(response.order_id).catch(() => {});
          navigate("/order-success", { state: { orderId: response.order_id } });
        } else {
          setError(response.message || t("Failed to place order. Please try again."));
        }
      } else {
        // Fetch a valid Razorpay order ID before payment
        const razorpayOrderRes = await createRazorpayOrder(total);
        if (!razorpayOrderRes.success || !razorpayOrderRes.order?.id) {
          setError(razorpayOrderRes.message || t("Failed to initiate secure online payment. Please try again."));
          setIsPlacing(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: total * 100,
          currency: "INR",
          name: "GoMo Deals Boutique",
          description: "Boutique Order",
          // Conditionally include order_id only if it is NOT a mock order
          ...(razorpayOrderRes.isMock ? {} : { order_id: razorpayOrderRes.order.id }),
          handler: async function (response) {
            try {
              const dbResponse = await createOrder({
                ...orderData,
                payment_id: response.razorpay_payment_id || `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
                razorpay_order_id: response.razorpay_order_id || razorpayOrderRes.order.id,
                razorpay_signature: response.razorpay_signature || "mock_signature_bypass"
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
