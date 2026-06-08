import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, ShoppingBag, Check, Scale } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useNavigate } from 'react-router-dom';

const CompareModal = ({ isOpen, onClose }) => {
    const { compareItems, formatPrice, addToCart, isInCart, removeFromCompare } = useShop();
    const navigate = useNavigate();

    if (!isOpen) return null;

    // We can show maximum 3 items
    const items = compareItems.slice(0, 3);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl bg-white shadow-2xl rounded-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-stone-50 border-b border-stone-100 px-6 py-5 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-black uppercase tracking-[0.2em] text-stone-800">Compare Products</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-all text-stone-500 hover:text-stone-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Headers Column */}
                        <div className="hidden md:flex flex-col border-r border-stone-100 pr-4">
                            <div className="h-64 mb-6"></div> {/* Spacer for image/title block */}
                            <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                                <div className="h-12 flex items-center">Price</div>
                                <div className="h-12 flex items-center">Rating</div>
                                <div className="h-12 flex items-center">Brand</div>
                                <div className="h-12 flex items-center">Category</div>
                                <div className="h-12 flex items-center">Weight</div>
                                <div className="h-12 flex items-center">Dimensions</div>
                            </div>
                        </div>

                        {/* Product Columns */}
                        {items.map((item, idx) => (
                            <div key={item.product_id || idx} className="flex flex-col relative group">
                                <button 
                                    onClick={() => {
                                        removeFromCompare(item.product_id);
                                        if (items.length === 1) onClose();
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-stone-400 hover:text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                    <X size={14} />
                                </button>
                                
                                <div className="h-64 mb-6 flex flex-col items-center text-center">
                                    <div 
                                        onClick={() => {
                                            onClose();
                                            navigate(`/product/${item.product_id}`);
                                        }}
                                        className="w-full h-40 bg-stone-50 rounded-xl overflow-hidden mb-4 cursor-pointer"
                                    >
                                        <img src={item.thumbnail || item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover mix-blend-multiply hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <h4 className="font-bold text-sm text-stone-800 line-clamp-2 mb-2 px-2 h-10">{item.name}</h4>
                                    <button
                                        onClick={() => addToCart(item)}
                                        className={`w-full max-w-[160px] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isInCart(item.product_id)
                                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-500/20'
                                        }`}
                                    >
                                        {isInCart(item.product_id) ? 'Added to Cart' : 'Add to Cart'}
                                    </button>
                                </div>

                                <div className="space-y-4 text-sm text-stone-700">
                                    {/* Price */}
                                    <div className="h-12 flex items-center justify-center md:justify-start border-t border-stone-50 md:border-t-0 pt-4 md:pt-0">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Price:</span>
                                        <span className="font-black text-orange-600">{formatPrice(item.price)}</span>
                                        {item.mrp > item.price && (
                                            <span className="text-[10px] text-stone-400 line-through ml-2">{formatPrice(item.mrp)}</span>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div className="h-12 flex items-center justify-center md:justify-start">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Rating:</span>
                                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                            <Star size={14} className="fill-current" />
                                            <span>{Number(item.rating || 4.2).toFixed(1)}</span>
                                        </div>
                                    </div>

                                    {/* Brand */}
                                    <div className="h-12 flex items-center justify-center md:justify-start">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Brand:</span>
                                        <span className="font-medium">{item.brand || '-'}</span>
                                    </div>

                                    {/* Category */}
                                    <div className="h-12 flex items-center justify-center md:justify-start">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Category:</span>
                                        <span className="font-medium text-stone-600 line-clamp-1">{item.category_name || '-'}</span>
                                    </div>

                                    {/* Weight */}
                                    <div className="h-12 flex items-center justify-center md:justify-start">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Weight:</span>
                                        <span className="font-medium text-stone-600">{item.weight ? `${item.weight} kg` : '-'}</span>
                                    </div>

                                    {/* Dimensions */}
                                    <div className="h-12 flex items-center justify-center md:justify-start">
                                        <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mr-2">Dimensions:</span>
                                        <span className="font-medium text-stone-600">
                                            {item.length && item.breadth && item.height ? `${item.length} x ${item.breadth} x ${item.height} cm` : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Empty placeholders */}
                        {Array.from({ length: 3 - items.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="hidden md:flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-100 rounded-xl">
                                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-2">
                                    <Scale size={20} />
                                </div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 text-center px-4">Add product<br/>to compare</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CompareModal;
