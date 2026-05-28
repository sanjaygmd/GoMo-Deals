import React from 'react';
import { BarChart2 } from 'lucide-react';

const SellerAnalytics = () => {
    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-orange-900">Analytics</h2>
                    <p className="text-orange-500 text-sm mt-1">Detailed insights into your store's performance.</p>
                </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <BarChart2 className="text-orange-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">Not Enough Data</h3>
                <p className="text-orange-500 max-w-sm mx-auto mb-8">We need more sales data to generate meaningful insights and charts for your store.</p>
            </div>
        </div>
    );
};

export default SellerAnalytics;
