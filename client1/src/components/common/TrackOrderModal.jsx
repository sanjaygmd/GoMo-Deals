import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, PackageCheck, PackageOpen, CheckCircle, PackageSearch, Clock } from 'lucide-react';
import { api } from '../../../services/api'; // or appropriate path

const TrackOrderModal = ({ order, isOpen, onClose }) => {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && order) {
            fetchTracking();
        }
    }, [isOpen, order]);

    const fetchTracking = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/shiprocket/tracking/${order.order_id}`);
            if (res.data.success && res.data.data) {
                // Shiprocket tracking details format:
                // res.data.data.tracking_data.track_status => 1 (success)
                // res.data.data.tracking_data.shipment_track[0] => main track obj
                // res.data.data.tracking_data.shipment_track_activities => array of activities
                setTrackingData(res.data.data);
            } else {
                setError("Tracking information not found.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch tracking data. It might not be available yet.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Determine current step based on order_status or tracking_data
    let currentStep = 0;
    const activities = trackingData?.tracking_data?.shipment_track_activities || [];
    const mainTrack = trackingData?.tracking_data?.shipment_track?.[0];
    const statusText = mainTrack?.current_status || order.order_status || 'Pending';

    const s = statusText.toUpperCase();
    if (s.includes('DELIVERED')) currentStep = 4;
    else if (s.includes('OUT FOR DELIVERY')) currentStep = 3;
    else if (s.includes('SHIPPED') || s.includes('IN TRANSIT')) currentStep = 2;
    else if (s.includes('PROCESSING') || s.includes('CONFIRMED')) currentStep = 1;
    else currentStep = 0; // Pending

    const steps = [
        { title: 'Order Placed', icon: <PackageCheck size={16} /> },
        { title: 'Confirmed', icon: <PackageSearch size={16} /> },
        { title: 'Dispatched', icon: <Truck size={16} /> },
        { title: 'Out for Delivery', icon: <PackageOpen size={16} /> },
        { title: 'Delivered', icon: <CheckCircle size={16} /> },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="bg-orange-600 px-6 py-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-sm uppercase tracking-[0.3em] font-bold">Track Shipment</h3>
                        <p className="text-[10px] uppercase tracking-widest text-orange-200 mt-1">
                            Order #{order?.order_id?.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-2 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-orange-400">Fetching live updates...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 px-4">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mx-auto mb-4">
                                <Clock size={28} />
                            </div>
                            <p className="text-sm font-bold text-rose-900 mb-2">{error}</p>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest">Tracking details usually appear 12-24 hours after dispatch.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Horizontal Timeline */}
                            <div className="relative flex justify-between mt-4 mb-8">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-orange-100 -z-10" />
                                <div 
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-orange-500 transition-all duration-1000 -z-10" 
                                    style={{ width: \`\${(currentStep / (steps.length - 1)) * 100}%\` }}
                                />
                                {steps.map((step, idx) => {
                                    const isCompleted = idx <= currentStep;
                                    const isCurrent = idx === currentStep;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-2 group relative">
                                            <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-500 shadow-sm \${
                                                isCompleted ? 'bg-orange-600 scale-110' : 'bg-orange-100 text-orange-300'
                                            }\`}>
                                                {step.icon}
                                            </div>
                                            <span className={\`absolute top-10 w-20 text-center text-[8px] uppercase tracking-wider font-black \${
                                                isCurrent ? 'text-orange-900' : isCompleted ? 'text-orange-500' : 'text-stone-300'
                                            }\`}>
                                                {step.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-900 border-b border-orange-100 pb-3 mb-4">Activity Log</h4>
                                
                                {activities && activities.length > 0 ? (
                                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-orange-100 before:to-transparent">
                                        {activities.map((act, idx) => (
                                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                                                {/* Icon marker */}
                                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-orange-100 text-orange-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 mx-auto">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                </div>
                                                {/* Card */}
                                                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-orange-50 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black text-orange-900 text-[11px] uppercase tracking-wider">{act.activity}</span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-500 leading-tight mb-2">{act.location || "Location not specified"}</p>
                                                    <div className="text-[8px] uppercase tracking-widest font-bold text-orange-400">
                                                        {new Date(act.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-[10px] uppercase tracking-widest text-stone-400 font-bold border border-dashed border-stone-200 rounded-xl">
                                        No recent scan activity
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TrackOrderModal;
