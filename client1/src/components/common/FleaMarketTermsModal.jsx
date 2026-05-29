import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Check, X } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { agreeToTerms } from '../../services/authService';

const FleaMarketTermsModal = ({ onClose, onSuccess }) => {
  const { user, updateUser } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleAgree = async () => {
    if (!agreed) return;
    setIsProcessing(true);
    try {
      // Execute backend API call to persist the terms agreement
      await agreeToTerms();
      
      // Update the in-memory context/user session state
      updateUser({ 
        ...user, 
        hasAgreedToFleaMarketTerms: true,
        has_agreed_to_flea_market_terms: true 
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to persist terms agreement:", error);
      alert(error?.response?.data?.message || error.message || "Failed to submit agreement. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onClose) onClose();
    // Dynamic redirect based on user role
    if (user?.role === 'seller' || user?.type === 'seller') {
      navigate('/seller-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-amber-50/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Shield className="text-amber-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Flea Market Terms & Conditions</h2>
            <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">Mandatory Agreement</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-orange-800 leading-relaxed font-medium">
              You are about to enter the GoMo Import/Export Exchange. To ensure a secure B2B trading environment, all users must agree to the following strict platform regulations before proceeding.
            </p>
          </div>

          <div className="space-y-5 text-sm text-gray-600">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">1. Strict No-Contact Policy</h3>
              <p className="leading-relaxed">Sharing of personal contact information (Phone numbers, Email addresses, WhatsApp, social media handles, or physical addresses) during video conferences or any communication on the platform is strictly prohibited. Violations will result in immediate account termination.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">2. Video Conference Regulations</h3>
              <p className="leading-relaxed">All video conferences must be scheduled and conducted exclusively through the GoMo platform. Recording without explicit written consent is forbidden. The platform reserves the right to monitor calls for compliance.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">3. Minimum Order Quantity (MOQ)</h3>
              <p className="leading-relaxed">The minimum order quantity for any transaction is strictly set to 10 kilograms (10 kg) per product. Buyers cannot request samples or orders below this threshold.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">4. Payments & Escrow</h3>
              <p className="leading-relaxed">All payments must be processed through GoMo's secure escrow system. Direct payments to sellers via bank transfer, UPI, crypto, or offline methods are strictly prohibited.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer group mb-6">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors"></div>
              <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 select-none">
              I have read and agree to abide by the GoMo Import/Export Exchange Terms and Conditions. I understand that any violation may result in an immediate and permanent ban.
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancel}
              className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Decline & Return
            </button>
            <button 
              onClick={handleAgree}
              disabled={!agreed || isProcessing}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-wider transition-all duration-300 shadow-md ${
                agreed && !isProcessing
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-orange-500/25 hover:brightness-105 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? 'Saving Agreement...' : 'I Agree to Terms'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FleaMarketTermsModal;
