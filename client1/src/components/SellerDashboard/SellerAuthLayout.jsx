import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SellerAuthLayout = ({ children, maxWidth = "max-w-[720px]" }) => {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-20 px-6 font-sans">
      <div className={`w-full ${maxWidth} transition-all duration-300`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-orange-100 relative overflow-hidden"
        >
          {/* Back to Home Link */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 hover:text-orange-900 transition-colors group"
            >
              <ArrowLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
          {children}
        </motion.div>
        
        <div className="mt-12 text-center">
          <p className="text-[10px] text-orange-400 uppercase tracking-[0.3em] font-bold">
            &copy; 2026 GOMO DEALS GLOBAL MARKETPLACE
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerAuthLayout;