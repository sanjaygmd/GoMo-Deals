import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, X, Check, Scale, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createMeeting } from '../../services/meetingService';

const ScheduleModal = ({ product, onClose, onSuccess }) => {
  const [purpose, setPurpose] = useState('');
  const [kgAmount, setKgAmount] = useState(product?.minOrderKg || 10);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  const minOrder = product?.minOrderKg || 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!termsAccepted) { setError('You must accept the terms and conditions to proceed.'); return; }
    if (kgAmount < minOrder) { setError(`Minimum order is ${minOrder} kg.`); return; }
    if (!meetingDate || !meetingTime) { setError('Please select a preferred date and time for the meeting.'); return; }

    const localDateTimeString = `${meetingDate}T${meetingTime}:00`;
    const localDateObj = new Date(localDateTimeString);
    const scheduledAt = localDateObj.toISOString();

    setLoading(true);
    try {
      // The FleaMarketPage prefixes real product UUIDs with 'fm_' for routing checks.
      // We must strip this prefix before sending it to the backend or Postgres will throw an invalid UUID error.
      let finalProductId = product.id || product.product_id;
      if (finalProductId && finalProductId.startsWith('fm_')) {
        finalProductId = finalProductId.substring(3);
      }

      const res = await createMeeting(
        finalProductId, 
        kgAmount, 
        purpose, 
        scheduledAt
      );

      if (res.success) {
        const tmr = new Date(scheduledAt);
        const scheduledTime = tmr.toLocaleString(undefined, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        setSubmitted(scheduledTime);
      } else {
        setError(res.error || 'Failed to schedule video conference.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while scheduling the conference.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={40} className="text-green-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Conference Scheduled!</h3>
          <p className="text-[12px] text-gray-600 mb-6 leading-relaxed">
            Your video conference with <strong>{product?.seller?.name || product?.brand || 'Seller'}</strong> has been scheduled for <br/>
            <span className="text-green-600 font-bold text-sm mt-1 block">{submitted}</span>
          </p>
          <div className="space-y-3">
            <button onClick={() => { if (onSuccess) onSuccess(); onClose(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[12px] uppercase tracking-widest hover:brightness-105 transition-all shadow-md">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-4" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gray-900 px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Video size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-white text-[14px] font-black">Schedule Video Conference</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">{product?.seller?.name || product?.brand || 'Seller'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* Listing Summary */}
        <div className="mx-6 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
          <img src={product?.image || product?.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover border border-amber-100 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider line-clamp-1">{product?.title || product?.name}</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">₹{product?.pricePerKg || product?.price}/kg · Min {minOrder}kg</p>
            <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">{product?.origin || 'India'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Quantity */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
              Quantity Required (kg) — Min {minOrder} kg
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
              <Scale size={14} className="ml-4 text-gray-400 flex-shrink-0" />
              <input type="number" min={minOrder} value={kgAmount}
                onChange={e => setKgAmount(Number(e.target.value))}
                className="flex-1 px-3 py-3 text-[13px] font-bold text-gray-900 outline-none bg-transparent"
                placeholder={`Min ${minOrder} kg`}
              />
              <span className="pr-4 text-[11px] text-gray-400 font-semibold">kg</span>
            </div>
          </div>

          {/* Date and Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                Meeting Date
              </label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                Meeting Time
              </label>
              <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors" />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
              Conference Purpose (Optional)
            </label>
            <textarea rows={2} value={purpose} onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Discuss bulk pricing, quality documentation, shipping terms..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[12px] text-gray-700 outline-none focus:border-amber-500 transition-colors resize-none bg-gray-50/50"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setTermsAccepted(p => !p)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  termsAccepted ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white hover:border-amber-400'
                }`}>
                {termsAccepted && <Check size={11} className="text-white" />}
              </div>
              <span className="text-[11px] text-gray-600 leading-relaxed">
                I agree to the{' '}
                <Link to="/flea-market/terms" target="_blank" className="text-amber-600 hover:underline font-bold">
                  Flea Market Terms & Conditions
                </Link>
                . I understand that sharing personal contact information during the conference is strictly prohibited, all transactions must be completed through GoMo platform, and the minimum order quantity is {minOrder} kg.
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertTriangle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-[12px] uppercase tracking-widest hover:brightness-105 transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <Video size={16} />
                <span>Confirm Conference Request</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ScheduleModal;
