import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Calendar, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import * as authService from '../../services/authService';

const CustomerRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profilePicture: null,
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.password) newErrors.password = 'Password required';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let pictureBase64 = '';
      if (formData.profilePicture) {
        pictureBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(formData.profilePicture);
        });
      }
      await authService.sendOtp(formData.email);
      navigate('/verify-email', {
        state: {
          email: formData.email,
          userData: {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            profile_picture_url: pictureBase64,
            password: formData.password,
            role: 'customer'
          }
        }
      });
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to send code' });
    } finally {
      setLoading(false);
    }
  };

  const primary = '#006d77'; // teal primary for customers
  const bg = '#f0f5f5';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-6">
            <h2 className="text-3xl font-semibold" style={{ color: primary }}>Join GoMo Deals</h2>
            <p className="text-sm text-gray-600 mt-2">Create your customer account</p>
          </motion.div>
          <motion.form onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{errors.submit}</div>
            )}
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border" placeholder="John Doe" />
              </div>
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border" placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border" placeholder="1234567890" />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border" />
              </div>
            </div>
            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border bg-white appearance-none">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {/* Profile Picture */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, profilePicture: e.target.files[0] })}
                  className="w-full text-sm pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border" />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} required value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:border" placeholder="Create password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:border" placeholder="Confirm password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded transition-colors"
            >
              {loading ? 'Sending Code...' : 'Create Account'}
            </button>
          </motion.form>
          <div className="text-center mt-4 text-xs text-gray-500">
            Already have an account? <Link to="/login" className="text-teal-600 font-medium">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
