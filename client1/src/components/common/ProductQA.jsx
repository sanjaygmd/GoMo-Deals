import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProductQuestions, askQuestion } from '../../services/questionService';

const ProductQA = ({ productId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchQA = async () => {
      setLoading(true);
      const res = await getProductQuestions(productId);
      if (res.success) {
        setQuestions(res.data);
      }
      setLoading(false);
    };
    if (isExpanded) {
        fetchQA();
    }
  }, [productId, isExpanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please login to ask a question.', variant: 'destructive' });
      return;
    }
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);
    const res = await askQuestion(productId, newQuestion);
    setIsSubmitting(false);

    if (res.success) {
      toast({ title: 'Success', description: 'Question submitted! You will be notified when the seller answers.' });
      setNewQuestion('');
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to submit question.', variant: 'destructive' });
    }
  };

  return (
    <div className="border border-orange-100 bg-white rounded-none mb-12">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-orange-50/50 hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-orange-600" />
          <h3 className="text-sm uppercase tracking-widest font-extrabold text-orange-955">Customer Q&A</h3>
          {!isExpanded && questions.length > 0 && (
            <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 font-bold">{questions.length} Answers</span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-orange-900" /> : <ChevronDown size={16} className="text-orange-900" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-orange-100">
              
              {/* Ask Question Form */}
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this product..."
                    className="flex-1 border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 outline-none rounded-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newQuestion.trim()}
                    className="bg-orange-950 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-orange-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Submitting...' : 'Ask'}
                  </button>
                </div>
              </form>

              {/* Q&A List */}
              {loading ? (
                <div className="text-center py-6 text-orange-400 text-xs">Loading Q&A...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-orange-900/50">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No questions asked yet.</p>
                  <p className="text-xs mt-1">Be the first to ask a question!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q) => (
                    <div key={q.question_id} className="bg-orange-50/30 p-4 border border-orange-100">
                      <div className="flex gap-3 mb-3">
                        <span className="font-bold text-orange-600">Q:</span>
                        <div>
                          <p className="text-sm font-bold text-orange-955">{q.question}</p>
                          <p className="text-[10px] text-orange-400 mt-1 uppercase tracking-wider">
                            Asked by {q.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 pl-2 sm:pl-6 border-l-2 border-orange-200">
                        <span className="font-bold text-emerald-600">A:</span>
                        <div>
                          <p className="text-sm text-orange-900">{q.answer}</p>
                          <p className="text-[10px] text-orange-400 mt-1 uppercase tracking-wider">
                            Seller Response
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductQA;
