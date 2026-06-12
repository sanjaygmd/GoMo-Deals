import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../context/ShopContext';
import { X, Scale } from 'lucide-react';
import CompareModal from './CompareModal';

const CompareTray = () => {
    const { compareItems, removeFromCompare, clearCompare } = useShop();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (compareItems.length === 0) return null;

    return (
        <>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
            >
                <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-orange-100/50 rounded-2xl p-4 flex items-center justify-between gap-4 pointer-events-auto">
                    
                    <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 mr-4 shrink-0">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                <Scale size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-orange-955">Compare Vendors</p>
                                <p className="text-[10px] text-orange-600/70">{compareItems.length} item(s)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <AnimatePresence>
                                {compareItems.map(item => (
                                    <motion.div 
                                        key={item.product_id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-orange-100 shrink-0 group"
                                    >
                                        <img src={item.thumbnail || item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeFromCompare(item.product_id)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} className="text-white" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={clearCompare}
                            className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-600 px-2"
                        >
                            Clear
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            disabled={compareItems.length < 1}
                            className="bg-orange-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition-all"
                        >
                            Compare Now
                        </button>
                    </div>
                </div>
            </motion.div>

            <CompareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default CompareTray;
