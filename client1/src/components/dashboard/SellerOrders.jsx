import React from 'react';
import { ShoppingCart } from 'lucide-react';

const SellerOrders = () => {
    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-orange-900">Orders</h2>
                    <p className="text-orange-500 text-sm mt-1">Track and manage your customer orders.</p>
                </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart className="text-orange-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">No Active Orders</h3>
                <p className="text-orange-500 max-w-sm mx-auto mb-8">When customers place orders for your products, they will appear here.</p>
            </div>
        </div>
    );
};

export default SellerOrders;
