import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingBag, Check, ExternalLink, Truck, Loader2, Camera } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { api } from '../../services/api';

const CompareModal = ({ isOpen, onClose }) => {
    const { compareItems, formatPrice, addToCart, isInCart } = useShop();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isVisualSearching, setIsVisualSearching] = useState(false);

    const item = compareItems[0];

    useEffect(() => {
        if (!isOpen || !item) return;

        let isMounted = true;
        const fetchVendors = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/products/${item.product_id || item.id}/compare-vendors`);
                if (res.data && res.data.success && isMounted) {
                    const data = res.data.data;
                    const vList = [
                        {
                            id: 'gomo',
                            name: 'GoMo Deals',
                            color: 'text-orange-600',
                            bg: 'bg-orange-50',
                            border: 'border-orange-200',
                            price: item.price,
                            rating: item.rating || 4.2,
                            delivery: '1-2 Days (Free)',
                            actionText: 'Add to Cart',
                            isPrimary: true,
                            available: true
                        },
                        {
                            id: 'amazon',
                            name: 'Amazon',
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            border: 'border-blue-200',
                            price: data.amazon.price,
                            rating: data.amazon.rating,
                            delivery: data.amazon.delivery,
                            actionText: 'View on Amazon',
                            isPrimary: false,
                            available: data.amazon.available,
                            searchQuery: data.amazon.exactSearchQuery
                        },
                        {
                            id: 'flipkart',
                            name: 'Flipkart',
                            color: 'text-yellow-600',
                            bg: 'bg-yellow-50',
                            border: 'border-yellow-200',
                            price: data.flipkart.price,
                            rating: data.flipkart.rating,
                            delivery: data.flipkart.delivery,
                            actionText: 'View on Flipkart',
                            isPrimary: false,
                            available: data.flipkart.available,
                            searchQuery: data.flipkart.exactSearchQuery
                        },
                        {
                            id: 'meesho',
                            name: 'Meesho',
                            color: 'text-pink-600',
                            bg: 'bg-pink-50',
                            border: 'border-pink-200',
                            price: data.meesho.price,
                            rating: data.meesho.rating,
                            delivery: data.meesho.delivery,
                            actionText: 'View on Meesho',
                            isPrimary: false,
                            available: data.meesho.available,
                            searchQuery: data.meesho.exactSearchQuery
                        }
                    ];
                    setVendors(vList);
                }
            } catch (error) {
                console.error("Failed to fetch comparison data", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchVendors();

        return () => {
            isMounted = false;
        };
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    const handleAction = (vendorId) => {
        if (vendorId === 'gomo') {
            addToCart(item);
        } else {
            const vendor = vendors.find(v => v.id === vendorId);
            if (!vendor || !vendor.available) return;
            const query = vendor.searchQuery || item.name;
            if (vendorId === 'amazon') {
                window.open(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, '_blank');
            } else if (vendorId === 'flipkart') {
                window.open(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, '_blank');
            } else if (vendorId === 'meesho') {
                window.open(`https://www.meesho.com/search?q=${encodeURIComponent(query)}`, '_blank');
            }
        }
    };

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
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black uppercase tracking-[0.2em] text-stone-800">Compare Vendors</h3>
                        <span className="text-sm font-medium text-stone-500 hidden sm:inline-block">for {item.name}</span>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-all text-stone-500 hover:text-stone-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Product Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-lg overflow-hidden shrink-0 border border-stone-200">
                                <img src={item.thumbnail || item.image || '/fallback-product.png'} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-stone-800 mb-2">{item.name}</h2>
                                <p className="text-sm text-stone-500 line-clamp-2">{item.description || 'Compare prices across top platforms to get the best deal.'}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0">
                            <button
                                disabled={isVisualSearching}
                                onClick={async () => {
                                    const imgUrl = item.thumbnail || item.image || (item.pi_images && item.pi_images[0]?.image_url);
                                    if (!imgUrl) return alert("No image available to search.");

                                    if (imgUrl.startsWith('http') && !imgUrl.includes('localhost') && !imgUrl.includes('127.0.0.1')) {
                                        window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`, '_blank');
                                    } else {
                                        try {
                                            setIsVisualSearching(true);

                                            // Convert local image to base64 in the browser to avoid backend path resolution issues
                                            let finalImgUrl = imgUrl;
                                            if (!imgUrl.startsWith('data:image')) {
                                                const response = await fetch(imgUrl);
                                                const blob = await response.blob();
                                                finalImgUrl = await new Promise((resolve, reject) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => resolve(reader.result);
                                                    reader.onerror = reject;
                                                    reader.readAsDataURL(blob);
                                                });
                                            }

                                            const res = await api.post('/products/visual-search', { imgUrl: finalImgUrl });
                                            if (res.data && res.data.success) {
                                                const exactQuery = res.data.query;
                                                window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(exactQuery)}`, '_blank');
                                            } else {
                                                alert("Could not identify the product in the image.");
                                            }
                                        } catch(err) {
                                            console.error(err);
                                            alert("Failed to analyze image: " + (err.response?.data?.message || err.message));
                                        } finally {
                                            setIsVisualSearching(false);
                                        }
                                    }
                                }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                                    isVisualSearching 
                                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 border border-indigo-200'
                                }`}
                            >
                                {isVisualSearching ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                {isVisualSearching ? 'Analyzing...' : 'Visual Search'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Headers Column */}
                        <div className="hidden md:flex flex-col border-r border-stone-100 pr-4 mt-[72px]">
                            <div className="space-y-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                                <div className="h-12 flex items-center">Price</div>
                                <div className="h-12 flex items-center">Rating</div>
                                <div className="h-12 flex items-center">Delivery</div>
                                <div className="h-12 flex items-center">Platform</div>
                            </div>
                        </div>

                        {/* Vendor Columns */}
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex flex-col relative rounded-xl p-4 bg-white border border-stone-200 animate-pulse">
                                    <div className="h-16 mb-4 flex items-center justify-center">
                                        <div className="w-24 h-6 bg-stone-200 rounded"></div>
                                    </div>
                                    <div className="space-y-4 text-sm">
                                        <div className="h-12 flex flex-col items-center justify-center pt-4 md:pt-0">
                                            <div className="w-16 h-6 bg-stone-200 rounded mb-1"></div>
                                        </div>
                                        <div className="h-12 flex flex-col items-center justify-center">
                                            <div className="w-12 h-4 bg-stone-200 rounded"></div>
                                        </div>
                                        <div className="h-12 flex flex-col items-center justify-center">
                                            <div className="w-20 h-4 bg-stone-200 rounded"></div>
                                        </div>
                                        <div className="h-16 flex items-center justify-center mt-4">
                                            <div className="w-full h-10 bg-stone-200 rounded-xl"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            vendors.map((vendor) => (
                                <div key={vendor.id} className={`flex flex-col relative rounded-xl p-4 transition-all ${vendor.isPrimary ? 'bg-orange-50/50 border-2 border-orange-400 shadow-sm' : 'bg-white border border-stone-200 hover:border-stone-300'}`}>
                                    
                                    {vendor.isPrimary && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                                            Best Deal
                                        </div>
                                    )}

                                    <div className="h-16 mb-4 flex items-center justify-center">
                                        <h4 className={`font-black text-lg uppercase tracking-wider ${!vendor.available ? 'text-stone-400' : vendor.color}`}>{vendor.name}</h4>
                                    </div>

                                    <div className="space-y-4 text-sm text-stone-700">
                                        {/* Price */}
                                        <div className="h-12 flex flex-col items-center justify-center border-t border-stone-100 md:border-t-0 pt-4 md:pt-0">
                                            <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mb-1">Price</span>
                                            {vendor.available ? (
                                                <span className={`font-black text-xl ${vendor.isPrimary ? 'text-orange-600' : 'text-stone-800'}`}>
                                                    {formatPrice(vendor.price)}
                                                </span>
                                            ) : (
                                                <span className="font-bold text-stone-400 text-sm">Unavailable</span>
                                            )}
                                        </div>

                                        {/* Rating */}
                                        <div className="h-12 flex flex-col items-center justify-center">
                                            <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mb-1">Rating</span>
                                            {vendor.available ? (
                                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                    <Star size={16} className="fill-current" />
                                                    <span>{Number(vendor.rating).toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-stone-300">-</span>
                                            )}
                                        </div>

                                        {/* Delivery */}
                                        <div className="h-12 flex flex-col items-center justify-center">
                                            <span className="md:hidden text-[10px] uppercase font-bold text-stone-400 mb-1">Delivery</span>
                                            {vendor.available ? (
                                                <div className="flex items-center gap-2 font-medium text-stone-600">
                                                    <Truck size={16} className="text-stone-400" />
                                                    <span>{vendor.delivery}</span>
                                                </div>
                                            ) : (
                                                <span className="text-stone-300">-</span>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="h-16 flex items-center justify-center mt-4">
                                            <button
                                                disabled={!vendor.available}
                                                onClick={() => handleAction(vendor.id)}
                                                className={`w-full py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                    !vendor.available 
                                                        ? 'bg-stone-50 text-stone-300 cursor-not-allowed border border-stone-200' 
                                                        : vendor.isPrimary
                                                            ? (isInCart(item.product_id) ? 'bg-orange-100 text-orange-700' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-500/20')
                                                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                                }`}
                                            >
                                                {vendor.isPrimary ? (
                                                    isInCart(item.product_id) ? <Check size={16} /> : <ShoppingBag size={16} />
                                                ) : (
                                                    vendor.available ? <ExternalLink size={16} /> : <X size={16} />
                                                )}
                                                <span className="text-center">{!vendor.available ? 'N/A' : (vendor.isPrimary && isInCart(item.product_id) ? 'Added to Cart' : vendor.actionText)}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CompareModal;
