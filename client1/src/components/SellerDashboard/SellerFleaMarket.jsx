import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSellerOffers } from "../../services/offerService";
import { getSellerMeetings, cancelMeeting as cancelSellerMeeting } from "../../services/meetingService";
import SellerOffers from "./SellerOffers";
import { useAuth } from "../../context/AuthContext.jsx";
import { useShop } from "../../context/ShopContext.jsx";
import FleaMarketTermsModal from "../common/FleaMarketTermsModal";
import { 
  Handshake, 
  Search, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  Percent,
  AlertTriangle,
  X,
  Video,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const SellerFleaMarket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useShop();
  const sellerId = user?.seller_id || user?.id;

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (user && !user.hasAgreedToFleaMarketTerms) {
      setShowTermsModal(true);
    } else {
      setShowTermsModal(false);
    }
  }, [user]);
  const [loading, setLoading] = useState(true);
  
  const [successMessage, setSuccessMessage] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  const [activeSection, setActiveSection] = useState("Overview");
  const [meetings, setMeetings] = useState([]);
  const [fetchingMeetings, setFetchingMeetings] = useState(false);
  const [meetingsError, setMeetingsError] = useState(null);

  const fetchFleaMarketData = async () => {
    if (!sellerId) return;
    setFetchingMeetings(true);
    setMeetingsError(null);
    try {
      const [meetingsRes, offersRes] = await Promise.all([
        getSellerMeetings(),
        getSellerOffers()
      ]);
      
      if (meetingsRes.success) {
        setMeetings(meetingsRes.meetings);
      } else {
        setMeetingsError(meetingsRes.error || "Failed to load scheduled B2B conferences.");
      }

      if (offersRes.success && offersRes.offers) {
        setOffers(offersRes.offers);
      }
    } catch (err) {
      console.error(err);
      setMeetingsError("An unexpected error occurred while loading Flea Market data.");
    } finally {
      setFetchingMeetings(false);
      setLoading(false);
    }
  };

  const handleCancelSellerMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled B2B video conference?")) return;
    try {
      const res = await cancelSellerMeeting(meetingId);
      if (res.success) {
        setSuccessMessage("Scheduled B2B conference has been successfully cancelled.");
        fetchFleaMarketData();
      } else {
        setResolveError(res.error || "Failed to cancel scheduled B2B conference.");
      }
    } catch (err) {
      console.error(err);
      setResolveError("An error occurred while cancelling the B2B call.");
    }
  };

  useEffect(() => {
    fetchFleaMarketData();
  }, [sellerId]);

  // Compute Stats
  const attendedConferences = meetings.filter(m => m.status === 'Completed' || m.status === 'Closed').length;
  const upcomingConferences = meetings.filter(m => m.status === 'Scheduled').length;
  const pendingOffers = offers.filter(o => o.status?.toLowerCase() === 'pending').length;
  const activeBargainRevenue = offers
    .filter(o => o.status?.toLowerCase() === 'accepted')
    .reduce((sum, o) => sum + Number(o.offered_price || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-955 rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Synchronizing ledger...</p>
      </div>
    );
  }

  const currentPlanId = user?.seller_subscription || 'free';
  const hasSubscription = currentPlanId === 'pro' || currentPlanId === 'enterprise';

  if (!hasSubscription) {
    return (
      <div className="p-8 lg:p-12 max-w-[1000px] mx-auto animate-fadeIn relative">
        <div className="bg-white border border-orange-100 rounded-3xl p-12 text-center space-y-8 shadow-xl shadow-orange-950/[0.02]">
          
          <div className="w-20 h-20 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center mx-auto shadow-sm animate-bounce-subtle">
            <Crown size={36} strokeWidth={1} className="text-orange-600" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">B2B Flea Market Exchange</span>
            </div>
            <h1 className="text-3xl font-serif text-orange-955 tracking-tight leading-tight">
              Upgrade Subscription to Unlock <br /><span className="font-semibold text-orange-600">Flea Market Operations</span>
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed pt-2">
              To list bulk staples, agricultural commodities, and accept live scheduled video conferences with global buyers, a Pro Exporter or Enterprise Exporter subscription is required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-6 text-left">
            <div className="p-5 border border-orange-100 bg-orange-50/10 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100/60 flex items-center justify-center text-orange-600">
                <Video size={16} strokeWidth={2} className="text-orange-600" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-orange-955">Video Conferences</h4>
              <p className="text-[10px] text-stone-500 leading-normal">
                Host live secure B2B calls with platform-regulated mediator oversight to close contract deals.
              </p>
            </div>
            <div className="p-5 border border-orange-100 bg-orange-50/10 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100/60 flex items-center justify-center text-orange-600">
                <Handshake size={16} strokeWidth={2} className="text-orange-600" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-orange-950">Bulk Commodities</h4>
              <p className="text-[10px] text-stone-500 leading-normal">
                List agricultural staples, pulses, grains, and wholesale goods directly in the Flea Market Exchange.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate('/seller-dashboard/subscription')}
              className="px-10 py-4 bg-orange-955 hover:bg-orange-900 border border-orange-900/30 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl shadow-lg hover:shadow-xl shadow-orange-950/10 active:scale-98 cursor-pointer"
            >
              Upgrade Subscription Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn relative">
      
      <AnimatePresence>
        {showTermsModal && (
          <FleaMarketTermsModal 
            onSuccess={() => setShowTermsModal(false)}
            onClose={() => setShowTermsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Success Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-orange-955 text-orange-200 border border-orange-850 flex items-center justify-between"
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

      {/* Error Banners */}
      <AnimatePresence>
        {resolveError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} />
              <p className="text-[11px] uppercase tracking-wider font-bold">{resolveError}</p>
            </div>
            <button onClick={() => setResolveError(null)} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {meetingsError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} />
              <p className="text-[11px] uppercase tracking-wider font-bold">{meetingsError}</p>
            </div>
            <button onClick={() => setMeetingsError(null)} className="text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Handshake size={14} className="text-orange-955" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">B2B Flex Exchange Control</span>
          </div>
          <h1 className="text-4xl font-semibold text-orange-950 tracking-tight">
            Flea Market <span className="font-bold text-orange-600">Operations</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-lg">
            Manage your agricultural bulk listings and scheduled video conference meetings.
          </p>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex items-center gap-4 border-b border-orange-100 pb-1">
        <button
          onClick={() => setActiveSection("Overview")}
          className={`px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer ${
            activeSection === "Overview"
              ? "border-orange-950 text-orange-950 font-black"
              : "border-transparent text-orange-400 hover:text-orange-950"
          }`}
        >
          <TrendingUp size={14} />
          Overview & Analytics
        </button>
        <button
          onClick={() => setActiveSection("Conferences")}
          className={`px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer ${
            activeSection === "Conferences"
              ? "border-orange-950 text-orange-950 font-black"
              : "border-transparent text-orange-400 hover:text-orange-950"
          }`}
        >
          <Video size={14} />
          Scheduled Conferences
        </button>
        <button
          onClick={() => setActiveSection("Offers")}
          className={`px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer ${
            activeSection === "Offers"
              ? "border-orange-950 text-orange-950 font-black"
              : "border-transparent text-orange-400 hover:text-orange-950"
          }`}
        >
          <Handshake size={14} />
          Customer Bargains
        </button>
      </div>

      {activeSection === "Overview" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Swatches */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Past Conferences", value: attendedConferences, icon: Video, label: "Total Calls Attended" },
              { title: "Upcoming Conferences", value: upcomingConferences, icon: Calendar, label: "Scheduled B2B Calls" },
              { title: "Pending Offers", value: pendingOffers, icon: Clock, label: "Bargains Awaiting Review" },
              { title: "Flea Market Revenue", value: `₹${activeBargainRevenue.toLocaleString()}`, icon: DollarSign, label: "Revenue from Offers" }
            ].map((item, idx) => (
              <div key={item.title} className="p-8 bg-white border border-orange-100 hover:border-orange-950 transition-all duration-300 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full group-hover:bg-orange-100/60 transition-colors pointer-events-none"></div>
                <div className="flex justify-between items-start mb-8 relative">
                  <div className="p-3 bg-orange-50 text-orange-500 group-hover:bg-orange-950 group-hover:text-white transition-all duration-500">
                    <item.icon size={18} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="relative">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-orange-500 font-bold mb-1">{item.title}</p>
                  <h3 className="text-3xl font-serif text-orange-955 mb-2">{item.value}</h3>
                  <p className="text-[8px] uppercase tracking-widest text-orange-400 font-black">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-12 bg-white border border-orange-100 text-center space-y-4 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100">
              <TrendingUp size={24} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-orange-950">Analytics Dashboard Active</h3>
              <p className="text-xs text-orange-500 mt-2 max-w-md mx-auto">Monitor your agricultural wholesale metrics here. Switch tabs to manage live conferences or approve customer bargains.</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === "Offers" && (
        <SellerOffers onOfferUpdate={fetchFleaMarketData} />
      )}

      {activeSection === "Conferences" && (
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden animate-fadeIn">
        {fetchingMeetings ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-955 rounded-full animate-spin mx-auto"></div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mt-4">Loading scheduled calendar...</p>
          </div>
        ) : meetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/50">
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Product</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Customer Details</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500 text-center">Requested Qty</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Meeting Date & Time</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500 text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Purpose</th>
                  <th className="px-8 py-5 text-right text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {meetings.map((m) => (
                  <tr key={m.meeting_id} className={`transition-colors ${m.status !== 'Scheduled' ? 'opacity-60 bg-stone-50/20' : 'hover:bg-orange-50/30'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 border border-orange-100/70 overflow-hidden shrink-0">
                          <img 
                            src={m.product_thumbnail || "https://via.placeholder.com/150"} 
                            alt={m.product_name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-orange-955 line-clamp-1 max-w-[200px]">{m.product_name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-orange-400 font-bold mt-1">ID: #{m.product_id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-orange-900">{m.customer_name}</p>
                        <p className="text-[9px] text-orange-400 font-medium font-mono">{m.customer_email}</p>
                        {m.customer_phone && <p className="text-[9px] text-orange-400 font-medium font-mono">{m.customer_phone}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] uppercase tracking-widest font-black">
                        {m.kg_amount} kg
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-orange-900 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                        <Calendar size={12} className="text-orange-500" />
                        {new Date(m.scheduled_at).toLocaleString("en-IN", { 
                          weekday: 'short', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-black rounded ${
                        m.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' :
                        m.status === 'Expired' ? 'bg-stone-200 text-stone-600' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] text-orange-800 leading-relaxed line-clamp-2 max-w-[200px]">
                        "{m.purpose || 'Bargain Discussion'}"
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {m.status === 'Scheduled' ? (() => {
                          const now = new Date();
                          const meetingTime = new Date(m.scheduled_at);
                          const diffMinutes = (now - meetingTime) / (1000 * 60);
                          const canJoin = diffMinutes >= -5 && diffMinutes <= 40;
                          return (
                            <>
                              <a 
                                href={canJoin ? m.meeting_link : '#'}
                                target={canJoin ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${
                                  canJoin 
                                    ? 'bg-orange-955 text-white shadow-md hover:bg-orange-850' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }`}
                                onClick={(e) => {
                                  if (!canJoin) {
                                    e.preventDefault();
                                    alert('You can only join the video conference 5 minutes before or up to 40 minutes after the scheduled time.');
                                  }
                                }}
                              >
                                <Video size={13} /> {canJoin ? 'Join Call' : 'Wait'}
                              </a>
                              <button 
                                onClick={() => handleCancelSellerMeeting(m.meeting_id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              >
                                <X size={14} />
                              </button>
                            </>
                          );
                        })() : (
                          <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100/50">
              <Calendar size={24} className="text-orange-400" />
            </div>
            <p className="text-[12px] font-black text-orange-950 uppercase tracking-widest mb-1">No conferences</p>
            <p className="text-[10px] text-orange-500 font-medium">You don't have any scheduled B2B video calls.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default SellerFleaMarket;
