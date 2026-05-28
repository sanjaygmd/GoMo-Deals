import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';

const WishlistDrawer = () => {
  const { 
    wishlist, 
    toggleWishlist, 
    addToCart, 
    wishlistDrawerOpen, 
    setWishlistDrawerOpen,
    isInCart,
    formatPrice,
    t
  } = useShop();
  
  const navigate = useNavigate();

  // Scroll lock when drawer is open
  useEffect(() => {
    if (wishlistDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [wishlistDrawerOpen]);

  if (!wishlistDrawerOpen) return null;

  const handleShopAll = () => {
    setWishlistDrawerOpen(false);
    navigate('/');
  };

  const handleViewProduct = (productId) => {
    setWishlistDrawerOpen(false);
    navigate(`/product/${productId}`);
  };

  return (
    <AnimatePresence>
      {wishlistDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setWishlistDrawerOpen(false)}
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
                  <Heart size={16} strokeWidth={2} className="fill-current" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] text-orange-200 uppercase tracking-widest font-black">GoMo Deals</span>
                  <h3 className="text-xs font-black uppercase tracking-wider">{t("my_wishlist")} ({wishlist.length})</h3>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setWishlistDrawerOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer hover:rotate-90 duration-300"
                title="Close Wishlist"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 divide-y divide-orange-100/50 custom-scrollbar flex flex-col text-left">
              {wishlist.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20 px-4">
                  <div className="w-20 h-20 bg-white border border-orange-100 flex items-center justify-center mb-6 shadow-sm rounded-none">
                    <Heart size={28} className="text-orange-400" strokeWidth={1} />
                  </div>
                  <h4 className="text-lg font-serif italic text-orange-955 mb-2">{t("wishlist_empty")}</h4>
                  <p className="text-orange-955/60 mb-8 max-w-[240px] font-sans leading-relaxed uppercase text-[8px] tracking-widest font-bold">
                    {t("wishlist_empty_desc")}
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
                  {wishlist.map((item) => {
                    const productId = item.product_id || item.id;
                    const image = item.thumbnail || item.image || 'https://via.placeholder.com/150';
                    return (
                      <motion.div
                        layout
                        key={productId}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 pb-6 border-b border-orange-100/40 group items-start first:pt-0"
                      >
                        {/* Framed Image */}
                        <div className="w-20 aspect-[3/4] bg-white border border-orange-100 p-1 overflow-hidden rounded-none relative shadow-sm flex items-center justify-center shrink-0">
                          <img
                            src={image}
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
                                  to={`/product/${productId}`} 
                                  onClick={() => setWishlistDrawerOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              </h4>
                              <button
                                onClick={() => toggleWishlist(item)}
                                className="text-orange-950/40 hover:text-rose-600 transition-all p-1 cursor-pointer shrink-0"
                                title="Remove from Wishlist"
                              >
                                <Trash2 size={14} strokeWidth={1.5} />
                              </button>
                            </div>

                            <p className="text-xs font-serif italic text-orange-955 font-normal mt-1">
                              {formatPrice(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            {/* Add to Cart button */}
                             <button
                              onClick={() => {
                                addToCart(item, 1);
                                toggleWishlist(item); // Remove from wishlist when added to cart
                              }}
                              className="flex-grow bg-orange-955 text-white py-2 text-[8px] uppercase tracking-widest font-black hover:bg-orange-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer h-9 shadow-sm"
                            >
                              <ShoppingBag size={11} />
                              {t("add_to_cart")}
                            </button>
                            
                            {/* View button */}
                            <button
                              onClick={() => handleViewProduct(productId)}
                              className="px-3 bg-white text-orange-955 border border-orange-200 hover:bg-orange-55 hover:border-orange-955 transition-all flex items-center justify-center cursor-pointer h-9 shadow-sm"
                              title={t("view_details")}
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Panel */}
            {wishlist.length > 0 && (
              <div className="bg-[#fdfbf9] p-6 border-t border-orange-150 relative z-10 shadow-[0_-5px_20px_rgba(67,23,5,0.015)]">
                <button 
                  onClick={handleShopAll}
                  className="w-full bg-orange-955 text-white py-4 text-[8px] uppercase tracking-[0.35em] font-black hover:bg-orange-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(67,23,5,0.15)] rounded-none cursor-pointer"
                >
                  {t("continue_shopping")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
