import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { Check, X, Search, Loader2, MessageSquare, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Create admin service function for getAllReviews or just use api directly
      const res = await api.get('/reviews');
      setReviews(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load reviews');
    }
    setLoading(false);
  };

  const handleModerate = async (id, status) => {
    setSubmitting(id);
    try {
      const res = await api.put(`/reviews/${id}/moderate`, { status });
      if (res.data.success) {
        toast.success(`Review ${status}`);
        setReviews(prev => prev.map(r => r.review_id === id ? { ...r, status } : r));
      }
    } catch (error) {
      toast.error('Failed to moderate review');
    }
    setSubmitting(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-955" size={40} /></div>;

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const otherReviews = reviews.filter(r => r.status !== 'pending');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Review Moderation</h1>
        <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
          Approve or reject customer reviews
        </p>
      </div>

      <div className="space-y-8">
        {pendingReviews.length > 0 && (
          <div className="bg-white border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
                Needs Attention ({pendingReviews.length})
              </h2>
            </div>
            <div className="divide-y divide-orange-100">
              {pendingReviews.map(r => (
                <div key={r.review_id} className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-orange-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-orange-900">{r.title}</span>
                    </div>
                    <p className="text-sm text-orange-900 mb-2">"{r.body}"</p>
                    <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold space-y-1">
                      <p>Product: {r.product_name}</p>
                      <p>Customer: {r.customer_name} ({r.customer_email})</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <button
                      onClick={() => handleModerate(r.review_id, 'approved')}
                      disabled={submitting === r.review_id}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-black hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleModerate(r.review_id, 'rejected')}
                      disabled={submitting === r.review_id}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 text-[10px] uppercase tracking-widest font-black hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherReviews.length > 0 && (
          <div className="bg-white border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-orange-200">
              <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
                Moderated Reviews
              </h2>
            </div>
            <div className="divide-y divide-orange-100">
              {otherReviews.slice(0, 50).map(r => (
                <div key={r.review_id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-black ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {r.status}
                      </span>
                      <div className="flex text-orange-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-orange-955 mb-1">{r.title}</h4>
                  <p className="text-xs text-orange-900 mb-2">"{r.body}"</p>
                  <p className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">Product: {r.product_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="bg-white border border-orange-200 py-16 flex flex-col items-center justify-center text-center px-4">
            <MessageSquare size={32} className="text-orange-200 mb-4" />
            <h3 className="text-lg font-serif italic text-orange-955 mb-2">No Reviews Found</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-900/50">
              There are no product reviews in the system yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
