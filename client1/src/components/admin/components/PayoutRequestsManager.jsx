import { useState, useMemo, useEffect } from "react";
import { 
  CreditCard, Search, Calendar, Check, CheckCircle2, 
  XCircle, ArrowRight, ArrowUpRight, TrendingUp, Landmark, Clock, Eye, X
} from "lucide-react";
import { Button } from "../../ui/button";
import { updatePayoutStatus } from "../../../services/payoutService";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function PayoutRequestsManager({ payouts, onRefresh }) {
  const { toast } = useToast();
  const [payoutSearch, setPayoutSearch] = useState("");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ transaction_ref: "", notes: "" });

  // Generate transactional reference codes automatically for selected payout
  useEffect(() => {
    if (selectedPayout && selectedPayout.status === 'Requested') {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPayoutForm({
        transaction_ref: `TXN-PAYOUT-${dateStr}-${rand}`,
        notes: `Processed via Admin Dashboard on ${new Date().toLocaleDateString()}`
      });
    } else if (!selectedPayout) {
      setPayoutForm({ transaction_ref: "", notes: "" });
    }
  }, [selectedPayout]);

  const filteredPayouts = useMemo(() => {
    if (!payouts) return [];
    return payouts.filter(payout => {
      const q = payoutSearch.toLowerCase();
      return (
        (payout.id && payout.id.toLowerCase().includes(q)) ||
        (payout.name && payout.name.toLowerCase().includes(q)) ||
        (payout.status && payout.status.toLowerCase().includes(q)) ||
        (payout.amount && payout.amount.toString().includes(q)) ||
        (payout.revenue && payout.revenue.toString().includes(q)) ||
        (payout.date && new Date(payout.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase().includes(q))
      );
    });
  }, [payouts, payoutSearch]);

  const handlePayoutAction = async (status) => {
    if (status === 'Paid' && !payoutForm.transaction_ref) {
      toast({ title: "Reference Required", description: "Please enter a transaction reference for payout.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await updatePayoutStatus(selectedPayout.id, {
        status,
        transaction_ref: payoutForm.transaction_ref,
        notes: payoutForm.notes
      });
      if (res.success) {
        toast({ title: "Success", description: `Payout ${status.toLowerCase()} successfully.` });
        setSelectedPayout(null);
        setPayoutForm({ transaction_ref: '', notes: '' });
        if (onRefresh) onRefresh();
      } else {
        toast({ title: "Failed", description: res.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Action failed. Check server logs.", variant: "destructive" });
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Seller Payout Requests Ledger */}
      <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight uppercase">Boutique Payout Requests</h3>
            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">
              Review and approve partner withdrawable balances securely
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search payouts..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="w-full pl-11 pr-4 h-11 border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
              />
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
              <CreditCard size={18} />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/50 border-b border-orange-100">
                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Request ID</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Seller Store</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Date Requested</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Requested Amount</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Gross Store Subtotal</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-stone-850">
              {filteredPayouts && filteredPayouts.length > 0 ? (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                    <td className="px-8 py-5">
                      <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-tight">#{String(payout.id).slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-orange-955 uppercase tracking-wide">{payout.name}</span>
                    </td>
                    <td className="px-6 py-5 text-stone-500 font-bold text-xs">
                      {new Date(payout.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-orange-955">
                      {fmt(payout.amount)}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-stone-700">
                      {fmt(payout.revenue)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm",
                        payout.status === 'Paid' && "border-emerald-200 bg-emerald-50 text-emerald-800",
                        payout.status === 'Requested' && "border-orange-200 bg-orange-50 text-orange-700",
                        payout.status === 'Rejected' && "border-rose-250 bg-rose-50 text-rose-800"
                      )}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => setSelectedPayout(payout)}
                        className={cn("h-9 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest shadow-sm cursor-pointer transition-all border",
                          payout.status === 'Requested' 
                            ? "bg-orange-955 border-orange-955 text-white" 
                            : "bg-orange-55 border-orange-150 text-orange-700 hover:bg-orange-955 hover:text-white"
                        )}
                      >
                        {payout.status === 'Requested' ? "Review Request" : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center border-t border-orange-100">
                    <p className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">No matching payout requests found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Review Modal (Light styled modal overlay) */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-orange-955/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl relative border border-orange-100 animate-in zoom-in-95 duration-300">
             <button 
               onClick={() => setSelectedPayout(null)} 
               className="absolute top-6 right-6 h-10 w-10 bg-orange-55 hover:bg-orange-105 border border-orange-205 rounded-full flex items-center justify-center text-orange-750 transition-all cursor-pointer z-30"
             >
               <X size={18} />
             </button>
             
             <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-6 bg-orange-500 rounded-full" />
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Payout Request Verification</span>
             </div>

             <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-orange-955 tracking-tight uppercase">{selectedPayout.name}</h2>
                <p className="text-stone-500 text-xs font-bold mt-0.5">Request ID: <span className="font-mono text-stone-700">#{selectedPayout.id}</span></p>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                   <p className="text-[8px] font-black text-stone-500 uppercase tracking-wider mb-0.5">Gross Sales</p>
                   <p className="text-base font-bold text-orange-955 tracking-tight">{fmt(selectedPayout.revenue)}</p>
                </div>
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                   <p className="text-[8px] font-black text-stone-550 uppercase tracking-wider mb-0.5">Flat Platform Fee</p>
                   <p className="text-base font-bold text-orange-700 tracking-tight">{fmt(selectedPayout.revenue - selectedPayout.amount)}</p>
                </div>
                <div className="p-4 bg-orange-55/50 rounded-2xl border border-orange-200">
                   <p className="text-[8px] font-black text-orange-600 uppercase tracking-wider mb-0.5">Net Disbursed</p>
                   <p className="text-base font-bold text-orange-955 tracking-tight">{fmt(selectedPayout.amount)}</p>
                </div>
             </div>

             {selectedPayout.status === 'Requested' ? (
               <div className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block ml-1">Transaction Reference (Required for Approval)</label>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. UTR-992122112"
                          value={payoutForm.transaction_ref}
                          onChange={(e) => setPayoutForm({...payoutForm, transaction_ref: e.target.value})}
                          className="flex-1 h-11 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                            const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
                            setPayoutForm(prev => ({ ...prev, transaction_ref: `TXN-PAYOUT-${dateStr}-${rand}` }));
                          }}
                          className="h-11 px-4 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          Generate Ref
                        </button>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block ml-1">Admin Resolution Notes</label>
                     <textarea 
                       placeholder="Optional notes for the seller..."
                       value={payoutForm.notes}
                       onChange={(e) => setPayoutForm({...payoutForm, notes: e.target.value})}
                       className="w-full h-20 p-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold leading-relaxed focus:bg-white transition-all shadow-inner focus:outline-none placeholder:text-stone-400 resize-none"
                     />
                  </div>

                  <div className="flex gap-3">
                     <button 
                       onClick={() => handlePayoutAction('Paid')}
                       disabled={actionLoading}
                       className="flex-1 h-12 rounded-xl bg-orange-955 text-white font-black uppercase text-[10px] tracking-widest hover:bg-orange-850 transition-all cursor-pointer shadow-md"
                     >
                       {actionLoading ? "Processing..." : "Approve Payout"}
                     </button>
                     <button 
                       onClick={() => handlePayoutAction('Rejected')}
                       disabled={actionLoading}
                       className="flex-1 h-12 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-all cursor-pointer shadow-sm"
                     >
                       Reject Request
                     </button>
                  </div>
               </div>
             ) : (
               <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider">Payout Status</span>
                     <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm", selectedPayout.status === 'Paid' ? "border-emerald-250 bg-emerald-50 text-emerald-800" : "border-rose-250 bg-rose-50 text-rose-800")}>
                        {selectedPayout.status}
                     </span>
                  </div>
                  {selectedPayout.status === 'Paid' && (
                    <div className="flex items-center justify-between border-t border-orange-100 pt-3">
                       <span className="text-[9px] font-black text-stone-500 uppercase tracking-wider">Transaction Ref</span>
                       <span className="text-xs font-bold text-orange-955 font-mono">#{selectedPayout.transaction_ref || 'N/A'}</span>
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
