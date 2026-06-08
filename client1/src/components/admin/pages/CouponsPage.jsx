import React, { useState, useEffect, useMemo } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../../services/couponService';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../hooks/use-toast';
import { 
    Ticket, Plus, Search, Filter, MoreVertical, Edit2, 
    Trash2, Clock, CheckCircle2, XCircle, AlertCircle,
    TrendingUp, Users, Activity, X, Loader2
} from 'lucide-react';
import { StatCard } from '../../admin/components/StatCard';
import { cn } from '../../../lib/utils';
import ConfirmModal from '../../common/ConfirmModal';

import api from '../../../services/api.js';

const inputClass = "w-full h-11 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]";
const labelClass = "text-[9px] font-black text-stone-600 uppercase tracking-widest mb-1.5 block ml-1";

export default function CouponsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, code: '' });
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        discount_percent: '',
        max_discount: '',
        min_order_value: '',
        valid_until: '',
        max_usage: '',
        is_active: true,
        category: 'all',
        category_ids: []
    });
    const [categoriesList, setCategoriesList] = useState([]);

    useEffect(() => {
        fetchCoupons();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            if (res.data.success) {
                setCategoriesList(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await getAllCoupons();
            if (res.success) {
                setCoupons(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const active = coupons.filter(c => c.is_active && (!c.valid_until || new Date(c.valid_until) >= new Date())).length;
        const totalUsed = coupons.reduce((acc, c) => acc + (parseInt(c.used_count) || 0), 0);
        return [
            { title: "Total Coupons", value: coupons.length, todayValue: "Configured Offers", type: "neutral", icon: Ticket },
            { title: "Active Now", value: active, todayValue: "Live Campaigns", type: "positive", icon: Activity },
            { title: "Redemptions", value: totalUsed, todayValue: "Used by Customers", type: "positive", icon: TrendingUp }
        ];
    }, [coupons]);

    const filteredCoupons = useMemo(() => {
        return coupons.filter(c => 
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [coupons, searchQuery]);

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                type: coupon.type,
                discount_percent: coupon.discount_percent,
                max_discount: coupon.max_discount,
                min_order_value: coupon.min_order_value,
                valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : '',
                max_usage: coupon.max_usage || '',
                is_active: coupon.is_active,
                category: coupon.category || 'all',
                category_ids: coupon.category_ids || []
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                type: 'percentage',
                discount_percent: '',
                max_discount: '',
                min_order_value: '',
                valid_until: '',
                max_usage: '',
                is_active: true,
                category: 'all',
                category_ids: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = editingCoupon 
                ? await updateCoupon(editingCoupon.coupon_id, formData)
                : await createCoupon(formData);
            
            if (res.success) {
                toast({
                    title: editingCoupon ? "Coupon Updated" : "Coupon Created",
                    description: `Code ${formData.code} is now ${formData.is_active ? 'active' : 'inactive'}.`
                });
                setIsModalOpen(false);
                fetchCoupons();
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (id, code) => {
        try {
            const res = await deleteCoupon(id);
            if (res.success) {
                toast({ title: "Coupon Deleted", description: `Code ${code} has been removed.` });
                fetchCoupons();
            } else {
                toast({ title: "Delete Failed", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not delete coupon.", variant: "destructive" });
        } finally {
            setConfirmModal({ isOpen: false, id: null, code: '' });
        }
    };

    return (
        <div className="space-y-12 pb-16">
            
            {/* Elegant Welcome Banner */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Ticket size={14} className="text-orange-600" />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Marketing Campaign Panel</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Campaign Coupons</h1>
                    <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
                        Design and manage promotional reward campaigns, discount ceilings, and coupon usage records.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="px-8 py-3 bg-orange-955 text-white hover:bg-orange-850 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
                    >
                        <Plus size={14} /> Create New Coupon
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <StatCard 
                        key={i}
                        title={stat.title}
                        value={stat.value}
                        todayValue={stat.todayValue}
                        changeType={stat.type}
                        icon={stat.icon}
                    />
                ))}
            </div>

            {/* List Control */}
            <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <input 
                        type="text"
                        placeholder="Search codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-orange-50/50 border-b border-orange-100">
                                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Coupon Details</th>
                                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Discount Metrics</th>
                                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Usage Progress</th>
                                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-100 text-stone-850">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
                                            <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Syncing campaigns...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-orange-300">
                                            <Ticket size={32} className="opacity-40" />
                                            <p className="text-xs font-bold text-stone-500">No coupons match search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.coupon_id} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-orange-955 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {coupon.code.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-orange-955 uppercase tracking-wide">{coupon.code}</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Clock size={11} className="text-stone-400" />
                                                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                                                            Expiry: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div>
                                                <span className="text-sm font-bold text-orange-955">{coupon.discount_percent}%</span>
                                                <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider ml-1">Off</span>
                                                <div className="mt-1 flex flex-col gap-0.5">
                                                    <p className="text-[9px] font-bold text-stone-500">Cap: ₹{coupon.max_discount || 'None'}</p>
                                                    <p className="text-[9px] font-bold text-stone-500">Min Order: ₹{coupon.min_order_value}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-40">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-orange-955">{coupon.used_count} <span className="text-stone-450">/ {coupon.max_usage || '∞'}</span></span>
                                                    <span className="text-[8px] font-black text-stone-500 uppercase tracking-wider">Redeemed</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-orange-50 rounded-full overflow-hidden border border-orange-100">
                                                    <div 
                                                        className="h-full bg-orange-955 rounded-full transition-all duration-500" 
                                                        style={{ width: `${coupon.max_usage ? Math.min(100, (coupon.used_count / coupon.max_usage) * 100) : 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {(() => {
                                                const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                                                if (isExpired) return (
                                                    <div className="inline-flex items-center gap-1 text-rose-500">
                                                        <XCircle size={12} />
                                                        <span className="text-[8px] font-black uppercase tracking-wider">Expired</span>
                                                    </div>
                                                );
                                                return coupon.is_active ? (
                                                    <div className="inline-flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle2 size={12} />
                                                        <span className="text-[8px] font-black uppercase tracking-wider">Running</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-amber-500">
                                                        <AlertCircle size={12} />
                                                        <span className="text-[8px] font-black uppercase tracking-wider">Paused</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(coupon)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95 animate-none"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmModal({ isOpen: true, id: coupon.coupon_id, code: coupon.code })}
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-rose-600 hover:text-white border border-orange-150 hover:border-rose-300 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95 animate-none"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay (Light themed elegant overlay) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto no-scrollbar bg-orange-955/40 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-orange-100 p-8 animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 h-10 w-10 bg-orange-55 hover:bg-orange-105 border border-orange-205 rounded-full flex items-center justify-center text-orange-750 transition-all cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-extrabold text-orange-955 tracking-tight uppercase">{editingCoupon ? 'Edit Campaign' : 'Create Campaign'}</h2>
                                <p className="text-stone-500 text-xs font-bold mt-0.5">Configure your discount parameters</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Code Input */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Promotional Code</label>
                                            <input 
                                                type="text" 
                                                value={formData.code} 
                                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                                className="w-full h-12 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-base font-black tracking-wide focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] outline-none transition-all placeholder:text-stone-400"
                                                placeholder="OFFER2026"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Category Target (Multi-Select)</label>
                                            <select 
                                                multiple
                                                value={formData.category_ids} 
                                                onChange={(e) => {
                                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                    setFormData({...formData, category_ids: selected, category: selected.length === 0 ? 'all' : 'specific'});
                                                }}
                                                className="w-full h-24 px-4 py-2 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] outline-none transition-all no-scrollbar"
                                            >
                                                {categoriesList.map(cat => (
                                                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[8px] text-stone-400 mt-1 uppercase tracking-widest font-black ml-1">Hold CTRL/CMD to select multiple. Leave empty for all categories.</p>
                                        </div>
                                    </div>

                                    {/* Dual Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Discount %</label>
                                            <input 
                                                type="number" 
                                                value={formData.discount_percent} 
                                                onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                                                className={inputClass}
                                                placeholder="10"
                                                max="90"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Max Usage</label>
                                            <input 
                                                type="number" 
                                                value={formData.max_usage} 
                                                onChange={(e) => setFormData({...formData, max_usage: e.target.value})}
                                                className={inputClass}
                                                placeholder="Unlimited"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Max Discount (₹)</label>
                                            <input 
                                                type="number" 
                                                value={formData.max_discount} 
                                                onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                                                className={inputClass}
                                                placeholder="None"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Min Order (₹)</label>
                                            <input 
                                                type="number" 
                                                value={formData.min_order_value} 
                                                onChange={(e) => setFormData({...formData, min_order_value: e.target.value})}
                                                className={inputClass}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Validity Expiry</label>
                                        <input 
                                            type="date" 
                                            value={formData.valid_until} 
                                            onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2.5 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                        <input 
                                            type="checkbox" 
                                            id="is_active"
                                            checked={formData.is_active} 
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            className="w-4 h-4 rounded border-orange-200 text-orange-955 focus:ring-orange-955 cursor-pointer animate-none"
                                        />
                                        <label htmlFor="is_active" className="text-[10px] font-black text-orange-955 uppercase tracking-widest cursor-pointer">Active & Ready</label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        disabled={updating}
                                        className="flex-1 h-11 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={updating}
                                        className="flex-1 h-11 rounded-xl bg-orange-955 text-white font-black uppercase text-[10px] tracking-widest hover:bg-orange-850 transition-all cursor-pointer shadow-md flex items-center justify-center"
                                    >
                                        {updating ? <Loader2 className="animate-spin" /> : (editingCoupon ? 'Update' : 'Launch')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, code: '' })}
                onConfirm={() => handleDelete(confirmModal.id, confirmModal.code)}
                title="Delete Coupon"
                message={`Are you sure you want to delete coupon ${confirmModal.code}? This action cannot be undone.`}
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
