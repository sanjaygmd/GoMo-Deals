import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, User, Mail, Lock, Key, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import * as authService from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

const AdminRegisterPage = () => {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        staffName: '',
        email: '',
        password: '',
        role: 'admin',
        secretCode: ''
    });
    const [errors, setErrors] = useState({});
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();

    const validate = () => {
        let newErrors = {};
        if (!formData.staffName.trim()) newErrors.staffName = 'Staff Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!formData.secretCode.trim()) newErrors.secretCode = 'Admin Secret Code is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            setErrors({});
            try {
                await authService.sendAdminRegisterOTP({ email: formData.email });
                setShowOTP(true);
            } catch (err) {
                console.error("ADMIN SEND OTP ERROR:", err);
                setErrors({ 
                    submit: err.response?.data?.message || 'Failed to send OTP.' 
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        
        if (!otp || otp.length !== 6) {
            setErrors({ submit: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            // Re-use verifyOtp for admin since the backend route is generic enough if we use the admin endpoint
            // Wait, we need an endpoint for verifying admin registration OTP.
            // Actually, we can use the same verifyOTP if we provide purpose="admin_registration"
            // But let's just use a new service method or add purpose in the backend. 
            // In otpController, we saw admin route infers 'admin_registration'. Let's call /admin/verify-otp
            await authService.handleApiCall('post', '/admin/verify-otp', { email: formData.email, otp });

            const response = await authService.registerAdmin({
                name: formData.staffName,
                email: formData.email,
                password: formData.password,
                type: formData.role,
                masterKey: formData.secretCode
            });
            
            login(response.data);
            navigate('/admin-login'); 
        } catch (err) {
            console.error("ADMIN REGISTER ERROR:", err);
            setErrors({ 
                submit: err.response?.data?.message || 'Admin registration failed.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Glowing gold/orange radial spots */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl w-full px-8 py-12 md:px-14 md:py-16 bg-zinc-950/60 border border-zinc-800/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif text-white tracking-widest uppercase font-light">Admin Registry</h2>
                    <p className="text-orange-500 text-[10px] uppercase tracking-widest mt-2">Internal System Access Registration</p>
                    <p className="mt-4 text-center">
                        <Link to="/" className="text-orange-600 hover:text-orange-400 transition-colors text-xs tracking-widest uppercase font-black">
                            ← Back to Home
                        </Link>
                    </p>
                </div>

                {!showOTP ? (
                <form onSubmit={handleSendOTP} className="divide-y divide-zinc-800/60">
                    {errors.submit && (
                        <div className="pb-6">
                            <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] uppercase tracking-widest font-bold text-center rounded-xl">
                                {errors.submit}
                            </div>
                        </div>
                    )}

                    {/* Staff Name Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Staff Name</label>
                            <span className="text-[10px] text-zinc-500 block">Your administrative identity</span>
                        </div>
                        <div className="w-full sm:w-2/3 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-4.5 w-4.5 text-orange-500/60" />
                            </div>
                            <input 
                                type="text"
                                required
                                value={formData.staffName}
                                onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-600 focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                placeholder="Admin Name"
                            />
                        </div>
                    </div>

                    {/* System Role Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">System Role</label>
                            <span className="text-[10px] text-zinc-500 block">Access authorization level</span>
                        </div>
                        <div className="w-full sm:w-2/3 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <ShieldCheck className="h-4.5 w-4.5 text-orange-500/60" />
                            </div>
                            <select 
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="w-full pl-11 pr-10 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl appearance-none cursor-pointer focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                            >
                                <option value="admin" className="bg-zinc-950 text-white">Standard Admin</option>
                                <option value="super_admin" className="bg-zinc-950 text-white">Super Admin</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-orange-500/60 text-xs">
                                ▼
                            </div>
                        </div>
                    </div>

                    {/* Work Email Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Work Email</label>
                            <span className="text-[10px] text-zinc-500 block">Official contact email</span>
                        </div>
                        <div className="w-full sm:w-2/3 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4.5 w-4.5 text-orange-500/60" />
                            </div>
                            <input 
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-600 focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                placeholder="name@gomo.gift"
                            />
                        </div>
                    </div>

                    {/* Security Password Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Security Password</label>
                            <span className="text-[10px] text-zinc-500 block">Strong login password</span>
                        </div>
                        <div className="w-full sm:w-2/3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4.5 w-4.5 text-orange-500/60" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-11 pr-11 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-600 focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-widest">{errors.password}</p>}
                        </div>
                    </div>

                    {/* Admin Secret Key Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Admin Secret Key</label>
                            <span className="text-[10px] text-zinc-500 block">System registration master key</span>
                        </div>
                        <div className="w-full sm:w-2/3 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Key className="h-4.5 w-4.5 text-orange-500/60" />
                            </div>
                            <input 
                                type="password"
                                required
                                value={formData.secretCode}
                                onChange={(e) => setFormData({...formData, secretCode: e.target.value})}
                                className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-600 focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                placeholder="Enter System Secret"
                            />
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] uppercase tracking-[0.3em] font-black hover:from-orange-500 hover:to-amber-400 transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-orange-950/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Initializing...' : 'Continue to Verification'} 
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </div>
                </form>
                ) : (
                <form onSubmit={handleVerifyAndRegister} className="divide-y divide-zinc-800/60">
                    {errors.submit && (
                        <div className="pb-6">
                            <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] uppercase tracking-widest font-bold text-center rounded-xl">
                                {errors.submit}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                        <div className="w-full sm:w-1/3 space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Verification Code</label>
                            <span className="text-[10px] text-zinc-500 block">Enter 6-digit OTP code sent to {formData.email}</span>
                        </div>
                        <div className="w-full sm:w-2/3">
                            <input 
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl text-center tracking-[0.5em] font-bold focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                    <div className="pt-8 space-y-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] uppercase tracking-[0.3em] font-black hover:from-orange-500 hover:to-amber-400 transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-orange-950/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Verifying...' : 'Verify & Register'} 
                            {!loading && <ArrowRight size={16} />}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setShowOTP(false)}
                            className="w-full py-4 text-[10px] text-orange-500 uppercase tracking-widest font-black hover:text-white transition-colors text-center block bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/60 rounded-xl"
                        >
                            Back to Form
                        </button>
                    </div>
                </form>
                )}

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest">
                        Already registered? <Link to="/admin-login" className="text-white font-bold hover:text-orange-400 transition-colors">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminRegisterPage;
