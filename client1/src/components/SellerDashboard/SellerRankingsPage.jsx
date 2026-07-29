import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, DollarSign, Calendar, Users, CheckCircle2, Sparkles, Star, ArrowRight, ThumbsUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function SellerRankingsPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [selectedCompForModal, setSelectedCompForModal] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOpenCompetitions();
  }, []);

  const fetchOpenCompetitions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rankings/open');
      if (res.data.success) {
        setCompetitions(res.data.competitions);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load ranking competitions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmModal = (competition) => {
    setSelectedCompForModal(competition);
  };

  const confirmAndPay = async () => {
    if (!selectedCompForModal) return;
    const competition = selectedCompForModal;
    try {
      setApplyingId(competition.competition_id);
      const res = await api.post('/rankings/apply', { competition_id: competition.competition_id });
      if (res.data.success) {
        toast({
          title: 'Participation Confirmed! 🏆',
          description: `You paid $${competition.entry_fee} and are now entered into the community voting leaderboard!`
        });
        setSelectedCompForModal(null);
        fetchOpenCompetitions();
      }
    } catch (error) {
      toast({
        title: 'Application Failed',
        description: error.response?.data?.message || 'Could not process application',
        variant: 'destructive'
      });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-orange-950 text-white rounded-2xl p-6 md:p-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> B2B Homepage Showcase Program
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Brand Ranking Competitions & Community Voting
          </h1>
          <p className="text-gray-300 text-sm md:text-base mt-2 leading-relaxed">
            Participate in our curated brand ranking events! Pay the participation fee to enter the public leaderboard, earn community votes from thousands of shoppers, and win exclusive featured placement on the GoMo Deals public homepage.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-700">No Active Competitions</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            There are currently no open brand ranking competitions. Check back soon for upcoming homepage showcase events!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {competitions.map((comp) => {
            const myApp = comp.my_application;
            const isWinner = myApp && myApp.status === 'winner';
            const applicants = comp.applicants || [];

            // Find my rank on leaderboard
            const myRankIndex = myApp ? applicants.findIndex(a => a.seller_id === myApp.seller_id) : -1;
            const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

            return (
              <div
                key={comp.competition_id}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden hover:shadow-xl hover:border-orange-400/80 ${isWinner
                  ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-xl bg-gradient-to-br from-amber-50/20 via-white to-white hover:border-amber-500'
                  : myApp
                    ? 'border-orange-200 shadow-md hover:border-orange-400'
                    : 'border-gray-200/80 shadow-sm'
                  }`}
              >
                <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-6">
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${isWinner
                        ? 'bg-amber-500 text-white shadow-sm'
                        : comp.status === 'active_showcase'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                        {isWinner ? '🏆 YOU WON THE SHOWCASE!' : comp.status === 'active_showcase' ? 'Showcase Active' : 'Open For Entry'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={13} /> Launched: {new Date(comp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">{comp.title}</h2>

                    {comp.description && (
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl">
                        {comp.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 pt-2 text-xs md:text-sm font-semibold text-gray-600">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <DollarSign size={16} /> Participation Fee: ${comp.entry_fee} USD
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Users size={16} className="text-gray-500" /> Competing Brands: {applicants.length}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: CTA & Status */}
                  <div className="flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 pt-6 lg:pt-0 border-gray-100 min-w-[260px]">
                    {isWinner ? (
                      <div className="text-left lg:text-right bg-amber-50 p-4 rounded-xl border border-amber-200 w-full">
                        <div className="flex items-center lg:justify-end gap-2 text-amber-900 font-bold text-sm mb-1">
                          <Trophy className="text-amber-600" size={18} /> Homepage Showcase Live!
                        </div>
                        <p className="text-xs text-amber-700">
                          Congratulations! Your store and top products are currently being showcased to all shoppers on the homepage.
                        </p>
                      </div>
                    ) : myApp ? (
                      <div className="space-y-3 w-full lg:w-auto text-left lg:text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-800 border border-green-200 rounded-xl text-sm font-bold w-full lg:w-auto justify-center">
                          <CheckCircle2 size={18} className="text-green-600" /> Applied & Paid ($USD {comp.entry_fee})
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between lg:justify-end gap-4 text-xs">
                          <span className="text-gray-500">Leaderboard Rank:</span>
                          <span className="font-extrabold text-gray-900 bg-white px-2.5 py-1 rounded shadow-sm border border-gray-200">
                            #{myRank || '-'} of {applicants.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between lg:justify-end gap-2 text-xs text-orange-600 font-semibold">
                          <ThumbsUp size={14} /> Your Community Votes: {myApp.vote_count || 0}
                        </div>
                      </div>
                    ) : comp.status === 'open' ? (
                      <button
                        onClick={() => handleOpenConfirmModal(comp)}
                        disabled={applyingId === comp.competition_id}
                        className="w-full lg:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                      >
                        {applyingId === comp.competition_id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Trophy size={18} className="text-orange-200 group-hover:scale-110 transition-transform" />
                            Apply & Pay Fee (${comp.entry_fee})
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold">
                        Applications Closed
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaderboard Preview (Top 3) */}
                {applicants.length > 0 && (
                  <div className="bg-gray-50/70 border-t border-gray-100 p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                      <Star size={14} className="text-amber-500" /> Live Shopper Voting Leaderboard
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {applicants.slice(0, 4).map((app, idx) => {
                        const isMe = myApp && app.seller_id === myApp.seller_id;
                        return (
                          <div
                            key={app.application_id}
                            className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 text-xs hover:-translate-y-0.5 hover:shadow-md hover:border-orange-400 ${isMe
                              ? 'bg-orange-50 border-orange-300 font-bold text-orange-950 shadow-sm'
                              : 'bg-white border-gray-200/80 text-gray-700'
                              }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {idx + 1}
                              </span>
                              <span className="truncate">{app.store_name || app.full_name || 'Brand'}</span>
                              {isMe && <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-normal">You</span>}
                            </div>
                            <span className="flex items-center gap-1 font-extrabold bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                              <ThumbsUp size={11} className="text-orange-500" /> {app.vote_count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Participation & Fee Payment */}
      <AnimatePresence>
        {selectedCompForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 md:p-8 text-center relative"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5 text-orange-600 shadow-inner">
                <Trophy size={32} />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Confirm Brand Participation
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                You are applying to enter your brand into <strong className="text-gray-900">"{selectedCompForModal.title}"</strong>. This will activate your store on the public shopper voting leaderboard and compete for exclusive Homepage Showcase placement.
              </p>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Competition Event:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[180px]">{selectedCompForModal.title}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Participation Fee:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">${selectedCompForModal.entry_fee} USD</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-600 pt-2 border-t border-orange-200/60">
                  <span>Payment Status:</span>
                  <span className="text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Simulated Instant Pay</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCompForModal(null)}
                  disabled={Boolean(applyingId)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndPay}
                  disabled={Boolean(applyingId)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {applyingId ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Sparkles size={16} /> Confirm & Pay
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
