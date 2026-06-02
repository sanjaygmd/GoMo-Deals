import { useState, useEffect } from "react";
import { 
  Star, Trash2, Search, Filter, MessageSquare, 
  User, Package, Calendar, ChevronRight, AlertTriangle 
} from "lucide-react";
import { api } from "../../../services/api";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import ConfirmModal from '../../common/ConfirmModal';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRating, setFilterRating] = useState("all");
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const { toast } = useToast();

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reviews');
            if (res.data.success) {
                setReviews(res.data.data);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch reviews."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await api.delete(`/admin/reviews/${id}`);
            if (res.data.success) {
                setReviews(reviews.filter(r => r.review_id !== id));
                toast({
                    title: "Success",
                    description: "Review deleted successfully."
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete review."
            });
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = 
            review.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterRating === "all" || review.rating === parseInt(filterRating);
        
        return matchesSearch && matchesFilter;
    });

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={14} 
                        className={cn(
                            i < rating ? "fill-orange-400 text-orange-400" : "text-orange-200"
                        )} 
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-orange-950 flex items-center justify-center text-white shadow-xl">
                            <MessageSquare size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-orange-950 tracking-tight">Product Reviews</h1>
                    </div>
                    <p className="text-orange-500 font-medium text-sm ml-1">Monitor and manage customer feedback across the platform</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-950 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search reviews..."
                            className="w-full sm:w-64 pl-12 pr-6 py-4 bg-white border border-orange-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-orange-100 focus:border-orange-950 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="px-6 py-4 bg-white border border-orange-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-950 transition-all shadow-sm"
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-orange-100 shadow-sm">
                    <div className="h-12 w-12 border-4 border-orange-100 border-t-orange-950 rounded-full animate-spin mb-4" />
                    <p className="text-orange-500 font-black uppercase tracking-widest text-[10px]">Loading Reviews...</p>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-orange-100 shadow-sm text-center">
                    <div className="h-20 w-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-300 mb-6">
                        <Filter size={40} />
                    </div>
                    <p className="text-orange-950 font-black text-xl mb-2">No reviews found</p>
                    <p className="text-orange-500 font-medium max-w-xs">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredReviews.map((review) => (
                        <div key={review.review_id} className="group bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-sm hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Left Side: Rating & Meta */}
                                <div className="lg:w-64 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black text-orange-950">{review.rating}</span>
                                            {renderStars(review.rating)}
                                        </div>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest italic">User Rating</p>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-orange-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                                                <User size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-orange-950 truncate">{review.customer_name}</p>
                                                <p className="text-[9px] font-bold text-orange-400 truncate">{review.customer_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                                                <Package size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-orange-950 truncate">{review.product_name}</p>
                                                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Product</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400">
                                                <Calendar size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-orange-950">{new Date(review.created_at).toLocaleDateString()}</p>
                                                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Date Posted</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-black text-orange-950 tracking-tight line-clamp-1">{review.title || "No Title"}</h3>
                                        <button 
                                            onClick={() => setConfirmModal({ isOpen: true, id: review.review_id })}
                                            className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Review"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <p className="text-orange-600 font-medium leading-relaxed bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                                            {review.body}
                                        </p>
                                        <div className="absolute -left-2 top-6 h-4 w-1 bg-orange-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={() => handleDelete(confirmModal.id)}
                title="Delete Review"
                message="Are you sure you want to delete this review? This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
