import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Plus,
  Compass,
  RotateCcw,
  Handshake,
  Crown,
  Lock
} from "lucide-react";

const menu = [
  { name: "Overview", path: "/seller-dashboard", icon: LayoutDashboard },
  { name: "Products", path: "/seller-dashboard/products", icon: Package },
  { name: "Orders", path: "/seller-dashboard/orders", icon: ShoppingBag },
  { name: "Flea Market", path: "/seller-dashboard/flea-market", icon: Handshake },
  { name: "Returns", path: "/seller-dashboard/returns", icon: RotateCcw },
  { name: "Customers", path: "/seller-dashboard/customers", icon: Users },
  { name: "Reports", path: "/seller-dashboard/analytics", icon: BarChart3 },
  { name: "Payments", path: "/seller-dashboard/payments", icon: CreditCard },
  { name: "Subscription", path: "/seller-dashboard/subscription", icon: Crown },
  { name: "Settings", path: "/seller-dashboard/settings", icon: Settings },
];

const SellerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="w-72 min-h-screen bg-orange-950 text-white flex flex-col justify-between overflow-hidden border-r border-white/5 sticky top-0 h-screen">
      <div className="flex flex-col flex-1">
        {/* Brand Identity */}
        <div className="p-12 mb-6">
          <Link to="/seller-dashboard" className="flex flex-col group">
            <span className="text-4xl font-serif tracking-[0.4em] uppercase leading-none text-white mb-3">GoMo</span>
            <div className="flex items-center gap-2">
                <div className="w-4 h-px bg-orange-500"></div>
                <span className="text-[8px] tracking-[0.4em] uppercase text-orange-400 font-black">Boutique Seller</span>
            </div>
          </Link>
        </div>

        {/* Action Button */}
        <div className="px-8 mb-10">
            <button 
                onClick={() => navigate('/seller-dashboard/products')}
                className="w-full py-4 bg-white text-orange-900 hover:bg-orange-200 transition-all duration-500 group flex items-center justify-center gap-3 active:scale-[0.98]"
            >
                <Plus size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Add Product</span>
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {menu.map((item) => {
            const isActive =
              item.path === "/seller-dashboard"
                ? location.pathname === "/seller-dashboard"
                : location.pathname.startsWith(item.path);

            return (
              <motion.div
                key={item.name}
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-300 rounded-none group relative ${
                    isActive
                    ? "text-white bg-white/5"
                    : "text-orange-400 hover:text-white"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-marker"
                    className="absolute left-0 w-1 h-1 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon 
                  size={16} 
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-all duration-300 ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"}`} 
                />
                <span className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                  {item.name}
                </span>
                {item.name === "Flea Market" && (!user?.seller_subscription || user?.seller_subscription === 'free') && (
                  <Lock size={12} className="ml-auto text-orange-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile */}
      <div className="p-8 border-t border-white/5 bg-orange-600/20">
        <div className="flex items-center gap-4 mb-8 px-2 group cursor-pointer" onClick={() => navigate('/seller-dashboard/settings')}>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-white/30">
            {user?.store_logo ? (
              <img src={user.store_logo} alt="Store" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-900 flex items-center justify-center font-serif italic text-lg text-orange-400">
                  {(user?.store_name || user?.full_name || 'S').charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold tracking-wider truncate text-orange-200 group-hover:text-white transition-colors">
                {user?.store_name || user?.full_name}
            </span>
            <span className="text-[8px] text-orange-400 uppercase tracking-widest mt-1 font-black">Premium Seller</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-orange-400 hover:text-rose-500 transition-all duration-300 group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SellerSidebar;