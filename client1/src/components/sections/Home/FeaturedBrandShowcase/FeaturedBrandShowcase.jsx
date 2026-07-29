import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, ThumbsUp, Award, CheckCircle2, Store, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../context/ToastContext';
import { api } from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';

export default function FeaturedBrandShowcase() {
  const [showcase, setShowcase] = useState(null);
  const [openCompetitions, setOpenCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showRes, openRes] = await Promise.all([
        api.get('/rankings/showcase'),
        api.get('/rankings/open')
      ]);

      if (showRes.data.success) {
        setShowcase(showRes.data.showcase);
      }
      if (openRes.data.success) {
        setOpenCompetitions(openRes.data.competitions);
      }
    } catch (error) {
      console.error('Failed to load brand showcase data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (compId, sellerId, storeName) => {
    if (!user) {
      toast({ 
        title: 'Login Required', 
        description: 'Please sign in to your customer account to cast your vote and support brands!', 
        variant: 'destructive' 
      });
      return;
    }
    try {
      setVotingId(`${compId}-${sellerId}`);
      const res = await api.post('/rankings/vote', { competition_id: compId, seller_id: sellerId });
      if (res.data.success) {
        toast({ 
          title: 'Vote Recorded! 🎉', 
          description: `You voted for "${storeName}". Thank you for supporting community brands!` 
        });
        fetchData(); // Refresh vote leaderboard
      }
    } catch (error) {
      toast({ 
        title: 'Could Not Record Vote', 
        description: error.response?.data?.message || 'You may have already voted in this competition.', 
        variant: 'destructive' 
      });
    } finally {
      setVotingId(null);
    }
  };

  if (loading) return null;

  const hasShowcase = Boolean(showcase);
  const activeVotingComps = openCompetitions.filter(c => c.applicants && c.applicants.length > 0 && c.status === 'open');

  if (!hasShowcase && activeVotingComps.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 space-y-6 font-sans">
      {/* 1. WINNING BRAND SHOWCASE (Minimalist Spotlight Banner without Products Grid) */}
      {hasShowcase && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl bg-gradient-to-r from-gray-950 via-gray-900 to-amber-950/70 p-5 sm:p-6 text-white shadow-xl border border-amber-500/40 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>

          {/* Compact Showcase Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-lg flex-shrink-0">
                <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center overflow-hidden font-bold text-xl text-amber-400">
                  {showcase.store_logo ? (
                    <img src={showcase.store_logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (showcase.store_name || 'B').substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Trophy size={11} className="text-amber-400" /> Official Showcase Winner
                  </span>
                  <span className="text-xs text-gray-400 font-semibold hidden sm:inline">| {showcase.title}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 truncate">
                  {showcase.store_name}
                </h2>
                {showcase.store_description && (
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl truncate italic">
                    "{showcase.store_description}"
                  </p>
                )}
              </div>
            </div>

            {/* Right: Shopper Votes & Shop Store Link Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 px-3.5 py-2.5 bg-black/40 rounded-xl border border-amber-500/20 text-xs font-bold text-amber-400">
                <ThumbsUp size={14} />
                <span>{showcase.total_votes} {parseInt(showcase.total_votes) === 1 ? 'Shopper Vote' : 'Shopper Votes'}</span>
              </div>

              <button
                onClick={() => navigate(`/?search=${encodeURIComponent(showcase.store_name)}&category=all`)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer hover:scale-105 active:scale-95"
              >
                <Store size={15} />
                <span>Shop Store Products</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. COMMUNITY VOTING BOOTH (Minimalist Interactive Strip) */}
      {activeVotingComps.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-gray-800"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                <Star size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  Community Choice: Vote for Next Month's Feature
                </h3>
                <p className="text-xs text-gray-400">
                  Shoppers decide who wins exclusive homepage placement! 1 vote per customer.
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-300 flex items-center gap-1.5 self-start sm:self-auto">
              <Award className="text-orange-400" size={14} />
              Live Leaderboard
            </div>
          </div>

          <div className="space-y-6">
            {activeVotingComps.map(comp => (
              <div key={comp.competition_id} className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 px-1">
                  <span>Event: <strong className="text-gray-200">{comp.title}</strong></span>
                  <span className="text-orange-400 font-bold">{comp.applicants.length} Competing Brands</span>
                </div>

                {/* Minimalist Horizontal Brand Pills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {comp.applicants.map((app, idx) => {
                    const hasVotedForThis = comp.user_voted_seller_id === app.seller_id;
                    const hasVotedInComp = Boolean(comp.user_voted_seller_id);
                    const isVoting = votingId === `${comp.competition_id}-${app.seller_id}`;

                    return (
                      <div 
                        key={app.application_id}
                        className={`bg-white/5 hover:bg-white/10 rounded-xl p-3 border transition-all flex items-center justify-between gap-3 group ${
                          hasVotedForThis 
                            ? 'border-orange-500/80 bg-orange-500/10 shadow-sm' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Left: Rank, Logo, Name */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-5 h-5 rounded-md text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-gray-950' : idx === 1 ? 'bg-gray-300 text-gray-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'
                          }`}>
                            #{idx + 1}
                          </span>

                          <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-300">
                            {app.store_logo ? (
                              <img src={app.store_logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (app.store_name || 'B').substring(0, 2).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-white truncate leading-tight group-hover:text-orange-300 transition-colors">
                              {app.store_name || 'Brand Store'}
                            </h4>
                            <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                              {app.store_description ? `"${app.store_description}"` : 'Participating Brand'}
                            </span>
                          </div>
                        </div>

                        {/* Right: Vote Action Pill */}
                        <div className="flex-shrink-0">
                          {hasVotedForThis ? (
                            <span className="px-2.5 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-lg text-[11px] font-extrabold flex items-center gap-1 shadow-inner">
                              <CheckCircle2 size={13} /> Voted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVote(comp.competition_id, app.seller_id, app.store_name)}
                              disabled={hasVotedInComp || isVoting}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-sm ${
                                hasVotedInComp
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white hover:shadow-md hover:scale-105 active:scale-95'
                              }`}
                              title={hasVotedInComp ? 'You already voted in this event' : `Vote for ${app.store_name}`}
                            >
                              {isVoting ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <ThumbsUp size={12} />
                                  <span>{app.vote_count || 0}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
