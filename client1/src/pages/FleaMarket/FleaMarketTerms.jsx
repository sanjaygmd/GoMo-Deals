import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Scale, Video, CreditCard, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FleaMarketTerms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Lock,
      title: '1. Strict No-Contact Policy',
      content: 'Sharing of personal contact information (Phone numbers, Email addresses, WhatsApp, social media handles, or physical addresses) during video conferences or any communication on the platform is strictly prohibited. Violations will result in immediate account termination and permanent ban from the GoMo Import/Export Exchange.',
    },
    {
      icon: Video,
      title: '2. Video Conference Regulations',
      content: 'All video conferences must be scheduled and conducted exclusively through the GoMo platform. Recording of video conferences by either party without explicit written consent from GoMo is strictly forbidden. The platform reserves the right to monitor calls for compliance and quality assurance purposes.',
    },
    {
      icon: Scale,
      title: '3. Minimum Order Quantity (MOQ)',
      content: 'The minimum order quantity for any transaction on the Flea Market Exchange is strictly set to 10 kilograms (10 kg) per product. Sellers are required to fulfill orders meeting or exceeding this minimum. Buyers cannot request samples or orders below this threshold through the exchange.',
    },
    {
      icon: CreditCard,
      title: '4. Payments & Escrow',
      content: 'All payments must be processed through GoMo\'s secure escrow system. Direct payments to sellers via bank transfer, UPI, crypto, or any offline methods are strictly prohibited. Funds will be released to the seller only after the buyer confirms receipt and satisfactory quality of the goods. GoMo charges a 2% platform fee on all successful transactions.',
    },
    {
      icon: Shield,
      title: '5. Quality Assurance & Certification',
      content: 'Sellers are solely responsible for the quality of commodities listed. Mandatory lab-tested quality certificates (e.g., FSSAI, ASTA, ICUMSA) must be provided upon buyer request. Any discrepancies between the described grade and the delivered product will be subject to dispute resolution and potential refund.',
    },
    {
      icon: Users,
      title: '6. Dispute Resolution & Arbitration',
      content: 'In the event of a dispute regarding quality, quantity, or delivery, both parties agree to binding arbitration facilitated by the GoMo Dispute Resolution Panel. The panel\'s decision shall be final. The platform operates under Indian trade laws and import/export regulations.',
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="bg-gray-900 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent" />
            <Shield size={48} className="mx-auto text-amber-500 mb-6 relative z-10" />
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight relative z-10">
              Flea Market <span className="text-amber-500">Terms & Conditions</span>
            </h1>
            <p className="text-gray-400 mt-4 text-sm max-w-xl mx-auto relative z-10">
              By accessing the GoMo Import/Export Exchange, you agree to abide by these strict trading regulations designed to ensure a secure and fair marketplace.
            </p>
          </div>

          <div className="px-8 py-10 space-y-10">
            {sections.map((section, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-5"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                    <section.icon size={20} className="text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-amber-50 px-8 py-6 border-t border-amber-100 flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800">
              Last updated: May 2026
            </p>
            <p className="text-xs font-bold text-amber-800">
              GoMo Deals © All rights reserved
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FleaMarketTerms;
