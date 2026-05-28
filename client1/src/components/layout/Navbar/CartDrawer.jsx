import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { useAuth } from '../../../context/AuthContext';

const CartDrawer = () => {
  const { 
    cart, 
    cartTotal, 
    cartCount, 
    removeFromCart, 
    updateQuantity, 
    cartDrawerOpen, 
    setCartDrawerOpen,
    formatPrice,
    t
  } = useShop();
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const membership = user?.membership || 'free';

  // Scroll lock when drawer is open
  useEffect(() => {
    if (cartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [cartDrawerOpen]);

  if (!cartDrawerOpen) return null;

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleShopAll = () => {
    setCartDrawerOpen(false);
    navigate('/');
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] cursor-pointer"
          />

          {/* Slide-out Drawer Panel Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-[#fdfbf9] h-full shadow-2xl flex flex-col z-[160] overflow-hidden border-l border-orange-100"
          >
            {/* Drawer Header */}
            <div className="bg-gradient-to-br from-orange-950 to-orange-900 text-white px-6 py-6 flex items-center justify-between border-b border-orange-900/20 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shadow-inner">
                  <ShoppingBag size={16} strokeWidth={2} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] text-orange-200 uppercase tracking-widest font-black">GoMo Deals</span>
                  <h3 className="text-xs font-black uppercase tracking-wider">{t("cartCount", {count: cartCount})}</h3>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setCartDrawerOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer hover:rotate-90 duration-300"
                title="Close Cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 divide-y divide-orange-100/50 custom-scrollbar flex flex-col text-left">
              {cart.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20 px-4">
                  <div className="w-20 h-20 bg-white border border-orange-100 flex items-center justify-center mb-6 shadow-sm rounded-none">
                    <ShoppingBag size={28} className="text-orange-400" strokeWidth={1} />
                  </div>
                  <h4 className="text-lg font-serif italic text-orange-955 mb-2">{t("cart_empty")}</h4>
                  <p className="text-orange-955/65 mb-8 max-w-[240px] font-sans leading-relaxed uppercase text-[8px] tracking-widest font-bold">
                    {t("cart_empty_desc")}
                  </p>
                  <button
                    onClick={handleShopAll}
                    className="bg-orange-950 text-white px-8 py-3.5 text-[8px] uppercase tracking-[0.3em] font-black hover:bg-orange-900 transition-all duration-300 rounded-none shadow-[0_5px_15px_rgba(67,23,5,0.1)] cursor-pointer w-full"
                  >
                    {t("start_shopping")}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 flex-grow">
                  {cart.map((item) => (
                    <motion.div
                      layout
                      key={`${item.id}-${item.selectedColor || 'none'}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 pb-6 border-b border-orange-100/40 group items-start first:pt-0"
                    >
                      {/* Framed Image */}
                      <div className="w-20 aspect-[3/4] bg-white border border-orange-100 p-1 overflow-hidden rounded-none relative shadow-sm flex items-center justify-center shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between py-1 text-left min-w-0">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h4 className="text-xs font-serif italic text-orange-955 hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                              <Link 
                                to={`/product/${item.id}`} 
                                onClick={() => setCartDrawerOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id, item.selectedColor)}
                              className="text-orange-950/40 hover:text-rose-600 transition-all p-1 cursor-pointer shrink-0"
                              title="Remove Item"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.selectedColor && (
                              <span className="text-[7px] uppercase tracking-widest px-2 py-0.5 bg-[#f4ebe1] text-orange-950 font-black border border-orange-200/50">
                                {item.selectedColor}
                              </span>
                            )}
                            <span className="text-[7px] uppercase tracking-widest px-2 py-0.5 bg-[#faf8f5] text-orange-950/70 font-black border border-orange-200/20">
                              QTY: {item.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-2">
                          {/* Compact Quantity adjusters */}
                          <div className="flex items-center border border-orange-200 bg-white rounded-none w-fit h-8">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedColor)}
                              className="px-2 h-full hover:bg-orange-50/50 transition-colors border-r border-orange-100 text-orange-950 cursor-pointer flex items-center justify-center"
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </button>
                            <span className="w-8 text-center text-[10px] font-black font-sans text-orange-955">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedColor)}
                              className="px-2 h-full hover:bg-orange-50/50 transition-colors border-l border-orange-100 text-orange-950 cursor-pointer flex items-center justify-center"
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>
                          </div>

                          <p className="text-xs font-serif italic text-orange-955">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Checkout Panel */}
            {cart.length > 0 && (
              <div className="bg-[#fdfbf9] p-6 border-t border-orange-150 relative z-10 shadow-[0_-5px_20px_rgba(67,23,5,0.015)]">
                <div className="space-y-4 mb-6 text-left">
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-orange-955/60 font-black">
                    <span>{t("subtotal")}</span>
                    <span className="text-orange-955">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-orange-955/60 font-black">
                    <span>{t("shipping")}</span>
                    <span className="text-orange-600 font-black uppercase">{t("free")}</span>
                  </div>
                  <div className="pt-4 border-t border-orange-200/60 flex justify-between items-baseline text-base font-serif italic text-orange-955">
                    <span>{t("total_price")}</span>
                    <span className="text-lg font-normal">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-orange-950 text-white py-4 text-[8px] uppercase tracking-[0.35em] font-black hover:bg-orange-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(67,23,5,0.15)] rounded-none group cursor-pointer"
                >
                  {t("proceed_to_checkout")} <ArrowRight size={12} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full mt-3 bg-white text-orange-955 border border-orange-950 py-3.5 text-[8px] uppercase tracking-[0.35em] font-black hover:bg-orange-50 transition-all duration-300 flex items-center justify-center gap-2 rounded-none cursor-pointer"
                >
                  {t("continue_shopping")}
                </button>
                
                {membership !== 'free' ? (
                  <div className={`mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 ${
                    membership === 'platinum' ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-500/40' :
                    membership === 'gold' ? 'bg-gradient-to-r from-amber-900/80 to-yellow-800/80 border border-amber-400/40' :
                    'bg-gradient-to-r from-gray-700/80 to-slate-600/80 border border-gray-400/30'
                  }`}>
                    <span className="text-base flex-shrink-0">{membership === 'platinum' ? '💎' : membership === 'gold' ? '👑' : '⭐'}</span>
                    <p className="text-[8px] font-black uppercase tracking-wider leading-relaxed text-white/90">
                      {membership === 'platinum' ? '15% off + Free Shipping applied at checkout' :
                       membership === 'gold' ? '10% off + Free Shipping applied at checkout' :
                       '5% off + Reduced Shipping applied at checkout'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl px-3 py-2.5 bg-orange-50/60 border border-orange-100/60 flex items-center gap-2 cursor-pointer hover:bg-orange-100/60 transition-colors" onClick={() => { setCartDrawerOpen(false); navigate('/membership'); }}>
                    <span className="text-base flex-shrink-0">✨</span>
                    <p className="text-[8px] font-black uppercase tracking-wider text-orange-700/90 leading-relaxed">
                      Upgrade to Gold — 10% off + Free Shipping on all orders
                    </p>
                  </div>
                )}
                <p className="mt-3 text-[6.5px] text-center text-orange-955/50 uppercase tracking-[0.2em] leading-normal font-black">
                  {t("free_shipping_disclaimer")}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
