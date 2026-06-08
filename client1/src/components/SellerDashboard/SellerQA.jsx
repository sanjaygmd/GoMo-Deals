import React, { useState, useEffect } from 'react';
import { HelpCircle, Check, X, Search, Loader2, MessageSquare } from 'lucide-react';
import { getSellerQuestions, answerQuestion } from "../../services/questionService";
import { toast } from 'react-hot-toast';

const SellerQA = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await getSellerQuestions();
    if (res.success) {
      setQuestions(res.data);
    } else {
      toast.error('Failed to load questions');
    }
    setLoading(false);
  };

  const handleAction = async (questionId, action) => {
    if (action === 'answer' && (!replyText[questionId] || replyText[questionId].trim() === '')) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(questionId);
    const res = await answerQuestion(questionId, action, replyText[questionId]);
    setSubmitting(null);

    if (res.success) {
      toast.success(`Question ${action === 'answer' ? 'answered' : 'rejected'} successfully`);
      // Update local state
      setQuestions(prev => prev.map(q => {
        if (q.question_id === questionId) {
          return { ...q, status: action === 'answer' ? 'answered' : 'rejected', answer: action === 'answer' ? replyText[questionId] : null };
        }
        return q;
      }));
    } else {
      toast.error(res.message || 'Failed to process question');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-955" size={40} />
      </div>
    );
  }

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Customer Q&A</h1>
        <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
          Manage questions from your customers
        </p>
      </div>

      {pendingQuestions.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-none shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
              <HelpCircle size={16} /> Needs Your Attention ({pendingQuestions.length})
            </h2>
          </div>
          <div className="divide-y divide-orange-100">
            {pendingQuestions.map((q) => (
              <div key={q.question_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 font-bold uppercase mb-2 inline-block">Product: {q.product_name}</span>
                    <p className="text-base font-medium text-orange-955 mb-1"><span className="font-bold text-orange-600 mr-2">Q:</span>{q.question}</p>
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">
                      {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-4 border border-orange-200 mt-4">
                  <textarea
                    value={replyText[q.question_id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [q.question_id]: e.target.value })}
                    placeholder="Type your answer here..."
                    className="w-full h-24 bg-white border border-orange-200 p-3 text-sm focus:border-orange-500 outline-none resize-none mb-3"
                    disabled={submitting === q.question_id}
                  ></textarea>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleAction(q.question_id, 'reject')}
                      disabled={submitting === q.question_id}
                      className="px-4 py-2 border border-rose-200 text-rose-600 text-[10px] uppercase tracking-widest font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      Reject/Delete
                    </button>
                    <button
                      onClick={() => handleAction(q.question_id, 'answer')}
                      disabled={submitting === q.question_id || !replyText[q.question_id]}
                      className="px-6 py-2 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-orange-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting === q.question_id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Submit Answer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {answeredQuestions.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-none shadow-sm overflow-hidden mt-8">
          <div className="bg-white px-6 py-4 border-b border-orange-200">
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-955 flex items-center gap-2">
              <Check size={16} className="text-emerald-600" /> Answered Questions ({answeredQuestions.length})
            </h2>
          </div>
          <div className="divide-y divide-orange-100">
            {answeredQuestions.map((q) => (
              <div key={q.question_id} className="p-6">
                <div className="mb-3">
                  <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 font-bold uppercase mb-2 inline-block">Product: {q.product_name}</span>
                  <p className="text-sm font-medium text-orange-955"><span className="font-bold text-orange-600 mr-2">Q:</span>{q.question}</p>
                </div>
                {q.status === 'answered' ? (
                  <div className="pl-6 border-l-2 border-emerald-200 py-1">
                    <p className="text-sm text-orange-900"><span className="font-bold text-emerald-600 mr-2">A:</span>{q.answer}</p>
                  </div>
                ) : (
                  <div className="pl-6 border-l-2 border-rose-200 py-1">
                    <p className="text-sm text-rose-500 italic"><X size={12} className="inline mr-1" />Question was rejected/deleted</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <div className="bg-white border border-orange-200 py-16 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-orange-50 flex items-center justify-center rounded-full mb-4">
            <MessageSquare size={24} className="text-orange-300" />
          </div>
          <h3 className="text-lg font-serif italic text-orange-955 mb-2">No Questions Yet</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-900/50 max-w-sm">
            When customers ask questions about your products, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default SellerQA;
