import {
  LineChart,
  Line,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { getSellerFinanceAnalytics, getSellerStats } from "../../services/sellerService";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  Activity,
  Layers,
  Download
} from "lucide-react";
import {useState, useEffect} from "react";
import { exportToExcel } from "../../utils/exportUtils";
import { useToast } from "../../hooks/use-toast";

import { useAuth } from "../../context/AuthContext.jsx";

const SellerAnalytics = () => {
  const { user } = useAuth();
  const sellerId = user?.id;
  const { toast } = useToast();
  const [financeData, setFinanceData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    halfYearly: [],
    annual: [],
    paymentMethods: [],
    revenuePerProduct: [],
    returnRatePerProduct: [],
    retentionRate: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const financeRes = await getSellerFinanceAnalytics(sellerId);
        const statsRes = await getSellerStats(sellerId);

        if (financeRes.success) {
          setFinanceData(financeRes.data);
        }
        if (statsRes.success) {
          setStats(statsRes.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Generating reports...</p>
        </div>
      </div>
    );
  }

  const periods = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
    { id: "halfYearly", label: "Half Yearly" },
    { id: "annual", label: "Annual" }
  ];

  const currentChartData = financeData[selectedPeriod] || [];

  const avgOrderValue = stats?.total_orders > 0
    ? (parseFloat(stats.total_revenue) / parseInt(stats.total_orders)).toFixed(0)
    : 0;

  const handleExport = () => {
    if (!currentChartData || currentChartData.length === 0) {
      toast({ title: "Export Failed", description: "No analytics data available for the selected period.", variant: "destructive" });
      return;
    }
    
    try {
      const dataToExport = currentChartData.map(d => ({
        "Period": d.name || "N/A",
        "Revenue (₹)": Number(d.value) || 0
      }));
      
      exportToExcel(dataToExport, `Analytics_${selectedPeriod}`);
      toast({ title: "Export Successful", description: `${selectedPeriod} analytics exported to Excel.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Export Failed", description: "An error occurred while generating the Excel file.", variant: "destructive" });
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BarChart3 size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Performance Analytics</span>
          </div>
          <h1 className="text-4xl font-bold text-orange-950 tracking-tight">
            Financial <span className="font-normal text-orange-500">Intelligence</span>
          </h1>
          <p className="text-xs text-orange-500 tracking-tight">
            Strategic insights and revenue metrics for your boutique.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full">
           <Calendar size={12} className="text-orange-400" />
           <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Real-time Data</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 border border-orange-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Activity size={80} strokeWidth={1} />
          </div>
          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Avg Order Value</p>
          <div className="flex items-end justify-between mt-4">
            <h4 className="text-3xl font-bold text-orange-950 tracking-tight">₹{Number(avgOrderValue).toLocaleString()}</h4>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(stats?.aov_growth) >= 0 ? 'text-orange-600 bg-orange-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
              {Number(stats?.aov_growth) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats?.aov_growth)}%
            </div>
          </div>
          <div className="mt-8 w-full bg-orange-50 h-0.5 relative overflow-hidden">
            <div className="bg-orange-950 h-full absolute left-0 transition-all duration-1000" style={{ width: `${Math.min(Math.abs(stats?.aov_growth || 0), 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 border border-orange-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <ArrowUpRight size={80} strokeWidth={1} />
          </div>
          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Revenue Growth</p>
          <div className="flex items-end justify-between mt-4">
            <h4 className="text-3xl font-bold text-orange-950 tracking-tight">{stats?.revenue_growth}%</h4>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(stats?.revenue_growth) >= 0 ? 'text-orange-600 bg-orange-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
              {Number(stats?.revenue_growth) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats?.revenue_growth)}%
            </div>
          </div>
          <div className="mt-8 w-full bg-orange-50 h-0.5 relative overflow-hidden">
            <div className={`h-full absolute left-0 transition-all duration-1000 ${Number(stats?.revenue_growth) >= 0 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(Math.abs(stats?.revenue_growth), 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 border border-orange-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <History size={80} strokeWidth={1} />
          </div>
          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Retention Rate</p>
          <div className="flex items-end justify-between mt-4">
            <h4 className="text-3xl font-bold text-orange-950 tracking-tight">{financeData.retentionRate || 0}%</h4>
            <span className="text-[10px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">
               {Number(financeData.retentionRate) > 50 ? 'Premium' : 'Standard'}
            </span>
          </div>
          <div className="mt-8 w-full bg-orange-50 h-0.5 relative overflow-hidden">
            <div className="bg-orange-950 h-full absolute left-0 transition-all duration-1000" style={{ width: `${financeData.retentionRate || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Analytics Section */}
      <div className="bg-white p-10 border border-orange-100 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-orange-950 tracking-tight">
              Revenue Dynamics
            </h3>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Detailed financial breakdown of your store's performance</p>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-orange-50 border border-orange-100">
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm ${selectedPeriod === p.id
                  ? "bg-orange-950 text-white shadow-lg"
                  : "text-orange-400 hover:text-orange-950 hover:bg-orange-100"
                  }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={handleExport}
              className="px-6 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-orange-950 hover:bg-orange-100 transition-colors"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="h-[450px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData}>
              <defs>
                <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 9, fontWeight: 900 }}
                tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: '0px',
                  border: '0.5px solid #e5e5e5',
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ fontWeight: 900, color: '#0a0a0a', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                labelStyle={{ fontWeight: 800, color: '#737373', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                cursor={{ stroke: '#0a0a0a', strokeWidth: 0.5, strokeDasharray: '5 5' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0a0a0a"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenuePremium)"
                animationDuration={2500}
                activeDot={{ r: 4, strokeWidth: 4, stroke: '#fff', fill: '#0a0a0a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 border border-orange-100 shadow-sm min-h-[500px] flex flex-col group">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-orange-950 tracking-tight">Volume Distribution</h4>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Payment Method Efficiency</p>
            </div>
            <PieChart size={20} className="text-orange-400 group-hover:text-orange-950 transition-colors" />
          </div>
          
          <div className="flex-1 min-h-[300px] relative">
            {financeData.paymentMethods?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData.paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontWeight: 900, fontSize: 10, fill: '#737373', textTransform: 'uppercase' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontWeight: 900, fontSize: 10, fill: '#737373' }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '0px', border: '0.5px solid #e5e5e5', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                    labelStyle={{ fontSize: '10px', color: '#737373' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#171717"
                    radius={[2, 2, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-400 bg-orange-50/50 border-[0.5px] border-dashed border-orange-200">
                <div className="mb-6 opacity-10">
                  <Layers size={64} />
                </div>
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">No Payment Data Identified</p>
                <p className="text-[8px] font-bold mt-3 opacity-60 uppercase tracking-widest">Awaiting initial store transactions</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-orange-950 p-10 shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-white">
             <BarChart3 size={120} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-bold text-white tracking-tight mb-1">Performance Quotient</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-12">Comparative Growth Analysis</p>
            
            <div className="space-y-10">
               <div>
                  <div className="flex justify-between items-end mb-4">
                     <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Efficiency Rate</span>
                     <span className="text-xl font-bold text-white tracking-tight">{stats?.efficiency || "100.0"}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-px relative">
                     <div className="h-full absolute left-0 bg-white transition-all duration-1000" style={{ width: `${stats?.efficiency || 100}%` }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-4">
                     <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Order Velocity</span>
                     <span className="text-xl font-bold text-white tracking-tight">+{stats?.order_growth || "0.0"}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-px relative">
                     <div className="h-full absolute left-0 bg-white transition-all duration-1000" style={{ width: `${Math.min(Math.abs(stats?.order_growth || 0), 100)}%` }}></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-4">
                     <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Customer Loyalty</span>
                     <span className="text-xl font-bold text-white tracking-tight">+{stats?.customer_growth || "0.0"}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-px relative">
                     <div className="h-full absolute left-0 bg-white transition-all duration-1000" style={{ width: `${Math.min(Math.abs(stats?.customer_growth || 0), 100)}%` }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Deep-Dive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 border border-orange-100 shadow-sm flex flex-col group">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-orange-950 tracking-tight">Revenue By Product</h4>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Top 10 performing items</p>
            </div>
            <BarChart3 size={20} className="text-orange-400 group-hover:text-orange-950 transition-colors" />
          </div>
          
          <div className="flex-1 min-h-[300px] relative">
            {financeData.revenuePerProduct?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData.revenuePerProduct} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" opacity={0.5} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 10, fill: '#737373' }} tickFormatter={(val) => `₹${val}`} />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 9, fill: '#737373' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0px', border: '0.5px solid #e5e5e5', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 900, fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-400 bg-orange-50/50 border-[0.5px] border-dashed border-orange-200">
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">No Sales Data Yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 border border-orange-100 shadow-sm flex flex-col group">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-orange-950 tracking-tight">Product Return Rates</h4>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Top items with highest return rates</p>
            </div>
            <TrendingDown size={20} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
          </div>
          
          <div className="flex-1 min-h-[300px] relative">
            {financeData.returnRatePerProduct?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeData.returnRatePerProduct} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" opacity={0.5} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 10, fill: '#737373' }} tickFormatter={(val) => `${val}%`} />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 9, fill: '#737373' }} />
                  <RechartsTooltip cursor={{ fill: '#fff1f2' }} contentStyle={{ borderRadius: '0px', border: '0.5px solid #e5e5e5', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 900, fontSize: '12px' }} />
                  <Bar dataKey="return_rate" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-400 bg-orange-50/50 border-[0.5px] border-dashed border-orange-200">
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">No Return Data Found</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SellerAnalytics;
