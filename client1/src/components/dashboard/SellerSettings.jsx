import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerSettings = () => {
    const { user } = useAuth();

    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-orange-900">Settings</h2>
                    <p className="text-orange-500 text-sm mt-1">Manage your store profile and configurations.</p>
                </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 max-w-2xl">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-orange-100">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <Settings className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-orange-900">Store Details</h3>
                        <p className="text-sm text-orange-500">Update your business information.</p>
                    </div>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Store Name</label>
                        <input 
                            type="text" 
                            disabled
                            value={user?.store_name || ''}
                            className="w-full bg-orange-50 border border-orange-200 px-4 py-3 text-sm rounded-xl focus:outline-none opacity-70 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-orange-400 mt-2">Store name cannot be changed easily. Contact support to update.</p>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Contact Email</label>
                        <input 
                            type="email" 
                            disabled
                            value={user?.email || ''}
                            className="w-full bg-orange-50 border border-orange-200 px-4 py-3 text-sm rounded-xl focus:outline-none opacity-70 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-orange-400 mb-2 block">Phone Number</label>
                        <input 
                            type="text" 
                            defaultValue={user?.phone || ''}
                            className="w-full bg-white border border-orange-200 px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    <button className="px-8 py-3 bg-orange-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SellerSettings;
