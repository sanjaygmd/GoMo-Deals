import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, UserPlus, Search, Eye, Mail, Phone,
  Calendar, ShieldCheck, X, UserX, CheckCircle2, AlertCircle, Loader2, Ban, AlertTriangle,
  MapPin, Trash2, ArrowRight, ExternalLink, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { Button } from '../../ui/button';
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";
import { StatCard } from "../components/StatCard";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [customerToBlock, setCustomerToBlock] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.type === 'super_admin';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/customers');
      if (resp.data.success) {
        setCustomers(Array.isArray(resp.data.data) ? resp.data.data : []);
      }
    } catch (err) {
      console.error('Customer fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer, isBlocking) => {
    if (isBlocking) {
      setCustomerToBlock(customer);
      setBlockReason("");
      setShowBlockModal(true);
    } else {
      await updateCustomerStatus(customer.customer_id, true, null);
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingDetails(true);
    setCustomerDetails(null);
    try {
      const resp = await api.get(`/admin/customer/${customer.customer_id}`);
      if (resp.data.success) {
        setCustomerDetails(resp.data.data);
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      toast({ title: "Details Unreachable", description: "Could not fetch full customer profile.", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setUpdating(true);
    try {
      const resp = await api.delete(`/admin/customer/${customerToDelete.customer_id}`);
      if (resp.data.success) {
        toast({ title: "Account Purged", description: "Customer account and private data removed." });
        setCustomers(prev => prev.filter(c => c.customer_id !== customerToDelete.customer_id));
        setShowDeleteModal(false);
        setSelectedCustomer(null);
      }
    } catch (err) {
      toast({ title: "Purge Failed", description: "Could not delete customer account.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const updateCustomerStatus = async (id, is_active, reason) => {
    setUpdating(true);
    try {
      const resp = await api.patch(`/admin/customer/${id}/status`, { is_active, block_reason: reason });
      if (resp.data.success) {
        toast({ 
          title: is_active ? "Customer Restored" : "Customer Restricted", 
          description: `Account access has been updated successfully.` 
        });
        setCustomers(prev => prev.map(c => c.customer_id === id ? { 
          ...c, 
          is_active: resp.data.is_active,
          block_reason: resp.data.block_reason
        } : c));
        if (selectedCustomer?.customer_id === id) {
          setSelectedCustomer(prev => ({ 
            ...prev, 
            is_active: resp.data.is_active,
            block_reason: resp.data.block_reason
          }));
        }
        setShowBlockModal(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", description: "Could not change account status.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id?.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Customer Relations Directory</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Customers</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Manage registered customer directories, verified accounts, account restrictions, and disputes.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid - Unified StatCard */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          todayValue="Registered Clients" 
          changeType="positive"
          icon={Users} 
        />
        <StatCard 
          title="Active Verified" 
          value={customers.filter(c => c.is_active).length} 
          todayValue="Verified Accounts" 
          changeType="positive"
          icon={UserCheck} 
        />
        <StatCard 
          title="Growth" 
          value={customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 86400000)).length} 
          todayValue="Onboarded Last 30 Days" 
          changeType="positive"
          icon={UserPlus} 
        />
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <input
            placeholder="Search by name, email or ID..."
            className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content View (Table) */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border border-orange-100 rounded-full" />
            <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Initializing Portal Directory...</p>
        </div>
      ) : (
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Joined Date</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-stone-850">
                {filtered.map((c) => (
                  <tr key={c.customer_id} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                    <td className="px-8 py-5">
                      <span className="font-mono text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                        #{c.customer_id.split('-')[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-955 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
                          {c.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-orange-955 tracking-wide uppercase leading-none mb-1">{c.name}</p>
                          <p className="text-[10px] font-bold text-stone-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg w-fit">
                        <Phone className="h-3 w-3 text-orange-500" />
                        {c.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-stone-500 uppercase tracking-wider">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-1">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm",
                          c.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-250 bg-rose-50 text-rose-800"
                        )}>
                          {c.is_active ? <CheckCircle2 size={10} className="text-emerald-600" /> : <AlertCircle size={10} className="text-rose-600" />}
                          <span className="text-[8px] font-black uppercase tracking-wider">{c.is_active ? 'Active' : 'Restricted'}</span>
                        </div>
                        {!c.is_active && c.block_reason && (
                          <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded max-w-[120px] truncate" title={c.block_reason}>
                            {c.block_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={updating}
                          onClick={() => handleToggleStatus(c, c.is_active)}
                          className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 border",
                            c.is_active 
                              ? "bg-rose-50 border-rose-150 hover:bg-rose-600 hover:text-white hover:border-rose-300 text-rose-600" 
                              : "bg-orange-50 border-orange-150 hover:bg-orange-955 hover:text-white hover:border-orange-200 text-orange-600"
                          )}
                          title={c.is_active ? "Block Customer" : "Unblock Customer"}
                        >
                          {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : (c.is_active ? <UserX size={16} /> : <UserCheck size={16} />)}
                        </button>
                        <button
                          onClick={() => handleSelectCustomer(c)}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-16 text-center border-t border-orange-100">
                <Users size={32} className="mx-auto text-orange-200 mb-3" />
                <p className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">No customers found matching search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Detail Overlay (Light-themed modern drawer modal) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] overflow-y-auto no-scrollbar">
          <div 
            className="fixed inset-0 bg-orange-955/40 backdrop-blur-md animate-in fade-in duration-200" 
            onClick={() => setSelectedCustomer(null)}
          />
          
          <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-orange-100 relative">
              <button
                onClick={() => setSelectedCustomer(null)}
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
                      {selectedCustomer.name?.charAt(0)}
                    </div>
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-extrabold tracking-wide uppercase leading-none mb-1.5">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-orange-300 uppercase tracking-widest">ID:</span>
                      <span className="font-mono text-[9px] font-bold text-orange-100 uppercase">#{selectedCustomer.customer_id.split('-')[0].toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                
                <div className="flex justify-between items-center border-b border-orange-100 pb-4">
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Account Authority Status</span>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                    selectedCustomer.is_active ? "border-emerald-250 bg-emerald-50 text-emerald-800" : "border-rose-250 bg-rose-50 text-rose-800"
                  )}>
                    {selectedCustomer.is_active ? 'Active Verified' : 'Restricted'}
                  </div>
                </div>

                {selectedCustomer.block_reason && !selectedCustomer.is_active && (
                  <div className="p-4 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl flex items-start gap-3 shadow-inner">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Restriction Reason</p>
                      <p className="text-xs font-bold text-rose-750 leading-relaxed">{selectedCustomer.block_reason}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Mail, label: "Email Address", value: selectedCustomer.email, color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: Phone, label: "Phone Number", value: selectedCustomer.phone || 'N/A', color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: Calendar, label: "Joined Date", value: new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: ShieldCheck, label: "Account Clearance", value: selectedCustomer.is_active ? "Verified User" : "Flagged Account", color: "text-orange-500", bg: "bg-orange-50" }
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

                {/* Addresses Section */}
                <div className="border-t border-orange-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-orange-955 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} className="text-orange-500" />
                      Shipping Locations
                    </h4>
                    <span className="text-[9px] font-bold text-stone-500 uppercase">{(customerDetails?.addresses?.length || 0)} Saved</span>
                  </div>
                  
                  {loadingDetails ? (
                    <div className="h-16 bg-orange-50 rounded-xl animate-pulse" />
                  ) : (customerDetails?.addresses?.find(a => a.is_default)) ? (
                    (() => {
                      const addr = customerDetails.addresses.find(a => a.is_default);
                      return (
                        <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20 hover:border-orange-200 transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] font-bold text-orange-955 truncate">{addr.full_name}</p>
                            <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Primary</span>
                          </div>
                          <p className="text-[11px] text-stone-700 leading-relaxed font-bold">{addr.address_line_1}, {addr.city}</p>
                          <p className="mt-1 text-[9px] font-black text-stone-500 uppercase tracking-wider">{addr.state} - {addr.pincode}</p>
                        </div>
                      );
                    })()
                  ) : (customerDetails?.addresses?.length > 0) ? (
                    <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20">
                      <p className="text-[10px] font-bold text-orange-955 mb-1">{customerDetails.addresses[0].full_name}</p>
                      <p className="text-[11px] text-stone-700 leading-relaxed font-bold">{customerDetails.addresses[0].address_line_1}, {customerDetails.addresses[0].city}</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-orange-200 rounded-xl bg-orange-50/20">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">No addresses recorded</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-orange-100">
                  <button 
                    onClick={() => navigate(`/admin/orders?search=${encodeURIComponent(selectedCustomer.email)}`)}
                    className="flex-1 min-w-[150px] h-12 bg-orange-955 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-850 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <History size={14} /> View History
                  </button>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      disabled={updating}
                      onClick={() => handleToggleStatus(selectedCustomer, selectedCustomer.is_active)}
                      className={cn(
                        "w-12 h-12 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-sm",
                        selectedCustomer.is_active ? "text-rose-500 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" : "text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-955 hover:text-white"
                      )}
                      title={selectedCustomer.is_active ? "Block Customer" : "Restore Customer"}
                    >
                      {updating ? <Loader2 className="animate-spin" /> : (selectedCustomer.is_active ? <UserX size={16} /> : <UserCheck size={16} />)}
                    </button>
                    {isSuperAdmin && (
                      <button 
                        onClick={() => { setCustomerToDelete(selectedCustomer); setShowDeleteModal(true); }}
                        className="w-12 h-12 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-650 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Purge Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedCustomer(null)}
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

      {/* Block Reason Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-orange-955/40 flex items-center justify-center z-[110] p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-orange-100">
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 text-rose-500">
              <Ban className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Restrict Customer</h2>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">Please provide a reason for restricting <span className="text-orange-900 font-black">"{customerToBlock?.name}"</span>. This will be shown to the customer.</p>
            
            <textarea
              className="w-full h-28 p-4 rounded-xl bg-orange-55/30 border border-orange-200 text-sm font-bold text-orange-955 focus:outline-none focus:border-rose-500 focus:bg-white transition-all placeholder:text-stone-400 mb-6 resize-none"
              placeholder="e.g. Suspicious activity, payment failure, violation of terms..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 h-11 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => updateCustomerStatus(customerToBlock.customer_id, false, blockReason)}
                disabled={!blockReason.trim() || updating}
                className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {updating ? <Loader2 className="animate-spin" /> : "Confirm Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-orange-955/40 flex items-center justify-center z-[110] p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-rose-100">
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500 border border-rose-100">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-orange-955 tracking-tight mb-2 uppercase">Purge Account?</h2>
            <p className="text-stone-500 text-xs mb-6 font-bold leading-relaxed">
              You are about to permanently delete <span className="text-orange-955 font-black">"{customerToDelete?.name}"</span>. 
              This will remove all private data, notifications, and shopping history. This action <span className="text-rose-600 uppercase font-black tracking-wider">cannot be undone</span>.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={updating}
                className="flex-1 h-11 rounded-xl bg-rose-650 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-md"
              >
                {updating ? <Loader2 className="animate-spin" /> : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
