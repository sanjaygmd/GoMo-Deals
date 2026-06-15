import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react';
import { getSharedWishlist } from '../../services/wishlistService';
import { toast } from 'react-hot-toast';

const SharedWishlist = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      const res = await getSharedWishlist(token);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || res.message || 'Shared wishlist not found');
        toast.error(res.error || res.message || 'Shared wishlist not found');
      }
      setLoading(false);
    };

    fetchWishlist();
  }, [token]);

  if (loading) {
    return (
      <div className="pt-16 pb-24 min-h-screen bg-[#fdfbf9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-16 pb-24 min-h-screen bg-[#fdfbf9] text-orange-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <h1 className="text-3xl font-serif italic text-orange-955 mb-4">Oops!</h1>
          <p className="text-orange-900/60 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-950 text-white px-8 py-4 text-[10px] uppercase tracking-widest hover:bg-orange-900 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 min-h-screen bg-[#fdfbf9]">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        <header className="mb-20 pb-12 border-b border-orange-100/40">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-[10px] uppercase tracking-widest text-orange-900/60 hover:text-orange-900 mb-8 font-bold transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" /> Back to Store
          </button>
          
          <span className="text-[10px] uppercase tracking-[0.4em] text-orange-600/75 block mb-4 font-bold">
            Shared Wishlist
          </span>
          <h1 className="text-4xl md:text-5xl font-serif italic text-orange-955 font-normal mb-4">
            {data.ownerName}'s Wishlist
          </h1>
          <p className="text-orange-950/60 text-sm font-medium">
            {data.items.length} {data.items.length === 1 ? 'item' : 'items'}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          <AnimatePresence mode='popLayout'>
            {data.items.map((product, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.19, 1, 0.22, 1] }}
                className="group relative flex flex-col"
              >
                {/* Image Container */}
                <div 
                  className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#F9F9F9] cursor-pointer"
                  onClick={() => navigate(`/product/${product.product_id}`)}
                >
                  <img
                    src={product.thumbnail || '/fallback-product.png'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-[0.19,1,0.22,1]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                </div>

                {/* Details */}
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-[13px] tracking-wide text-orange-950 font-medium leading-relaxed group-hover:text-orange-600 transition-colors cursor-pointer"
                      onClick={() => navigate(`/product/${product.product_id}`)}
                    >
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-orange-900 font-bold">
                      $\{(parseFloat(product.price)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => navigate(`/product/${product.product_id}`)}
                  className="mt-6 w-full py-4 text-[9px] uppercase tracking-[0.25em] font-bold text-orange-900 border border-orange-200 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={12} />
                  View Product
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SharedWishlist;
