import { useState, useEffect } from "react";
import {
  Bell, Shield, Store, Lock, Eye, EyeOff,
  ShoppingBag, Check, ChevronRight, RotateCcw
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { api } from "../../../services/api";

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300",
        value ? "bg-orange-950 shadow-lg shadow-orange-200" : "bg-orange-200"
      )}
    >
      <span className={cn(
        "inline-block h-6 w-6 rounded-full bg-white shadow-xl transition-transform duration-300",
        value ? "translate-x-6" : "translate-x-0"
      )} />
    </button>
  );
}

const SECTIONS = [
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    desc: "Control which alerts you receive",
    color: "text-orange-600", bg: "bg-orange-50",
    items: [
      { key: "new_orders", label: "New Order Alerts", desc: "Get notified for every new order placed", default: true },
      { key: "low_stock", label: "Low Stock Warnings", desc: "Alert when product stock drops below threshold", default: true },
      { key: "new_sellers", label: "Seller Registration", desc: "Notifications for new seller sign-ups", default: true },
      { key: "returns", label: "Return & Refund Requests", desc: "Get notified of customer return requests", default: false },
      { key: "daily_summary", label: "Daily Summary Email", desc: "Receive a daily digest of platform activity", default: false },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Security",
    desc: "Protect your admin account",
    color: "text-orange-600", bg: "bg-orange-50",
    items: [
      { key: "two_factor", label: "Two-Factor Authentication", desc: "Extra login verification step", default: true },
      { key: "login_alerts", label: "Login Activity Alerts", desc: "Get notified of new login attempts", default: true },
      { key: "session_timeout", label: "Auto Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", default: false },
    ],
  },
  {
    id: "marketplace",
    icon: Store,
    label: "Marketplace",
    desc: "Platform-level preferences",
    color: "text-orange-600", bg: "bg-orange-50",
    items: [
      { key: "auto_approve", label: "Auto-Approve Verified Sellers", desc: "Skip manual approval for GST-verified sellers", default: false },
      { key: "cod_enabled", label: "Enable Cash on Delivery", desc: "Allow cash on delivery as a payment option", default: true },
      { key: "auto_commission", label: "Auto Commission Deduction", desc: "Deduct commission from payouts automatically", default: true },
      { key: "review_display", label: "Show Product Reviews", desc: "Display customer reviews on product pages", default: true },
    ],
  },
  {
    id: "orders",
    icon: ShoppingBag,
    label: "Order Settings",
    desc: "Configure order processing behaviour",
    color: "text-orange-600", bg: "bg-orange-50",
    items: [
      { key: "auto_confirm", label: "Auto-Confirm Orders", desc: "Automatically confirm orders after payment success", default: false },
      { key: "cancel_window", label: "Allow Cancellation Window", desc: "Let customers cancel within 1 hour of placing", default: true },
    ],
  },
];

const buildDefaults = () => {
  const state = {};
  SECTIONS.forEach(s => s.items.forEach(item => { state[item.key] = item.default; }));
  return state;
};

