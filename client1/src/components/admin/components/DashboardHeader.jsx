import { useState, useEffect, useRef } from "react";
import { Bell, X, Mail, Phone, LogOut, Menu, Home, LayoutDashboard, Package, ShoppingCart, Users, CreditCard, RotateCcw, FileBarChart, Settings, Store, Ticket, Shield, MessageSquare, ShieldCheck, Info, Tag, Truck, CheckCircle2, XCircle, RefreshCw, ShoppingBag, Clock } from "lucide-react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { cn } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../services/api";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const resp = await api.get(`/admin/notifications/${user.id}`);
      if (resp.data.success) {
        setNotifications(resp.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      const resp = await api.patch(`/notifications/read/${notifId}`);
      if (resp.data.success) {
        setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      const promises = unread.map(n => api.patch(`/notifications/read/${n.notification_id}`));
      await Promise.all(promises);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (notifId) => {
    try {
      const resp = await api.delete(`/notifications/${notifId}`);
      if (resp.data.success) {
        setNotifications(prev => prev.filter(n => n.notification_id !== notifId));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/admin") return "Overview";
    if (path.includes("products")) return "Products";
    if (path.includes("orders")) return "Orders";
    if (path.includes("returns")) return "Returns";
    if (path.includes("customers")) return "Customers";
    if (path.includes("sellers")) return "Sellers";
    if (path.includes("coupons")) return "Coupons";
    if (path.includes("finance")) return "Finance";
    if (path.includes("payouts")) return "Payouts";
    if (path.includes("analytics")) return "Reports";
    if (path.includes("logs")) return "System Logs";
    if (path.includes("administrators")) return "Admins";
    return "Dashboard";
  };

  const initials = (user?.name || "AD").split(" ").map(n => n[0]).join("").toUpperCase();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { title: "Products", path: "/admin/products", icon: Package },
    { title: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { title: "Customers", path: "/admin/customers", icon: Users },
    { title: "Sellers", path: "/admin/sellers", icon: Store },
    { title: "Coupons", path: "/admin/coupons", icon: Ticket },
    { title: "Logs", path: "/admin/logs", icon: Shield },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-orange-500/10 h-20 flex items-center">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-10">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-8">
            {/* Logo - Mobile only */}
            <div
              className="flex lg:hidden items-center gap-4 cursor-pointer group"
              onClick={() => navigate("/admin")}
            >
              <div className="h-10 w-10 bg-orange-600 flex items-center justify-center text-white flex-shrink-0 transition-transform duration-500 rounded-xl shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div className="hidden sm:block">
                <span className="block text-xl font-bold text-orange-900 tracking-widest uppercase">GoMo</span>
                <span className="block text-[8px] font-bold text-orange-500 uppercase tracking-[0.3em] mt-1">Admin</span>
              </div>
            </div>

            {/* Page Title - Desktop only */}
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black mb-0.5">Admin Portal</span>
              <h1 className="text-lg font-extrabold text-orange-955 tracking-tight">
                {getTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate("/")}
                className="p-2.5 hover:bg-orange-50 transition-all text-orange-500 hover:text-orange-950 group rounded-xl"
                title="View Storefront"
              >
                <Home size={18} className="transition-transform group-hover:scale-110" strokeWidth={1.5} />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-transparent hover:border-orange-100/80 hover:bg-white text-orange-955 hover:text-orange-600 hover:scale-105 hover:shadow-[0_4px_12px_rgba(249,115,22,0.06)] active:scale-95 transition-all duration-300 relative p-0 cursor-pointer animate-in fade-in hover-bell-shake"
                >
                  <Bell size={20} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse shadow-[0_2px_4px_rgba(234,88,12,0.25)]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full right-[-16px] sm:right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-96 bg-white border border-orange-100 z-[200] overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(234,88,12,0.08),0_4px_12px_rgba(0,0,0,0.03)] text-neutral-800 animate-in fade-in"
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
                          <button onClick={() => setShowNotifications(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-50 cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Cards list */}
                      <div className="max-h-[380px] overflow-y-auto py-2.5 px-3.5 custom-scrollbar bg-white space-y-2 no-scrollbar">
                        {loadingNotifs ? (
                          <div className="py-12 text-center">
                            <div className="h-5 w-5 border border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map((notification) => {
                            const isUnread = !notification.is_read;
                            
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
                                onClick={() => isUnread && handleMarkAsRead(notification.notification_id)}
                                className={`p-3 rounded-xl border transition-all duration-200 relative group flex gap-3 text-left cursor-pointer ${
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
                                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
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
                          onClick={() => { setShowNotifications(false); navigate('/admin/settings'); }}
                          className="w-full py-2 rounded-lg border border-orange-200 bg-white hover:bg-orange-50/50 text-[10px] font-extrabold uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-all shadow-sm cursor-pointer active:scale-98"
                        >
                          Notification Settings
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Profile Toggle */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="h-10 w-10 bg-orange-950 flex items-center justify-center text-white text-[11px] font-bold transition-all hover:bg-orange-900 rounded-xl border border-orange-900 shadow-sm"
              >
                {initials}
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-72 glass-card border border-orange-500/10 shadow-xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-12 w-12 bg-orange-950 flex items-center justify-center text-white font-bold text-sm rounded-xl border border-orange-900 shadow-sm">{initials}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-[12px] text-orange-950 tracking-wide uppercase truncate">{user?.name || "Admin"}</p>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mt-1">{user?.role || "Administrator"}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-4 border-t border-orange-500/10">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Mail size={14} className="text-orange-400 shrink-0" />
                        <span className="text-[11px] font-normal text-orange-950/70 truncate">{user?.email}</span>
                      </div>
                      
                      <button
                        onClick={() => { navigate('/admin/settings'); setShowProfile(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-all group rounded-xl"
                      >
                        <Settings size={14} className="text-orange-400 group-hover:text-orange-950" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 group-hover:text-orange-950">Settings</span>
                      </button>

                      <button
                        onClick={() => { navigate('/admin/logs'); setShowProfile(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-all group rounded-xl"
                      >
                        <Shield size={14} className="text-orange-400 group-hover:text-orange-950" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 group-hover:text-orange-950">Activity Logs</span>
                      </button>
                    </div>
                    <div className="pt-4 mt-4 border-t border-orange-500/10">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 h-11 bg-orange-950 hover:bg-orange-900 border border-orange-900/30 text-white text-[9px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl shadow-md"
                      >
                        <LogOut size={14} /> Terminate Session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 hover:bg-orange-50 transition-all text-orange-950 rounded-xl"
            >
              {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-orange-950 text-white p-4 space-y-1 animate-in slide-in-from-top-full duration-300 border-b border-white/5 z-50 shadow-xl">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 p-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-none",
                isActive
                  ? "bg-white/5 text-white"
                  : "text-orange-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={16} strokeWidth={1.5} className={isActive ? "text-white" : "text-orange-400"} />
              {item.title}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
