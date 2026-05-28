import React, { useState } from 'react';
// Force rebuild watcher trigger for sharp luxury cards
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Check, Star } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product }) => {
  const { addToCart, removeFromCart, toggleWishlist, isInWishlist, isInCart, formatPrice, t, translateRecipient, translateOccasion } = useShop();
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
    const cat = (product.category_name || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const tags = (product.tags || '').toLowerCase();
    
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

  return (
    <>
      <div className="group flex flex-col bg-white border border-orange-100/75 hover:border-orange-850/20 rounded-2xl p-4 hover:shadow-[0_20px_40px_rgba(31,15,7,0.05)] hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-pointer h-full relative">
        <Link to={`/product/${productId}`} className="relative aspect-[4/5] overflow-hidden bg-[#faebe3] rounded-xl mb-4 block border border-orange-100/50">
          <img
            src={image}
            alt={t(product.name)}
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />

          {/* Subtle warm overlay on card hover */}
          <div className="absolute inset-0 bg-orange-950/0 group-hover:bg-orange-950/5 transition-colors duration-500" />

          {/* Floating Save badge */}
          {product.mrp > product.price && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-[7.5px] uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">
              {t("save_percent", { percent: Math.round(((product.mrp - product.price) / product.mrp) * 100) })}
            </div>
          )}

          {/* Top-Right Heart (Luxurious circular floating pill) */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border z-20 cursor-pointer shadow-sm hover:scale-110 active:scale-90 ${
              isInWishlist(productId) 
                ? 'bg-rose-50 text-rose-600 border-rose-200 fill-rose-600 hover:bg-rose-100/70' 
                : 'bg-white/90 backdrop-blur-md text-orange-955 border-orange-100 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
            }`}
            title={isInWishlist(productId) ? t("remove_from_wishlist") : t("add_to_wishlist")}
          >
            <Heart size={15} className={isInWishlist(productId) ? "fill-current" : ""} />
          </button>
        </Link>

        {/* Info Block */}
        <div className="flex flex-col justify-between flex-grow">
          <div className="space-y-1">
            {/* Elegant tiny tags row */}
            {(product.recipient || product.occasion) && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {product.recipient && (
                  <span className="text-[8px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200/40 px-2.5 py-0.5 rounded-full shadow-sm transition-all duration-300 hover:bg-orange-100 hover:scale-102">
                    {translateRecipient(product.recipient)}
                  </span>
                )}
                {product.occasion && (
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/40 px-2.5 py-0.5 rounded-full shadow-sm transition-all duration-300 hover:bg-amber-100 hover:scale-102">
                    {translateOccasion(product.occasion)}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              {product.brand && (
                <span className="text-[9.5px] uppercase tracking-[0.25em] text-orange-400 font-extrabold block">
                  {t(product.brand)}
                </span>
              )}
              <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black shrink-0">
                <Star size={10} className="fill-current text-amber-500" />
                <span>{Number(product.rating || 4.2).toFixed(1)}</span>
              </div>
            </div>
            <h3 className="font-bold text-[15.5px] text-orange-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
              <Link to={`/product/${productId}`}>{t(product.name)}</Link>
            </h3>
          </div>

          <div className="pt-3 mt-4 border-t border-orange-100/70 flex items-center justify-between gap-4">
            <div className="flex flex-col text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-extrabold text-orange-955 font-sans leading-none">
                  {formatPrice(product.price)}
                  {isMarketProduct && <span className="text-[10px] font-normal text-orange-500/80 ml-0.5">/ KG</span>}
                </span>
                {product.mrp > product.price && (
                  <span className="text-[11px] text-orange-900/40 line-through font-bold leading-none">
                    {formatPrice(product.mrp)}
                    {isMarketProduct && <span className="text-[9px] font-normal text-orange-900/30">/ KG</span>}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Add to Cart (Circular, premium hover animation) */}
              <button 
                onClick={handleAddToCart}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer shadow-sm hover:scale-110 active:scale-90 ${
                  isInCart(productId) 
                    ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' 
                    : 'bg-orange-950 text-white border-orange-950 hover:bg-orange-850 hover:border-orange-900 shadow-sm hover:shadow-orange-glow/10'
                }`}
                title={isInCart(productId) ? t("added_to_cart") : t("add_to_cart")}
              >
                {isInCart(productId) ? <Check size={15} strokeWidth={2.5} /> : <ShoppingBag size={15} />}
              </button>
              {/* Quick View (Circular, premium white frame) */}
              <button 
                onClick={handleQuickView}
                className="w-9 h-9 bg-[#fdfaf8] border border-orange-100 rounded-full flex items-center justify-center text-orange-900 hover:text-orange-955 hover:bg-[#faebe3] hover:border-orange-200 hover:scale-110 active:scale-90 shadow-sm transition-all duration-300 cursor-pointer"
                title={t("quick_view")}
              >
                <Eye size={15} />
              </button>
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
