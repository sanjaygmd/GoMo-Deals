import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import SellerAuthLayout from "./SellerAuthLayout";

import { loginSeller as apiLoginSeller } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const SellerLoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user) {
      setError(`A ${user.role || 'user'} is already logged in. Please logout first.`);
      return;
    }

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiLoginSeller({
        email: form.email,
        password: form.password
      });

      if (!res.success) {
        setError(res.message);
        return;
      }

      login(res.data);
      
      if (!res.data.onboarding_completed) {
        navigate("/seller/onboarding");
      } else {
        navigate("/seller-dashboard");
      }

    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthLayout>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-orange-900 tracking-tight mb-3">
          Seller Portal
        </h2>
        <p className="text-orange-500 text-sm tracking-wide">
          Enter your credentials to access your store
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3"
          >
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Access Restricted</p>
              <p className="text-xs text-rose-700/80 leading-relaxed font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Business Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
              <input
                type="email"
                name="email"
                value={form.email}
                placeholder="name@business.com"
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400">Security Password</label>
              <Link to="/forgot-password" className="text-[10px] uppercase tracking-wider text-orange-400 hover:text-orange-900 transition-colors">Forgot?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-900 transition-colors"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-5 bg-orange-900 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-800"}`}
        >
          {loading ? 'Signing In...' : 'Access Dashboard'}
          {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="text-center pt-8 border-t border-orange-50 mt-8">
        <p className="text-orange-500 text-[11px] uppercase tracking-widest font-medium">
          Interested in selling?{" "}
          <Link
            to="/seller/register"
            className="text-orange-900 font-black border-b-2 border-orange-900 pb-0.5 ml-2 hover:opacity-70 transition-all"
          >
            Join Hub
          </Link>
        </p>
      </div>
    </SellerAuthLayout>
  );
};

export default SellerLoginPage;