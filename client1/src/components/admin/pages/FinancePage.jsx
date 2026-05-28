import { useState, useEffect, useMemo } from "react";
import { 
  IndianRupee, TrendingUp, CreditCard, Receipt, Search,
  Download, Calendar, History, TrendingDown, Wallet, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Landmark, ArrowRight, Eye, CheckCircle2, XCircle
} from "lucide-react";
import PayoutRequestsManager from "../components/PayoutRequestsManager";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext.jsx";
import { StatCard } from "../components/StatCard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
      const doc = new jsPDF();
      
      // Branding Header
      doc.setFontSize(22);
      doc.setTextColor(249, 115, 22);
      doc.text("GoMo Deals Marketplace", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Annual Fiscal Intelligence Report", 14, 28);
      doc.text(`Fiscal Year: ${year}`, 14, 34);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("EXECUTIVE SUMMARY", 14, 50);
      
      // Summary Box
      doc.setDrawColor(240);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 55, 182, 35, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Gross Revenue", 20, 65);
      doc.text("Platform Earnings", 80, 65);
      doc.text("Net Profit", 140, 65);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(fmt(financeData.summary.gross_revenue), 20, 75);
      doc.text(fmt(financeData.summary.platform_commission), 80, 75);
      doc.setTextColor(16, 185, 129); // Success Green
      doc.text(fmt(financeData.summary.net_profit), 140, 75);

      // Performance Table
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("MONTHLY PERFORMANCE LEDGER", 14, 105);

      const tableRows = (financeData.monthlyPL || []).map(m => [
        m.name,
        fmt(m.revenue),
        fmt(m.costs),
        fmt(m.profit)
      ]);

      autoTable(doc, {
        startY: 110,
        head: [['Period', 'Revenue (Credits)', 'Costs (Debits)', 'Net Profit']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { font: "helvetica" },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`GoMo Internal Document - Confidential`, 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
      }

      doc.save(`GoMo-Fiscal-Report-${year}.pdf`);
      toast({ title: "Report Generated", description: `Professional fiscal report for ${year} is ready.` });
    } catch (err) {
      console.error("Download report error:", err);
      toast({ title: "Generation Failed", description: "Could not build the PDF report.", variant: "destructive" });
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
      {!loading && <PayoutRequestsManager payouts={payouts} onRefresh={fetchFinanceData} />}
    </div>
  );
}