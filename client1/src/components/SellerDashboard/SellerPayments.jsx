import React, { useState, useEffect, useMemo } from "react";
import { getSellerEarningsSummary, getSellerPayoutHistory, requestPayout } from "../../services/payoutService";
import { 
  CreditCard, 
  History, 
  Download, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wallet,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { exportToExcel } from "../../utils/exportUtils";

const SellerPayments = () => {
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id;
  const { toast } = useToast();
  
  const [data, setData] = useState({
    summary: {
      total_earnings: 0,
      withdrawable_balance: 0,
      pending_delivery: 0,
      processing_payouts: 0,
      completed_payouts: 0
    },
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [payoutSearch, setPayoutSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!data.transactions) return [];
    return data.transactions.filter(tx => {
      const q = payoutSearch.toLowerCase();
      const txId = String(tx.id || tx.payout_id || '').toLowerCase();
      const status = String(tx.status || tx.payout_status || '').toLowerCase();
      const method = String(tx.method || "Transfer").toLowerCase();
      const dateStr = new Date(tx.date || tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
      return (
        txId.includes(q) ||
        status.includes(q) ||
        method.includes(q) ||
        dateStr.includes(q) ||
        (tx.amount && tx.amount.toString().includes(q))
      );
    });
  }, [data.transactions, payoutSearch]);

  const fetchData = async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        getSellerEarningsSummary(sellerId),
        getSellerPayoutHistory(sellerId)
      ]);

      if (summaryRes.success && historyRes.success) {
        setData({
          summary: {
            total_earnings: summaryRes.data.total_earnings,
            withdrawable_balance: summaryRes.data.withdrawable_balance,
            pending_delivery: summaryRes.data.pending_delivery,
            processing_payouts: summaryRes.data.processing_payouts,
            completed_payouts: summaryRes.data.paid_earnings
          },
          transactions: historyRes.data
        });
      }
    } catch (error) {
      console.error("Failed to fetch payment data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [sellerId]);

  const handleRequestPayout = async () => {
    if (data.summary.withdrawable_balance <= 0) {
      toast({ 
        title: "Insufficient Balance", 
        description: "You don't have any earnings from delivered products to withdraw yet.", 
        variant: "destructive" 
      });
      return;
    }

    setRequesting(true);
    try {
      const res = await requestPayout({ seller_id: sellerId, notes: "Requested from dashboard" });
      if (res.success) {
        toast({ title: "Request Submitted", description: "Your payout request has been sent to the treasury." });
        fetchData();
      } else {
        toast({ title: "Failed", description: res.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Internal processing error. Please try again.", variant: "destructive" });
    }
    setRequesting(false);
  };

  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({ title: "Export Failed", description: "No payout history available to export.", variant: "destructive" });
      return;
    }
    
    try {
      const dataToExport = filteredTransactions.map(tx => ({
        "Payout ID": tx.id || tx.payout_id || "N/A",
        "Date Requested": tx.date || tx.created_at ? new Date(tx.date || tx.created_at).toLocaleDateString() : "N/A",
        "Amount (₹)": Number(tx.amount) || 0,
        "Status": tx.status || tx.payout_status || "N/A",
        "Method": tx.method || "Bank Transfer",
        "Notes": tx.notes || "N/A"
      }));
      
      exportToExcel(dataToExport, 'Seller_Payouts');
      toast({ title: "Export Successful", description: "Payout history exported to Excel." });
    } catch (error) {
      console.error(error);
      toast({ title: "Export Failed", description: "An error occurred while generating the Excel file.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400 font-bold">Auditing accounts...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Withdrawable", 
      value: `₹${Number(data.summary.withdrawable_balance).toLocaleString()}`, 
      icon: CheckCircle2, 
      label: "Ready for transfer",
      color: "text-orange-600"
    },
    { 
      title: "Processing", 
      value: `₹${Number(data.summary.processing_payouts).toLocaleString()}`, 
      icon: Clock, 
      label: "In transit to bank",
      color: "text-orange-500"
    },
    { 
      title: "Outstanding", 
      value: `₹${Number(data.summary.pending_delivery).toLocaleString()}`, 
      icon: AlertCircle, 
      label: "Pending fulfillment",
      color: "text-orange-400"
    },
    { 
      title: "Transferred", 
      value: `₹${Number(data.summary.completed_payouts).toLocaleString()}`, 
      icon: ShieldCheck, 
      label: "Lifetime payouts",
      color: "text-orange-950"
    },
  ];

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CreditCard size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Financial Settlement</span>
          </div>
          <h1 className="text-4xl font-bold text-orange-950 tracking-tight">
            Revenue <span className="font-normal text-orange-500">Distribution</span>
          </h1>
          <p className="text-xs text-orange-500 tracking-tight">
            Lifecycle of your earnings from transaction to bank deposit.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handleRequestPayout}
             disabled={requesting || data.summary.withdrawable_balance <= 0}
             className={`px-8 py-4 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-xl ${
               data.summary.withdrawable_balance > 0 
                ? "bg-orange-950 text-white hover:bg-orange-800 active:scale-[0.98]" 
                : "bg-orange-100 text-orange-400 cursor-not-allowed"
             }`}
           >
             {requesting ? "Processing Request..." : <><Send size={14} /> Request Instant Payout</>}
           </button>
        </div>
      </div>

      {/* Main Wallet Card */}
      <div className="bg-orange-950 p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between group rounded-sm shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative z-10 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Net Lifetime Earnings</p>
          <h2 className="text-5xl font-bold tracking-tight">₹{Number(data.summary.total_earnings).toLocaleString()}</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-400 font-black uppercase text-[8px] tracking-widest mt-1 group relative cursor-help">
            <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse" />
            Flat ₹15 Platform Fee per Order (No Percentage Commissions!)
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-orange-900 border border-orange-800 text-white text-[8px] tracking-normal font-normal p-3 rounded-md shadow-xl w-64 normal-case z-20">
              GoMo does not take percentage commissions! We only deduct a flat ₹15 platform fee per order, meaning you keep 100% of your listed prices.
            </span>
          </div>
        </div>
        <div className="relative z-10 flex gap-12 border-l border-white/10 pl-12">
           <div className="text-center">
              <p className="text-2xl font-bold mb-1">₹{Number(data.summary.withdrawable_balance).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Available Now</p>
           </div>
           <div className="text-center">
              <p className="text-2xl font-bold mb-1">₹{Number(data.summary.completed_payouts).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Paid to Date</p>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((item, idx) => (
          <div key={item.title} className="bg-white p-8 border border-orange-100 shadow-sm group">
            <div className="flex justify-between items-start mb-10">
              <div className={`p-3 bg-orange-50 ${item.color} group-hover:bg-orange-950 group-hover:text-white transition-all duration-500`}>
                 <item.icon size={18} strokeWidth={1.5} />
              </div>
              <ArrowUpRight size={14} className="text-orange-200 group-hover:text-orange-950 transition-colors" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-orange-400 font-bold mb-1">{item.title}</p>
            <h3 className="text-2xl font-bold text-orange-950 mb-4">{item.value}</h3>
            <p className="text-[10px] text-orange-400 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-orange-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <History size={16} className="text-orange-400" />
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-orange-950">Payout Log</h3>
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search payouts by ID, status, date..."
                  value={payoutSearch}
                  onChange={(e) => setPayoutSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 bg-orange-50 border border-orange-200 rounded-none text-xs font-bold text-orange-800 placeholder-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-950 focus:border-orange-950 transition-all"
                />
              </div>
              <button onClick={handleExport} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-950 transition-colors shrink-0">
                 <Download size={14} /> Export CSV
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-orange-50 text-[9px] text-orange-500 uppercase tracking-[0.4em] font-black border-b border-orange-100">
                <th className="px-10 py-6 font-black">Transaction ID</th>
                <th className="px-10 py-6 font-black">Settlement Date</th>
                <th className="px-10 py-6 font-black">Channel</th>
                <th className="px-10 py-6 text-right font-black">Net Amount</th>
                <th className="px-10 py-6 text-center font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                  <motion.tr
                    key={tx.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="px-10 py-8">
                       <span className="text-[10px] font-black text-orange-950 uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                         #{String(tx.id || tx.payout_id).slice(0, 8).toUpperCase()}
                       </span>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-orange-900">
                             {new Date(tx.date || tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[8px] text-orange-400 font-black uppercase tracking-widest mt-1">
                             {new Date(tx.date || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{tx.method || "Transfer"}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <span className="text-sm font-bold text-orange-950">₹{Number(tx.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.4em] border ${
                         (tx.status || tx.payout_status)?.toLowerCase() === 'paid' ? 'text-orange-600 border-orange-100 bg-orange-50' : 
                         (tx.status || tx.payout_status)?.toLowerCase() === 'requested' ? 'text-orange-600 border-orange-100 bg-orange-50' : 
                         'text-orange-500 border-orange-100 bg-orange-50'
                       }`}>
                         {tx.status || tx.payout_status}
                       </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-10 py-32 text-center text-[10px] uppercase tracking-[0.6em] text-orange-400">
                      No matching transaction records identified
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerPayments;
