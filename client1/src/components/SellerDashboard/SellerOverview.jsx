import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";
import { getSellerStats, getSellerDashboardData } from "../../services/sellerService";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight,
  CreditCard,
  Zap,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

const SellerOverview = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const sellerId = user?.seller_id || user?.id;
  
  const [stats, setStats] = useState({
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    total_customers: 0,
    pending_orders: 0,
    revenue_growth: "0.0",
    order_growth: "0.0",
    customer_growth: "0.0",
    efficiency: "100.0"
  });

  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sellerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshUser();
        const statsRes = await getSellerStats(sellerId);
        const graphRes = await getSellerDashboardData(sellerId);

        if (statsRes.success) {
          setStats(statsRes.data.stats);
          setRecentOrders(statsRes.data.recentOrders);
        }

        if (graphRes.success) {
          setRevenueData(graphRes.data.revenueData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setError("Unable to sync dashboard data.");
      }
      setLoading(false);
    };

    fetchData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Refining your data...</p>
      </div>
    );
  }

  const statCards = [
    { title: "Revenue", value: `₹${Number(stats.total_revenue).toLocaleString()}`, icon: CreditCard, growth: stats.revenue_growth, label: "Total Earnings" },
    { title: "Orders", value: stats.total_orders, icon: ShoppingBag, growth: stats.order_growth, label: "Total Sales" },
    { title: "Customers", value: stats.total_customers, icon: Users, growth: stats.customer_growth, label: "Active Buyers" },
    { title: "Products", value: stats.total_products, icon: Package, growth: "Live", label: "Store Inventory" },
  ];

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Verified Business Account</span>
          </div>
          <h1 className="text-4xl font-serif text-orange-950 tracking-tight">
            Welcome back, <span className="italic font-light">{user?.store_name || user?.full_name}</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-lg">
            Monitor your store's heartbeat. Here's your performance summary for the last 30 days.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end px-6 border-r border-orange-100">
            <span className="text-[9px] uppercase tracking-widest text-orange-500 font-bold">Local Time</span>
            <span className="text-sm font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button 
            onClick={() => navigate('/seller-dashboard/products')}
            className="px-8 py-3 bg-orange-950 text-white text-[10px] uppercase tracking-widest font-black hover:bg-orange-800 transition-all flex items-center gap-3 shadow-xl"
          >
            <Plus size={14} /> Add New Listing
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group p-8 bg-white border border-orange-100 hover:border-orange-950 transition-all duration-500 shadow-sm hover:shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-orange-100 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-10 relative">
              <div className="p-3 bg-orange-50 text-orange-400 group-hover:bg-orange-950 group-hover:text-white transition-all duration-500">
                <item.icon size={20} strokeWidth={1.5} />
              </div>
              {item.growth !== "Live" && (
                <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter ${Number(item.growth) >= 0 ? 'text-orange-500' : 'text-rose-500'}`}>
                  {Number(item.growth) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(item.growth)}%
                </div>
              )}
            </div>

            <div className="relative">
              <p className="text-[9px] uppercase tracking-[0.4em] text-orange-500 font-bold mb-1">{item.title}</p>
              <h3 className="text-3xl font-serif text-orange-950 mb-4">{item.value}</h3>
              <p className="text-[8px] uppercase tracking-widest text-orange-400 font-black">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 space-y-8 p-8 bg-white border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif text-orange-900">Revenue Performance</h3>
              <p className="text-[9px] uppercase tracking-[0.3em] text-orange-500 font-bold">Transaction trend for the last 10 days</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="hidden sm:flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-orange-950"></div>
                 <span className="text-[8px] uppercase tracking-widest font-black text-orange-500">Current Cycle</span>
               </div>
               <button 
                 onClick={() => navigate('/seller-dashboard/analytics')}
                 className="px-5 py-2.5 bg-orange-50 hover:bg-orange-950 hover:text-white border border-orange-200 hover:border-orange-950 text-orange-700 text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-2"
               >
                 Full Details <ArrowRight size={12} />
               </button>
            </div>
          </div>

          <div className="h-[400px] w-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#737373', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em'}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    border: 'none', 
                    borderRadius: '0px', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                  }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  labelStyle={{ fontSize: '9px', fontWeight: '900', color: '#737373', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '2px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#171717" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)"
                  activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-8 p-8 bg-orange-50 border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <ShoppingBag size={120} strokeWidth={1} />
          </div>

          <div className="flex items-center justify-between border-b border-orange-200 pb-6 relative">
            <div>
              <h3 className="text-lg font-serif text-orange-900">Recent Orders</h3>
              <p className="text-[9px] uppercase tracking-[0.3em] text-orange-500 font-bold">Latest transactions</p>
            </div>
            <button 
              onClick={() => navigate('/seller-dashboard/orders')}
              className="p-2 hover:bg-orange-200 transition-colors rounded-full"
            >
              <ArrowUpRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-6 relative">
            {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
              <motion.div 
                key={order.order_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-4 bg-white border border-orange-100 hover:border-orange-300 transition-all group cursor-pointer"
                onClick={() => navigate('/seller/orders')}
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-950">
                    {order.customer_name}
                  </p>
                  <p className="text-[8px] text-orange-500 uppercase tracking-widest font-bold">
                    #{order.order_id.slice(0, 8).toUpperCase()} • {new Date(order.placed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-950">₹{Number(order.amount).toLocaleString()}</p>
                  <span className={`text-[7px] uppercase tracking-[0.2em] font-black ${
                    order.status === 'delivered' ? 'text-orange-500' : 'text-orange-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </motion.div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <Compass size={32} strokeWidth={1} className="mx-auto text-orange-200" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-orange-400 font-bold">No recent orders found</p>
              </div>
            )}

            {recentOrders.length > 0 && (
              <button 
                onClick={() => navigate('/seller-dashboard/orders')}
                className="w-full py-4 text-[9px] uppercase tracking-[0.4em] font-black text-orange-500 hover:text-orange-950 transition-colors border-t border-orange-200 mt-4"
              >
                View Full History
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Efficiency Banner */}
      <div className="bg-orange-950 p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative z-10 space-y-4 text-center lg:text-left">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <Zap size={16} className="text-orange-400" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-orange-400 font-black">Store Efficiency Profile</span>
          </div>
          <h2 className="text-3xl font-serif tracking-tight">Your fulfillment score is <span className="italic text-orange-400">{stats.efficiency}%</span></h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-orange-300 font-black max-w-md">
            Excellent! Your delivery speed and order accuracy are within the top 5% of sellers this month.
          </p>
        </div>
        <div className="flex items-center gap-12 relative z-10 border-l border-white/10 pl-12 hidden lg:flex">
          <div className="text-center">
            <p className="text-4xl font-light mb-2">{stats.pending_orders}</p>
            <p className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Pending Shipments</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light mb-2">{stats.total_customers}</p>
            <p className="text-[8px] uppercase tracking-widest text-orange-500 font-black">Total Followers</p>
          </div>
          <button 
            onClick={() => navigate('/seller-dashboard/analytics')}
            className="w-12 h-12 bg-white text-orange-900 flex items-center justify-center hover:bg-orange-200 transition-all shadow-2xl"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SellerOverview;