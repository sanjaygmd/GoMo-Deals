import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, User, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const ReviewSection = ({ productId, selectedVariant }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);
    const [orderItemId, setOrderItemId] = useState(null);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    
    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchReviews();
        if (user) {
            checkEligibility();
        }
    }, [productId, user]);

    const fetchReviews = async () => {
        setLoading(true);
        const res = await reviewService.getProductReviews(productId);
        if (res.success) {
            setReviews(res.data);
        }
        setLoading(false);
    };

    const checkEligibility = async () => {
        const res = await reviewService.checkCanReview(productId);
        if (res.success) {
            setCanReview(res.canReview);
            setOrderItemId(res.orderItemId);
            setAlreadyReviewed(res.alreadyReviewed || false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        const res = await reviewService.addReview({
            product_id: productId,
            order_item_id: orderItemId,
            rating,
            title,
            body,
            variant_id: selectedVariant?.variant_id
        });

        if (res.success) {
            setSuccess('Review submitted successfully!');
            setIsFormOpen(false);
            setCanReview(false);
            setAlreadyReviewed(true);
            fetchReviews();
        } else {
            setError(res.error || 'Failed to submit review');
        }
        setSubmitting(false);
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="mt-20 pt-16 border-t border-orange-100 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                <div>
                    <span className="text-[9px] uppercase tracking-[0.4em] text-orange-400 block mb-2">Customer Feedback</span>
                    <h2 className="text-2xl font-serif italic text-orange-900">Reviews & Ratings</h2>
                </div>
                
                {reviews.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-light text-orange-900 mb-0.5">{averageRating}</p>
                            <div className="flex items-center justify-center gap-0.5 text-orange-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={10} 
                                        fill={i < Math.round(averageRating) ? "currentColor" : "none"} 
                                        className={i < Math.round(averageRating) ? "text-orange-500" : "text-orange-200"}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="h-8 w-px bg-orange-100" />
                        <div>
                            <p className="text-lg font-light text-orange-900">{reviews.length}</p>
                            <p className="text-[8px] uppercase tracking-widest text-orange-400 font-bold">Reviews</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Review Button Logic */}
            <div className="mb-12">
                {!user ? (
                    <div className="p-6 bg-orange-50 rounded-sm border border-orange-100 text-center">
                        <p className="text-[10px] text-orange-500 uppercase tracking-widest mb-4">Login to share your experience</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 h-11 bg-orange-950 text-white text-[9px] uppercase tracking-[0.3em] font-black hover:bg-orange-600 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                ) : alreadyReviewed ? (
                    <div className="p-4 bg-orange-50/50 rounded-sm border border-orange-100 flex items-center gap-3">
                        <CheckCircle className="text-orange-500" size={16} />
                        <p className="text-[9px] uppercase tracking-widest text-orange-700 font-bold">You've shared your thoughts on this item. Thank you!</p>
                    </div>
                ) : !isFormOpen && (
                    <div className="p-6 bg-orange-50 rounded-sm border border-orange-100 text-center">
                        {!canReview && (
                            <p className="text-[9px] text-rose-400 uppercase tracking-widest mb-4 font-bold">Only customers with a 'Delivered' order can post reviews</p>
                        )}
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            disabled={!canReview}
                            className={cn(
                                "px-10 h-12 text-[10px] uppercase tracking-[0.3em] font-black transition-all shadow-md",
                                canReview 
                                    ? "bg-orange-950 text-white hover:bg-orange-600" 
                                    : "bg-orange-200 text-orange-400 cursor-not-allowed"
                            )}
                        >
                            {canReview ? 'Write a Review' : 'Review Locked'}
                        </button>
                    </div>
                )}
            </div>

            {/* Review Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-20"
                    >
                        <form onSubmit={handleSubmit} className="p-6 border border-orange-900 rounded-sm space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-orange-900">Share Your Experience</h3>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="text-[9px] uppercase tracking-widest text-orange-400 hover:text-orange-900 font-bold">Cancel</button>
                            </div>

                            {/* Rating Stars */}
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">Your Rating</label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star 
                                                size={18} 
                                                strokeWidth={1}
                                                fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                                                className={(hoverRating || rating) >= star ? "text-orange-500" : "text-orange-200"}
                                            />
                                        </button>
                                    ))}
                                    <span className="text-[9px] font-bold text-orange-400 ml-2 uppercase tracking-widest">
                                        {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">Review Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Summarize your thoughts"
                                        className="w-full h-11 bg-orange-50 border-none px-4 text-[12px] focus:ring-1 focus:ring-orange-950 transition-all placeholder:text-orange-300"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-orange-400 font-bold">Review Content</label>
                                    <textarea 
                                        required
                                        placeholder="What did you love about this product?"
                                        rows={4}
                                        className="w-full bg-orange-50 border-none p-4 text-[12px] focus:ring-1 focus:ring-orange-950 transition-all placeholder:text-orange-300 resize-none"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && <p className="text-rose-500 text-[9px] uppercase tracking-widest font-black">{error}</p>}

                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full h-12 bg-orange-950 text-white text-[10px] uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                {submitting ? 'Submitting...' : 'Post Review'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review List */}
            <div className="space-y-12 pb-20">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-orange-200" size={32} strokeWidth={1} />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-24 bg-orange-50 rounded-sm">
                        <MessageSquare className="mx-auto text-orange-200 mb-6" size={40} strokeWidth={1} />
                        <p className="text-[11px] uppercase tracking-[0.3em] text-orange-400 font-bold">No reviews yet. Be the first to share your experience.</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.review_id} className="group">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="md:w-64 shrink-0">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-400">
                                            <User size={18} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-orange-950 uppercase tracking-widest">{review.customer_name}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
                                                <p className="text-[8px] font-bold text-orange-400 uppercase tracking-widest">Verified Purchase</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-orange-300 font-bold uppercase tracking-widest">
                                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-0.5 text-orange-500 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={12} 
                                                fill={i < review.rating ? "currentColor" : "none"} 
                                                className={i < review.rating ? "text-orange-500" : "text-orange-200"}
                                            />
                                        ))}
                                    </div>
                                    <h4 className="text-lg font-serif italic text-orange-900 mb-4">{review.title}</h4>
                                    <p className="text-orange-500 text-sm font-light leading-relaxed mb-6 italic">
                                        "{review.body}"
                                    </p>
                                    {review.variant_value && (
                                        <span className="px-3 py-1 bg-orange-50 text-[9px] font-black text-orange-400 uppercase tracking-widest rounded-full border border-orange-100 mb-4 inline-block">
                                            Edition: {review.variant_value}
                                        </span>
                                    )}
                                    {review.seller_reply && (
                                        <div className="mt-4 p-4 bg-orange-50 border-l-2 border-orange-300">
                                            <p className="text-[10px] font-bold text-orange-955 uppercase tracking-widest mb-2">Seller Response</p>
                                            <p className="text-sm text-orange-900">{review.seller_reply}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
