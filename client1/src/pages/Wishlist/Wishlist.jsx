import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import ProductCard from '../../components/common/ProductCard';

const Wishlist = () => {
  const { wishlist } = useShop();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="pt-16 pb-24 min-h-screen bg-white text-orange-900 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Matte Picture Frame (Zero Rounding) */}
            <div className="w-24 h-24 bg-white border border-orange-100 flex items-center justify-center mb-8 shadow-[0_4px_20px_rgba(67,23,5,0.03)] rounded-none">
              <Heart size={32} className="text-orange-400" strokeWidth={1} />
            </div>
            <h1 className="text-3xl font-serif italic text-orange-955 mb-4">Your wishlist is empty</h1>
            <p className="text-orange-900/60 mb-10 max-w-sm mx-auto font-sans leading-relaxed uppercase text-[9px] tracking-[0.18em] font-bold">
              Save products you like to view and buy them later.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-950 text-white px-12 py-5 text-[9px] uppercase tracking-[0.4em] font-black hover:bg-orange-900 transition-all duration-300 rounded-none shadow-[0_8px_30px_rgba(67,23,5,0.15)] cursor-pointer"
            >
              Start Shopping
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 min-h-screen bg-white">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 pb-12 border-b border-orange-100/40">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-600/75 block mb-4 font-bold">GoMo Deals</span>
            <h1 className="text-5xl md:text-6xl font-serif italic text-orange-955 font-normal">My Wishlist</h1>
          </div>
          <p className="text-orange-950/60 text-[9px] uppercase tracking-[0.2em] max-w-xs font-bold leading-relaxed md:text-right">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in wishlist.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          <AnimatePresence mode='popLayout'>
            {wishlist.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
