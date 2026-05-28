import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Mail, Lock, User, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../hooks/use-toast";
import { adminRegister, sendAdminRegisterOTP } from "../../../services/authService";

const G = {
  primary: "#f97316", // glowing orange
  bg: "#09090b", // zinc-950
  text: "#f4f4f5", // zinc-100
  muted: "#a1a1aa", // zinc-400
  border: "rgba(63, 63, 70, 0.4)", // zinc-800 glass
  superPrimary: "#f97316"
};

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 = form, 2 = OTP verify
  const [registerOtp, setRegisterOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    masterKey: "",
    type: "admin"
  });

  const startOtpTimer = () => {
    setOtpTimer(600);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const dynamicCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
:root {
  --font-sans: 'Inter', sans-serif;
  --primary: #f97316; /* Glowing neon orange */
  --primary-hover: #ea580c;
  --accent: #ffedd5;
  --bg: #09090b; /* Zinc-950 dark */
  --card-bg: rgba(24, 24, 27, 0.7); /* Zinc-900 glass */
  --text: #f4f4f5; /* Zinc-100 */
  --muted: #a1a1aa; /* Zinc-400 */
  --border: rgba(63, 63, 70, 0.4); /* Zinc-800 glass */
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

p {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--muted);
}

/* Hover effects and form elements */
.toggle-auth-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}
.toggle-auth-btn:hover {
  color: var(--primary-hover);
  transform: translateY(-1px);
}
.hover-primary-text {
  transition: color 0.3s ease;
}
.hover-primary-text:hover {
  color: var(--primary) !important;
}

/* Page container */
.admin-auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg);
}

/* Stunning glowing micro orbs dark backdrop */
.admin-bg {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #09090b;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* Ambient glowing orbs */
.admin-bg::before, .admin-bg::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  pointer-events: none;
  z-index: -1;
  opacity: 0.25;
}
.admin-bg::before {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(249,115,22,0.4) 0%, rgba(249,115,22,0) 70%);
  top: -10%;
  left: -10%;
}
.admin-bg::after {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(234,88,12,0.35) 0%, rgba(234,88,12,0) 70%);
  bottom: -10%;
  right: -10%;
}

.admin-left-hero { display: none; }

