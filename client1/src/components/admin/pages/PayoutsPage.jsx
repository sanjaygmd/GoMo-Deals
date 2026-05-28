import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, CheckCircle2, Clock, Landmark, Download, AlertCircle, TrendingUp, Search
} from "lucide-react";
import PayoutRequestsManager from "../components/PayoutRequestsManager";
import { Button } from "../../ui/button";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";
import { StatCard } from "../components/StatCard";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const { toast } = useToast();

  const fetchPayoutsData = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/admin/finance-data?range=all`);
      if (resp.data.success) {
        setPayouts(resp.data.data.payouts || []);
      }
    } catch (err) {
      console.error("Fetch payouts error:", err);
      toast({ title: "Fetch Error", description: "Failed to load payout data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const stats = useMemo(() => {
    let pendingCount = 0;
    let totalPaidAmount = 0;
    let feesCollected = 0;

    payouts.forEach(p => {
      if (p.status === 'Requested') {
        pendingCount++;
      } else if (p.status === 'Paid') {
        totalPaidAmount += Number(p.amount || 0);
        feesCollected += Number(p.revenue || 0) - Number(p.amount || 0);
      }
    });

    return {
      pending: pendingCount,
      paid: fmt(totalPaidAmount),
      fees: fmt(feesCollected),
      totalRequests: payouts.length
    };
  }, [payouts]);

  const handleExport = () => {
    toast({ title: "Export Started", description: "The payouts ledger list is being compiled for download." });
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Landmark size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Partner FinTech Portal</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Seller Payouts</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Disburse, review, and track boutique merchant withdrawals and processing fees securely.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="px-8 py-3 bg-orange-955 text-white hover:bg-orange-850 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
          >
            <Download size={14} /> Export Ledger
          </button>
        </div>
      </div>

      {/* Stats Cards - Unified StatCard */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <StatCard 
          title="Awaiting Approval" 
          value={stats.pending} 
          todayValue="Pending Requests" 
          changeType="neutral" 
          icon={Clock} 
        />
        <StatCard 
          title="Disbursed To Date" 
          value={stats.paid} 
          todayValue="Paid Withdrawals" 
          changeType="positive" 
          icon={CheckCircle2} 
        />
        <StatCard 
          title="Flat Fees Retained" 
          value={stats.fees} 
          todayValue="₹15 Platform Fee Retained" 
          changeType="positive" 
          icon={TrendingUp} 
        />
      </div>

      {/* Main Table Area */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border border-orange-100 rounded-full" />
            <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Syncing Merchant Ledgers...</p>
        </div>
      ) : (
        <PayoutRequestsManager payouts={payouts} onRefresh={fetchPayoutsData} />
      )}
    </div>
  );
}
