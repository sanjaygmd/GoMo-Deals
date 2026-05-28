import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ShieldAlert, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SellerAuthLayout from "./SellerAuthLayout";
import { sellerRegister, sendSellerOtp, verifySellerOtp } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const SellerRegistration = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setError("All required fields must be filled");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await sendSellerOtp({ email: form.email, purpose: "registration" });
      if (res.success) {
        setStep(2);
      } else {
        setError(res.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const vRes = await verifySellerOtp({ email: form.email, otp, purpose: "registration" });
      if (!vRes.success) {
        setError(vRes.message || "Invalid OTP");
        setVerifying(false);
        return;
      }

      const res = await sellerRegister({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        store_name: 'Store_' + Math.random().toString(36).substring(7)
      });

      if (!res.success) {
        setError(res.message);
        setVerifying(false);
        return;
      }

      login(res.data);
      navigate("/seller/onboarding");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SellerAuthLayout>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-orange-900 tracking-tight mb-2">
          {step === 1 ? "Join as Seller" : "Verify Email"}
        </h2>
        <p className="text-orange-500 text-sm tracking-wide">
          {step === 1 ? "Start your merchant journey with us" : "Enter the code sent to your business email"}
        </p>
      </div>

      {/* Progress Dot */}
      <div className="flex justify-center gap-2 mb-8">
        <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-orange-900' : 'bg-orange-200'}`} />
        <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-orange-900' : 'bg-orange-200'}`} />
      </div>

      <AnimatePresence mode="wait">
        <motion.form 
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onSubmit={step === 1 ? handleSendOtp : handleVerifyAndRegister} 
          className="space-y-4"
        >
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-rose-700 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                    <input
                      name="fullName"
                      placeholder="Enter your name"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                    <input
                      name="email"
                      type="email"
                      placeholder="merchant@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                  <input
                    name="phone"
                    placeholder="Your contact number"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-900">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 ml-1">Confirm Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} strokeWidth={1.5} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-sm outline-none focus:border-orange-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" size={20} />
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full py-6 bg-orange-50 border border-orange-100 rounded-2xl text-orange-900 text-3xl tracking-[0.5em] font-mono outline-none focus:border-orange-600 focus:bg-white transition-all text-center"
                />
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-[10px] text-orange-400 uppercase tracking-widest">
                  Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-orange-900 font-bold hover:underline">Resend</button>
                </p>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-[10px] text-orange-400 uppercase tracking-widest font-black hover:text-orange-900 transition-all"
                >
                  ← Edit Details
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || verifying}
            className={`w-full py-5 bg-orange-900 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] ${loading || verifying ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-800"}`}
          >
            {loading ? "Sending Code..." : verifying ? "Verifying..." : step === 1 ? "Next Step" : "Complete Registration"}
            {!loading && !verifying && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </motion.form>
      </AnimatePresence>

      <div className="text-center pt-8 border-t border-orange-50 mt-8">
        <p className="text-orange-500 text-[11px] uppercase tracking-widest font-medium">
          Already registered?{" "}
          <Link
            to="/seller/login"
            className="text-orange-900 font-black border-b-2 border-orange-900 pb-0.5 ml-2 hover:opacity-70 transition-all"
          >
            Sign In
          </Link>
        </p>
      </div>
    </SellerAuthLayout>
  );
};

export default SellerRegistration;