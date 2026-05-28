import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { Check, ShoppingBag, ArrowRight, Package, Calendar, CreditCard } from "lucide-react";

const OrderPlaced = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useShop();
  const orderId = location.state?.orderId || "ORD" + Math.floor(Math.random() * 100000);

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const details = [
    { icon: <Package size={16} />, label: t("Order ID"), value: `#${orderId.toString().toUpperCase().slice(0, 12)}` },
    { icon: <Calendar size={16} />, label: t("Estimated Delivery"), value: t("3 - 5 Business Days") },
    { icon: <CreditCard size={16} />, label: t("Payment Status"), value: t("Confirmed") }
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-12">
          <div className={`relative transition-all duration-1000 ease-out ${animate ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="w-24 h-24 rounded-full bg-orange-900 flex items-center justify-center text-white relative z-10">
              <Check size={40} strokeWidth={2.5} className={`transition-transform duration-700 delay-500 ${animate ? 'scale-100' : 'scale-0'}`} />
            </div>
            <div className="absolute inset-0 rounded-full bg-orange-900/10 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute -inset-4 rounded-full border border-orange-100 animate-pulse"></div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mb-16">
          <h1 className={`text-4xl md:text-5xl font-light tracking-tight text-orange-900 transition-all duration-700 delay-300 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {t("Thank you for")} <br/> <span className="font-medium italic">{t("your order.")}</span>
          </h1>
          <p className={`text-orange-500 text-lg font-light transition-all duration-700 delay-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {t("Your selection has been confirmed and we're preparing it for shipment.")}
          </p>
        </div>

        {/* Order Details Card */}
        <div className={`bg-orange-50 rounded-3xl p-8 md:p-10 mb-12 border border-orange-100 transition-all duration-700 delay-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="grid grid-cols-1 gap-6">
            {details.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 text-orange-400">
                  {item.icon}
                  <span className="text-xs uppercase tracking-widest font-medium">{item.label}</span>
                </div>
                <span className="text-orange-900 font-medium text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-900 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button
            onClick={() => navigate("/my-orders")}
            className="flex-1 bg-orange-950 text-white px-8 py-5 rounded-full flex items-center justify-center gap-3 hover:bg-orange-850 transition-all group cursor-pointer"
          >
            <ShoppingBag size={18} />
            <span className="text-sm font-medium">{t("Track Order")}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-white text-orange-900 border border-orange-200 px-8 py-5 rounded-full text-sm font-medium hover:bg-orange-50 transition-all cursor-pointer"
          >
            {t("Continue Browsing")}
          </button>
        </div>

        {/* Footer Note */}
        <p className={`text-center text-orange-400 text-[10px] uppercase tracking-[0.2em] mt-16 transition-all duration-700 delay-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>
          {t("A confirmation email has been sent to your inbox.")}
        </p>
      </div>
    </div>
  );
};

export default OrderPlaced;