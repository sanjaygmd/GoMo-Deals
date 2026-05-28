import { useState, useEffect, useRef } from "react";
import { Bell, X, Mail, Phone, LogOut, Menu, Home, LayoutDashboard, Package, ShoppingCart, Users, CreditCard, RotateCcw, FileBarChart, Settings, Store, Ticket, Shield, MessageSquare, ShieldCheck } from "lucide-react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { cn } from "../../../lib/utils";
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

              {/* Notification Toggle */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className="p-2.5 hover:bg-orange-50 transition-all text-orange-500 hover:text-orange-950 relative group rounded-xl"
                >
                  <Bell size={18} className="transition-transform group-hover:scale-110" strokeWidth={1.5} />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 bg-orange-500 border border-white rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 glass-card border border-orange-500/10 shadow-xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-orange-500/10 flex items-center justify-between bg-orange-50/20 backdrop-blur-md">
                      <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-orange-950">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-orange-400 hover:text-orange-950 transition-colors"><X size={14} /></button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto p-1.5">
                      {loadingNotifs ? (
                        <div className="p-8 text-center">
                          <div className="h-4 w-4 border border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.1em]">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.notification_id}
                            onClick={() => !notif.is_read && handleMarkAsRead(notif.notification_id)}
                            className={cn(
                              "p-3.5 border-b border-orange-500/5 hover:bg-orange-50/50 rounded-xl transition-all cursor-pointer group mb-1 last:mb-0",
                              !notif.is_read ? "bg-orange-50/20" : "opacity-70"
                            )}
                          >
                            <div className="flex gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[10px] text-orange-950 uppercase tracking-wider mb-1">
                                  {notif.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-[11px] text-orange-950/70 leading-relaxed">{notif.message}</p>
                                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                              </div>
                              {!notif.is_read && <div className="h-1.5 w-1.5 bg-orange-500 rounded-full self-center shrink-0 shadow-[0_0_4px_rgba(249,115,22,0.6)]" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
