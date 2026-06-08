import { useState, useEffect, useMemo } from "react";
import { 
  IndianRupee, TrendingUp, CreditCard, Receipt, Search,
  Download, Calendar, History, TrendingDown, Wallet, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Landmark, ArrowRight, Eye, CheckCircle2, XCircle
} from "lucide-react";
import PayoutRequestsManager from "../components/PayoutRequestsManager";
import OrphanedPaymentsManager from "../components/OrphanedPaymentsManager";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext.jsx";
import { StatCard } from "../components/StatCard";
import { exportToExcel } from "../../../utils/exportUtils";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function FinancePage() {
  const [range, setRange] = useState('monthly');
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState({
    summary: { gross_revenue: 0, platform_commission: 0, net_profit: 0 },
    monthlyPL: [],
    payouts: [],
    expenses: [],
    transactions: []
  });

  useEffect(() => {
    fetchFinanceData();
  }, [range]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/admin/finance-data?range=${range}`);
      if (resp.data.success) {
        setFinanceData(resp.data.data);
      }
    } catch (err) {
      console.error("Fetch finance data error:", err);
      toast({ title: "Fetch Error", description: "Failed to load financial metrics.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const year = new Date().getFullYear();
      
      const summaryData = [{
        "Gross Revenue": fmt(financeData.summary.gross_revenue),
        "Platform Earnings": fmt(financeData.summary.platform_commission),
        "Net Profit": fmt(financeData.summary.net_profit)
      }];

      const ledgerData = (financeData.monthlyPL || []).map(m => ({
        "Period": m.name,
        "Revenue (Credits)": fmt(m.revenue),
        "Costs (Debits)": fmt(m.costs),
        "Net Profit": fmt(m.profit)
      }));

      const exportData = {
        "Executive Summary": summaryData,
        "Monthly Ledger": ledgerData
      };

      exportToExcel(exportData, `GoMo_Fiscal_Report_${year}`);
      toast({ title: "Report Generated", description: `Excel fiscal report for ${year} is ready.` });
    } catch (err) {
      console.error("Download report error:", err);
      toast({ title: "Generation Failed", description: "Could not build the Excel report.", variant: "destructive" });
    }
  };

  const { summary, monthlyPL, payouts, transactions } = financeData;

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Landmark size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Fiscal Intelligence System</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Finance Dashboard</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Track platform gross revenue, commission metrics, withdrawals, and ledger streams.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-orange-50/50 p-1 rounded-2xl border border-orange-100 shadow-sm">
            <button 
              onClick={() => setRange('monthly')}
              className={cn("px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                range === 'monthly' ? "bg-orange-955 text-white shadow-md" : "text-orange-500 hover:bg-orange-50"
              )}
            >
              Monthly
            </button>
            <button 
              onClick={() => setRange('annual')}
              className={cn("px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                range === 'annual' ? "bg-orange-955 text-white shadow-md" : "text-orange-500 hover:bg-orange-50"
              )}
            >
              Yearly
            </button>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="px-8 py-3 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-black hover:bg-orange-850 transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
          >
            <Download size={14} /> Download Yearly Report
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={range === 'monthly' ? "Monthly Revenue" : "Annual Revenue"} 
          value={fmt(summary.gross_revenue)} 
          todayValue="Total Gross Sales" 
          changeType="positive"
          icon={IndianRupee} 
        />
        <StatCard 
          title="Platform Earnings" 
          value={fmt(summary.platform_commission)} 
          todayValue="Flat Commission Fees" 
          changeType="positive"
          icon={Receipt} 
        />
        <StatCard 
          title="Net Profit" 
          value={fmt(summary.net_profit)} 
          todayValue="Platform Net Revenue" 
          changeType="positive"
          icon={TrendingUp} 
        />
        <StatCard 
          title="Ledger Count" 
          value={transactions.length} 
          todayValue="Total Transactions" 
          changeType="neutral"
          icon={History} 
        />
      </div>

      {/* Financial Performance Ledger */}
      {loading ? (
        <div className="flex h-[30vh] flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border border-orange-100 rounded-full" />
            <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Syncing Fiscal Ledgers...</p>
        </div>
      ) : (
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-orange-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-orange-955 tracking-tight uppercase">Performance Summary</h3>
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">
                Summarized view of {range} earnings and expenditures
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
              <Landmark size={18} />
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">{range === 'monthly' ? 'Month' : 'Year'}</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Revenue (Credits)</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Costs (Debits)</th>
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-stone-850">
                {monthlyPL && monthlyPL.length > 0 ? (
                  [...monthlyPL].reverse().map((item, idx) => (
                    <tr key={idx} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-orange-955 uppercase tracking-wide">{item.name}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-bold text-orange-955">{fmt(item.revenue)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-bold text-rose-600">-{fmt(item.costs)}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                           <span className={cn("text-sm font-bold", item.profit >= 0 ? "text-orange-955" : "text-rose-600")}>
                             {fmt(item.profit)}
                           </span>
                           {item.profit >= 0 ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-rose-600" />}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-16 text-center border-t border-orange-100">
                      <p className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">No data available for this range</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Render payout request segment below if loading is done */}
      {!loading && (
        <>
          <PayoutRequestsManager payouts={payouts} onRefresh={fetchFinanceData} />
          <OrphanedPaymentsManager />
        </>
      )}
    </div>
  );
}