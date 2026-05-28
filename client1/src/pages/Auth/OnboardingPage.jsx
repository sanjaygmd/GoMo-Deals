import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import * as authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const OnboardingPage = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        phone: user?.phone || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
    });

    React.useEffect(() => {
        const loadExistingAddress = async () => {
            if (user?.customer_id || user?.id) {
                try {
                    const response = await authService.getCustomerAddresses(user.customer_id || user.id);
                    if (response.success && response.data && response.data.length > 0) {
                        const addr = response.data[0];
                        setFormData({
                            phone: addr.phone || user.phone || '',
                            address1: addr.address_line_1 || '',
                            address2: addr.address_line_2 || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            zip: addr.pincode || '',
                            country: addr.country || 'India'
                        });
                    }
                } catch (err) {
                    console.error("Failed to load existing address:", err);
                }
            }
        };
        loadExistingAddress();
    }, [user]);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError('');
        try {
            await authService.customerOnboarding(user.customer_id || user.id, {
                full_name: user.full_name || user.name,
                phone: formData.phone,
                address_line_1: formData.address1,
                address_line_2: formData.address2,
                city: formData.city,
                state: formData.state,
                pincode: formData.zip,
                country: formData.country
            });
            updateUser({ onboarding_completed: true });
            navigate('/profile');
        } catch (err) {
            console.error("ONBOARDING ERROR:", err);
            setError(err.response?.data?.message || 'Onboarding failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-6">
            <div className="max-w-2xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-serif tracking-widest uppercase mb-4">Final Touches</h2>
                    <p className="text-orange-500 text-sm tracking-wider">Help us personalize your gifting experience by providing your delivery details.</p>
                </motion.div>

                <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    onSubmit={handleSubmit} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {error && (
                        <div className="md:col-span-2 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                            <input 
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="+91 98765 43210"
                                className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Address Line 1</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                            <input 
                                type="text"
                                required
                                value={formData.address1}
                                onChange={(e) => setFormData({...formData, address1: e.target.value})}
                                placeholder="House / Flat No, Street Name"
                                className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Address Line 2 (Optional)</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                            <input 
                                type="text"
                                value={formData.address2}
                                onChange={(e) => setFormData({...formData, address2: e.target.value})}
                                placeholder="Landmark, Area"
                                className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">City</label>
                        <input 
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            placeholder="Mumbai"
                            className="w-full px-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">State / Province</label>
                        <input 
                            type="text"
                            required
                            value={formData.state}
                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                            placeholder="Maharashtra"
                            className="w-full px-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Zip / Postal Code</label>
                        <input 
                            type="text"
                            required
                            value={formData.zip}
                            onChange={(e) => setFormData({...formData, zip: e.target.value})}
                            placeholder="400001"
                            className="w-full px-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Country</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                            <select 
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 focus:border-orange-600 focus:bg-white outline-none transition-all duration-300 text-sm tracking-wide appearance-none"
                            >
                                <option value="India">India</option>
                                <option value="United States">United States</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Canada">Canada</option>
                                <option value="Australia">Australia</option>
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-6">
                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 bg-orange-900 text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-orange-800 transition-all duration-300 shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving Profile...' : 'Complete Profile'} 
                            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default OnboardingPage;

