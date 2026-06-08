import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { Shield, Loader2, Check, Gavel } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/disputes');
      if (res.data.success) {
        setDisputes(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load disputes');
    }
    setLoading(false);
  };

  const handleResolve = async (id, status = 'resolved') => {
    if (!resolutionText[id] && status !== 'closed') {
      toast.error('Please enter a resolution message');
      return;
    }
    setSubmitting(id);
    try {
      const res = await api.put(`/disputes/${id}/admin`, { resolution: resolutionText[id], status });
      if (res.data.success) {
        toast.success(`Dispute marked as ${status}`);
        setDisputes(prev => prev.map(d => d.dispute_id === id ? { ...d, status, resolution: resolutionText[id] || d.resolution } : d));
      }
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
    setSubmitting(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-955" size={40} /></div>;

  const openDisputes = disputes.filter(d => d.status === 'open');
  const resolvedDisputes = disputes.filter(d => d.status !== 'open');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Dispute Mediator</h1>
        <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
          Oversee and resolve disputes between buyers and sellers
        </p>
      </div>

      <div className="space-y-8">
        {openDisputes.length > 0 && (
          <div className="bg-white border border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center gap-2">
              <Gavel size={16} className="text-rose-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-rose-955">
                Active Disputes ({openDisputes.length})
              </h2>
            </div>
            <div className="divide-y divide-rose-100">
              {openDisputes.map(d => (
                <div key={d.dispute_id} className="p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block mb-1">Customer</span>
                        <p className="text-sm font-bold text-orange-955">{d.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block mb-1">Seller</span>
                        <p className="text-sm font-bold text-orange-955">{d.store_name}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block mb-1">Order Details</span>
                      <p className="text-xs text-orange-900 font-bold">ID: {d.order_id}</p>
                      <p className="text-xs text-orange-900">Amount: ₹{Number(d.amount).toLocaleString()}</p>
                    </div>
                    <h3 className="text-xs font-bold text-orange-955 mb-2 uppercase tracking-widest">Issue Reported:</h3>
                    <p className="text-sm text-orange-900 bg-orange-50 p-4 border-l-2 border-orange-300">"{d.reason}"</p>
                  </div>
                  
                  <div className="lg:w-1/3 space-y-3 bg-orange-50/50 p-4 border border-orange-100">
                    <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold">Admin Resolution</label>
                    <textarea
                      value={resolutionText[d.dispute_id] || ''}
                      onChange={(e) => setResolutionText({...resolutionText, [d.dispute_id]: e.target.value})}
                      placeholder="Admin decision (e.g. Forced refund, Request denied)"
                      className="w-full h-24 border border-orange-200 p-3 text-sm focus:border-orange-500 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(d.dispute_id, 'resolved')}
                        disabled={submitting === d.dispute_id || !resolutionText[d.dispute_id]}
                        className="flex-1 bg-emerald-600 text-white px-2 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-emerald-700 transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
                      >
                        {submitting === d.dispute_id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolve(d.dispute_id, 'closed')}
                        disabled={submitting === d.dispute_id}
                        className="flex-1 bg-rose-600 text-white px-2 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-rose-700 transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resolvedDisputes.length > 0 && (
          <div className="bg-white border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-900">
                Processed Disputes
              </h2>
            </div>
            <div className="divide-y divide-emerald-100">
              {resolvedDisputes.slice(0, 50).map(d => (
                <div key={d.dispute_id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest ${d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {d.status}
                      </span>
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Order ID: {d.order_id}</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{new Date(d.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-1">Issue ({d.customer_name})</p>
                      <p className="text-sm text-orange-900 bg-orange-50 p-3">"{d.reason}"</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-emerald-900 font-bold mb-1">Resolution</p>
                      <p className="text-sm text-emerald-900 bg-emerald-50 p-3">"{d.resolution || 'No resolution message'}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {disputes.length === 0 && (
          <div className="bg-white border border-orange-200 py-16 flex flex-col items-center justify-center text-center px-4">
            <Shield size={48} className="text-orange-200 mb-4" />
            <h3 className="text-lg font-serif italic text-orange-955 mb-2">Platform Secure</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-900/50">
              There are no active disputes requiring moderation at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;
