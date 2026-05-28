import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useAdminSearch } from "../../admin/contexts/AdminSearchContext";
import {
  IndianRupee, ShoppingCart, Package, Users, Activity,
  PackageCheck, Clock, ShieldAlert, Zap, Search, ListFilter,
  ShieldCheck, TrendingUp, TrendingDown, LayoutGrid, BarChart3,
  Rocket
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { api } from "../../../services/api";
import { StatCard } from "../components/StatCard";

function ProductImage({ src, name, size = 52 }) {
  const [imgError, setImgError] = useState(false);
  const isRealImage = src && !imgError && (src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/"));

  return (
    <div className="shrink-0 rounded-xl border border-orange-100 bg-orange-50/50 flex items-center justify-center overflow-hidden transition-transform duration-500" style={{ width: size, height: size }}>
      {isRealImage ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-orange-955 text-white font-bold text-md rounded-xl">
          {name ? name[0] : <Package className="w-5 h-5 text-orange-400" />}
        </div>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const { searchQuery: search, setSearchQuery: setSearch } = useAdminSearch();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await api.get('/admin/dashboard-data');
        if (resp.data.success) setDashboardData(resp.data.data);
      } catch (err) {
        console.error("Fetch dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPerformance = useMemo(() => {
    const list = dashboardData?.productPerformance || [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.room?.toLowerCase().includes(q)
    );
  }, [dashboardData, search]);

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 relative">
        <div className="absolute inset-0 border border-orange-100 rounded-full" />
        <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Initializing Portal</p>
    </div>
  );

  const stats = dashboardData?.stats || {};
  const admin = user || { name: "Administrator" };
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-12 pb-16">

      {/* Elegant Light Welcome Header (Matches Seller Dashboard exactly, completely flat sans-serif with zero italics) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">
              {isSuperAdmin ? "Super Admin Authority" : "Verified Administrative Session"}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">
            Welcome back, <span className="font-extrabold text-orange-955">{admin.name}</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            {isSuperAdmin 
              ? "Platform-wide configurations active. Elevated dashboard security permissions established."
              : `Platform operations running at peak performance. ${stats.today_orders > 0 ? `${stats.today_orders} transactions recorded today.` : "All parameters stable."}`
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end px-6 border-r border-orange-100">
            <span className="text-[9px] uppercase tracking-widest text-orange-500 font-bold">Local Time</span>
            <span className="text-sm font-bold text-orange-955">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => navigate('/admin/administrators')}
              className="px-8 py-3 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-black hover:bg-orange-850 transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
            >
              Manage Admins
            </button>
          )}
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-8 py-3 bg-white text-orange-955 border border-orange-200 hover:bg-orange-50 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-sm cursor-pointer active:scale-98"
          >
            Transactions
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - Using premium unified StatCard component */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={"₹" + Number(stats.total_revenue || 0).toLocaleString('en-IN')}
          change={"+" + Math.round((stats.today_revenue / (stats.total_revenue || 1)) * 100) + "%"}
          changeType="positive"
          icon={IndianRupee}
        />
        <StatCard
          title="Orders"
          value={stats.total_orders || 0}
          todayValue={stats.today_orders || 0}
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          title="Inventory"
          value={stats.total_products || 0}
          todayValue={stats.today_new_products || 0}
          changeType="neutral"
          icon={Package}
        />
        <StatCard
          title="Clients"
          value={stats.total_customers || 0}
          todayValue={stats.today_new_customers || 0}
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-5 items-start">
        {/* Recent Transactions Matrix */}
        <div className="lg:col-span-3 bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-orange-100 pb-5">
            <div>
              <h3 className="text-xl font-extrabold text-orange-955 tracking-tight">Latest Activity</h3>
              <p className="text-[9px] uppercase tracking-[0.3em] text-orange-500 font-bold mt-1">Real-time ledger updates</p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-[9px] font-bold text-orange-700 uppercase tracking-widest border border-orange-200 px-4 py-2 rounded-xl bg-orange-55 hover:bg-orange-955 hover:text-white hover:border-orange-955 transition-all duration-300 cursor-pointer active:scale-98"
            >
              View Directory
            </button>
          </div>

          <div className="space-y-4">
            {(dashboardData?.recentOrders || []).map((o) => (
              <div 
                key={o.id} 
                className="flex items-center justify-between p-4.5 border border-orange-100 hover:border-orange-955 rounded-2xl transition-all duration-300 cursor-pointer bg-white hover:bg-orange-50/30 hover:scale-[1.01]" 
                onClick={() => navigate('/admin/orders')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                    <ShoppingCart size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-orange-955 uppercase tracking-wider">{o.customer}</h4>
                    <p className="text-[9px] font-bold text-stone-500 mt-1 uppercase tracking-wider">
                      REF: <span className="text-stone-700">#{o.id.split('-')[0].toUpperCase()}</span> <span className="mx-1.5 text-orange-200">|</span> {o.items} Units
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-955">{o.total}</p>
                  <span className={cn("inline-block mt-1.5 text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                    o.status === 'Delivered' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                      o.status === 'Cancelled' ? 'border-rose-200 bg-rose-50 text-rose-800' :
                        'border-amber-200 bg-amber-50 text-amber-800'
                  )}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {(!dashboardData?.recentOrders?.length) && (
              <div className="p-12 text-center border border-dashed border-orange-200 rounded-xl bg-orange-50/20">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">No transactions recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Intelligence Tools */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight mb-6 border-b border-orange-100 pb-4">Shortcuts</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Catalog', icon: Package, path: '/admin/products' },
                { label: 'Orders', icon: LayoutGrid, path: '/admin/orders' },
                { label: 'Clients', icon: Users, path: '/admin/customers' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-5 p-4 border border-orange-100 rounded-2xl bg-white text-orange-955 hover:bg-orange-50/50 hover:border-orange-955 hover:scale-[1.02] transition-all duration-300 group cursor-pointer active:scale-98"
                >
                  <div className="h-10 w-10 border border-orange-200 rounded-xl flex items-center justify-center transition-all duration-300 bg-orange-50 group-hover:bg-orange-955 group-hover:border-orange-955 group-hover:scale-105">
                    <item.icon size={16} strokeWidth={1.5} className="text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-900 group-hover:text-orange-955 transition-colors">{item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Catalog Overview */}
      <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-orange-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-extrabold text-orange-955 tracking-tight">Boutique Products</h3>
            <p className="text-[9px] text-orange-500 font-bold mt-1 uppercase tracking-wider">Live Catalog Metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
              <input
                placeholder="Search catalog..."
                className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-50/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all duration-300 rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50/50">
                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Identification</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Valuation</th>
                <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Units</th>
                <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-stone-800">
              {filteredPerformance.map(p => (
                <tr key={p.id} className="transition-all duration-200 cursor-pointer hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group" onClick={() => navigate('/admin/products')}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <ProductImage src={p.image} name={p.name} size={48} />
                      <div>
                        <p className="text-sm font-bold text-orange-955 group-hover:text-orange-600 transition-colors uppercase tracking-wide">{p.name}</p>
                        <p className="text-[9px] font-bold text-stone-500 uppercase mt-1 tracking-wider">
                          SKU: {p.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                      {p.room || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-bold text-orange-955">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={cn("text-sm font-bold tracking-wider", (p.stock || 0) < 10 ? 'text-orange-600 font-bold' : 'text-stone-800')}>
                      {p.stock || 0}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn("inline-block px-3 py-1 border text-[8px] font-black uppercase tracking-wider rounded-full",
                      (p.stock || 0) > 0 ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                    )}>
                      {(p.stock || 0) > 0 ? 'Available' : 'Depleted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
