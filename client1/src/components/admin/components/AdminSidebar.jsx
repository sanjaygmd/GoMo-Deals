import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Ticket, Shield, CreditCard, BarChart3, Store,
  MessageSquare, Landmark, ShieldCheck, RotateCcw,
  Video, Image, Trophy
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";

const navItems = [
  { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { title: "Products", path: "/admin/products", icon: Package },
  { title: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { title: "Returns", path: "/admin/returns", icon: RotateCcw },
  { title: "Customers", path: "/admin/customers", icon: Users },
  { title: "Sellers", path: "/admin/sellers", icon: Store },
  { title: "Coupons", path: "/admin/coupons", icon: Ticket },
  { title: "Payouts", path: "/admin/payouts", icon: CreditCard },
  { title: "Mediator", path: "/admin/mediator", icon: Video },
  { title: "B2B Conferences", path: "/admin/mediator/flea-market", icon: Video },
  { title: "Reviews", path: "/admin/reviews", icon: MessageSquare },
  { title: "Ad Banners", path: "/admin/ad-banners", icon: Image },
  { title: "Brand Rankings", path: "/admin/rankings", icon: Trophy },
  { title: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { title: "Logs", path: "/admin/logs", icon: Shield },
];

const superAdminItems = [
  { title: "Admins", path: "/admin/administrators", icon: ShieldCheck },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = user?.role === 'super_admin' 
    ? [...navItems, ...superAdminItems] 
    : navItems;

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 flex flex-col bg-orange-950 text-white border-r border-white/5 font-sans shadow-xl overflow-y-auto no-scrollbar">
      {/* Brand Identity - Exact match of Seller Sidebar */}
      <div className="p-12 mb-6 border-b border-white/5">
        <Link to="/admin" className="flex flex-col group">
          <span className="text-4xl font-serif tracking-[0.4em] uppercase leading-none text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>GoMo</span>
          <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-orange-500"></div>
              <span className="text-[8px] tracking-[0.4em] uppercase text-orange-400 font-black">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin Portal'}
              </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-6 text-[8px] font-bold text-orange-500 uppercase tracking-[0.3em] mb-4">Directory</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={cn(
                "flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-300 rounded-none group relative text-[10px] font-bold uppercase tracking-[0.2em]",
                isActive
                  ? "text-white bg-white/5"
                  : "text-orange-400 hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
              <item.icon 
                size={16} 
                strokeWidth={isActive ? 2 : 1.5} 
                className={cn(
                  "flex-shrink-0 transition-transform group-hover:scale-110 duration-300", 
                  isActive ? "opacity-100 text-white" : "opacity-40 group-hover:opacity-100 text-orange-400"
                )} 
              />
              <span className={cn(
                "transition-all duration-300",
                isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
              )}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="p-8 border-t border-white/5 bg-orange-600/10">
        <div className="bg-white/5 p-5 rounded-none border border-white/5">
          <div className="flex items-center gap-2.5 mb-2">
             <div className="h-1.5 w-1.5 bg-orange-50 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
             <p className="text-[8.5px] font-bold text-orange-400 uppercase tracking-[0.25em]">Systems Active</p>
          </div>
          <p className="text-[8.5px] font-normal text-orange-200 uppercase tracking-widest leading-relaxed">Admin Suite v2.0</p>
        </div>
      </div>
    </aside>
  );
}