/* Premium Dark Glassmorphic card - responsive side-by-side or stacked */
.admin-right-form {
  width: 100%;
  max-width: 720px;
  background: rgba(15, 15, 18, 0.75);
  border: 1px solid rgba(249, 115, 22, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3.5rem 3rem;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px -10px rgba(249, 115, 22, 0.05);
  position: relative;
  z-index: 2;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease;
}

.admin-right-form:hover {
  transform: translateY(-4px);
  border-color: rgba(249, 115, 22, 0.35);
  box-shadow: 0 35px 70px -10px rgba(0, 0, 0, 0.9), 0 0 60px -5px rgba(249, 115, 22, 0.1);
}

/* Premium Settings-Pane Horizontal Layout */
.admin-form-container {
  display: flex;
  flex-direction: column;
}

.admin-form-row {
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(63, 63, 70, 0.3);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .admin-form-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
}

.admin-row-label-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

@media (min-width: 640px) {
  .admin-row-label-container {
    width: 35%;
  }
}

.admin-row-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #f97316; /* Neon Orange */
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.admin-row-sublabel {
  font-size: 0.65rem;
  color: #a1a1aa;
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.admin-row-input-container {
  width: 100%;
}

@media (min-width: 640px) {
  .admin-row-input-container {
    width: 65%;
  }
}

.admin-role-btn-group {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.admin-role-btn {
  flex: 1;
  padding: 0.85rem 1rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 12px;
  border: 1px solid rgba(63, 63, 70, 0.6);
  background: transparent;
  color: #a1a1aa;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-role-btn:hover {
  border-color: #f97316;
  color: #f4f4f5;
  background: rgba(249, 115, 22, 0.05);
}

.admin-role-btn.active {
  background: #f97316;
  border-color: #f97316;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.3);
}

.admin-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.admin-input-box input {
  width: 100%;
  padding: 0.85rem 2.75rem 0.85rem 2.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba(9, 9, 11, 0.8);
  color: #f4f4f5;
  font-family: var(--font-sans);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-input-box input:focus {
  outline: none;
  background: #09090b;
  border-color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
}

.admin-input-box > svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #71717a;
  pointer-events: none;
  transition: color 0.3s ease;
  width: 16px;
  height: 16px;
}

.admin-input-box:focus-within > svg {
  color: #f97316;
}

.admin-input-box .eye-toggle {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  transition: color 0.3s ease;
  z-index: 10;
}

.admin-input-box .eye-toggle:hover {
  color: #f97316;
}

/* Elegant neon orange gradient button */
.admin-submit-btn {
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 2rem;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.3);
}

.admin-submit-btn:hover {
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(249, 115, 22, 0.5);
}

.admin-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .admin-auth-container {
    padding: 1.25rem;
  }
  .admin-right-form {
    padding: 2.5rem 1.5rem;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    background: rgba(20, 20, 23, 0.9);
  }
  .admin-submit-btn {
    padding: 1rem;
    font-size: 0.85rem;
  }
}
.animate-fade {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resData = await sendAdminRegisterOTP(formData);
      if (resData.success) {
        toast({ title: "Verification Code Sent", description: `Check ${formData.email} for your 6-digit code.` });
        setRegisterStep(2);
        setRegisterOtp("");
        startOtpTimer();
      } else {
        toast({ variant: "destructive", title: "Failed", description: resData.message || "Please check your details." });
      }
    } catch (err) {
      const isValidationError = !!err.response?.data?.message;
      toast({ variant: "destructive", title: isValidationError ? "Validation Error" : "Network Error", description: err.response?.data?.message || "Failed to connect to the backend server." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const resData = await adminRegister({ ...formData, otp: registerOtp });
      if (resData.success) {
        toast({ title: "Account Initialized", description: "Your administrative identity is confirmed. Please log in." });
        navigate("/admin-login");
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: resData.message || "Invalid or expired code." });
      }
    } catch (err) {
      const isValidationError = !!err.response?.data?.message;
      toast({ variant: "destructive", title: isValidationError ? "Registration Failed" : "Network Error", description: err.response?.data?.message || "Failed to connect to the backend server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-bg admin-auth-container">
      <style>{dynamicCss}</style>
      
      <div className="admin-right-form register-mode">
        <div className="animate-fade w-full">
          <div style={{ marginBottom: "2.5rem" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: G.muted, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "1.5rem" }} className="hover-primary-text">
              <ArrowLeft size={14} /> Back to Store
            </Link>
            <h2 style={{ fontSize: "2.5rem", fontFamily: "var(--font-sans)", fontWeight: 800, color: G.text, marginBottom: "1rem" }}>
              {registerStep === 1 ? "Initialize" : "Verify Email"}
            </h2>
            <p style={{ color: G.muted, fontSize: "0.9rem", fontWeight: 300, letterSpacing: "0.05em" }}>
              {registerStep === 1 ? "Setup a new administrative identity." : `Enter the 6-digit code sent to ${formData.email}`}
            </p>
          </div>

          {/* Step 2: OTP Verify */}
          {registerStep === 2 ? (
            <div>
              <div className="admin-form-row" style={{ borderTop: "1px solid rgba(63,63,70,0.4)" }}>
                <div className="admin-row-label-container">
                  <span className="admin-row-label">Verification Code</span>
                  <span className="admin-row-sublabel">6-digit code from your email</span>
                </div>
                <div className="admin-row-input-container">
                  <div className="admin-input-box">
                    <ShieldCheck size={16} />
                    <input
                      type="text"
                      placeholder="------"
                      maxLength={6}
                      value={registerOtp}
                      onChange={e => setRegisterOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{ letterSpacing: "0.5em", fontWeight: 700, fontSize: "1.4rem", textAlign: "center", paddingLeft: 0 }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", color: otpTimer < 60 ? "#ef4444" : G.muted, fontWeight: 700, letterSpacing: "0.1em" }}>
                      {otpTimer > 0 ? `Expires in ${formatTimer(otpTimer)}` : "Code expired"}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await sendAdminRegisterOTP(formData);
                          if (res.success) {
                            toast({ title: "New Code Sent", description: "Check your email for the new code." });
                            setRegisterOtp("");
                            startOtpTimer();
                          } else {
                            toast({ variant: "destructive", title: "Failed", description: res.message });
                          }
                        } catch (err) {
                          toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Could not resend." });
                        } finally { setLoading(false); }
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: G.muted, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}
                      className="hover-primary-text"
                    >
                      <RefreshCw size={11} /> Resend
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "2.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setRegisterStep(1); setRegisterOtp(""); if (timerRef.current) clearInterval(timerRef.current); }}
                  style={{ flex: 1, padding: "1.1rem", borderRadius: "12px", border: "1px solid " + G.border, background: "transparent", fontWeight: 700, cursor: "pointer", color: G.text, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.1em" }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading || registerOtp.length !== 6}
                  onClick={handleVerifyOTP}
                  className="admin-submit-btn"
                  style={{ flex: 2, margin: 0, padding: "1.1rem", fontSize: "0.75rem" }}
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </button>
              </div>
            </div>
          ) : (
          /* Step 1: Registration Form */
          <form onSubmit={handleSubmit} className="admin-form-container" style={{ borderTop: "1px solid rgba(63, 63, 70, 0.4)" }}>
            {/* Access Role Row */}
            <div className="admin-form-row">
              <div className="admin-row-label-container">
                <span className="admin-row-label">Access Role</span>
                <span className="admin-row-sublabel">Select administration authorization tier</span>
              </div>
              <div className="admin-row-input-container">
                <div className="admin-role-btn-group">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'admin'})}
                    className={`admin-role-btn ${formData.type === 'admin' ? 'active' : ''}`}
                  >
                    Admin
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'super_admin'})}
                    className={`admin-role-btn ${formData.type === 'super_admin' ? 'active' : ''}`}
                  >
                    Super Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Full Name Row */}
            <div className="admin-form-row">
              <div className="admin-row-label-container">
                <span className="admin-row-label">Full Name</span>
                <span className="admin-row-sublabel">Your administrative staff identity</span>
              </div>
              <div className="admin-row-input-container">
                <div className="admin-input-box">
                  <User size={16} />
                  <input type="text" placeholder="Your identity" required 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Official Email Row */}
            <div className="admin-form-row">
              <div className="admin-row-label-container">
                <span className="admin-row-label">Official Email</span>
                <span className="admin-row-sublabel">Registered staff email address</span>
              </div>
              <div className="admin-row-input-container">
                <div className="admin-input-box">
                  <Mail size={16} />
                  <input type="email" placeholder="admin@domain.com" required 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Password Row */}
            <div className="admin-form-row">
              <div className="admin-row-label-container">
                <span className="admin-row-label">Password</span>
                <span className="admin-row-sublabel">Staff access security password</span>
              </div>
              <div className="admin-row-input-container">
                <div className="admin-input-box">
                  <Lock size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button" 
                    className="eye-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Master Security Key Row */}
            <div className="admin-form-row">
              <div className="admin-row-label-container">
                <span className="admin-row-label">Master Security Key</span>
                <span className="admin-row-sublabel">System override key required for registry</span>
              </div>
              <div className="admin-row-input-container">
                <div className="admin-input-box">
                  <ShieldCheck size={16} />
                  <input type="password" placeholder="System override key" required 
                    value={formData.masterKey} onChange={e => setFormData({...formData, masterKey: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? "Processing..." : "Send Verification Code"}
            </button>
          </form>
          )}

          <div style={{ marginTop: "3rem", textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
            <span style={{ color: G.muted }}>
              Already registered?
            </span>{" "}
            <Link to="/admin-login" style={{ textDecoration: "none", color: G.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }} className="hover-primary-text">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
