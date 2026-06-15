import React, { useState } from 'react';
// Force rebuild watcher trigger for sharp luxury cards
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Check, Star, Video, Scale } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product }) => {
  const { 
    addToCart, 
    removeFromCart, 
    toggleWishlist, 
    isInWishlist, 
    isInCart, 
    addToCompare, 
    compareItems, 
    formatPrice, 
    t, 
    translateRecipient, 
    translateOccasion 
  } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const productId = product.product_id || product.id;
  const image = product.thumbnail || product.image || 'https://via.placeholder.com/400x500?text=GoMo+Gift';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isInCart(productId)) {
      removeFromCart(productId);
    } else {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const isMarketProduct = React.useMemo(() => {
    if (!product) return false;
    const cat = String(product.category_name || '').toLowerCase();
    const name = String(product.name || '').toLowerCase();
    const tags = String(product.tags || '').toLowerCase();
    
    return cat.includes('grocery') || 
           cat.includes('groceries') || 
           cat.includes('staple') || 
           cat.includes('grain') || 
           cat.includes('lentil') ||
           cat.includes('rice') ||
           cat.includes('dal') ||
           tags.includes('grocery') || 
           tags.includes('flea market') || 
           tags.includes('rice') || 
           tags.includes('dal') ||
           name.includes('rice') || 
           name.includes('dal') || 
           name.includes('atta') || 
           name.includes('wheat');
  }, [product]);

  const isInCompare = React.useMemo(() => {
    return compareItems?.some(item => (item.product_id || item.id) === productId);
  }, [compareItems, productId]);

  return (
    <>
      <div className="group flex flex-col bg-white border border-stone-200 hover:border-orange-500/35 rounded-2xl p-3 sm:p-4 hover:shadow-[0_22px_44px_rgba(240,115,35,0.06)] hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-pointer h-full relative">
        
        {/* Image & Quick Action Overlay Section */}
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-50 rounded-xl mb-3 border border-stone-100/60 flex-shrink-0">
          <Link to={`/product/${productId}`} className="w-full h-full block">
            <img
              src={image}
              alt={t(product.name)}
              className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            {/* Subtle warm overlay on card hover */}
            <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors duration-500" />
          </Link>

          {/* Floating Save discount badge */}
          {Number(product.mrp) > Number(product.price) && (
            <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-[7.5px] uppercase tracking-widest px-2 py-0.5 rounded shadow-sm z-10">
              {t("save_percent", { percent: Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) })}
            </div>
          )}

          {/* Floating Quick Action Overlay Stack */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
            {/* Wishlist Button */}
            <button 
              onClick={handleToggleWishlist}
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 border shadow-md hover:scale-110 active:scale-90 cursor-pointer ${
                isInWishlist(productId) 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 fill-rose-600' 
                  : 'bg-white/95 backdrop-blur text-stone-700 border-stone-200/60 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
              }`}
              title={isInWishlist(productId) ? t("remove_from_wishlist") : t("add_to_wishlist")}
            >
              <Heart size={14} className={isInWishlist(productId) ? "fill-current" : ""} />
            </button>

            {/* Quick View Button */}
            <button 
              onClick={handleQuickView}
              className="w-8.5 h-8.5 bg-white/95 backdrop-blur border border-stone-200/60 text-stone-700 hover:text-orange-600 hover:border-orange-200 hover:scale-110 active:scale-90 rounded-full flex items-center justify-center shadow-md transition-all duration-300 md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer"
              title={t("quick_view")}
            >
              <Eye size={14} />
            </button>

            {/* Compare Button */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCompare(product);
              }}
              className={`w-8.5 h-8.5 border rounded-full flex items-center justify-center hover:scale-110 active:scale-90 shadow-md transition-all duration-300 md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer ${
                isInCompare 
                  ? 'bg-orange-50 text-orange-600 border-orange-200' 
                  : 'bg-white/95 backdrop-blur text-stone-700 border-stone-200/60 hover:text-orange-600 hover:border-orange-200'
              }`}
              title="Compare"
            >
              <Scale size={14} />
            </button>
          </div>
        </div>

        {/* Info & Footer Container */}
        <div className="flex flex-col flex-grow">
          {/* Info Block (takes remaining vertical space except footer) */}
          <div className="flex-grow space-y-1">
            {/* Elegant recipient and occasion tags */}
            {(product.recipient || product.occasion) && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {product.recipient && (
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200/30 px-2 py-0.5 rounded-full">
                    {translateRecipient(product.recipient)}
                  </span>
                )}
                {product.occasion && (
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/30 px-2 py-0.5 rounded-full">
                    {translateOccasion(product.occasion)}
                  </span>
                )}
              </div>
            )}

            {/* Brand & Ratings Row */}
            <div className="flex items-center justify-between gap-2">
              {product.brand && (
                <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-extrabold block truncate">
                  {t(product.brand)}
                </span>
              )}
              <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black shrink-0">
                <Star size={9.5} className="fill-current text-amber-500" />
                <span>{Number(product.rating || 4.2).toFixed(1)}</span>
              </div>
            </div>

            {/* Product Title */}
            <h3 className="font-bold text-sm sm:text-[15px] text-stone-850 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
              <Link to={`/product/${productId}`}>{t(product.name)}</Link>
            </h3>
          </div>

          {/* Footer Block - Pinned to bottom, perfectly aligned across cards */}
          <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between gap-3 shrink-0">
            {/* Price Column */}
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-black text-stone-900 leading-none">
                {formatPrice(product.price)}
                {isMarketProduct && <span className="text-[9px] sm:text-[10px] font-normal text-stone-500 ml-0.5">/ KG</span>}
              </span>
              {Number(product.mrp) > Number(product.price) && (
                <span className="text-[10px] sm:text-[11px] text-stone-400 line-through font-bold leading-none mt-1">
                  {formatPrice(product.mrp)}
                  {isMarketProduct && <span className="text-[8px] font-normal text-stone-300">/ KG</span>}
                </span>
              )}
            </div>
            
            {/* Primary Action Button (Single button in footer ensures responsiveness) */}
            <div className="flex-shrink-0">
              {isMarketProduct ? (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/flea-market');
                  }}
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer shadow-sm bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:scale-110 active:scale-90"
                  title="Schedule B2B Conference"
                >
                  <Video size={14} />
                </button>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer shadow-md hover:scale-110 active:scale-90 ${
                    isInCart(productId) 
                      ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' 
                      : 'bg-orange-600 text-white border-orange-600 hover:bg-orange-750 hover:border-orange-700 shadow-sm'
                  }`}
                  title={isInCart(productId) ? t("added_to_cart") : t("add_to_cart")}
                >
                  {isInCart(productId) ? <Check size={14} strokeWidth={2.5} /> : <ShoppingBag size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickViewModal 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </>
  );
};

export default ProductCard;
