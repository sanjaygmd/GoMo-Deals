import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import ProductCard from '../../components/common/ProductCard';
import { shareWishlist } from '../../services/wishlistService';
import { toast } from 'react-hot-toast';

const Wishlist = () => {
  const { wishlist } = useShop();
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    if (wishlist.length === 0) return;
    setIsSharing(true);
    
    // We only need to send basic info to generate a snapshot
    const items = wishlist.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      price: item.price,
      thumbnail: item.thumbnail
    }));

    const res = await shareWishlist(items);
    if (res.success) {
      setShareUrl(res.shareUrl);
    } else {
      toast.error(res.message || 'Failed to share wishlist');
    }
    setIsSharing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (wishlist.length === 0) {
    return (
      <div className="pt-16 pb-24 min-h-screen bg-[#fdfbf9] text-orange-900 flex items-center justify-center">
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
    <div className="pt-16 pb-24 min-h-screen bg-[#fdfbf9]">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 pb-12 border-b border-orange-100/40">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-600/75 block mb-4 font-bold">GoMo Deals</span>
            <h1 className="text-5xl md:text-6xl font-serif italic text-orange-955 font-normal">My Wishlist</h1>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <p className="text-orange-950/60 text-[9px] uppercase tracking-[0.2em] max-w-xs font-bold leading-relaxed md:text-right">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in wishlist.
            </p>
            <button 
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 bg-orange-50 text-orange-900 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-orange-100 transition-colors rounded-none border border-orange-200 disabled:opacity-50"
            >
              <Share2 size={14} />
              {isSharing ? 'Generating Link...' : 'Share Wishlist'}
            </button>
          </div>
        </header>

        {shareUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white border border-orange-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div>
              <h3 className="font-serif italic text-orange-950 text-xl mb-1">Your Shareable Link</h3>
              <p className="text-xs text-orange-900/60 uppercase tracking-widest font-bold">Link valid for 30 days</p>
            </div>
            <div className="flex w-full md:w-auto items-center">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="bg-orange-50/50 border border-orange-200 px-4 py-3 text-sm text-orange-900 w-full md:w-80 outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-orange-950 text-white px-6 py-3 border border-orange-950 hover:bg-orange-900 transition-colors flex items-center justify-center min-w-[120px]"
              >
                {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                <span className="text-[10px] uppercase tracking-widest font-bold">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </motion.div>
        )}

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
