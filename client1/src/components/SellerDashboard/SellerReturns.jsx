import React, { useState, useEffect } from "react";
import { getSellerReturns, resolveSellerReturnRequest } from "../../services/sellerService";
import { useAuth } from "../../context/AuthContext.jsx";
import { 
  RotateCcw, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SellerReturns = () => {
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id;

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All"); // All, Pending, Approved, Rejected
  
  // Selected Return Detail State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [resolving, setResolving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  const fetchReturnsData = async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await getSellerReturns(sellerId);
      if (res.success) {
        setReturns(res.data);
      } else {
        setError(res.message || "Failed to load returns.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while fetching return requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsData();
  }, [sellerId]);

  const handleResolve = async (status) => {
    if (!selectedReturn) return;
    setResolving(true);
    setSuccessMessage(null);
    setResolveError(null);
    try {
      const res = await resolveSellerReturnRequest(sellerId, {
        returnRequestId: selectedReturn.id,
        status,
        remarks: remarks || `Resolved by boutique seller`
      });

      if (res.success) {
        setSuccessMessage(`Successfully ${status.toLowerCase()} the return request.`);
        setRemarks("");
        // Refresh local data
        await fetchReturnsData();
        // Update selectedReturn in-place or close drawer
        setSelectedReturn(null);
      } else {
        setResolveError(res.message || "Failed to resolve return request.");
      }
    } catch (err) {
      console.error(err);
      setResolveError("Error resolving return request.");
    } finally {
      setResolving(false);
    }
  };

  // Filter returns based on search and selected active tab
  const filteredReturns = returns.filter(item => {
    const matchesSearch = 
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTab = 
      activeTab === "All" || 
      item.status?.toLowerCase() === activeTab.toLowerCase();
      
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-800 text-[9px] font-black uppercase tracking-widest border border-orange-200/50">
            <Clock size={10} /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-800 text-[9px] font-black uppercase tracking-widest border border-orange-200/50">
            <CheckCircle2 size={10} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 text-[9px] font-black uppercase tracking-widest border border-rose-200/50">
            <XCircle size={10} /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-200/50">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Synchronizing returns ledger...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn relative">
      
      {/* Success Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-orange-950 text-orange-200 border border-orange-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} />
              <p className="text-[11px] uppercase tracking-wider font-bold">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-orange-400 hover:text-white">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RotateCcw size={14} className="text-orange-950 animate-spin-slow" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Reverse Logistics Portal</span>
          </div>
          <h1 className="text-4xl font-semibold text-orange-950 tracking-tight">
            Customer <span className="font-bold text-orange-600">Returns</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-lg">
            Review product return requests, assess refund eligibility, and process approvals securely.
          </p>
        </div>
      </div>

      {/* Control Panel (Tabs & Search) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        {/* Status Tabs */}
        <div className="flex items-center border-b border-orange-200">
          {["All", "Pending", "Approved", "Rejected"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-[10px] uppercase tracking-widest font-black transition-all border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? "border-orange-950 text-orange-950 font-black"
                  : "border-transparent text-orange-400 hover:text-orange-950"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search customer, item, return ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-orange-200 text-orange-900 placeholder-orange-400 text-xs focus:border-orange-950 outline-none transition-all rounded-none"
          />
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
        </div>
      </div>

      {/* Main Returns Grid */}
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
        {filteredReturns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/50">
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Return ID</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Customer</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Product</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Refund Amt</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Type</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Status</th>
                  <th className="px-8 py-5 text-right text-[9px] uppercase tracking-[0.3em] font-black text-orange-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {filteredReturns.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedReturn(item)}
                    className="group hover:bg-orange-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-900 bg-orange-100 px-2 py-1">
                        {item.displayId}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-orange-900">{item.customerName}</p>
                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">
                          {new Date(item.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-orange-800 line-clamp-1 max-w-xs">{item.productName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-orange-900">₹{item.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] uppercase tracking-widest text-orange-500 font-black">
                        {item.returnType || "Return"}
                      </span>
                    </td>
                    <td className="px-8 py-6">{getStatusBadge(item.status)}</td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 bg-orange-50 text-orange-400 group-hover:bg-orange-950 group-hover:text-white transition-all rounded-none">
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto">
              <RotateCcw size={24} className="text-orange-300" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest font-black text-orange-700">No Return Requests Found</p>
              <p className="text-[10px] text-orange-400 uppercase tracking-[0.2em]">There are no return requests matching this search.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sliding Return Detail Drawer */}
      <AnimatePresence>
        {selectedReturn && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReturn(null)}
              className="fixed inset-0 bg-orange-600 z-40"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-orange-100 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-8 border-b border-orange-100 flex items-center justify-between bg-orange-50">
                <div className="space-y-1">
                  <span className="text-[9px] bg-orange-900 text-white px-2.5 py-1 uppercase tracking-widest font-black">
                    {selectedReturn.displayId}
                  </span>
                  <h3 className="text-lg font-serif text-orange-950 pt-2">Return Specifications</h3>
                </div>
                <button 
                  onClick={() => setSelectedReturn(null)}
                  className="p-2 bg-white hover:bg-orange-900 hover:text-white transition-all border border-orange-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-8 flex-1">
                {/* Product Detail */}
                <div className="space-y-3">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-orange-400 font-black">Product Information</span>
                  <div className="p-5 border border-orange-100 bg-orange-50/50 space-y-2">
                    <h4 className="text-xs font-black text-orange-900 uppercase tracking-wider">{selectedReturn.productName}</h4>
                    <p className="text-[10px] text-orange-500 uppercase tracking-widest">Linked Order: #{selectedReturn.orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-orange-400 font-black block">Customer Name</span>
                    <span className="text-xs font-bold text-orange-900">{selectedReturn.customerName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-orange-400 font-black block">Refund Amount</span>
                    <span className="text-xs font-bold text-orange-900">₹{selectedReturn.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Dates & Reason */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-orange-400 font-black block">Request Date</span>
                      <span className="text-xs text-orange-800 font-bold">
                        {new Date(selectedReturn.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-orange-400 font-black block">Return Type</span>
                      <span className="text-xs text-orange-800 font-black uppercase tracking-widest">{selectedReturn.returnType || "Refund"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-orange-400 font-black block">Customer's Reason</span>
                    <p className="text-xs leading-relaxed text-orange-600 bg-orange-50 p-5 border border-orange-100 italic">
                      "{selectedReturn.reason || "No explicit reasoning provided."}"
                    </p>
                  </div>
                </div>

                {/* Action Form if Pending */}
                {selectedReturn.status?.toLowerCase() === "pending" ? (
                  <div className="space-y-4 pt-4 border-t border-orange-100">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-orange-400 font-black block">Review Resolution</span>
                    
                    {resolveError && (
                      <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={12} className="text-rose-700 animate-pulse" />
                          <span>{resolveError}</span>
                        </div>
                        <button onClick={() => setResolveError(null)} className="text-rose-600 hover:text-rose-950 font-black text-[11px] ml-2">✕</button>
                      </div>
                    )}

                    <textarea
                      placeholder="Input review remarks or return terms (will be shown to the customer)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full p-4 border border-orange-200 outline-none text-xs focus:border-orange-900 transition-all rounded-none min-h-[100px] placeholder-orange-400 text-orange-800 bg-white"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        onClick={() => handleResolve("Rejected")}
                        disabled={resolving}
                        className="py-4 bg-rose-50 text-rose-800 hover:bg-rose-100 text-[10px] uppercase tracking-widest font-black transition-colors border border-rose-200"
                      >
                        {resolving ? "Processing..." : "Reject Return"}
                      </button>
                      <button
                        onClick={() => handleResolve("Approved")}
                        disabled={resolving}
                        className="py-4 bg-orange-950 hover:bg-orange-800 text-white text-[10px] uppercase tracking-widest font-black transition-colors"
                      >
                        {resolving ? "Processing..." : "Approve Return"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-orange-100 space-y-4">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-orange-400 font-black block">Resolution Status</span>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100">
                      <Info size={16} className="text-orange-400" />
                      <p className="text-[10px] uppercase tracking-wider text-orange-500 font-bold">
                        This request is already resolved and marked as <span className="font-black text-orange-950">{selectedReturn.status}</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerReturns;
