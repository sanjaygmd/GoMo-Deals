import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSellerNotifications, markNotificationRead } from "../../services/sellerService";
import { deleteNotification } from "../../services/notificationService";
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
  ChevronRight,
  Info,
  Tag,
  Truck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Clock
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

  const handleMarkAllAsRead = async () => {
    try {
      const promises = notifications.map(n => markNotificationRead(n.notification_id));
      await Promise.all(promises);
      setNotifications([]);
    } catch (err) {
      console.error("Mark all read failed", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n.notification_id !== id));
      }
    } catch (err) {
      console.error("Delete notification failed", err);
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
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-transparent hover:border-orange-100/80 hover:bg-white text-orange-955 hover:text-orange-600 hover:scale-105 hover:shadow-[0_4px_12px_rgba(249,115,22,0.06)] active:scale-95 transition-all duration-300 relative p-0 cursor-pointer hover-bell-shake"
              >
                  <Bell size={20} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse shadow-[0_2px_4px_rgba(234,88,12,0.25)]">
                      {unreadCount}
                    </span>
                  )}
              </button>

              <AnimatePresence>
                  {showNotif && (
                  <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full right-[-16px] sm:right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-96 bg-white border border-orange-100 z-[200] overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(234,88,12,0.08),0_4px_12px_rgba(0,0,0,0.03)] text-neutral-800"
                  >
                      {/* Header */}
                      <div className="p-4 border-b border-orange-100/60 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-neutral-900">Updates</span>
                          {unreadCount > 0 && (
                            <span className="bg-orange-50 text-orange-600 text-[9px] px-2 py-0.5 font-bold rounded-full border border-orange-100/80">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {notifications.length > 0 && (
                            <button 
                              onClick={handleMarkAllAsRead}
                              className="text-[9.5px] uppercase tracking-wider font-extrabold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer hover:underline font-sans"
                            >
                              Mark all read
                            </button>
                          )}
                          <button onClick={() => setShowNotif(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-50 cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Cards list */}
                      <div className="max-h-[380px] overflow-y-auto py-2.5 px-3.5 custom-scrollbar bg-white space-y-2 no-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => {
                            const isUnread = true; // Seller notifications in list are always unread
                            
                            // Determine dynamic icon, title, and color scheme based on notification.type
                            let IconComponent = Info;
                            let iconBgColor = "bg-amber-50 text-amber-600 border-amber-100";
                            let typeLabel = "Info";
                            
                            if (notification.type === 'offer_update' || notification.type === 'new_offer') {
                              IconComponent = Tag;
                              iconBgColor = "bg-orange-50 text-orange-600 border-orange-100";
                              typeLabel = "Bargain offer";
                            } else if (notification.type === 'order_shipped' || notification.type === 'shipment_update') {
                              IconComponent = Truck;
                              iconBgColor = "bg-blue-50 text-blue-600 border-blue-100";
                              typeLabel = "Shipped";
                            } else if (notification.type === 'order_delivered') {
                              IconComponent = CheckCircle2;
                              iconBgColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                              typeLabel = "Delivered";
                            } else if (notification.type === 'order_cancelled') {
                              IconComponent = XCircle;
                              iconBgColor = "bg-rose-50 text-rose-600 border-rose-100";
                              typeLabel = "Cancelled";
                            } else if (notification.type === 'return_update' || notification.type === 'return_request') {
                              IconComponent = RefreshCw;
                              iconBgColor = "bg-purple-50 text-purple-600 border-purple-100";
                              typeLabel = "Return request";
                            } else if (notification.type === 'order_update' || notification.type === 'new_order') {
                              IconComponent = ShoppingBag;
                              iconBgColor = "bg-orange-50 text-orange-600 border-orange-100";
                              typeLabel = "Order update";
                            }
                            
                            return (
                              <div 
                                key={notification.notification_id} 
                                className={`p-3 rounded-xl border transition-all duration-200 relative group flex gap-3 text-left ${
                                  isUnread 
                                    ? 'bg-orange-50/40 hover:bg-orange-50/70 border-orange-100/70 border-l-[3.5px] border-l-orange-500 shadow-sm' 
                                    : 'bg-white hover:bg-neutral-50/50 border-neutral-100 border-l-[3.5px] border-l-neutral-200 shadow-none'
                                }`}
                              >
                                {/* Left side: Icon */}
                                <div className="flex-shrink-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${iconBgColor}`}>
                                    <IconComponent size={13} strokeWidth={2} />
                                  </div>
                                </div>

                                {/* Right side: Message & Actions */}
                                <div className="flex-grow space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[8.5px] uppercase tracking-wider font-extrabold ${isUnread ? 'text-orange-600' : 'text-neutral-400'}`}>
                                      {typeLabel}
                                    </span>
                                    {isUnread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    )}
                                  </div>
                                  <p className={`text-[12px] leading-relaxed transition-colors duration-200 ${isUnread ? 'font-bold text-neutral-900' : 'text-neutral-500 font-medium'}`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100/80 mt-1.5">
                                    <span className="text-[8.5px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                      <Clock size={9} className="text-neutral-400" />
                                      {new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      {isUnread && (
                                        <button 
                                          onClick={() => handleMarkAsRead(notification.notification_id)}
                                          className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer hover:underline font-sans"
                                        >
                                          Mark Read
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleDelete(notification.notification_id)}
                                        className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer hover:underline"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-12 text-center space-y-3">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto border border-orange-100/60 shadow-sm">
                              <Bell size={20} strokeWidth={1.5} className="text-orange-500" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-800">All caught up!</p>
                              <p className="text-[9.5px] text-neutral-400 font-semibold uppercase tracking-wide">No new updates</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-3 bg-neutral-50/50 border-t border-orange-100/50 text-center">
                        <button 
                          onClick={() => { setShowNotif(false); navigate('/seller-dashboard/settings'); }}
                          className="w-full py-2 rounded-lg border border-orange-200 bg-white hover:bg-orange-50/50 text-[10px] font-extrabold uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-all shadow-sm cursor-pointer active:scale-98"
                        >
                          Notification Settings
                        </button>
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