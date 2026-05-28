import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { 
  Search, RotateCcw, AlertTriangle, CheckCircle, 
  XCircle, Banknote, ListCollapse, Clock, ShieldAlert,
  Eye, X, ArrowUpRight, Package, Loader2
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { StatCard } from "../components/StatCard";

export default function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/returns');
      if (resp.data.success) {
        setReturns(resp.data.data);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Fetch Error", description: "Could not load return data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReturn = async (id, status) => {
    try {
      const adminId = user?.id;

      const resp = await api.post(`/admin/returns/${id}/resolve`, { 
        status, 
        resolution_note: status === 'Approved' ? 'Return request approved by admin' : 'Return request rejected by admin',
        admin_id: adminId
      });
      
      if (resp.data.success) {
        toast({ title: `Return ${status}`, description: resp.data.message });
        fetchReturns();
        setSelectedReturn(null);
      } else {
        toast({ title: "Action Failed", description: resp.data.message, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred while resolving the request.", variant: "destructive" });
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((r) =>
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      r.displayId?.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.product_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [returns, search]);

  const stats = useMemo(() => [
    { title: "Active Requests", value: returns.length, label: "Awaiting Review", icon: AlertTriangle, color: "negative" },
    { title: "In Transit", value: Math.floor(returns.length * 0.4), label: "Reverse Logistics", icon: RotateCcw, color: "neutral" },
    { title: "Refund Value", value: `₹${returns.reduce((acc, r) => acc + Number((r.amount || '').replace(/[^0-9]/g, '') || 0), 0).toLocaleString('en-IN')}`, label: "Total Pending", icon: Banknote, color: "positive" },
    { title: "Resolved", value: "184", label: "Completion Rate", icon: CheckCircle, color: "positive" }
  ], [returns]);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RotateCcw size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Customer Service Operations</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Returns</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Manage customer return requests, disputes, and refund workflow operations.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid - Unified StatCard */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard 
            key={i} 
            title={s.title}
            value={s.value}
            todayValue={s.label}
            changeType={s.color}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
          <input 
            placeholder="Search by Return ID, Order ID, or Customer..." 
            className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border border-orange-100 rounded-full" />
            <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Loading Return Streams...</p>
        </div>
      ) : (
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Return ID</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-stone-850">
                {filteredReturns.map((r) => (
                  <tr key={r.id} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit">
                          #{r.id.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-bold text-stone-500 mt-1 uppercase tracking-wider">Order: {r.orderId?.split('-')[0].toUpperCase() || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                          {r.customer?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-orange-955">{r.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 w-fit">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">{r.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-bold text-orange-955">{r.amount}</span>
                    </td>
                     <td className="px-6 py-5 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm mx-auto",
                        r.status === 'Approved' ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                        r.status === 'Rejected' || r.status === 'Cancelled' ? "border-rose-250 bg-rose-50 text-rose-800" :
                        "border-amber-200 bg-amber-50 text-amber-800"
                      )}>
                        {r.status === 'Approved' ? <CheckCircle size={10} className="text-emerald-600" /> : 
                         r.status === 'Rejected' || r.status === 'Cancelled' ? <XCircle size={10} className="text-rose-600" /> : 
                         <Clock size={10} className="text-amber-600" />}
                        <span className="text-[8px] font-black uppercase tracking-wider">{r.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setSelectedReturn(r)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95 ml-auto"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center border-t border-orange-100">
                      <RotateCcw size={32} className="mx-auto text-orange-200 mb-3" />
                      <p className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">No return requests found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Details Modal (Light themed overlays) */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-orange-955/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-orange-100 overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setSelectedReturn(null)}
              className="absolute top-6 right-6 h-10 w-10 bg-orange-55 hover:bg-orange-105 border border-orange-205 rounded-full flex items-center justify-center text-orange-750 transition-all cursor-pointer z-30"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-6 bg-rose-600 rounded-full" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Dispute Request Details</span>
              </div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-orange-955 tracking-tight">{selectedReturn.amount}</h2>
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-0.5">Return ID: <span className="text-orange-900 font-mono">#{selectedReturn.id.toUpperCase()}</span></p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                  selectedReturn.status === 'Approved' ? "border-emerald-250 bg-emerald-50 text-emerald-800" :
                  selectedReturn.status === 'Rejected' || selectedReturn.status === 'Cancelled' ? "border-rose-250 bg-rose-50 text-rose-800" :
                  "border-amber-250 bg-amber-50 text-amber-800"
                )}>
                  {selectedReturn.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Package, label: "Order Reference", value: `#${selectedReturn.orderId?.split('-')[0].toUpperCase() || 'N/A'}`, color: "text-orange-500", bg: "bg-orange-50" },
                  { icon: ShieldAlert, label: "Return Reason", value: selectedReturn.reason, color: "text-rose-500", bg: "bg-rose-50" },
                  { icon: Clock, label: "Requested On", value: selectedReturn.date, color: "text-orange-500", bg: "bg-orange-50" },
                  { icon: RotateCcw, label: "Logistics Type", value: "Standard Pickup", color: "text-orange-500", bg: "bg-orange-50" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-orange-100 bg-white hover:border-orange-200 hover:shadow-sm transition-all duration-300">
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

              {/* Administrative Override Mode */}
              {selectedReturn.status !== 'Pending' && (
                <div className="mb-6 p-4 rounded-xl bg-orange-50/50 border border-orange-150 flex items-start gap-3 shadow-inner">
                  <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-0.5">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-orange-900">Administrator Override Mode</h4>
                    <p className="text-[10px] text-stone-650 leading-relaxed font-bold">
                      This dispute is already marked as <span className="font-bold underline">{selectedReturn.status}</span>.
                      You have full override rights to reverse this status.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  disabled={selectedReturn.status === 'Approved'}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-black uppercase text-[9px] tracking-widest border transition-all shadow-sm cursor-pointer",
                    selectedReturn.status === 'Approved' 
                      ? "bg-orange-50/50 text-stone-400 cursor-not-allowed border-orange-100" 
                      : "bg-orange-955 text-white hover:bg-orange-850"
                  )}
                  onClick={() => handleResolveReturn(selectedReturn.id, 'Approved')}
                >
                  {selectedReturn.status === 'Pending' ? "Approve Return" : "Override: Approve"}
                </button>
                <button 
                  disabled={selectedReturn.status === 'Rejected' || selectedReturn.status === 'Cancelled'}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer",
                    selectedReturn.status === 'Rejected' || selectedReturn.status === 'Cancelled'
                      ? "bg-rose-50/50 text-stone-400 cursor-not-allowed border-rose-100" 
                      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  )}
                  onClick={() => handleResolveReturn(selectedReturn.id, 'Rejected')}
                >
                  {selectedReturn.status === 'Pending' ? "Reject Request" : "Override: Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
