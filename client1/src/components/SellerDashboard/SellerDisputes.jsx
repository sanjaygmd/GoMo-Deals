import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, Check, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSellerDisputes, updateDisputeSeller } from "../../services/disputeService";

const SellerDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    const res = await getSellerDisputes();
    if (res.success) {
      setDisputes(res.data);
    }
    setLoading(false);
  };

  const handleResolve = async (id) => {
    if (!resolutionText[id]) {
      toast.error('Please enter a resolution message');
      return;
    }
    setSubmitting(id);
    const res = await updateDisputeSeller(id, resolutionText[id], 'resolved');
    if (res.success) {
      toast.success('Dispute marked as resolved');
      setDisputes(prev => prev.map(d => d.dispute_id === id ? { ...d, status: 'resolved', resolution: resolutionText[id] } : d));
    } else {
      toast.error(res.error || 'Failed to resolve dispute');
    }
    setSubmitting(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-955" size={40} /></div>;

  const openDisputes = disputes.filter(d => d.status === 'open');
  const closedDisputes = disputes.filter(d => d.status !== 'open');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Dispute Management</h1>
        <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
          Address and resolve buyer concerns
        </p>
      </div>

      <div className="space-y-8">
        {openDisputes.length > 0 && (
          <div className="bg-white border border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-rose-955">
                Action Required ({openDisputes.length})
              </h2>
            </div>
            <div className="divide-y divide-rose-100">
              {openDisputes.map(d => (
                <div key={d.dispute_id} className="p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 font-bold uppercase tracking-widest">Open</span>
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Order ID: {d.order_id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-orange-955 mb-2">Issue Reported:</h3>
                    <p className="text-sm text-orange-900 bg-orange-50 p-4 border-l-2 border-orange-300 mb-4">"{d.reason}"</p>
                    <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                      <p>Customer: {d.customer_name}</p>
                      <p>Date Opened: {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="lg:w-1/3 space-y-3">
                    <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold">Your Resolution</label>
                    <textarea
                      value={resolutionText[d.dispute_id] || ''}
                      onChange={(e) => setResolutionText({...resolutionText, [d.dispute_id]: e.target.value})}
                      placeholder="How will you resolve this? (e.g. Refund issued, Replacement shipped)"
                      className="w-full h-24 border border-orange-200 p-3 text-sm focus:border-orange-500 outline-none resize-none"
                    />
                    <button
                      onClick={() => handleResolve(d.dispute_id)}
                      disabled={submitting === d.dispute_id || !resolutionText[d.dispute_id]}
                      className="w-full bg-orange-955 text-white px-4 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-orange-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {submitting === d.dispute_id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {closedDisputes.length > 0 && (
          <div className="bg-white border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-900">
                Resolved Disputes
              </h2>
            </div>
            <div className="divide-y divide-emerald-100">
              {closedDisputes.map(d => (
                <div key={d.dispute_id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold uppercase tracking-widest">Resolved</span>
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Order ID: {d.order_id}</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{new Date(d.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-1">Issue</p>
                      <p className="text-sm text-orange-900 bg-orange-50 p-3">"{d.reason}"</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-emerald-900 font-bold mb-1">Resolution</p>
                      <p className="text-sm text-emerald-900 bg-emerald-50 p-3">"{d.resolution}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {disputes.length === 0 && (
          <div className="bg-white border border-orange-200 py-16 flex flex-col items-center justify-center text-center px-4">
            <ShieldAlert size={48} className="text-orange-200 mb-4" />
            <h3 className="text-lg font-serif italic text-orange-955 mb-2">No Disputes</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-900/50">
              Your store has an excellent track record! No buyer protection claims found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDisputes;
