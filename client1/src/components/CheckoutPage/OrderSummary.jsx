import React, { useState } from "react";
import { validateCoupon } from "../../services/couponService";
import { Tag, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { useShop } from "../../context/ShopContext";

const OrderSummary = ({
  subtotal = 0,
  delivery = 0,
  platformFee = 10,
  codFee = 0,
  total = 0,
  paymentMethod = "razorpay",
  onCouponApply,
  items = [],
  gst = 0,
  isBargain = false,
  membershipTier = 'free',
  membershipDiscountAmount = 0
}) => {
  const { formatPrice, t } = useShop();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Normalize image from any format (string URL, array, or stringified array)
  const getImage = (item) => {
    const raw = item.image || item.thumbnail || item.images;
    if (!raw) return null;
    if (typeof raw === 'string') {
      if (raw.startsWith('[')) {
        try { return JSON.parse(raw)[0]; } catch { return raw; }
      }
      return raw;
    }
    if (Array.isArray(raw)) return raw[0];
    return null;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setLoading(true);
    setError("");
    try {
      const res = await validateCoupon(couponCode, subtotal);
      if (res.success) {
        setAppliedCoupon(res.data);
        if (onCouponApply) onCouponApply(res.data);
      } else {
        setError(t(res.message) || t("Invalid coupon code"));
        setAppliedCoupon(null);
      }
    } catch (err) {
      setError(t("Failed to validate coupon"));
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const discountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'flat' || appliedCoupon.type === 'fixed' || parseFloat(appliedCoupon.discount_amount || 0) > 0)
      ? parseFloat(appliedCoupon.discount_amount)
      : Math.min(
          (subtotal * (appliedCoupon.discount_percent || 0)) / 100, 
          appliedCoupon.max_discount || Infinity
        ) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Items Preview */}
      <div className="bg-white p-6 rounded-sm border border-orange-100 shadow-sm">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-900 mb-6">{t("collection")} ({items.length})</h3>
        <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-4 pb-4 border-b border-orange-50 last:border-none last:pb-0">
              <div className="w-16 h-16 bg-orange-50 rounded-sm overflow-hidden shrink-0 border border-orange-100">
                <img
                  src={getImage(item)}
                  alt={t(item.name)}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=150"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-wider truncate">{t(item.name)}</h4>
                <p className="text-[10px] text-orange-400 uppercase tracking-widest mt-1">
                  {t("qty")}: {item.quantity || 1} {item.selectedColor ? `• ${t(item.selectedColor)}` : ''}
                </p>
                <p className="text-[11px] font-medium text-orange-900 mt-1">{formatPrice(item.price || item.discountPrice || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white p-8 rounded-sm border border-orange-100 shadow-sm space-y-6">
        <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-orange-900 border-b border-orange-50 pb-4">{t("order_summary")}</h3>
        
        {/* Coupon */}
        {isBargain ? (
          <div className="p-4 bg-orange-50 border border-orange-200/50 rounded-sm text-center">
            <p className="text-[9.5px] text-orange-600 font-black uppercase tracking-widest font-sans">
              🤝 {t("Negotiated Offer Active")}
            </p>
            <p className="text-[8.5px] text-orange-400 uppercase tracking-widest mt-1 font-sans">
              {t("Coupons cannot be stacked on bargained checkouts.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("PROMO CODE")}
                  className="w-full h-11 pl-10 pr-4 bg-orange-50 border border-orange-100 rounded-sm text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-orange-900 transition-colors font-sans"
                  disabled={appliedCoupon}
                />
              </div>
              {appliedCoupon ? (
                <button 
                  onClick={() => { setAppliedCoupon(null); setCouponCode(""); if (onCouponApply) onCouponApply(null); }}
                  className="px-4 text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest font-sans cursor-pointer"
                >
                  {t("Remove")}
                </button>
              ) : (
                <button 
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode}
                  className="px-6 h-11 bg-orange-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-orange-600 disabled:opacity-30 transition-all font-sans cursor-pointer"
                >
                  {loading ? '...' : t('Apply')}
                </button>
              )}
            </div>
            {error && <p className="text-[9px] font-bold text-rose-500 tracking-wider uppercase font-sans">{t(error)}</p>}
            {appliedCoupon && (
              <p className="text-[9px] font-black text-orange-600 tracking-wider uppercase font-sans">
                ✓ {t("Applied")}: {appliedCoupon.code} (-{formatPrice(discountAmount)})
              </p>
            )}
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-orange-50">
          <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-400">
            <span>{t("subtotal")}</span>
            <span className="text-orange-900 font-bold">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-400">
            <span>{t("shipping")}</span>
            <span className={delivery === 0 ? "text-orange-600 font-black" : "text-orange-900 font-bold"}>
              {delivery === 0 ? t("free") : formatPrice(delivery)}
            </span>
          </div>

          <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-400 group relative">
            <span className="cursor-help border-b border-dotted border-orange-300">{t("Platform Fee")}</span>
            <span className="text-orange-900 font-bold">{formatPrice(platformFee)}</span>
            <span className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-orange-900 text-white text-[8px] tracking-normal font-normal p-2 rounded shadow-lg w-52 normal-case z-20">
              {t("Covers secure transaction processing, gateway verification, and platform maintenance.")}
            </span>
          </div>

          <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-400">
            <span>{t("duties_tax")} (5%)</span>
            <span className="text-orange-900 font-bold">{formatPrice(gst)}</span>
          </div>

          {codFee > 0 && (
            <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-600 font-black">
              <span>{t("COD Handling")}</span>
              <span>+{formatPrice(codFee)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-[11px] uppercase tracking-widest text-orange-600 font-black">
              <span>{t("Savings")}</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}

          {membershipDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-black">
              <span className={`flex items-center gap-1.5 ${
                membershipTier === 'platinum' ? 'text-slate-600' :
                membershipTier === 'gold' ? 'text-amber-600' : 'text-gray-500'
              }`}>
                <span>{membershipTier === 'platinum' ? '💎' : membershipTier === 'gold' ? '👑' : '⭐'}</span>
                {membershipTier.charAt(0).toUpperCase() + membershipTier.slice(1)} {t("Savings")}
              </span>
              <span className={`${
                membershipTier === 'platinum' ? 'text-slate-600' :
                membershipTier === 'gold' ? 'text-amber-600' : 'text-gray-500'
              }`}>-{formatPrice(membershipDiscountAmount)}</span>
            </div>
          )}

          <div className="pt-6 border-t border-orange-100 flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400 mb-1">{t("total_price")}</p>
              <p className="text-[9px] text-orange-300 uppercase tracking-widest italic">{t("included")}</p>
            </div>
            <span className="text-3xl font-light text-orange-900 tracking-tighter">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-900">
            <ShieldCheck size={14} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-orange-500 leading-relaxed">
            <span className="font-black text-orange-900 block">{t("secure_payment")}</span>
            {t("payment_desc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-900">
            <Truck size={14} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-orange-500 leading-relaxed">
            <span className="font-black text-orange-900 block">{t("free_delivery")}</span>
            {t("delivery_desc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-900">
            <RefreshCcw size={14} />
          </div>
          <p className="text-[9px] uppercase tracking-widest text-orange-500 leading-relaxed">
            <span className="font-black text-orange-900 block">{t("boutique_return")}</span>
            {t("return_desc")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;