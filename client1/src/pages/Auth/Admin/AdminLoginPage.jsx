import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import * as authService from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

const AdminLoginPage = () => {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [otp, setOtp] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'admin'
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        let newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            setErrors({});
            try {
                const response = await authService.loginAdmin(formData.email, formData.password, formData.role);
                
                if (response.requires2FA) {
                    setShow2FA(true);
                } else {
                    login(response.data);
                    navigate('/admin');
                }
            } catch (err) {
                console.error("ADMIN LOGIN ERROR:", err);
                setErrors({ 
                    submit: err.response?.data?.message || 'Authentication failed. Please check your credentials.' 
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const response = await authService.verifySuperAdminLogin(formData.email, otp);
            login(response.data);
            navigate('/admin');
        } catch (err) {
            console.error("2FA ERROR:", err);
            setErrors({ 
                submit: err.response?.data?.message || 'Invalid or expired code.' 
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
                    <h2 className="text-3xl font-serif text-white tracking-widest uppercase font-light">
                        {show2FA ? 'Security Verification' : 'Command Center'}
                    </h2>
                    <p className="text-orange-500 text-[10px] uppercase tracking-widest mt-2">
                        {show2FA ? 'Enter the code sent to your email' : 'Administrative Authentication'}
                    </p>
                    <p className="mt-4 text-center">
                        <Link to="/" className="text-orange-600 hover:text-orange-400 transition-colors text-xs tracking-widest uppercase font-black">
                            ← Back to Home
                        </Link>
                    </p>
                </div>

                {!show2FA ? (
                    <form onSubmit={handleSubmit} className="divide-y divide-zinc-800/60">
                        {errors.submit && (
                            <div className="pb-6">
                                <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] uppercase tracking-widest font-bold text-center rounded-xl">
                                    {errors.submit}
                                </div>
                            </div>
                        )}

                        {/* Access Role Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                            <div className="w-full sm:w-1/3 space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Access Role</label>
                                <span className="text-[10px] text-zinc-500 block">Select administration tier</span>
                            </div>
                            <div className="w-full sm:w-2/3 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'admin'})}
                                    className={`flex-1 py-3 px-4 text-[10px] uppercase tracking-[0.2em] font-black transition-all border rounded-xl ${formData.role === 'admin' ? 'bg-white text-zinc-950 border-white' : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}
                                >
                                    Admin
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, role: 'super_admin'})}
                                    className={`flex-1 py-3 px-4 text-[10px] uppercase tracking-[0.2em] font-black transition-all border rounded-xl ${formData.role === 'super_admin' ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20' : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}
                                >
                                    Super Admin
                                </button>
                            </div>
                        </div>

                        {/* Email Address Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                            <div className="w-full sm:w-1/3 space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Email Address</label>
                                <span className="text-[10px] text-zinc-500 block">Registered staff email</span>
                            </div>
                            <div className="w-full sm:w-2/3 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-orange-500/60" />
                                </div>
                                <input 
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-600 focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                    placeholder="admin@gomo.gift"
                                />
                            </div>
                        </div>

                        {/* Security Key Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                            <div className="w-full sm:w-1/3 space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Security Key</label>
                                <span className="text-[10px] text-zinc-500 block">Staff access password</span>
                            </div>
                            <div className="w-full sm:w-2/3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-orange-500/60" />
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

                        {/* Submit Button Container */}
                        <div className="pt-8">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] uppercase tracking-[0.3em] font-black hover:from-orange-500 hover:to-amber-400 transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-orange-950/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Initializing...' : 'Initialize Session'} 
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerify2FA} className="divide-y divide-zinc-800/60">
                        {errors.submit && (
                            <div className="pb-6">
                                <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] uppercase tracking-widest font-bold text-center rounded-xl">
                                    {errors.submit}
                                </div>
                            </div>
                        )}

                        {/* Verification Code Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                            <div className="w-full sm:w-1/3 space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-orange-500 block">Verification Code</label>
                                <span className="text-[10px] text-zinc-500 block">Enter 6-digit OTP code</span>
                            </div>
                            <div className="w-full sm:w-2/3">
                                <input 
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-zinc-900/40 border border-zinc-800 text-white focus:border-orange-500 focus:bg-zinc-900/60 outline-none transition-all text-xs rounded-xl text-center tracking-[0.5em] font-bold focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="pt-8 space-y-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] uppercase tracking-[0.3em] font-black hover:from-orange-500 hover:to-amber-400 transition-all rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-orange-950/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Access'} 
                                {!loading && <ArrowRight size={16} />}
                            </button>

                            <button 
                                type="button" 
                                onClick={() => setShow2FA(false)}
                                className="w-full py-4 text-[10px] text-orange-500 uppercase tracking-widest font-black hover:text-white transition-colors text-center block bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/60 rounded-xl"
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}

                {!show2FA && (
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-orange-400 uppercase tracking-widest">
                            New Administrator? <Link to="/admin-register" className="text-white font-bold hover:text-orange-400 transition-colors">Request Access</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLoginPage;

