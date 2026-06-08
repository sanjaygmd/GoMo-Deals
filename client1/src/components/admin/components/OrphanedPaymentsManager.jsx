import { useState, useEffect } from "react";
import { Search, AlertTriangle, IndianRupee, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function OrphanedPaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/orphaned-payments');
      if (resp.data.success) {
        setPayments(resp.data.data);
      }
    } catch (err) {
      console.error("Fetch orphaned payments error:", err);
      toast({ title: "Error", description: "Failed to load orphaned payments.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleResolve = async (id, action) => {
    let order_id = null;
    if (action === 'match') {
      order_id = prompt("Enter the Order ID this payment belongs to:");
      if (!order_id) return;
    } else if (action === 'refund') {
      if (!window.confirm("Are you sure you want to mark this as refunded? Make sure you actually initiated the refund in Razorpay.")) {
        return;
      }
    }

    try {
      const resp = await api.post(`/admin/orphaned-payments/${id}/resolve`, { action, order_id });
      if (resp.data.success) {
        toast({ title: "Success", description: resp.data.message });
        fetchPayments();
      }
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to resolve payment.", variant: "destructive" });
    }
  };

  const unresolvedCount = payments.filter(p => p.status === 'Captured').length;

  return (
    <div className="bg-white border border-rose-100 rounded-3xl shadow-sm overflow-hidden mt-12">
      <div className="p-8 border-b border-rose-100 flex items-center justify-between bg-rose-50/20">
        <div>
          <h3 className="text-xl font-extrabold text-rose-955 tracking-tight uppercase flex items-center gap-2">
            <AlertTriangle size={20} className="text-rose-600" />
            Orphaned Payments
          </h3>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">
            {unresolvedCount} unresolved payment{unresolvedCount !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-sm text-stone-500">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="p-8 text-center text-sm text-stone-500">No orphaned payments found.</div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Payment ID</th>
                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Razorpay Order</th>
                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-850">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="transition-all hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-mono text-xs">{payment.payment_id}</td>
                  <td className="px-6 py-4 font-mono text-xs text-stone-500">{payment.razorpay_order_id}</td>
                  <td className="px-6 py-4 text-right font-bold text-sm">{fmt(payment.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase",
                      payment.status === 'Captured' ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {payment.status}
                    </span>
                    {payment.notes && <p className="text-[10px] text-stone-400 mt-1 max-w-xs truncate">{payment.notes}</p>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.status === 'Captured' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-[10px] h-8" onClick={() => handleResolve(payment.payment_id, 'match')}>
                          Match Order
                        </Button>
                        <Button size="sm" variant="destructive" className="text-[10px] h-8 border-rose-600 bg-rose-600 text-white hover:bg-rose-700" onClick={() => handleResolve(payment.payment_id, 'refund')}>
                          Mark Refunded
                        </Button>
                      </div>
                    )}
                    {payment.status !== 'Captured' && (
                      <span className="text-emerald-600 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
