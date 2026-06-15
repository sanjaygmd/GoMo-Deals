import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../admin/components/StatCard";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Search, Plus, Store, UserCheck, UserX, ShieldCheck, Clock,
  Star, Mail, Phone, MapPin, FileText, CheckCircle2, XCircle,
  AlertTriangle, Ban, Eye, TrendingUp, History, Download, X, Loader2, Trash2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../../../services/api";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";

const CHART_COLORS = ['#f97316', '#ea580c', '#0c0a09', '#c2410c', '#fdba74'];

const statusStyle = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Pending KYC": "border-orange-200 bg-orange-50 text-orange-700",
  Suspended: "border-rose-250 bg-rose-50 text-rose-800",
  Banned: "border-rose-250 bg-rose-50 text-rose-800",
};

export default function SellersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("");
  const [sellerToBlock, setSellerToBlock] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/sellers-data');
      if (resp.data.success) {
        setSellers(resp.data.data);
      }
    } catch (err) {
      console.error("Fetch sellers error:", err);
      toast({ title: "Fetch Failed", description: "Could not load sellers data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeller = async (seller) => {
    setSelectedSeller(seller);
    setLoadingDetails(true);
    setSellerDetails(null);
    try {
      const resp = await api.get(`/admin/seller/${seller.id}`);
      if (resp.data.success) {
        setSellerDetails(resp.data.data);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load seller details.", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVerifySeller = async (sellerId, isVerified) => {
    setUpdating(true);
    try {
      const resp = await api.patch(`/admin/seller/${sellerId}/verify`, { is_verified: isVerified });
      if (resp.data.success) {
        toast({ title: "KYC Updated", description: `Seller is now ${isVerified ? 'Verified' : 'Pending'}.` });
        setSellers(prev => prev.map(s => s.id === sellerId ? { 
          ...s, 
          is_verified: isVerified,
          status: s.is_active ? (isVerified ? 'Active' : 'Pending KYC') : 'Suspended'
        } : s));
        if (selectedSeller?.id === sellerId) {
          setSelectedSeller(prev => ({ 
            ...prev, 
            is_verified: isVerified,
            status: prev.is_active ? (isVerified ? 'Active' : 'Pending KYC') : 'Suspended'
          }));
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", description: "Could not verify seller.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;
    setUpdating(true);
    try {
      const resp = await api.delete(`/admin/seller/${sellerToDelete.id}`);
      if (resp.data.success) {
        toast({ title: "Account Purged", description: "Seller account and data removed." });
        setSellers(prev => prev.filter(s => s.id !== sellerToDelete.id));
        setShowDeleteModal(false);
        setSellerToDelete(null);
        if (selectedSeller?.id === sellerToDelete.id) {
          setSelectedSeller(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Deletion Failed", description: "Could not delete seller.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const updateSellerStatus = async (id, is_active, reason, duration) => {
    setUpdating(true);
    try {
      const resp = await api.patch(`/admin/seller/${id}/status`, { 
        is_active, 
        block_reason: reason,
        block_duration_days: duration 
      });
      if (resp.data.success) {
        toast({ 
          title: is_active ? "Seller Unblocked" : "Seller Blocked", 
          description: `Store status has been updated successfully.` 
        });
        setSellers(prev => prev.map(s => s.id === id ? { 
          ...s, 
          is_active: resp.data.is_active, 
          status: resp.data.is_active ? (s.is_verified ? 'Active' : 'Pending KYC') : 'Suspended',
          block_reason: resp.data.block_reason,
          blocked_until: resp.data.blocked_until
        } : s));
        if (selectedSeller?.id === id) {
          setSelectedSeller(prev => ({ 
            ...prev, 
            is_active: resp.data.is_active,
            status: resp.data.is_active ? (prev.is_verified ? 'Active' : 'Pending KYC') : 'Suspended',
            block_reason: resp.data.block_reason,
            blocked_until: resp.data.blocked_until
          }));
        }
        setShowBlockModal(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", description: "Could not change seller status.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (seller, isBlocking) => {
    if (isBlocking) {
      setSellerToBlock(seller);
      setBlockReason("");
      setBlockDuration("");
      setShowBlockModal(true);
    } else {
      await updateSellerStatus(seller.id, true, null, null);
    }
  };

  const performanceData = useMemo(() => {
    return sellers.filter(s => s.status === "Active").map(s => ({
      name: s.name.split(" ")[0].toUpperCase(),
      orders: parseInt(s.orders) || 0,
      rating: (parseFloat(s.rating) || 0) * 20
    })).slice(0, 8);
  }, [sellers]);

  const stats = useMemo(() => {
    return {
      total: sellers.length,
      active: sellers.filter(s => s.status === 'Active').length,
      pending: sellers.filter(s => s.status === 'Pending KYC').length,
      suspended: sellers.filter(s => s.status === 'Suspended').length
    };
  }, [sellers]);

  const filtered = useMemo(() => {
    return sellers.filter((s) => {
      const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.owner?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());
      if (tab === "all") return matchSearch;
      if (tab === "active") return matchSearch && s.status === "Active";
      if (tab === "pending") return matchSearch && s.status === "Pending KYC";
      if (tab === "suspended") return matchSearch && (s.status === "Suspended" || s.status === "Banned");
      return matchSearch;
    });
  }, [sellers, search, tab]);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Store size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Partner Ecosystem Governance</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Seller Ecosystem</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Onboarding, KYC verification, performance analytics, and merchant store suspensions.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Partners" value={stats.total} todayValue="Marketplace Scale" changeType="positive" icon={Store} />
        <StatCard title="Active Status" value={stats.active} todayValue={`${Math.round((stats.active / (stats.total || 1)) * 100)}% of Total`} changeType="positive" icon={UserCheck} />
        <StatCard title="Pending KYC" value={stats.pending} todayValue="Awaiting Review" changeType="neutral" icon={Clock} />
        <StatCard title="Suspended" value={stats.suspended} todayValue="Platform Risk Lock" changeType="negative" icon={UserX} />
      </div>

      {/* Seller Performance Chart */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm group overflow-hidden relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight uppercase">Partner Performance</h3>
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">Order velocity and rating score</p>
          </div>
          <TrendingUp className="text-orange-500 h-8 w-8" />
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#78716c' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', background: '#ffffff' }}
                itemStyle={{ fontWeight: 900, color: '#0c0a09', fontSize: '11px' }}
              />
              <Bar dataKey="orders" name="Total Orders" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="rating" name="Rating Score" fill="#0c0a09" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <input
            placeholder="Search partners, owners, or store IDs..."
            className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-orange-50/50 p-1 rounded-2xl gap-2 border border-orange-100 shadow-sm overflow-x-auto no-scrollbar">
          {[
            { key: "all", label: "All Assets" },
            { key: "active", label: "Verified" },
            { key: "pending", label: "KYC Pending" },
            { key: "suspended", label: "Restricted" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTab(f.key)}
              className={cn("px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap",
                f.key === tab 
                  ? "bg-orange-955 text-white shadow-md" 
                  : "text-orange-500 hover:bg-orange-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seller Grid */}
      {loading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-orange-50/50 rounded-3xl animate-pulse border border-orange-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 group flex flex-col relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 w-1.5 h-full transition-colors",
                s.is_active ? 'bg-orange-500' : 'bg-rose-500'
              )} />

              <div className="flex items-start justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Store className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                    statusStyle[s.status] || "border-orange-200 bg-orange-50 text-orange-700"
                  )}>
                    {s.status}
                  </span>
                  {!s.is_active && s.block_reason && (
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded max-w-[150px] truncate" title={s.block_reason}>
                        Reason: {s.block_reason}
                      </span>
                      {s.blocked_until && (
                         <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded max-w-[150px] truncate">
                           Until: {new Date(s.blocked_until).toLocaleDateString()}
                         </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-orange-955 tracking-wide uppercase truncate">{s.name}</h3>
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mt-1">Lead: {s.owner}</p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 bg-orange-50/20 p-2 rounded-lg border border-orange-100/50">
                  <Mail className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span className="text-xs font-bold text-stone-750 truncate">{s.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50/20 p-2 rounded-lg border border-orange-100/50">
                  <Phone className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span className="text-xs font-bold text-stone-750">{s.phone}</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y border-orange-100 text-center mb-6 mt-auto">
                <div>
                  <p className="text-lg font-bold text-orange-955">{s.products || 0}</p>
                  <p className="text-[8px] font-black text-stone-500 uppercase tracking-wider">Assets</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-955">{s.orders || 0}</p>
                  <p className="text-[8px] font-black text-stone-500 uppercase tracking-wider">Orders</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-955">{s.rating || '—'}</p>
                  <p className="text-[8px] font-black text-stone-500 uppercase tracking-wider">Score</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(s, s.is_active)}
                  disabled={updating}
                  className={cn("flex-1 h-11 rounded-xl font-black uppercase text-[9px] tracking-widest border transition-all cursor-pointer shadow-sm flex items-center justify-center",
                    s.is_active 
                      ? "bg-rose-50 border-rose-150 hover:bg-rose-600 hover:text-white hover:border-rose-300 text-rose-600" 
                      : "bg-orange-50 border-orange-150 hover:bg-orange-955 hover:text-white hover:border-orange-200 text-orange-600"
                  )}
                >
                  {updating ? <Loader2 size={14} className="animate-spin" /> : (s.is_active ? "Suspend" : "Activate")}
                </button>
                <button 
                  onClick={() => handleSelectSeller(s)}
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-orange-200">
              <div className="h-16 w-16 bg-orange-55 border border-orange-150 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-500">
                <Store className="h-8 w-8 text-orange-300" />
              </div>
              <h3 className="text-sm font-bold text-orange-955">No Partners Found</h3>
              <p className="text-[10px] text-stone-500 font-bold mt-1">Refine your search parameters or tab filters to find specific sellers.</p>
            </div>
          )}
        </div>
      )}

      {/* Seller Detail Overlay (Light drawer modal) */}
      {selectedSeller && (
        <div className="fixed inset-0 z-[100] overflow-y-auto no-scrollbar">
          <div 
            className="fixed inset-0 bg-orange-955/40 backdrop-blur-md animate-in fade-in duration-200" 
            onClick={() => setSelectedSeller(null)}
          />
          
          <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-orange-100 relative">
              <button
                onClick={() => setSelectedSeller(null)}
                className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-orange-55 hover:bg-orange-105 border border-orange-205 transition-all z-30 text-orange-750 cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Modal Cover Header */}
              <div className="h-44 bg-gradient-to-r from-orange-955 to-orange-850 relative overflow-hidden flex items-end p-8">
                <div className="absolute top-[-40%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-20 w-20 rounded-2xl bg-white p-1 border border-orange-200/50 shadow-md">
                    <div className="h-full w-full rounded-xl bg-orange-955 flex items-center justify-center text-white text-3xl font-black">
                      {selectedSeller.name?.charAt(0)}
                    </div>
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-extrabold tracking-wide uppercase leading-none mb-1.5">{selectedSeller.name}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-orange-300 uppercase tracking-widest">Store ID:</span>
                      <span className="font-mono text-[9px] font-bold text-orange-100 uppercase">#{selectedSeller.id.split('-')[0].toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                
                <div className="flex justify-between items-center border-b border-orange-100 pb-4">
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Store Status</span>
                  <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                    selectedSeller.is_active ? "border-emerald-250 bg-emerald-50 text-emerald-800" : "border-rose-250 bg-rose-50 text-rose-800"
                  )}>
                    {selectedSeller.status}
                  </div>
                </div>

                {selectedSeller.block_reason && !selectedSeller.is_active && (
                  <div className="p-4 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl flex items-start gap-3 shadow-inner">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Restriction Reason</p>
                      <p className="text-xs font-bold text-rose-750 leading-relaxed">{selectedSeller.block_reason}</p>
                      {selectedSeller.blocked_until && (
                         <p className="text-[9px] mt-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded w-fit uppercase tracking-widest">
                           Expires: {new Date(selectedSeller.blocked_until).toLocaleDateString()}
                         </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Mail, label: "Official Email", value: selectedSeller.email, color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: Phone, label: "Contact Phone", value: selectedSeller.phone || 'N/A', color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: FileText, label: "AADHAR Identity", value: sellerDetails?.aadhar || 'Not Provided', color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: ShieldCheck, label: "GSTIN Tax ID", value: sellerDetails?.gstin || 'Not Provided', color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: History, label: "PAN Identifier", value: sellerDetails?.pan || 'Not Provided', color: "text-rose-500", bg: "bg-rose-50" },
                    { icon: Clock, label: "Onboarding Date", value: selectedSeller.joinDate || 'N/A', color: "text-orange-500", bg: "bg-orange-50" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-orange-100 bg-white hover:border-orange-200 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-orange-100", item.bg)}>
                          <item.icon className={cn("h-4 w-4", item.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black text-stone-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                          <p className="text-xs font-bold text-orange-955 truncate">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pickup Location Section */}
                <div className="border-t border-orange-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-orange-955 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} className="text-orange-500" />
                      Primary Pickup Location
                    </h4>
                  </div>
                  {loadingDetails ? (
                    <div className="h-16 bg-orange-50 rounded-xl animate-pulse" />
                  ) : (sellerDetails?.addresses?.find(a => a.is_default)) ? (
                    (() => {
                      const addr = sellerDetails.addresses.find(a => a.is_default);
                      return (
                        <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20 hover:border-orange-200 transition-all">
                          <p className="text-[10px] font-bold text-orange-955 mb-0.5">{addr.location_name}</p>
                          <p className="text-[11px] text-stone-700 leading-relaxed font-bold">{addr.address_line_1}, {addr.city}</p>
                          <p className="mt-1 text-[9px] font-black text-stone-500 uppercase tracking-wider">{addr.state} - {addr.pincode}</p>
                        </div>
                      );
                    })()
                  ) : (sellerDetails?.addresses?.length > 0) ? (
                    <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20">
                      <p className="text-[10px] font-bold text-orange-955 mb-0.5">{sellerDetails.addresses[0].location_name}</p>
                      <p className="text-[11px] text-stone-700 leading-relaxed font-bold">{sellerDetails.addresses[0].address_line_1}, {sellerDetails.addresses[0].city}</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-orange-200 rounded-xl bg-orange-50/20">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">No pickup locations configured</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-orange-100">
                  <div className="flex-1 flex gap-3 min-w-[250px]">
                    <button 
                      onClick={() => navigate(`/admin/products?seller=${selectedSeller.id}`)}
                      className="flex-1 h-12 bg-orange-955 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-850 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      Inventory
                    </button>
                    {!selectedSeller.is_verified && (
                      <button 
                        onClick={() => handleVerifySeller(selectedSeller.id, true)}
                        disabled={updating}
                        className="flex-1 h-12 bg-orange-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {updating ? <Loader2 className="animate-spin" /> : "Verify KYC"}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      disabled={updating}
                      onClick={() => handleToggleStatus(selectedSeller, selectedSeller.is_active)}
                      className={cn("w-12 h-12 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-sm",
                        selectedSeller.is_active ? "text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" : "text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-955 hover:text-white"
                      )}
                      title={selectedSeller.is_active ? "Suspend Store" : "Restore Store"}
                    >
                      {updating ? <Loader2 className="animate-spin" /> : (selectedSeller.is_active ? <Ban size={16} /> : <UserCheck size={16} />)}
                    </button>
                    {isSuperAdmin && (
                      <button 
                        onClick={() => { setSellerToDelete(selectedSeller); setShowDeleteModal(true); }}
                        className="w-12 h-12 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-650 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Purge Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedSeller(null)}
                      className="px-5 h-12 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-955 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-orange-955/40 flex items-center justify-center z-[120] p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-rose-105 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500 border border-rose-100">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Purge Store?</h2>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">
              You are about to permanently delete <span className="text-orange-955 font-black">"{sellerToDelete?.name}"</span>. 
              This will remove all products, settings, and partner data. This action <span className="text-rose-600 uppercase font-black tracking-wider">cannot be undone</span>.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={handleDeleteSeller}
                disabled={updating}
                className="flex-1 h-11 rounded-xl bg-rose-650 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-md"
              >
                {updating ? <Loader2 className="animate-spin" /> : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-orange-955/40 flex items-center justify-center z-[110] p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-orange-100 animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 text-rose-500">
              <Ban className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Suspend Partner</h2>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">Please provide a reason for restricting <span className="text-orange-900 font-black">"{sellerToBlock?.name}"</span>. This will be shown to the seller.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               <div className="col-span-full">
                  <label className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-1.5 block ml-1">Suspension Reason</label>
                  <textarea
                    className="w-full h-24 p-4 rounded-xl bg-orange-55/30 border border-orange-200 text-sm font-bold text-orange-955 focus:outline-none focus:border-rose-500 focus:bg-white transition-all placeholder:text-stone-400 resize-none"
                    placeholder="e.g. Violation of terms, repeated order cancellations..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
               </div>
               <div>
                  <label className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-1.5 block ml-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full h-11 px-4 rounded-xl bg-orange-55/30 border border-orange-200 text-sm font-bold text-orange-955 focus:outline-none focus:border-rose-500 focus:bg-white transition-all placeholder:text-stone-400"
                    placeholder="Leave blank for permanent"
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 h-11 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => updateSellerStatus(sellerToBlock.id, false, blockReason, blockDuration)}
                disabled={!blockReason.trim() || updating}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {updating ? <Loader2 className="animate-spin" /> : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
