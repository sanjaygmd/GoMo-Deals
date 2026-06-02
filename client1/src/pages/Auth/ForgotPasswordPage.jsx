import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import * as authService from '../../services/authService';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine userType from path
    const path = location.pathname;
    let userType = 'customer';
    if (path.includes('seller')) userType = 'seller';
    if (path.includes('admin')) userType = 'admin';

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const endpoint = `/${userType}/send-otp`;
            await authService.handleApiCall('post', endpoint, { 
                email, 
                purpose: 'forgot_password', 
                user_type: userType 
            });
            setStep(2);
            setSuccess('OTP sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please check the email and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.handleApiCall('post', '/reset-password', {
                email,
                otp,
                newPassword,
                user_type: userType
            });
            
            setSuccess('Password reset successfully!');
            setTimeout(() => {
                if (userType === 'seller') navigate('/seller/login');
                else if (userType === 'admin') navigate('/admin-login');
                else navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Invalid OTP or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-6">
            <div className="max-w-md mx-auto text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Lock className="text-orange-900" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-serif tracking-widest uppercase mb-4">Reset Password</h2>
                    <p className="text-orange-500 text-sm tracking-wider mb-10 px-8">
                        {step === 1 ? `Enter your ${userType} email to receive an OTP.` : `Enter the OTP and your new password.`}
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-6 text-left"
                >
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest font-bold text-center">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 border border-green-100 text-green-600 text-[10px] uppercase tracking-widest font-bold text-center">
                            {success}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-orange-300" />
                                </div>
                                <input 
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-orange-50/50 border border-orange-100 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm rounded-sm"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 bg-orange-900 text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-orange-800 transition-all shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Sending OTP...' : 'Send Reset Link'} 
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyAndReset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-orange-900">OTP Code</label>
                                <input 
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm rounded-sm tracking-[0.5em] text-center font-bold"
                                    placeholder="••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-orange-900">New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-4 pr-11 py-3 bg-orange-50/50 border border-orange-100 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm rounded-sm"
                                        placeholder="Min 8 characters"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 bg-orange-900 text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-orange-800 transition-all shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'} 
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
