import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShop } from '../../context/ShopContext';
import * as authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const VerifyEmailPage = () => {
    const { login } = useAuth();
    const { t } = useShop();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendDisabled, setResendDisabled] = useState(false);
    const [timer, setTimer] = useState(0);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { email, userData, userType } = location.state || {};

    const isSeller = userType === 'seller';

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) {
            setError(t('enter_full_code'));
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (isSeller) {
                await authService.verifySellerOtp(email, fullOtp);
                const response = await authService.registerSeller(userData);
                login(response.data);
                navigate('/seller-dashboard');
            } else {
                await authService.verifyOtp(email, fullOtp);
                const response = await authService.register(userData);
                login(response.data);
                navigate('/onboarding');
            }
        } catch (err) {
            console.error("VERIFICATION ERROR:", err);
            setError(err.response?.data?.message || t('auth_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setError('');
        try {
            if (isSeller) {
                await authService.sendSellerOtp(email);
            } else {
                await authService.sendOtp(email);
            }
            setResendDisabled(true);
            setTimer(60); // 60 seconds cooldown
        } catch (err) {
            setError(t('failed_resend'));
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
                        <Mail className="text-orange-900" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-serif tracking-widest uppercase mb-4">{t("verify_email_title")}</h2>
                    <p className="text-orange-500 text-sm tracking-wider mb-2 px-8">{t("verification_code_sent")}</p>
                    <p className="text-orange-900 text-sm font-bold tracking-wider mb-10">{email}</p>
                </motion.div>

                <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    onSubmit={handleSubmit} 
                    className="space-y-10"
                >
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] uppercase tracking-widest font-bold">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                            <input 
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 bg-orange-100 border border-orange-300 focus:border-orange-600 focus:bg-white text-center text-xl font-bold outline-none transition-all duration-300 rounded-sm shadow-inner"
                            />
                        ))}
                    </div>

                    <div className="space-y-6">
                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 bg-orange-900 text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-orange-800 transition-all duration-300 shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t("verifying") : t("verify_email_btn")} 
                            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>

                        <button 
                            type="button"
                            disabled={resendDisabled || loading}
                            onClick={handleResend}
                            className={`flex items-center gap-2 mx-auto text-[10px] uppercase tracking-widest ${resendDisabled || loading ? 'text-orange-300 cursor-not-allowed' : 'text-orange-400 hover:text-orange-900 transition-colors'}`}
                        >
                            <RefreshCcw size={14} className={loading && resendDisabled ? 'animate-spin' : ''} /> 
                            {resendDisabled ? t("resend_code_in", { timer }) : t("resend_code")}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
