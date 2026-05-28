import React from 'react';
import { Package, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const SellerProducts = () => {
    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-orange-900">Products</h2>
                    <p className="text-orange-500 text-sm mt-1">Manage your store's inventory and listings.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20">
                    <Plus size={16} /> Add New Product
                </button>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <Package className="text-orange-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">No Products Yet</h3>
                <p className="text-orange-500 max-w-sm mx-auto mb-8">You haven't listed any products yet. Add your first product to start selling on GoMo Deals.</p>
                <button className="px-8 py-4 bg-orange-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20">
                    Create First Product
                </button>
            </div>
        </div>
    );
};

export default SellerProducts;
