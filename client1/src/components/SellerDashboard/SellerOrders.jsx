import React, { useState, useEffect } from "react";
import { getSellerOrders } from "../../services/sellerService";
import OrderDetailsModal from "./OrderDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  History, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const SellerOrders = () => {
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!sellerId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await getSellerOrders(sellerId);
        if (res.success) {
          setOrders(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [sellerId]);

  const statusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-orange-500 border-orange-100 bg-orange-50";
      case "shipped":
        return "text-orange-500 border-orange-100 bg-orange-50";
      case "delivered":
        return "text-orange-500 border-orange-100 bg-orange-50";
      case "cancelled":
        return "text-rose-500 border-rose-100 bg-rose-50";
      default:
        return "text-orange-400 border-orange-100 bg-orange-50";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || order.status.toLowerCase() === activeTab.toLowerCase();
    
    return matchesSearch && matchesTab;
  });

  const tabs = [
    { id: "all", label: "All Sales", icon: ShoppingBag },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "shipped", label: "In Transit", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "cancelled", label: "Cancelled", icon: XCircle }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Synchronizing orders...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <History size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Order Fulfillment</span>
          </div>
          <h1 className="text-4xl font-semibold text-orange-950 tracking-tight">
            Order <span className="font-bold text-orange-600">History</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em]">
            Managing {orders.length} total transactions from your store.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:text-orange-950 transition-colors" />
            <input
              type="text"
              placeholder="FIND BY ID OR CUSTOMER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-3 bg-orange-50 border border-orange-100 text-[10px] uppercase tracking-widest outline-none focus:border-orange-950 focus:bg-white transition-all w-72 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 transition-all relative ${
                activeTab === tab.id 
                  ? "text-orange-950" 
                  : "text-orange-500 hover:text-orange-600"
              }`}
            >
              <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="order-tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-950" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-orange-50 text-[9px] text-orange-500 uppercase tracking-[0.4em] font-black border-b border-orange-100">
                <th className="px-10 py-6 font-black">Reference</th>
                <th className="px-10 py-6 font-black">Customer Detail</th>
                <th className="px-10 py-6 font-black">Transaction Date</th>
                <th className="px-10 py-6 text-right font-black">Gross Total</th>
                <th className="px-10 py-6 text-center font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              <AnimatePresence mode="popLayout">
                {filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => { setSelectedOrderId(order.id); setShowModal(true); }}
                  >
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-950 group-hover:text-orange-600 transition-colors">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <ShieldCheck size={10} className="text-orange-500" />
                          <span className="text-[7px] uppercase tracking-widest text-orange-500 font-bold">Encrypted</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-[11px] font-black uppercase tracking-wider text-orange-950 truncate max-w-[200px]">
                        {order.customer}
                      </p>
                      {order.status === 'Cancelled' && order.cancellation_reason ? (
                        <p className="text-[8px] text-red-500 uppercase tracking-wider mt-1 font-black max-w-[250px] truncate">
                          Reason: {order.cancellation_reason}
                        </p>
                      ) : (
                        <p className="text-[8px] text-orange-500 uppercase tracking-[0.3em] mt-1 font-bold">Authorized Account</p>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">
                        {new Date(order.placed_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="text-sm font-bold text-orange-950 tracking-tighter">₹{Number(order.total).toLocaleString()}</span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.4em] border ${statusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-10 py-32 text-center text-[10px] uppercase tracking-[0.6em] text-orange-400">
                      No matching records found in order history
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedOrderId && (
        <OrderDetailsModal 
          orderId={selectedOrderId} 
          onClose={() => {
            setShowModal(false);
            setSelectedOrderId(null);
            // Refresh logic
            const refresh = async () => {
              const res = await getSellerOrders(sellerId);
              if (res.success) setOrders(res.data);
            };
            refresh();
          }} 
        />
      )}
    </div>
  );
};

export default SellerOrders;