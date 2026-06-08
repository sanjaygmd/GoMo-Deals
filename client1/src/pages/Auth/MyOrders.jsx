import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyOrders, cancelOrder, createReturnRequest } from '../../services/orderService';
import { ShoppingBag, Truck, X, Clock, AlertCircle, ChevronRight, Package, Search, RotateCcw, ShieldAlert, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useShop } from '../../context/ShopContext';
import TrackOrderModal from '../../components/common/TrackOrderModal';
import { openDispute } from '../../services/disputeService';

const MyOrders = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { formatPrice } = useShop();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [returnType, setReturnType] = useState('Refund');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            if (user?.customer_id || user?.id) {
                try {
                    const res = await getMyOrders(user.customer_id || user.id);
                    if (res.success) {
                        setOrders(res.data);
                    }
                } catch (err) {
                    console.error("FAILED TO FETCH ORDERS:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrders();
    }, [user]);

    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setIsCancelModalOpen(true);
    };

    const handleReturnClick = (order) => {
        if (order.return_requests && order.return_requests.length > 0) {
            toast({
                title: "Action Blocked",
                description: "A return request has already been submitted for this order.",
                variant: "destructive"
            });
            return;
        }
        setSelectedOrder(order);
        setIsReturnModalOpen(true);
    };

    const handleConfirmReturn = async () => {
        if (!returnReason.trim()) return;
        try {
            // Use the first item for now (standard MVP approach)
            const item = selectedOrder.items?.[0];
            if (!item) throw new Error("No items found in this order.");

            const res = await createReturnRequest({
                order_id: selectedOrder.order_id,
                order_item_id: item.order_item_id,
                reason: returnReason,
                return_type: returnType
            });

            if (res.success) {
                setOrders(orders.map(o => o.order_id === selectedOrder.order_id 
                    ? { 
                        ...o, 
                        return_requests: [{ 
                            return_request_id: res.return_id || 'temp-id', 
                            order_id: selectedOrder.order_id, 
                            refund_status: 'Pending', 
                            return_type: returnType 
                        }] 
                      } 
                    : o
                ));
                setIsReturnModalOpen(false);
                setReturnReason('');
                setSelectedOrder(null);
                toast({
                    title: "Return Requested",
                    description: "Your return request has been submitted for review.",
                    variant: "default"
                });
            }
        } catch (err) {
            toast({
                title: "Request Failed",
                description: err.message || "Could not submit return request.",
                variant: "destructive"
            });
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancelReason.trim()) return;
        try {
            const res = await cancelOrder(selectedOrder.order_id, user.customer_id || user.id, cancelReason);
            if (res.success) {
                // Update local state
                setOrders(orders.map(o => o.order_id === selectedOrder.order_id ? { ...o, order_status: 'Cancelled' } : o));
                setIsCancelModalOpen(false);
                setCancelReason('');
                setSelectedOrder(null);
                toast({
                    title: "Order Cancelled",
                    description: `Order #${selectedOrder.order_id.slice(0, 8).toUpperCase()} has been successfully cancelled.`,
                    variant: "default"
                });
            }
        } catch (err) {
            toast({
                title: "Cancellation Failed",
                description: err.message || "We couldn't cancel your order at this moment.",
                variant: "destructive"
            });
        }
    };

    const handleDisputeClick = (order) => {
        setSelectedOrder(order);
        setIsDisputeModalOpen(true);
    };

    const handleConfirmDispute = async () => {
        if (!disputeReason.trim()) return;
        try {
            const res = await openDispute(selectedOrder.order_id, disputeReason);
            if (res.success) {
                setIsDisputeModalOpen(false);
                setDisputeReason('');
                setSelectedOrder(null);
                toast({
                    title: "Issue Reported",
                    description: "Your dispute has been escalated. Our team will review it shortly.",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Action Failed",
                    description: res.error || "Could not report issue.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            toast({
                title: "Action Failed",
                description: "Could not report issue.",
                variant: "destructive"
            });
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'All' || o.order_status === filterStatus;
        const matchesSearch = o.order_id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-orange-500 bg-orange-50';
            case 'Processing': return 'text-orange-500 bg-orange-50';
            case 'Shipped': return 'text-orange-500 bg-orange-50';
            case 'Delivered': return 'text-orange-500 bg-orange-50';
            case 'Cancelled': return 'text-rose-500 bg-rose-50';
            default: return 'text-orange-500 bg-orange-50';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-orange-100 border-t-orange-900 rounded-full animate-spin" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-orange-400">Loading History...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50/50 pt-16 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-serif tracking-[0.2em] uppercase mb-2">My <span className="italic font-light">Orders</span></h1>
                        <p className="text-[10px] text-orange-400 uppercase tracking-[0.3em] font-bold">Track, manage and review your purchases</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                            <input 
                                type="text"
                                placeholder="Search by Order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pl-12 pr-6 rounded-full bg-white border border-orange-100 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-orange-900 transition-all shadow-sm"
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-12 px-6 rounded-full bg-white border border-orange-100 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-orange-900 transition-all shadow-sm"
                        >
                            {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-6">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={order.order_id} 
                                className="bg-white border border-orange-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                    {/* Order Main Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-orange-900 flex items-center justify-center text-white">
                                                    <Package size={20} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-orange-900">Order #{order.order_id.slice(0, 12).toUpperCase()}</p>
                                                    <p className="text-[9px] text-orange-400 uppercase tracking-widest mt-1">Placed on {new Date(order.placed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${getStatusColor(order.order_status)}`}>
                                                {order.order_status}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-orange-50">
                                            <div>
                                                <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mb-1">Total Amount</p>
                                                <p className="text-sm font-black text-orange-900 italic">{formatPrice(order.total_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mb-1">Payment</p>
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{order.payment_method}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mb-1">Items</p>
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{order.items?.length || 0} Products</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mb-1">Est. Delivery</p>
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">3-5 Working Days</p>
                                            </div>
                                        </div>

                                        {/* Products Details List inside Order Card */}
                                        {order.items && order.items.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-orange-50 space-y-4 text-left">
                                                <p className="text-[9px] uppercase tracking-[0.25em] font-black text-orange-400 mb-3">Order Items</p>
                                                <div className="divide-y divide-orange-50/55 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                    {order.items.map((item, itemIdx) => (
                                                        <div key={item.order_item_id || itemIdx} className="flex gap-4 items-center py-3.5 first:pt-0 last:pb-0 group/item">
                                                            <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-sm overflow-hidden shrink-0 transition-transform duration-300 group-hover/item:scale-105">
                                                                <img 
                                                                    src={item.thumbnail} 
                                                                    alt={item.product_name} 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[11px] font-black text-orange-950 uppercase tracking-wider truncate cursor-pointer hover:text-orange-600 transition-colors" onClick={() => navigate(`/product/${item.product_id}`)}>
                                                                    {item.product_name || "Boutique Item"}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                    <span className="text-[9px] text-orange-400 uppercase tracking-widest font-black">Qty: {item.quantity}</span>
                                                                    {item.variant_name && (
                                                                        <>
                                                                            <span className="text-orange-200">•</span>
                                                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[8px] uppercase tracking-wider font-extrabold rounded-none">
                                                                                {item.variant_name}: {item.variant_value}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-orange-200">•</span>
                                                                    <span className="text-[9.5px] text-orange-600 font-extrabold uppercase tracking-wide">Status: {item.item_status || order.order_status}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs font-black text-orange-900 font-sans">{formatPrice(item.unit_price)}</p>
                                                                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1 font-sans">Total: {formatPrice(item.total_price)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {order.return_requests && order.return_requests.length > 0 && (
                                            <div className="mt-6 p-4 bg-orange-50/40 border border-orange-100 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                        <RotateCcw size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-900">Return Request Status</p>
                                                        <p className="text-[9px] text-orange-500 uppercase tracking-widest mt-0.5 font-medium">
                                                            {order.return_requests[0].return_type} Request is <span className="font-bold text-orange-600">{order.return_requests[0].refund_status}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                                                    order.return_requests[0].refund_status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    order.return_requests[0].refund_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {order.return_requests[0].refund_status}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 md:w-52 border-t md:border-t-0 md:border-l border-orange-50 pt-6 md:pt-0 md:pl-8">
                                        {order.tracking_id && (
                                            <button 
                                                onClick={() => {
                                                    setTrackingOrder(order);
                                                    setIsTrackModalOpen(true);
                                                }}
                                                className="w-full h-12 flex items-center justify-center gap-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20"
                                            >
                                                <Truck size={14} /> Track Order
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => navigate(`/product/${order.items?.[0]?.product_id}`)}
                                            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-orange-200 text-orange-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-50 transition-all"
                                        >
                                            View Details
                                        </button>
                                        {(order.order_status === 'Pending' || order.order_status === 'Processing') && (
                                            <button 
                                                onClick={() => handleCancelClick(order)}
                                                className="w-full h-12 flex items-center justify-center gap-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all"
                                            >
                                                <X size={14} /> Cancel Order
                                            </button>
                                        )}
                                        {order.order_status === 'Delivered' && (
                                            order.return_requests && order.return_requests.length > 0 ? (
                                                <button 
                                                    disabled
                                                    className={`w-full h-12 flex items-center justify-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] cursor-not-allowed ${
                                                        order.return_requests[0].refund_status === 'Approved' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                        order.return_requests[0].refund_status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                        'bg-orange-100 text-orange-400'
                                                    }`}
                                                >
                                                    <RotateCcw size={14} /> {
                                                        order.return_requests[0].refund_status === 'Approved' ? 'Return Approved' :
                                                        order.return_requests[0].refund_status === 'Rejected' ? 'Return Rejected' :
                                                        'Return Pending'
                                                    }
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleReturnClick(order)}
                                                    className="w-full h-12 flex items-center justify-center gap-3 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-100 transition-all"
                                                >
                                                    <RotateCcw size={14} /> Return Order
                                                </button>
                                            )
                                        )}
                                        {order.order_status !== 'Pending' && order.order_status !== 'Cancelled' && (
                                            <button 
                                                onClick={() => handleDisputeClick(order)}
                                                className="w-full h-12 flex items-center justify-center gap-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all"
                                            >
                                                <Shield size={14} /> Report Issue
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white border border-orange-100 p-20 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-orange-300">
                                <ShoppingBag size={40} strokeWidth={1} />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif tracking-widest uppercase mb-2">No orders found</h3>
                                <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">You haven't placed any orders that match your search.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/')}
                                className="px-10 py-4 bg-orange-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all rounded-full"
                            >
                                Start Shopping
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCancelModalOpen(false)}
                            className="absolute inset-0 bg-orange-600/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white shadow-2xl rounded-sm overflow-hidden z-10"
                        >
                            <div className="bg-rose-600 px-8 py-8 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm uppercase tracking-[0.3em] font-bold">Cancel Order</h3>
                                    <p className="text-[9px] uppercase tracking-widest text-rose-200 mt-1">Please provide a reason for cancellation</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <AlertCircle size={24} />
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
                                    <p className="text-[10px] text-rose-800 font-bold uppercase tracking-widest leading-relaxed">
                                        Are you sure you want to cancel Order #{selectedOrder?.order_id.slice(0, 8).toUpperCase()}? This action cannot be undone.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] uppercase tracking-widest font-black text-orange-400 ml-1">Cancellation Reason</label>
                                    <textarea 
                                        rows="4"
                                        placeholder="e.g. Changed my mind, found a better price, etc."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-full bg-orange-50 border border-orange-100 p-6 text-xs font-bold tracking-wide focus:outline-none focus:border-rose-500 transition-all custom-scrollbar resize-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 h-14 bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-200 transition-all"
                                    >
                                        Go Back
                                    </button>
                                    <button 
                                        onClick={handleConfirmCancel}
                                        disabled={!cancelReason.trim()}
                                        className="flex-2 h-14 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xl shadow-rose-500/20"
                                    >
                                        Confirm Cancellation
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Return Modal */}
            <AnimatePresence>
                {isReturnModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReturnModalOpen(false)}
                            className="absolute inset-0 bg-orange-600/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white shadow-2xl rounded-sm overflow-hidden z-10"
                        >
                            <div className="bg-orange-600 px-8 py-8 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm uppercase tracking-[0.3em] font-bold">Request Return</h3>
                                    <p className="text-[9px] uppercase tracking-widest text-orange-200 mt-1">Order #{selectedOrder?.order_id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <RotateCcw size={24} />
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {['Refund', 'Replacement'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setReturnType(type)}
                                            className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                                returnType === type 
                                                    ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm ring-2 ring-orange-500/20" 
                                                    : "bg-orange-50 border-orange-100 text-orange-400 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                                            }`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] uppercase tracking-widest font-black text-orange-400 ml-1">Return Reason</label>
                                    <select 
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        className="w-full h-14 bg-orange-50 border border-orange-100 px-6 text-xs font-bold tracking-wide focus:outline-none focus:border-orange-500 transition-all"
                                    >
                                        <option value="">Select a reason...</option>
                                        <option value="Damaged Product">Damaged Product</option>
                                        <option value="Wrong Item Received">Wrong Item Received</option>
                                        <option value="Quality not as expected">Quality not as expected</option>
                                        <option value="Size/Fit issue">Size/Fit issue</option>
                                        <option value="No longer needed">No longer needed</option>
                                    </select>
                                    <textarea 
                                        rows="3"
                                        placeholder="Add more details about the issue..."
                                        value={returnReason.includes(':') ? returnReason.split(': ')[1] : ''}
                                        onChange={(e) => {
                                            const base = returnReason.includes(':') ? returnReason.split(': ')[0] : returnReason;
                                            setReturnReason(`${base}: ${e.target.value}`);
                                        }}
                                        className="w-full bg-orange-50 border border-orange-100 p-6 text-xs font-bold tracking-wide focus:outline-none focus:border-orange-500 transition-all custom-scrollbar resize-none mt-2"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsReturnModalOpen(false)}
                                        className="flex-1 h-14 bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmReturn}
                                        disabled={!returnReason.trim()}
                                        className="flex-2 h-14 bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-700 transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dispute Modal */}
            <AnimatePresence>
                {isDisputeModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDisputeModalOpen(false)}
                            className="absolute inset-0 bg-rose-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white shadow-2xl rounded-sm overflow-hidden z-10"
                        >
                            <div className="bg-rose-600 px-8 py-8 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm uppercase tracking-[0.3em] font-bold">Report an Issue</h3>
                                    <p className="text-[9px] uppercase tracking-widest text-rose-200 mt-1">Order #{selectedOrder?.order_id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
                                    <p className="text-[10px] text-rose-800 font-bold uppercase tracking-widest leading-relaxed">
                                        Use this only for severe issues (fraud, missing items, uncooperative seller). This escalates the issue to GoMo Deals administrators.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] uppercase tracking-widest font-black text-rose-900 ml-1">Describe the Issue</label>
                                    <textarea 
                                        rows="4"
                                        placeholder="Please provide details about the problem with this order..."
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        className="w-full bg-orange-50 border border-orange-100 p-6 text-xs font-bold tracking-wide focus:outline-none focus:border-rose-500 transition-all custom-scrollbar resize-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsDisputeModalOpen(false)}
                                        className="flex-1 h-14 bg-orange-100 text-orange-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmDispute}
                                        disabled={!disputeReason.trim()}
                                        className="flex-2 h-14 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xl shadow-rose-500/20"
                                    >
                                        Submit Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TrackOrderModal 
                isOpen={isTrackModalOpen} 
                onClose={() => {
                    setIsTrackModalOpen(false);
                    setTrackingOrder(null);
                }} 
                order={trackingOrder} 
            />
        </div>
    );
};

export default MyOrders;
