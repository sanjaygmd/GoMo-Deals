import React, { useState, useEffect } from 'react';
import { getCustomerMeetings } from '../../services/meetingService';
import { Video, Calendar, Clock, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

const CustomerConferences = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const res = await getCustomerMeetings();
                if (res.success) {
                    setMeetings(res.meetings || []);
                } else {
                    setError(res.error || 'Failed to load conferences.');
                }
            } catch (err) {
                setError('An error occurred while fetching conferences.');
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="animate-spin text-orange-400" size={32} />
                <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Loading schedule...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-rose-50 border border-rose-100 flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle size={32} className="text-rose-400 mb-4" />
                <p className="text-[11px] uppercase tracking-widest font-bold text-rose-600">{error}</p>
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="p-12 border border-dashed border-orange-200 flex flex-col items-center text-center bg-white shadow-sm">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <Video size={24} className="text-orange-300" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-orange-955 mb-2">No Conferences Scheduled</h4>
                <p className="text-xs text-orange-500 max-w-sm">When you request a B2B Flea Market deal and schedule a video conference, it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {meetings.map((m) => {
                const isScheduled = m.status === 'Scheduled';
                
                // Allow joining from 5 mins before until 40 mins after
                const now = new Date();
                const meetTime = new Date(m.scheduled_at);
                const diffMs = now - meetTime;
                const canJoin = isScheduled && diffMs >= -5 * 60 * 1000 && diffMs <= 40 * 60 * 1000;
                
                return (
                    <div key={m.meeting_id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border shadow-sm transition-all ${isScheduled ? 'border-orange-200 hover:border-orange-400' : 'border-stone-200 opacity-75'}`}>
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-stone-50 border border-stone-100 p-1 shrink-0">
                                <img src={m.product_thumbnail || 'https://via.placeholder.com/150'} alt={m.product_name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-orange-955 line-clamp-1">{m.product_name}</h4>
                                <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mt-1 mb-2">Target Quantity: {m.kg_amount} kg</p>
                                
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-stone-500">
                                    <span className="flex items-center gap-1.5 bg-orange-50 text-orange-800 px-2.5 py-1">
                                        <Calendar size={12} />
                                        {new Date(m.scheduled_at).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-orange-50 text-orange-800 px-2.5 py-1">
                                        <Clock size={12} />
                                        {new Date(m.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end w-full sm:w-auto">
                            <span className={`px-3 py-1 mb-3 text-[9px] uppercase tracking-[0.2em] font-black rounded-full ${
                                m.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' :
                                m.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-rose-100 text-rose-700'
                            }`}>
                                {m.status}
                            </span>
                            
                            {isScheduled ? (
                                <a 
                                    href={canJoin ? m.meeting_link : '#'} 
                                    target={canJoin ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    className={`px-6 py-3 flex items-center gap-2 text-[10px] uppercase tracking-widest font-black transition-all ${
                                        canJoin 
                                        ? 'bg-orange-955 text-white hover:bg-orange-850 shadow-md' 
                                        : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                                    }`}
                                    onClick={(e) => {
                                        if (!canJoin) {
                                            e.preventDefault();
                                            alert("You can only join the video conference during the scheduled time window.");
                                        }
                                    }}
                                >
                                    <Video size={14} />
                                    {canJoin ? 'Join Conference' : 'Waiting...'}
                                </a>
                            ) : (
                                <button disabled className="px-6 py-3 bg-stone-50 border border-stone-200 text-stone-400 text-[10px] uppercase tracking-widest font-black">
                                    Closed
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CustomerConferences;
