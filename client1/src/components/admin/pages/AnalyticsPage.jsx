import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Activity, Package, IndianRupee, Download, 
  BarChart3 as BarIcon, PieChart as PieIcon, LayoutGrid, Box,
  ArrowUpRight, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import { exportToExcel } from "../../../utils/exportUtils";
import { StatCard } from "../components/StatCard";

const RANGES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'halfYearly', label: 'Half Yearly' },
  { id: 'annual', label: 'Annual' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'all', label: 'All Time' },
];

const COLORS = ["#f97316", "#ea580c", "#0c0a09", "#fdba74", "#7c2d12", "#a8a29e"];

export default function AnalyticsPage() {
  const [range, setRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    trend: [], categorySales: [], categoryDistribution: [], statusDistribution: [], topProducts: [], summary: null
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { fetchAnalytics(); }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/admin/analytics-data?range=${range}`);
      if (resp.data.success) setAnalytics(resp.data.data);
    } catch (err) {
      toast({ title: "Error", description: "Could not load analytics data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const summary = analytics.summary || {};
  const totalRevenue = Number(summary.total_revenue || 0);
  const totalOrders = Number(summary.total_orders || 0);
  const totalItems = Number(summary.total_items_sold || 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statCards = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Transaction Count', value: totalOrders.toLocaleString(), icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Verified Delivery', value: totalItems.toLocaleString(), icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Avg Valuation', value: `₹${Math.round(avgOrderValue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const handleExport = () => {
    const exportData = {
      "Top Products": analytics.topProducts || [],
      "Category Distribution": analytics.categoryDistribution || [],
      "Revenue Trend": analytics.trend || [],
      "Recent Deliveries": analytics.recentDeliveries || []
    };
    
    exportToExcel(exportData, `GoMo_Intelligence_${range}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}`);
    toast({ title: "Intelligence Exported", description: "Excel report is now available for review." });
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Activity size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Intelligence Matrix</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Market Dynamics</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Comprehensive analysis of platform liquidity, fulfillment velocity, and sector-specific growth vectors.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchAnalytics}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button 
            onClick={handleExport}
            className="px-8 py-3 bg-orange-955 text-white hover:bg-orange-850 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
          >
            <Download size={14} /> Export Intelligence
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white border border-orange-100 rounded-3xl p-4 shadow-sm">
        <div className="flex flex-wrap p-1 bg-orange-55/30 border border-orange-100 rounded-2xl gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "px-5 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                range === r.id 
                  ? "bg-orange-955 text-white shadow-md" 
                  : "text-orange-500 hover:bg-orange-50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-orange-955 pr-4">
           <div className="flex items-center gap-1.5">
             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live Feed</span>
           </div>
           <div className="h-4 w-px bg-orange-150" />
           <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Last Sync: <span className="text-orange-600">{new Date().toLocaleTimeString()}</span></p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <StatCard 
            key={i}
            title={card.label}
            value={card.value}
            todayValue="Peak Volume"
            changeType="positive"
            icon={card.icon}
          />
        ))}
      </div>

      {/* FINANCIAL INTELLIGENCE SECTION */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-1 w-12 bg-orange-500 rounded-full" />
          <h2 className="text-xl font-black text-orange-900 uppercase tracking-[0.3em]">Revenue Performance</h2>
        </div>
             <div className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Revenue Trend</h3>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Total Sales vs Operational Costs</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
               <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-orange-950 shadow-sm" /><span className="text-[9px] font-black uppercase text-stone-600 tracking-wider">Revenue</span></div>
               <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm" /><span className="text-[9px] font-black uppercase text-stone-600 tracking-wider">Costs</span></div>
               <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-orange-500 shadow-sm" /><span className="text-[9px] font-black uppercase text-stone-600 tracking-wider">Net Profit</span></div>
            </div>
          </div>
          <div className="h-[400px] w-full min-h-[400px] min-w-0 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center"><div className="h-12 w-12 border-2 border-orange-100 border-t-orange-955 rounded-full animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={analytics.trend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fdba74" stopOpacity={0.15}/><stop offset="95%" stopColor="#fdba74" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '16px' }}
                    itemStyle={{ fontWeight: '800', fontSize: '13px', color: '#0c0a09' }}
                    formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, name.toUpperCase()]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} />
                  <Area type="monotone" dataKey="costs" stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 6" fill="transparent" />
                  <Area type="monotone" dataKey="profit" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" activeDot={{ r: 6, strokeWidth: 0, fill: '#ea580c' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* OPERATIONAL INTELLIGENCE SECTION */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-1 w-12 bg-orange-955 rounded-full" />
          <h2 className="text-xl font-black text-orange-900 uppercase tracking-[0.3em]">Order Statistics</h2>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Order Volume</h3>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Volume trend and fulfillment spikes</p>
               </div>
               <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                  <BarIcon size={18} />
               </div>
            </div>
            <div className="h-[350px] w-full min-h-[350px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={analytics.trend}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '16px' }}
                    itemStyle={{ fontWeight: '800', fontSize: '13px', color: '#0c0a09' }}
                    formatter={v => [v, 'ORDERS']}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={5} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-orange-100 rounded-3xl p-8 shadow-sm flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-bl-full -mr-24 -mt-24 group-hover:bg-orange-100 transition-all duration-500" />
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                  <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Fulfillment Status</h3>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Logistics health distribution</p>
               </div>
               <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                  <LayoutGrid size={18} />
               </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full min-w-0 relative z-10 mb-6">
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                     <Pie
                       data={analytics.statusDistribution}
                       cx="50%" cy="50%"
                       innerRadius={70}
                       outerRadius={105}
                       paddingAngle={6}
                       dataKey="value"
                       strokeWidth={0}
                     >
                       {analytics.statusDistribution.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '12px' }} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-orange-955 tracking-tighter leading-none">{totalOrders}</span>
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">Total Packets</span>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
               {analytics.statusDistribution.slice(0, 4).map((s, i) => (
                 <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-orange-55/30 hover:bg-white transition-all border border-orange-100 hover:border-orange-200 shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-stone-500 uppercase tracking-wider">{s.name}</span>
                       <span className="text-xs font-black text-orange-955">{s.value}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* MARKET INTELLIGENCE SECTION */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-1 w-12 bg-orange-955 rounded-full" />
          <h2 className="text-xl font-black text-orange-900 uppercase tracking-[0.3em]">Category Insights</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm group relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Category Performance</h3>
                   <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Revenue generation per sector</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                   <IndianRupee size={18} />
                </div>
             </div>
             <div className="h-[350px] w-full min-h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={analytics.categorySales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '16px' }}
                      itemStyle={{ fontWeight: '800', fontSize: '13px', color: '#0c0a09' }}
                      formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'REVENUE']}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm flex flex-col group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-bl-full -mr-24 -mt-24 group-hover:bg-orange-100 transition-all duration-500" />
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                   <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Inventory Split</h3>
                   <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Catalog distribution by category</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                   <Box size={18} />
                </div>
             </div>
             <div className="flex-1 min-h-[300px] w-full min-w-0 relative z-10 mb-6 flex flex-col items-center justify-center">
                <div className="h-[250px] w-full min-h-[250px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryDistribution}
                        cx="50%" cy="50%"
                        innerRadius={75}
                        outerRadius={110}
                        paddingAngle={6}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {analytics.categoryDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-orange-955 tracking-tighter">{analytics.categoryDistribution.reduce((acc, curr) => acc + curr.value, 0)}</span>
                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">Unique SKUs</span>
                  </div>
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* TOP PRODUCTS SECTION */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-1 w-12 bg-orange-955 rounded-full" />
          <h2 className="text-xl font-black text-orange-900 uppercase tracking-[0.3em]">Top Performing Products</h2>
        </div>

        <div className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm group relative overflow-hidden">
           <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                 {(analytics.topProducts || []).slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-orange-55/30 hover:bg-orange-50/50 transition-all border border-orange-100 group/item">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white border border-orange-150 flex items-center justify-center font-black text-orange-600 group-hover/item:border-orange-955 group-hover/item:text-orange-955 transition-all text-xs">
                             0{i + 1}
                          </div>
                          <div>
                             <h4 className="font-black text-orange-955 tracking-tight text-sm">{p.name}</h4>
                             <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{p.seller}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-orange-955 text-sm">₹{p.revenue.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mt-0.5">{p.qty} Sold</p>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="h-[300px] w-full min-h-[300px] min-w-0 flex items-center">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={analytics.topProducts?.slice(0, 5)} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" hide />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#fff', padding: '12px' }}
                         itemStyle={{ fontWeight: '800', fontSize: '13px', color: '#0c0a09' }}
                         formatter={(v) => [`₹${v.toLocaleString()}`, 'REVENUE']}
                       />
                       <Bar dataKey="revenue" fill="#f97316" radius={[0, 8, 8, 0]} barSize={24} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* LOGISTICS INTELLIGENCE SECTION */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <div className="h-1 w-12 bg-orange-955 rounded-full" />
          <h2 className="text-xl font-black text-orange-900 uppercase tracking-[0.3em]">Logistics Intelligence</h2>
        </div>

        <div className="bg-white border border-orange-100 rounded-3xl p-8 shadow-sm overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-orange-955 tracking-tight uppercase">Recent Deliveries</h3>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-1">Live synchronization from the deliveries table</p>
            </div>
            <div className="flex items-center gap-2.5 bg-orange-50/50 text-orange-955 px-4 py-2 rounded-xl border border-orange-100">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider text-orange-600">Operational Pulse</span>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-orange-100">
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Order Sequence</th>
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Authority</th>
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Logistics Partner</th>
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">Protocol Status</th>
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Dispatched</th>
                  <th className="pb-4 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Handover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {(analytics.recentDeliveries || []).map((d) => (
                  <tr key={d.delivery_id} className="group/row hover:bg-orange-50/20 transition-colors">
                    <td className="py-4 font-bold text-orange-955">#{d.order_id.slice(0, 8)}</td>
                    <td className="py-4 font-bold text-stone-850">{d.customer_name}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-orange-955">{d.courier_name}</span>
                        <span className="text-[10px] font-bold text-stone-500 mt-0.5">{d.awb_code}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border",
                        d.shipping_status === 'Delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                        d.shipping_status === 'Shipped' ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-stone-50 text-stone-500 border-stone-200"
                      )}>
                        {d.shipping_status}
                      </span>
                    </td>
                    <td className="py-4 text-stone-500 text-xs font-bold">
                      {d.dispatched_at ? new Date(d.dispatched_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-4 text-stone-500 text-xs font-bold">
                      {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
                {(!analytics.recentDeliveries || analytics.recentDeliveries.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-orange-300">
                          <Package size={24} />
                        </div>
                        <p className="text-xs font-bold text-stone-500">No logistics data found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
