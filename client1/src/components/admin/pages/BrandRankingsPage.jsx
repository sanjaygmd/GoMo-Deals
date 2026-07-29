import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Users, Award, Calendar, DollarSign, CheckCircle2, ChevronDown, ChevronUp, Star, ThumbsUp, ArrowUpDown, Edit, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

export default function BrandRankingsPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [expandedCompId, setExpandedCompId] = useState(null);
  const [selectedWinnerModal, setSelectedWinnerModal] = useState(null);
  const [selectedDeleteModal, setSelectedDeleteModal] = useState(null);
  const [declaringWinner, setDeclaringWinner] = useState(false);
  const [deletingComp, setDeletingComp] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_fee: '49.99',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rankings/admin');
      if (res.data.success) {
        setCompetitions(res.data.competitions);
        if (res.data.competitions.length > 0 && !expandedCompId) {
          setExpandedCompId(res.data.competitions[0].competition_id);
        }
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load ranking competitions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditingComp(null);
    setFormData({
      title: '',
      description: '',
      entry_fee: '49.99',
      start_date: '',
      end_date: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp, e) => {
    e.stopPropagation();
    setEditingComp(comp);
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => n < 10 ? '0' + n : n;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setFormData({
      title: comp.title || '',
      description: comp.description || '',
      entry_fee: comp.entry_fee ? String(comp.entry_fee) : '49.99',
      start_date: formatDateForInput(comp.start_date),
      end_date: formatDateForInput(comp.end_date)
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (comp, e) => {
    e.stopPropagation();
    setSelectedDeleteModal({ compId: comp.competition_id, title: comp.title });
  };

  const confirmDeleteCompetition = async () => {
    if (!selectedDeleteModal) return;
    try {
      const res = await api.delete(`/rankings/admin/${selectedDeleteModal.compId}`);
      toast({ 
        title: 'Competition Deleted', 
        description: res.data?.message || `"${selectedDeleteModal.title}" has been permanently removed.` 
      });
      setSelectedDeleteModal(null);
      fetchCompetitions();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete competition', variant: 'destructive' });
    } finally {
      setDeletingComp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (editingComp) {
        await api.put(`/rankings/admin/${editingComp.competition_id}`, payload);
        toast({ title: 'Success', description: 'Ranking competition updated successfully' });
      } else {
        await api.post('/rankings/admin', payload);
        toast({ title: 'Success', description: 'Ranking competition created successfully' });
      }
      setIsModalOpen(false);
      setEditingComp(null);
      fetchCompetitions();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save competition', variant: 'destructive' });
    }
  };

  const handleOpenDeclareModal = (compId, sellerId, storeName) => {
    setSelectedWinnerModal({ compId, sellerId, storeName });
  };

  const confirmDeclareWinner = async () => {
    if (!selectedWinnerModal) return;
    const { compId, sellerId, storeName } = selectedWinnerModal;
    try {
      setDeclaringWinner(true);
      await api.post('/rankings/admin/winner', {
        competition_id: compId,
        winner_seller_id: sellerId
      });
      toast({ title: 'Winner Declared! 🏆', description: `${storeName} is now live on the homepage showcase!` });
      setSelectedWinnerModal(null);
      fetchCompetitions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to declare winner', variant: 'destructive' });
    } finally {
      setDeclaringWinner(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCompId(expandedCompId === id ? null : id);
  };

  const sortedCompetitions = [...competitions].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'most_applicants') return (b.applicants?.length || 0) - (a.applicants?.length || 0);
    if (sortBy === 'most_votes') {
      const votesA = a.applicants?.reduce((sum, app) => sum + parseInt(app.vote_count || 0), 0) || 0;
      const votesB = b.applicants?.reduce((sum, app) => sum + parseInt(app.vote_count || 0), 0) || 0;
      return votesB - votesA;
    }
    if (sortBy === 'highest_fee') return parseFloat(b.entry_fee || 0) - parseFloat(a.entry_fee || 0);
    return 0;
  });

  return (
    <div className="p-8 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Trophy className="text-orange-600" size={32} />
            Brand Rankings & Homepage Showcases
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create ranking competitions, invite brands to participate, view community vote counts, and declare winners for the homepage showcase.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          New Competition
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-700">No Ranking Competitions Yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">Start by creating a brand ranking competition to monetize homepage placement.</p>
          <button
            onClick={handleOpenModal}
            className="px-6 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow"
          >
            Create Your First Competition
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200/80 mb-6">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Trophy size={16} className="text-orange-500" />
              Showing <span className="font-extrabold text-gray-900">{competitions.length}</span> Competitions
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={13} /> Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_applicants">Most Participating Brands</option>
                <option value="most_votes">Highest Community Votes</option>
                <option value="highest_fee">Highest Entry Fee ($USD)</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {sortedCompetitions.map((comp) => {
              const isExpanded = expandedCompId === comp.competition_id;
              const applicantsCount = comp.applicants ? comp.applicants.length : 0;
              const hasWinner = Boolean(comp.winner_seller_id);

              return (
                <div key={comp.competition_id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/80 hover:border-orange-500/40 transition-all duration-300 overflow-hidden group/card">
                  {/* Header Row with Enhanced Hover & Responsive Actions */}
                  <div 
                    onClick={() => toggleExpand(comp.competition_id)}
                    className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer bg-gradient-to-r from-white via-white to-gray-50/30 hover:from-orange-50/20 hover:to-orange-50/40 transition-all duration-300 border-b border-gray-100"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`p-3.5 rounded-2xl transition-transform duration-300 group-hover/card:scale-105 flex-shrink-0 ${hasWinner ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-orange-100 text-orange-600 shadow-sm'}`}>
                        <Award size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-extrabold text-gray-900 group-hover/card:text-orange-600 transition-colors truncate">{comp.title}</h2>
                          <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full ${
                            hasWinner ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {hasWinner ? 'Winner Declared (Live)' : 'Open for Voting'}
                          </span>
                        </div>
                        {comp.description && (
                          <p className="text-sm text-gray-500 mt-1 max-w-2xl line-clamp-2">{comp.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-6 mt-3 text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-2xs">
                            <DollarSign size={14} /> Fee: ${comp.entry_fee}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                            <Users size={14} className="text-orange-500" /> Participating Brands: {applicantsCount}
                          </span>
                          {comp.start_date && (
                            <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
                              <Calendar size={14} className="text-gray-400" /> Starts: {new Date(comp.start_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Winner Badge, Edit, Delete, Chevron */}
                    <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {hasWinner && (
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                          <Trophy className="text-amber-600" size={15} />
                          <span className="text-xs font-extrabold text-amber-900 truncate max-w-[150px]">Winner: {comp.winner_store_name || 'Brand Selected'}</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => handleOpenEditModal(comp, e)}
                        className="p-2 text-gray-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-1.5 text-xs font-bold px-3 cursor-pointer hover:scale-105 active:scale-95"
                        title="Edit Competition Details"
                      >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenDeleteModal(comp, e)}
                        className="p-2 text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-1.5 text-xs font-bold px-3 cursor-pointer hover:scale-105 active:scale-95"
                        title="Delete Competition"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>

                      <button 
                        onClick={() => toggleExpand(comp.competition_id)}
                        className="p-2.5 bg-gray-100 group-hover/card:bg-orange-100 text-gray-600 group-hover/card:text-orange-600 rounded-xl transition-all duration-200 ml-1 cursor-pointer"
                        title={isExpanded ? 'Collapse List' : 'Expand List'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Applicants List with Dynamic Hover Effects */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50/60 p-6 border-t border-gray-100"
                      >
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                          <Users size={14} className="text-orange-500" /> Participating Sellers & Leaderboard ({applicantsCount})
                        </h3>

                        {applicantsCount === 0 ? (
                          <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-gray-300 text-sm text-gray-500">
                            <Sparkles className="mx-auto text-amber-400 mb-2" size={24} />
                            No sellers have applied for this ranking competition yet. Once brands apply and pay the participation fee, they will appear here for community voting!
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {comp.applicants.map((app, idx) => {
                              const isThisWinner = app.seller_id === comp.winner_seller_id;
                              return (
                                <div 
                                  key={app.application_id} 
                                  className={`bg-white p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                    isThisWinner 
                                      ? 'border-amber-400/90 ring-2 ring-amber-400/20 shadow-md bg-gradient-to-br from-amber-50/50 via-white to-white hover:border-amber-500' 
                                      : 'border-gray-200/80 hover:border-orange-500/50 shadow-sm hover:bg-gradient-to-br hover:from-orange-50/20 hover:to-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 font-bold text-gray-500 flex-shrink-0 shadow-2xs">
                                        {app.store_logo ? (
                                          <img src={app.store_logo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          (app.store_name || 'B').substring(0, 2).toUpperCase()
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-extrabold text-gray-900 text-base truncate">{app.store_name || app.full_name || 'Unnamed Seller'}</h4>
                                          <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-md font-extrabold flex-shrink-0">#{idx + 1}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{app.email}</p>
                                      </div>
                                    </div>

                                    {isThisWinner && (
                                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1.5 rounded-full shadow-sm flex-shrink-0 animate-pulse" title="Current Live Winner">
                                        <Trophy size={14} />
                                      </span>
                                    )}
                                  </div>

                                  {app.store_description && (
                                    <p className="text-xs text-gray-600 mt-3 line-clamp-2 italic">"{app.store_description}"</p>
                                  )}

                                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200/60 shadow-2xs">
                                        <ThumbsUp size={12} /> {app.vote_count} {parseInt(app.vote_count) === 1 ? 'Vote' : 'Votes'}
                                      </span>
                                      <span className="text-[10px] bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                                        Fee Paid
                                      </span>
                                    </div>

                                    {!isThisWinner && (
                                      <button
                                        onClick={() => handleOpenDeclareModal(comp.competition_id, app.seller_id, app.store_name || app.full_name)}
                                        className="px-3 py-1.5 bg-gray-900 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                                      >
                                        <Trophy size={12} /> Declare Winner
                                      </button>
                                    )}
                                    {isThisWinner && (
                                      <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                                        <CheckCircle2 size={14} /> Showcased Live
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Competition */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2.5">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                    {editingComp ? <Edit size={18} /> : <Trophy size={18} />}
                  </div>
                  {editingComp ? 'Edit Brand Ranking Competition' : 'Create Brand Ranking Competition'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setEditingComp(null); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Competition Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Featured Brand of the Month - August"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Description / Rules
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain the perks of winning and how community voting works..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Participation Fee ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-emerald-600 shadow-2xs"
                  />
                  <p className="text-xs text-gray-400 mt-1">Sellers must pay this amount to apply and enter the community voting leaderboard.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-800 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-800 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingComp(null); }}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {editingComp ? <Edit size={16} /> : <Trophy size={16} />} 
                    <span>{editingComp ? 'Save Changes' : 'Launch Competition'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Declaring Winner */}
      <AnimatePresence>
        {selectedWinnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 md:p-8 text-center relative"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-600 shadow-inner">
                <Trophy size={32} />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Declare Homepage Showcase Winner
              </h3>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Are you ready to crown <strong className="text-gray-900">"{selectedWinnerModal.storeName}"</strong> as the winner? This will immediately publish their store and top products to the live public Homepage Showcase.
              </p>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Selected Brand:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[180px]">{selectedWinnerModal.storeName}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>New Status:</span>
                  <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Live Showcase Winner</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedWinnerModal(null)}
                  disabled={declaringWinner}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeclareWinner}
                  disabled={declaringWinner}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {declaringWinner ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trophy size={16} /> Declare Live
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Deleting Competition */}
      <AnimatePresence>
        {selectedDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 md:p-8 text-center relative"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-red-600 shadow-inner">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Delete Competition?
              </h3>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Are you sure you want to permanently delete <strong className="text-gray-900">"{selectedDeleteModal.title}"</strong>? All brand applications and community votes associated with this event will be permanently removed.
              </p>
              
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-left mb-6 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
                <span className="text-amber-600 font-extrabold text-base leading-none mt-0.5">💰</span>
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900">Automatic Refund Guarantee</p>
                  <p className="text-[11px] text-amber-800/90 leading-normal">
                    Any participating sellers who paid the entry fee will be automatically refunded to their Payout &amp; Transaction account and notified via alert immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDeleteModal(null)}
                  disabled={deletingComp}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCompetition}
                  disabled={deletingComp}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {deletingComp ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete Forever
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
