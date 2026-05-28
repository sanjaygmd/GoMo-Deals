import { CreditCard, Landmark, Check } from "lucide-react";
import { useShop } from "../../context/ShopContext";

const PaymentMethod = ({ paymentMethod, setPaymentMethod, onBack, onNext }) => {
  const { t } = useShop();

  const options = [
    {
      id: "razorpay",
      label: "Online Payment",
      subtitle: "UPI · Cards · Net Banking · Wallets",
      icon: <CreditCard size={22} strokeWidth={1} />,
      accent: "text-orange-600",
      activeBg: "border-orange-950 bg-orange-950 text-white",
      inactiveBg: "border-orange-100 hover:border-orange-300 text-orange-900",
    },
    {
      id: "cod",
      label: "Cash on Delivery",
      subtitle: "Pay when your order arrives",
      icon: <Landmark size={22} strokeWidth={1} />,
      fee: "+ ₹50 handling fee",
      accent: "text-orange-600",
      activeBg: "border-orange-950 bg-orange-950 text-white",
      inactiveBg: "border-orange-100 hover:border-orange-300 text-orange-900",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic text-orange-900 mb-2">{t("Payment Method")}</h2>
        <p className="text-[10px] uppercase tracking-widest text-orange-400">{t("Choose your preferred payment mode")}</p>
      </div>

      <div className="space-y-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setPaymentMethod(opt.id)}
            className={`w-full p-6 rounded-sm border-2 flex items-center gap-6 transition-all duration-500 text-left cursor-pointer ${
              paymentMethod === opt.id ? opt.activeBg : opt.inactiveBg
            }`}
          >
            <div className={`shrink-0 transition-colors ${paymentMethod === opt.id ? 'text-white' : opt.accent}`}>
              {opt.icon}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-black uppercase tracking-widest ${paymentMethod === opt.id ? 'text-white' : 'text-orange-900'}`}>
                {t(opt.label)}
              </p>
              <p className={`text-[10px] uppercase tracking-widest mt-1 ${paymentMethod === opt.id ? 'text-white/60' : 'text-orange-400'}`}>
                {t(opt.subtitle)}
              </p>
              {opt.fee && (
                <p className={`text-[9px] uppercase tracking-widest mt-1 font-black ${paymentMethod === opt.id ? 'text-orange-300' : 'text-orange-600'}`}>
                  {t(opt.fee)}
                </p>
              )}
            </div>
            {paymentMethod === opt.id && (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check size={14} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 h-14 border border-orange-200 text-orange-600 text-[11px] uppercase tracking-[0.4em] font-black rounded-sm hover:bg-orange-50 transition-all duration-300 cursor-pointer"
        >
          ← {t("Back")}
        </button>
        <button
          onClick={onNext}
          className="flex-1 h-14 bg-orange-955 text-white text-[11px] uppercase tracking-[0.4em] font-black rounded-sm hover:bg-orange-600 transition-all duration-500 cursor-pointer"
        >
          {t("Review Order")} →
        </button>
      </div>
    </div>
  );
};

export default PaymentMethod;