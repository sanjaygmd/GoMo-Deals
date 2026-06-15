import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, Star, ShieldCheck, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart, removeFromCart, toggleWishlist, isInWishlist, isInCart, formatPrice, t, translateRecipient } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = React.useState(0);

  const gallery = React.useMemo(() => {
    if (!product) return [];
    
    // 1. Try pi_images
    if (product.pi_images && product.pi_images.length > 0) {
      return product.pi_images.filter(img => !img.variant_id).map(img => img.image_url);
    }
    
    // 2. Try product.images
    if (product.images) {
      if (Array.isArray(product.images)) {
        return product.images;
      }
      if (typeof product.images === 'string') {
        try {
          if (product.images.startsWith('[')) {
            return JSON.parse(product.images);
          }
        } catch (e) {
          console.error(e);
        }
        return [product.images];
      }
    }
    
    // 3. Fallback to thumbnail or image
    return [product.thumbnail || product.image || '/fallback-product.png'];
  }, [product]);

  React.useEffect(() => {
    setActiveImage(0);
  }, [gallery]);

  if (!isOpen || !product) return null;

  const productId = product.product_id || product.id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-orange-950/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative bg-[#fdfbf9] w-full max-w-4xl h-full max-h-[600px] overflow-hidden rounded-none border border-orange-100/50 flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 z-10 text-orange-900/60 hover:text-orange-955 transition-colors p-2 hover:rotate-90 duration-300"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {/* Left Column: Pure White Gallery Canvas */}
          <div className="w-full md:w-1/2 bg-white border-r border-orange-100/30 flex flex-col items-center justify-between p-6 overflow-hidden aspect-square md:aspect-auto h-full">
            <div className="relative flex-grow w-full flex items-center justify-center overflow-hidden min-h-0 group/gallery">
              <img 
                src={gallery[activeImage]} 
                alt={product.name} 
                className="max-h-[350px] max-w-full object-contain transition-transform duration-500 hover:scale-[1.02]"
              />
              
              {/* Pagination Arrows */}
              {gallery.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImage(prev => (prev === 0 ? gallery.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-orange-950 hover:text-white flex items-center justify-center text-orange-955 shadow-sm border border-orange-100/50 opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveImage(prev => (prev === gallery.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-orange-950 hover:text-white flex items-center justify-center text-orange-955 shadow-sm border border-orange-100/50 opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 max-w-full justify-center no-scrollbar shrink-0">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveImage(idx)}
                    onClick={() => setActiveImage(idx)}
                    className={`w-10 h-10 border p-1 bg-white shrink-0 transition-all duration-200 cursor-pointer rounded-sm ${
                      activeImage === idx 
                        ? 'border-orange-955 scale-105 shadow-sm' 
                        : 'border-orange-100 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details Info */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="mb-auto">
              <span className="text-[9px] uppercase tracking-[0.3em] text-orange-500 block mb-3 font-extrabold">
                {t("for_recipient", { recipient: translateRecipient(product.recipient) })}
              </span>
              <h2 className="text-2.5xl font-serif italic text-orange-955 mb-5 leading-tight">
                {product.name}
              </h2>
              
              <div className="flex items-center gap-4 mb-6 border-b border-orange-100/20 pb-5">
                <span className="text-2xl font-extrabold text-orange-600 tracking-tight">{formatPrice(product.price)}</span>
                {product.mrp && Number(product.mrp) > Number(product.price) && (
                  <span className="text-xs line-through text-orange-300 font-light">{formatPrice(product.mrp)}</span>
                )}
                <div className="flex items-center gap-0.5 text-orange-500 ml-auto bg-[#faf8f5] border border-orange-100/40 px-2.5 py-1">
                  <Star size={10} fill="currentColor" className="text-orange-500" />
                  <span className="text-[8px] text-orange-950 font-black uppercase tracking-widest ml-1">{product.rating || '5.0'}</span>
                </div>
              </div>

              <p className="text-orange-900/80 text-[12px] font-medium leading-relaxed mb-8">
                {product.description}
              </p>

              <div className="space-y-6 mb-8 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => { 
                      if (!user) {
                        onClose();
                        navigate('/login');
                        return;
                      }
                      if (isInCart(productId)) {
                        removeFromCart(productId);
                      } else {
                        addToCart(product, 1);
                      }
                      onClose(); 
                    }}
                    className={`flex-grow h-13 text-[10px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border ${
                      isInCart(productId)
                        ? 'bg-orange-100 text-orange-900 border-orange-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'
                        : 'bg-orange-950 text-white hover:bg-orange-600 shadow-md shadow-orange-950/10'
                    }`}
                  >
                    <ShoppingBag size={14} /> 
                    {isInCart(productId) ? t("remove_from_cart") : t("add_to_cart")}
                  </button>
                  
                  <button 
                    onClick={() => {
                        if (!user) {
                          onClose();
                          navigate('/login');
                          return;
                        }
                        toggleWishlist(product);
                    }}
                    className={`w-13 h-13 border transition-all duration-300 flex items-center justify-center rounded-none bg-white ${
                      isInWishlist(productId) 
                        ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm' 
                        : 'border-orange-200 text-orange-950 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500'
                    }`}
                  >
                    <Heart 
                      size={15} 
                      className={isInWishlist(productId) ? 'fill-current scale-105' : ''} 
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Micro Trust Hairline Grid */}
            <div className="pt-6 border-t border-orange-100/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Truck size={13} className="text-orange-955" />
                  <span className="text-[8.5px] uppercase tracking-widest text-orange-955 font-black">{t("free_delivery")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-orange-955" />
                  <span className="text-[8.5px] uppercase tracking-widest text-orange-955 font-black">{t("secure_checkout")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
