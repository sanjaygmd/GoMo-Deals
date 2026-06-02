import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import '../../styles/auth.css';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import * as authService from '../../services/authService';

const LoginPage = () => {
    const { login } = useAuth();
    const { t } = useShop();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpTimer, setOtpTimer] = useState(0);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        let newErrors = {};
        if (!formData.email) {
            newErrors.email = t('email_required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('email_invalid');
        }

        if (!formData.password) {
            newErrors.password = t('password_required');
        } else if (formData.password.length < 8) {
            newErrors.password = t('password_length_error');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (requiresOtp) {
            if (!otp || otp.length !== 6) {
                setErrors({ submit: 'Please enter a valid 6-digit OTP' });
                return;
            }
            
            setLoading(true);
            setErrors({});
            try {
                const response = await authService.login(formData.email, formData.password, otp);
                login(response.data);
                navigate('/');
            } catch (err) {
                console.error("LOGIN OTP VERIFY ERROR:", err);
                setErrors({ submit: err.response?.data?.message || 'Failed to verify OTP' });
            } finally {
                setLoading(false);
            }
            return;
        }

        if (validate()) {
            setLoading(true);
            setErrors({});
            try {
                const response = await authService.login(formData.email, formData.password);
                if (response.requiresOtp) {
                    setRequiresOtp(true);
                    setOtpTimer(600); // 10 minutes
                    
                    // Simple timer logic
                    const interval = setInterval(() => {
                        setOtpTimer(prev => {
                            if (prev <= 1) {
                                clearInterval(interval);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                } else {
                    login(response.data);
                    navigate('/');
                }
            } catch (err) {
                console.error("LOGIN ERROR:", err);
                setErrors({ 
                    submit: err.response?.data?.message || t('login_failed_desc'),
                    isBlocked: err.response?.status === 403
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="min-h-screen auth-bg flex items-center justify-center">
            <div className="auth-card">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-orange-600/80 block mb-3.5 font-bold">GoMo Deals</span>
                    <h2 className="text-4xl font-serif italic text-orange-950 font-normal mb-3">{t("sign_in")}</h2>
                    <p className="text-orange-950/60 text-[9px] uppercase tracking-[0.18em] font-bold max-w-xs mx-auto leading-relaxed">
                        {t("sign_in_desc")}
                    </p>
                </motion.div>

                <motion.form 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                >
                    {errors.submit && (
                        <div className="p-5 bg-rose-50 border border-rose-100 text-rose-800 rounded-none transition-all duration-300">
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-700">{t("security_alert")}</span>
                                <p className="text-sm font-serif italic text-orange-950 leading-tight">
                                    {errors.isBlocked ? t("access_restricted") : t("auth_failed")}
                                </p>
                                <div className="h-[1px] w-10 bg-rose-200 my-1" />
                                <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed text-rose-700">
                                    {errors.submit}
                                </p>
                            </div>
                        </div>
                    )}

                    {!requiresOtp ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("email_address")}</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                                    <input 
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({...formData, email: e.target.value});
                                            if (errors.email) setErrors({...errors, email: ''});
                                        }}
                                        placeholder="name@example.com"
                                        className={`w-full pl-12 pr-4 py-4 bg-[#faf8f5] border ${errors.email ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30`}
                                    />
                                </div>
                                {errors.email && <p className="text-[9px] text-red-500 uppercase tracking-widest font-extrabold mt-1">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("password")}</label>
                                    <Link to="/forgot-password" className="text-[9px] uppercase tracking-wider text-orange-600/80 hover:text-orange-950 transition-colors font-bold">{t("forgot_password")}</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({...formData, password: e.target.value});
                                            if (errors.password) setErrors({...errors, password: ''});
                                        }}
                                        placeholder="••••••••"
                                        className={`w-full pl-12 pr-12 py-4 bg-[#faf8f5] border ${errors.password ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30`}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-950/45 hover:text-orange-950 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[9px] text-red-500 uppercase tracking-widest font-extrabold mt-1">{errors.password}</p>}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">Enter OTP</label>
                            <p className="text-xs text-orange-950/60 mb-2">An OTP has been sent to {formData.email}</p>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                                <input 
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        if (errors.submit) setErrors({});
                                    }}
                                    placeholder="000000"
                                    className={`w-full pl-12 pr-4 py-4 bg-[#faf8f5] border ${errors.submit ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30 tracking-[1em] text-center font-bold`}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] uppercase tracking-widest text-orange-950/50">
                                    {otpTimer > 0 ? `Expires in ${formatTime(otpTimer)}` : 'Expired'}
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => { setRequiresOtp(false); setOtp(''); }}
                                    className="text-[9px] uppercase tracking-widest text-orange-600 font-bold hover:text-orange-950 transition-colors"
                                >
                                    Change Email
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 bg-orange-950 text-white text-[9px] uppercase tracking-[0.4em] font-black hover:bg-orange-900 transition-all duration-300 shadow-[0_8px_30px_rgba(67,23,5,0.12)] flex items-center justify-center gap-3 group rounded-none cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (requiresOtp ? 'VERIFYING...' : t("signing_in")) : (requiresOtp ? 'VERIFY OTP' : t("sign_in"))} 
                        {!loading && <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </motion.form>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-12 text-center"
                >
                    <p className="text-center mt-6">
                        <Link to="/" className="text-orange-700 hover:underline text-sm">
                            {t("back_to_home")}
                        </Link>
                    </p>
                    <p className="text-orange-950/60 text-[10px] tracking-wider uppercase font-bold mt-4">
                        {t("no_account")} {' '}
                        <Link to="/register" className="text-orange-950 font-black border-b border-orange-950/30 pb-0.5 hover:border-orange-950 hover:text-orange-600 transition-all uppercase text-[10px] tracking-widest ml-1.5">{t("create_one")}</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;

