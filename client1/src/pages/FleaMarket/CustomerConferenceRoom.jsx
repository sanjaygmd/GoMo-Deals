import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerMeetings, endMeeting } from '../../services/meetingService';
import { motion } from 'framer-motion';
import { 
  Video, Calendar, Clock, AlertTriangle, Shield, Check, Crown, 
  ArrowLeft, Info, StopCircle, User, Box, Scale 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function CustomerConferenceRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await getCustomerMeetings();
        if (res.success) {
          const found = res.meetings.find(m => m.meeting_id === id);
          if (found) {
            setMeeting(found);
          } else {
            setError("Conference not found.");
          }
        } else {
          setError(res.error || "Failed to fetch conference details.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading the conference.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();

    // Poll every 5 seconds to check if meeting was ended by seller/admin
    const intervalId = setInterval(fetchMeeting, 5000);
    return () => clearInterval(intervalId);
  }, [id]);

  const handleEndMeeting = async () => {
    if (!window.confirm("Are you sure you want to end this video conference?")) return;
    setIsEnding(true);
    try {
      const res = await endMeeting(id);
      if (res.success) {
        navigate('/flea-market', { replace: true });
      } else {
        toast({ title: 'Error', description: res.error || "Failed to end conference.", variant: 'destructive' });
        setIsEnding(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: "Error ending conference.", variant: 'destructive' });
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-amber-500 text-xs font-black uppercase tracking-widest animate-pulse">Initializing Secure Room...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full text-center">
          <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-gray-400 mb-6">{error || "Conference not found."}</p>
          <button 
            onClick={() => navigate('/flea-market')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Validate time window (0 to 40 mins after scheduled_at)
  const now = new Date();
  const meetingTime = new Date(meeting.scheduled_at);
  const diffMinutes = (now - meetingTime) / (1000 * 60);
  const canJoin = diffMinutes >= 0 && diffMinutes <= 40;

  if (!canJoin && meeting.status === 'Scheduled') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-900/20">
          <Clock size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Wait for Assigned Time</h2>
          <p className="text-sm text-gray-400 mb-6">
            You can only join the video conference during the assigned time (up to 40 minutes after scheduled time).<br/><br/>
            Scheduled for: {new Date(meeting.scheduled_at).toLocaleString()}
          </p>
          <button 
            onClick={() => navigate('/flea-market')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (meeting.status !== 'Scheduled') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full text-center">
          <Check size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Conference Closed</h2>
          <p className="text-sm text-gray-400 mb-6">This video conference has been {meeting.status.toLowerCase()}.</p>
          <button 
            onClick={() => navigate('/flea-market')}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Sidebar - Conference Details */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full md:w-[320px] lg:w-[380px] bg-gray-900 border-r border-gray-800 flex flex-col h-[40vh] md:h-screen shrink-0 relative z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
          <button 
            onClick={() => navigate('/flea-market')}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Video className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-black text-amber-500 mb-0.5">Secure B2B Room</p>
              <h1 className="text-lg font-black text-white leading-tight">Flea Market Exchange</h1>
            </div>
          </div>
        </div>

        {/* Scrollable Details */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          
          {/* Product Info */}
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2">
              <Box size={12} /> Commodity Subject
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-700 shrink-0 bg-gray-900">
                <img 
                  src={meeting.product_thumbnail || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"} 
                  alt={meeting.product_name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white line-clamp-2">{meeting.product_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded">
                    {meeting.kg_amount} kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3 flex items-center gap-2">
              <User size={12} /> Exporter Details
            </h3>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-200 flex items-center gap-2">
                {meeting.seller_store_name || meeting.seller_name}
                <Shield size={12} className="text-blue-400" />
              </p>
              <p className="text-xs text-gray-500 italic">Contact details are hidden for privacy</p>
            </div>
          </div>

          {/* Meeting Purpose */}
          {meeting.purpose && (
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
               <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2 flex items-center gap-2">
                <Info size={12} /> Purpose
              </h3>
              <p className="text-xs text-gray-300 italic leading-relaxed">
                "{meeting.purpose}"
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20 flex gap-3">
             <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
             <p className="text-[10px] text-rose-300/80 leading-relaxed font-medium">
               GoMo strictly prohibits sharing direct contact details or processing offline payments. All negotiations must occur within the platform context.
             </p>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50 backdrop-blur-md mt-auto">
          <button 
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2"
          >
            {isEnding ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <StopCircle size={16} />
                End Conference
              </>
            )}
          </button>
          <p className="text-[9px] text-gray-500 text-center mt-3 uppercase tracking-widest font-medium">
            End the call once the negotiation is complete
          </p>
        </div>
      </motion.div>

      {/* Main Content - Jitsi Iframe */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 h-[60vh] md:h-screen relative bg-black"
      >
        <iframe
          src={meeting.meeting_link}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-none"
          title="Flea Market B2B Room"
        />
        {/* Subtle overlay gradient to blend edges */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none hidden md:block"></div>
      </motion.div>
    </div>
  );
}
