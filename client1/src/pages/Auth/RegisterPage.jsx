import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Calendar, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import '../../styles/auth.css';
import { useShop } from '../../context/ShopContext';
import * as authService from '../../services/authService';

const RegisterPage = () => {
    const { t } = useShop();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        profilePicture: null,
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        let newErrors = {};
        if (!formData.fullName.trim()) {
            newErrors.fullName = t('full_name_required');
        }

        if (!formData.email) {
            newErrors.email = t('email_required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('email_invalid');
        }

        if (!formData.phone) {
            newErrors.phone = t('phone_required');
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = t('phone_invalid');
        }

        if (!formData.password) {
            newErrors.password = t('password_required');
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
            newErrors.password = t('password_complexity_error');
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('passwords_dont_match');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setLoading(true);
            try {
                let profilePictureBase64 = '';
                if (formData.profilePicture) {
                    profilePictureBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(formData.profilePicture);
                    });
                }

                await authService.sendOtp(formData.email);
                // Redirect to email verification with form data in state
                navigate('/verify-email', { 
                    state: { 
                        email: formData.email,
                        userData: {
                            full_name: formData.fullName,
                            email: formData.email,
                            phone: formData.phone,
                            date_of_birth: formData.dateOfBirth,
                            profile_picture_url: profilePictureBase64,
                            password: formData.password
                        }
                    } 
                });
            } catch (err) {
                console.error("REGISTER ERROR:", err);
                setErrors({ 
                    submit: err.response?.data?.message || t('failed_send_verification') 
                });
            } finally {
                setLoading(false);
            }
        }
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
                    <h2 className="text-4xl font-serif italic text-orange-950 font-normal mb-3">{t("join_title")}</h2>
                    <p className="text-orange-950/60 text-[9px] uppercase tracking-[0.18em] font-bold max-w-xs mx-auto leading-relaxed">
                        {t("join_desc")}
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
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-[9px] uppercase tracking-widest font-extrabold text-center rounded-none shadow-sm">
                            {errors.submit}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("full_name")}</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                            <input 
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => {
                                    setFormData({...formData, fullName: e.target.value});
                                    if (errors.fullName) setErrors({...errors, fullName: ''});
                                }}
                                placeholder="John Doe"
                                className={`w-full pl-12 pr-4 py-4 bg-[#faf8f5] border ${errors.fullName ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30`}
                            />
                        </div>
                        {errors.fullName && <p className="text-[9px] text-red-500 uppercase tracking-widest font-extrabold mt-1">{errors.fullName}</p>}
                    </div>

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
                        <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("phone_number")}</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                            <input 
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => {
                                    setFormData({...formData, phone: e.target.value});
                                    if (errors.phone) setErrors({...errors, phone: ''});
                                }}
                                placeholder="1234567890"
                                className={`w-full pl-12 pr-4 py-4 bg-[#faf8f5] border ${errors.phone ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30`}
                            />
                        </div>
                        {errors.phone && <p className="text-[9px] text-red-500 uppercase tracking-widest font-extrabold mt-1">{errors.phone}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("date_of_birth")}</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                                <input 
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-[#faf8f5] border border-orange-200/60 focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("profile_picture")}</label>
                            <div className="relative">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({...formData, profilePicture: e.target.files[0]})}
                                    className="w-full pl-12 pr-4 py-4 bg-[#faf8f5] border border-orange-200/60 focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-[9px] uppercase tracking-widest file:mr-4 file:py-1 file:px-2 file:rounded-none file:border-0 file:text-[9px] file:font-semibold file:bg-orange-950 file:text-white hover:file:bg-orange-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("password")}</label>
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
                                placeholder={t("password")}
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

                    <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-[0.25em] font-bold text-orange-950/70">{t("confirm_password")}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-950/45" size={16} strokeWidth={1.5} />
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    setFormData({...formData, confirmPassword: e.target.value});
                                    if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                                }}
                                placeholder={t("confirm_password")}
                                className={`w-full pl-12 pr-4 py-4 bg-[#faf8f5] border ${errors.confirmPassword ? 'border-red-500' : 'border-orange-200/60'} focus:border-orange-950 focus:bg-white outline-none transition-all duration-300 text-xs tracking-wider text-orange-950 rounded-none placeholder-orange-950/30`}
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-[9px] text-red-500 uppercase tracking-widest font-extrabold mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 bg-orange-950 text-white text-[9px] uppercase tracking-[0.4em] font-black hover:bg-orange-900 transition-all duration-300 shadow-[0_8px_30px_rgba(67,23,5,0.12)] flex items-center justify-center gap-3 group rounded-none cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t("sending_code") : t("create_account")} 
                        {!loading && <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </motion.form>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-12 text-center"
                >
                    <p className="mt-4 text-center"><Link to="/" className="text-orange-700 hover:underline">{t("back_to_home")}</Link></p>
                    <p className="text-orange-950/60 text-[10px] tracking-wider uppercase font-bold">
                        {t("already_have_account")} {' '}
                        <Link to="/login" className="text-orange-950 font-black border-b border-orange-950/30 pb-0.5 hover:border-orange-950 hover:text-orange-600 transition-all uppercase text-[10px] tracking-widest ml-1.5">{t("sign_in")}</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;

