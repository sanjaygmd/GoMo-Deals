import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Check, X, Search, Loader2, MessageSquare, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Need a custom endpoint to get seller reviews, but for now we might have to use a generic one
      // Actually we need `GET /api/v1/reviews/seller`
      // I should add that endpoint or just use `getSellerQuestions` like approach.
      // Assuming I'll add `GET /api/v1/reviews/seller` in backend next.
      const res = await api.get('/reviews/seller');
      setReviews(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load reviews');
    }
    setLoading(false);
  };

  const handleReply = async (id) => {
    if (!replyText[id] || replyText[id].trim() === '') {
      toast.error('Please enter a reply');
      return;
    }
    setSubmitting(id);
    try {
      const res = await api.put(`/reviews/${id}/reply`, { seller_reply: replyText[id] });
      if (res.data.success) {
        toast.success('Replied to review successfully');
        setReviews(prev => prev.map(r => r.review_id === id ? { ...r, seller_reply: replyText[id] } : r));
      }
    } catch (error) {
      toast.error('Failed to reply to review');
    }
    setSubmitting(null);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-955" size={40} /></div>;

  const pendingReplies = reviews.filter(r => !r.seller_reply);
  const repliedReviews = reviews.filter(r => r.seller_reply);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Product Reviews</h1>
        <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
          Manage and reply to customer reviews
        </p>
      </div>

      <div className="space-y-8">
        {pendingReplies.length > 0 && (
          <div className="bg-white border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
                Unanswered Reviews ({pendingReplies.length})
              </h2>
            </div>
            <div className="divide-y divide-orange-100">
              {pendingReplies.map(r => (
                <div key={r.review_id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 font-bold uppercase mb-2 inline-block">Product: {r.product_name}</span>
                      <div className="flex text-orange-500 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p className="text-base font-medium text-orange-955 mb-1">{r.title}</p>
                      <p className="text-sm text-orange-900 mb-2">"{r.body}"</p>
                      <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-4 border border-orange-200 mt-4">
                    <textarea
                      value={replyText[r.review_id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [r.review_id]: e.target.value })}
                      placeholder="Type your public response here..."
                      className="w-full h-24 bg-white border border-orange-200 p-3 text-sm focus:border-orange-500 outline-none resize-none mb-3"
                      disabled={submitting === r.review_id}
                    ></textarea>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleReply(r.review_id)}
                        disabled={submitting === r.review_id || !replyText[r.review_id]}
                        className="px-6 py-2 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-orange-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {submitting === r.review_id ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                        Post Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {repliedReviews.length > 0 && (
          <div className="bg-white border border-orange-200 shadow-sm overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-orange-200">
              <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
                Replied Reviews
              </h2>
            </div>
            <div className="divide-y divide-orange-100">
              {repliedReviews.map(r => (
                <div key={r.review_id} className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-orange-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                      Product: {r.product_name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-orange-955 mb-1">{r.title}</h4>
                  <p className="text-xs text-orange-900 mb-4">"{r.body}"</p>
                  
                  <div className="pl-6 border-l-2 border-orange-300 py-1 bg-orange-50 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-orange-955 font-bold mb-1">Your Response</p>
                    <p className="text-sm text-orange-900">{r.seller_reply}</p>
                  </div>
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
              There are no reviews for your products yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerReviews;
