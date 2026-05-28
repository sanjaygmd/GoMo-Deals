import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSellerNotifications, markNotificationRead } from "../../services/sellerService";
import { useAuth } from "../../context/AuthContext";
import { 
  Bell, 
  ChevronDown, 
  Check, 
  Settings,
  LogOut,
  X,
  Compass,
  Store,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SellerPortalNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const sellerId = user?.seller_id || user?.id;

  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!sellerId) return;
    const fetchNotifications = async () => {
      try {
        const res = await getSellerNotifications(sellerId);
        if (res.success) {
          setNotifications(res.data);
        }
      } catch (error) {
        console.error("Notif fetch failed", error);
      }
    };
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [sellerId]);

  const handleMarkAsRead = async (id) => {
    const res = await markNotificationRead(id);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    }
  };

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/seller-dashboard") return "Overview";
    if (path.includes("products")) return "Products";
    if (path.includes("orders")) return "Orders";
    if (path.includes("customers")) return "Customers";
    if (path.includes("analytics")) return "Reports";
    if (path.includes("payments")) return "Payments";
    if (path.includes("settings")) return "Settings";
    return "Dashboard";
  };

  const unreadCount = notifications.length;

  return (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b border-orange-100 px-8 flex justify-between items-center sticky top-0 z-40">
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black mb-0.5">Portal</span>
          <h1 className="text-lg font-serif text-orange-950 tracking-tight">
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-8">
        
        {/* Quick Access */}
        <div className="hidden md:flex items-center gap-6 border-r border-orange-100 pr-8">
           <button 
             onClick={() => navigate('/seller-dashboard/settings')}
             className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-orange-500 hover:text-orange-950 transition-colors font-bold"
           >
             <Settings size={14} /> Account
           </button>
        </div>

        <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                  onClick={() => setShowNotif(!showNotif)}
                  className={`p-2.5 transition-all relative ${showNotif ? "text-orange-950 bg-orange-50" : "text-orange-500 hover:text-orange-950"}`}
              >
                  <Bell size={18} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-950 rounded-full border border-white"></span>
                  )}
              </button>

              <AnimatePresence>
                  {showNotif && (
                  <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-4 w-96 bg-white shadow-2xl border border-orange-100 z-50 overflow-hidden"
                  >
                      <div className="p-6 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-950">Updates</span>
                          {unreadCount > 0 && <span className="bg-orange-950 text-white text-[8px] px-1.5 py-0.5 font-bold">{unreadCount}</span>}
                        </div>
                        <button onClick={() => setShowNotif(false)} className="text-orange-400 hover:text-orange-950">
                            <X size={14} />
                        </button>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? (
                          <div className="divide-y divide-orange-50">
                          {notifications.map((notif) => (
                              <div key={notif.notification_id} className="p-6 hover:bg-orange-50 transition-all flex justify-between items-start group">
                                <div className="flex-1 pr-4">
                                    <p className="text-[11px] text-orange-600 leading-relaxed">{notif.message}</p>
                                    <p className="text-[8px] text-orange-500 font-bold mt-2 uppercase tracking-widest">
                                      {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notif.notification_id);
                                    }}
                                    className="p-1.5 text-orange-400 hover:text-orange-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Check size={14} />
                                </button>
                              </div>
                          ))}
                          </div>
                      ) : (
                          <div className="py-20 text-center space-y-4">
                            <Compass size={32} strokeWidth={1} className="mx-auto text-orange-200" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Clean Slate</p>
                          </div>
                      )}
                      </div>
                  </motion.div>
                  )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-3 p-1 pl-3 bg-orange-50 border border-orange-100 hover:border-orange-950 transition-all group"
              >
                  <div className="flex flex-col text-right hidden lg:block">
                    <span className="text-[10px] font-bold text-orange-950 truncate max-w-[120px]">
                        {user?.store_name || user?.full_name}
                    </span>
                    <span className="text-[8px] text-orange-500 uppercase tracking-widest font-black leading-none">Settings</span>
                  </div>
                  <div className="w-8 h-8 bg-orange-950 flex items-center justify-center overflow-hidden">
                    {user?.store_logo ? (
                        <img src={user.store_logo} alt="S" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white text-[10px] font-serif italic">{(user?.store_name || user?.full_name || 'S').charAt(0)}</span>
                    )}
                  </div>
              </button>

              <AnimatePresence>
                  {showProfile && (
                  <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-4 w-64 bg-white shadow-2xl border border-orange-100 z-50 overflow-hidden"
                  >
                      <div className="p-6 bg-orange-50/50 border-b border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck size={12} className="text-orange-500" />
                           <span className="text-[8px] uppercase tracking-widest text-orange-500 font-black">Authorized Session</span>
                        </div>
                        <p className="text-[10px] font-bold text-orange-950 truncate">{user?.email}</p>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => { navigate("/seller-dashboard/settings"); setShowProfile(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 text-orange-600 hover:text-orange-950 hover:bg-orange-50 transition-all text-[10px] uppercase tracking-widest font-bold"
                        >
                          <div className="flex items-center gap-3">
                            <Settings size={14} /> <span>Account Settings</span>
                          </div>
                          <ChevronRight size={12} />
                        </button>
                        
                      </div>

                      <div className="p-2 border-t border-orange-100 bg-orange-50/20">
                        <button
                          onClick={async () => { await logout(); navigate("/"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 transition-all text-[10px] uppercase tracking-widest font-black"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                  </motion.div>
                  )}
              </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SellerPortalNav;