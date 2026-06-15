import React, { useState, useEffect, useMemo } from "react";
import { 
  Video, ShieldAlert, Calendar, Clock, CheckCircle, XCircle, Search, AlertCircle, Eye, RefreshCw
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { getAdminMeetings, cancelMeeting, endMeeting } from "../../../services/meetingService";
import ConfirmModal from '../../common/ConfirmModal';
import { useNavigate } from 'react-router-dom';

export default function FleaMarketMediator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Scheduled, Cancelled
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null });

  const fetchMeetings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAdminMeetings();
      if (res.success) {
        setMeetings(res.meetings || []);
      } else {
        setErrorMessage(res.error || "Failed to retrieve B2B conferences.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while loading conferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const executeCancelMeeting = async (meetingId) => {
    try {
      const res = await cancelMeeting(meetingId);
      if (res.success) {
        setSuccessMessage("Scheduled conference was successfully cancelled by Mediator.");
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchMeetings();
      } else {
        setErrorMessage(res.error || "Failed to cancel scheduled B2B conference.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An error occurred while cancelling the B2B call.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const executeEndMeeting = async (meetingId) => {
    try {
      const res = await endMeeting(meetingId);
      if (res.success) {
        setSuccessMessage("B2B video conference ended successfully.");
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchMeetings();
      } else {
        setErrorMessage(res.error || "Failed to end B2B video conference.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An error occurred while ending the B2B call.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === 'cancel') executeCancelMeeting(confirmModal.id);
    if (confirmModal.type === 'end') executeEndMeeting(confirmModal.id);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // Filter meetings by search term and status
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchesSearch = 
        m.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.seller_store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.product_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === "All" || 
        m.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchTerm, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = meetings.length;
    const scheduled = meetings.filter(m => m.status === 'Scheduled').length;
    const cancelled = meetings.filter(m => m.status === 'Cancelled').length;
    
    // Active meetings today or upcoming
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = meetings.filter(m => {
      const date = new Date(m.scheduled_at);
      return m.status === 'Scheduled' && date >= today;
    }).length;

    return { total, scheduled, cancelled, activeToday };
  }, [meetings]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-250/50">
            <Clock size={10} /> Active
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-250/50">
            <XCircle size={10} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider border border-orange-250/50">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Elegant Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Video size={14} className="text-orange-955" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">B2B Compliance Center</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">Flea Market Mediation</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Monitor B2B buyer-seller conferences, prevent offline transaction attempts, and mediate escrow deals.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-orange-50 border border-orange-200 rounded-xl p-1 shrink-0">
            <button onClick={() => navigate('/admin/mediator')} className="px-6 py-2.5 text-orange-600 hover:text-orange-955 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer">
              <ShieldAlert size={14} /> Disputes
            </button>
            <button className="px-6 py-2.5 bg-white text-orange-955 shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Video size={14} /> B2B Conferences
            </button>
          </div>
          <button 
            onClick={fetchMeetings}
            className="px-6 py-3 bg-white border border-orange-200 text-orange-955 hover:bg-orange-50 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-2 cursor-pointer active:scale-98 shadow-sm rounded-xl"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh List
          </button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <StatCard 
          title="Active Conferences" 
          value={stats.scheduled} 
          todayValue="Awaiting Negotiation" 
          changeType="positive" 
          icon={Video} 
        />
        <StatCard 
          title="Upcoming Today" 
          value={stats.activeToday} 
          todayValue="Today's Bookings" 
          changeType="neutral" 
          icon={Calendar} 
        />
        <StatCard 
          title="Cancelled Deals" 
          value={stats.cancelled} 
          todayValue="Lapsed Schedules" 
          changeType="negative" 
          icon={XCircle} 
        />
        <StatCard 
          title="Total Operations" 
          value={stats.total} 
          todayValue="All B2B Bookings" 
          changeType="neutral" 
          icon={CheckCircle} 
        />
      </div>

      {/* Compliance Advisory Alert */}
      <div className="bg-amber-50/50 border border-amber-200/60 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert className="text-amber-700" size={20} />
        </div>
        <div className="text-left space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Mediator Enforcement Policy</h4>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            GoMo holds a strict zero-tolerance policy against offline transactions. As a platform mediator, join scheduled conferences, enforce the platform escrow checkout system, and decline any attempts to share personal contact channels, location coordinates, or bank accounts.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-xl">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center border-b border-orange-200 overflow-x-auto no-scrollbar w-full md:w-auto">
          {["All", "Scheduled", "Cancelled"].map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-6 py-4 text-[10px] uppercase tracking-widest font-black transition-all border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? "border-orange-955 text-orange-955 font-black"
                  : "border-transparent text-orange-400 hover:text-orange-955"
              }`}
            >
              {filter === 'Scheduled' ? 'Active' : filter}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by buyer, store, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-orange-200 text-orange-900 placeholder-orange-400 text-xs focus:border-orange-955 outline-none transition-all rounded-xl"
          />
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
        </div>
      </div>

      {/* Main Conference Table */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border border-orange-100 rounded-full" />
            <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Syncing Scheduled Rooms...</p>
        </div>
      ) : filteredMeetings.length > 0 ? (
        <div className="bg-white border border-orange-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/50">
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Commodity Product</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Customer (Buyer)</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Seller (Merchant)</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500 text-center">Volume</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Date & Time</th>
                  <th className="px-8 py-5 text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Room Status</th>
                  <th className="px-8 py-5 text-right text-[9px] uppercase tracking-[0.3em] font-black text-orange-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {filteredMeetings.map((m) => (
                  <tr key={m.meeting_id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 border border-orange-100/70 overflow-hidden shrink-0 rounded-xl">
                          <img 
                            src={m.product_thumbnail || "https://via.placeholder.com/150"} 
                            alt={m.product_name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-orange-955 line-clamp-1 max-w-[180px]">{m.product_name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-orange-400 font-bold mt-1">ID: #{m.product_id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-orange-900">{m.customer_name}</p>
                        <p className="text-[9px] text-orange-400 font-medium font-mono">{m.customer_email}</p>
                        {m.customer_phone && <p className="text-[9px] text-orange-400 font-medium font-mono">{m.customer_phone}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold text-orange-900">{m.seller_store_name || m.seller_name}</p>
                        <p className="text-[9px] text-orange-400 font-medium font-mono">{m.seller_email}</p>
                        {m.seller_phone && <p className="text-[9px] text-orange-400 font-medium font-mono">{m.seller_phone}</p>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] uppercase tracking-widest font-black rounded-lg">
                        {m.kg_amount} kg
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-955 bg-orange-50/50 p-2.5 border border-orange-100 rounded-xl max-w-[200px]">
                        <Calendar size={12} className="text-orange-500" />
                        <span>
                          {new Date(m.scheduled_at).toLocaleString("en-IN", { 
                            weekday: 'short', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">{getStatusBadge(m.status)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'Scheduled' ? (
                          <>
                            <a 
                              href={m.meeting_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-orange-955 hover:bg-orange-850 text-white text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md rounded-xl active:scale-98 shrink-0"
                            >
                              <Eye size={12} /> Monitor & Mediate
                            </a>
                            <button 
                              onClick={() => setConfirmModal({ isOpen: true, type: 'end', id: m.meeting_id })}
                              className="px-3 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200 hover:border-orange-300 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer rounded-xl active:scale-98 shrink-0"
                              title="End Meeting"
                            >
                              End
                            </button>
                            <button 
                              onClick={() => setConfirmModal({ isOpen: true, type: 'cancel', id: m.meeting_id })}
                              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer rounded-xl active:scale-98 shrink-0"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest pr-4">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-white border border-orange-100 shadow-sm rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto rounded-2xl">
            <Video size={24} className="text-orange-300" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest font-black text-orange-700">No Conferences Scheduled</p>
            <p className="text-[10px] text-orange-400 uppercase tracking-[0.2em]">There are no B2B meetings scheduled under these criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
}