const inputClass = "w-full h-11 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]";
const labelClass = "text-[9px] font-black text-stone-600 uppercase tracking-widest mb-1.5 block ml-1";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [toggles, setToggles] = useState(buildDefaults());
  const [activeTab, setActiveTab] = useState("notifications");
  const [savingToggles, setSavingToggles] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
        fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
        const resp = await api.get(`/admin/settings/${user.id}`);
        if (resp.data.success) {
            setToggles(prev => ({ ...prev, ...resp.data.data }));
        }
    } catch (err) {
        console.error("Failed to load settings:", err);
    } finally {
        setLoading(false);
    }
  };

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  const handleToggle = (key, val) => setToggles(prev => ({ ...prev, [key]: val }));

  const handleSavePreferences = async () => {
    setSavingToggles(true);
    try {
        const resp = await api.put(`/admin/settings/${user.id}`, { settings: toggles });
        if (resp.data.success) {
            toast({ title: "Preferences Saved", description: "Your settings have been updated and persisted." });
        }
    } catch (err) {
        toast({ variant: "destructive", title: "Save Failed", description: "Could not persist your settings." });
    } finally {
        setSavingToggles(false);
    }
  };

  const handleResetPreferences = () => {
    setToggles(buildDefaults());
    toast({ title: "Reset Complete", description: "Settings restored to defaults locally. Click save to persist." });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      return toast({ variant: "destructive", title: "Missing Fields", description: "Please fill all password fields." });
    }
    if (passwords.next !== passwords.confirm) {
      return toast({ variant: "destructive", title: "Password Mismatch", description: "New password and confirmation do not match." });
    }
    if (passwords.next.length < 6) {
      return toast({ variant: "destructive", title: "Too Short", description: "Password must be at least 6 characters." });
    }

    setPwLoading(true);
    try {
      const resp = await api.put("/admin/update-password-self", { currentPassword: passwords.current, newPassword: passwords.next });
      const data = resp.data;
      if (data.success) {
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setPasswords({ current: "", next: "", confirm: "" });
      } else {
        toast({ variant: "destructive", title: "Failed", description: data.message });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Could not update password." });
    } finally {
      setPwLoading(false);
    }
  };

  const activeSection = SECTIONS.find(s => s.id === activeTab);

  return (
    <div className="space-y-12 pb-20">
      {/* Elegant Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Shield size={14} className="text-orange-600" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">System Configuration</span>
          </div>
          <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">System Settings</h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
            Configure system parameters, alert channels, marketplace preferences, and secure credentials.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar nav */}
        <div className="space-y-3">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 border cursor-pointer",
                activeTab === s.id
                  ? "bg-white shadow-md border-orange-100 text-orange-955"
                  : "bg-orange-55/10 hover:bg-orange-55/35 border-transparent text-orange-700"
              )}
            >
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", activeTab === s.id ? "bg-orange-955 text-white" : "bg-orange-50 text-orange-600")}>
                <s.icon size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black tracking-tight">{s.label}</p>
                <p className="text-[9px] font-bold text-stone-400 mt-0.5 uppercase tracking-wider">{s.desc}</p>
              </div>
              {activeTab === s.id && <ChevronRight size={16} className="text-orange-300 shrink-0" />}
            </button>
          ))}

          {/* Password tab */}
          <button
            onClick={() => setActiveTab("password")}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 border cursor-pointer",
                activeTab === "password"
                  ? "bg-white shadow-md border-orange-100 text-orange-955"
                  : "bg-orange-55/10 hover:bg-orange-55/35 border-transparent text-orange-700"
              )}
            >
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", activeTab === "password" ? "bg-orange-955 text-white" : "bg-orange-50 text-orange-600")}>
                <Lock size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black tracking-tight">Credentials</p>
                <p className="text-[9px] font-bold text-stone-400 mt-0.5 uppercase tracking-wider">Update secure access</p>
              </div>
              {activeTab === "password" && <ChevronRight size={16} className="text-orange-300 shrink-0" />}
            </button>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3">
          {activeTab !== "password" && activeSection ? (
            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-8">
              {/* Section header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-orange-955 text-white">
                    <activeSection.icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-orange-955 tracking-tight uppercase">{activeSection.label}</h2>
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mt-1">{activeSection.desc}</p>
                  </div>
                </div>
              </div>

              {/* Toggle list */}
              <div className="space-y-4">
                {activeSection.items.map((item, i) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-5 rounded-2xl bg-orange-55/20 hover:bg-orange-55/40 border border-orange-100 hover:border-orange-200 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm transition-colors",
                        toggles[item.key] ? "bg-orange-955 text-white" : "bg-orange-50 text-orange-500"
                      )}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-orange-955 tracking-tight">{item.label}</p>
                        <p className="text-[10px] font-bold text-stone-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle value={toggles[item.key]} onChange={val => handleToggle(item.key, val)} />
                  </div>
                ))}
              </div>

              {/* Save / Reset buttons */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-orange-100">
                <button
                  onClick={handleSavePreferences}
                  disabled={savingToggles}
                  className="h-11 px-8 rounded-xl bg-orange-955 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-850 transition-all flex items-center gap-3 shadow-md disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <Check size={14} /> {savingToggles ? "Synchronizing..." : "Update Preferences"}
                </button>
                <button
                  onClick={handleResetPreferences}
                  className="h-11 px-6 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-3 cursor-pointer active:scale-98"
                >
                  <RotateCcw size={14} /> Reset Defaults
                </button>
              </div>
            </div>
          ) : null}

          {/* Password change panel */}
          {activeTab === "password" && (
            <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-orange-955 tracking-tight uppercase">Change Password</h2>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mt-1">Update your admin login credentials</p>
                </div>
              </div>

              {/* Security info card */}
              <div className="mb-8 p-5 rounded-2xl bg-orange-55/20 border border-orange-100 flex items-start gap-3">
                <Shield className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-orange-955 uppercase tracking-wider">Password Security Protocol</p>
                  <p className="text-[10px] font-bold text-stone-500 mt-1">
                    Use at least 8 characters, mixing uppercase, lowercase, numbers, and symbols. Avoid reuse of existing credentials.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {[
                  { field: "current", label: "Current Password", placeholder: "Enter current password" },
                  { field: "next", label: "New Password", placeholder: "Enter new password" },
                  { field: "confirm", label: "Confirm New Password", placeholder: "Re-enter new password" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[field] ? "text" : "password"}
                        placeholder={placeholder}
                        value={passwords[field]}
                        onChange={e => setPasswords(prev => ({ ...prev, [field]: e.target.value }))}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-800 transition-colors cursor-pointer"
                      >
                        {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {field === "next" && passwords.next && passwords.next.length < 6 && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1">Minimum 6 characters required</p>
                    )}
                    {field === "confirm" && passwords.confirm && passwords.next !== passwords.confirm && (
                      <p className="text-[10px] font-bold text-rose-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-6 border-t border-orange-100">
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="h-11 px-8 rounded-xl bg-orange-955 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-850 transition-all flex items-center gap-2 shadow-md disabled:opacity-60 cursor-pointer active:scale-98"
                  >
                    <Lock size={14} /> {pwLoading ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswords({ current: "", next: "", confirm: "" })}
                    className="h-11 px-6 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all cursor-pointer active:scale-98"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
