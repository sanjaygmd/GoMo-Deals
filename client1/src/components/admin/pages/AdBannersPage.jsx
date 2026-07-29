import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Check, X, Image as ImageIcon, Link as LinkIcon, Calendar } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

const formatForInput = (isoString) => {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  return (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
};
const formatForDisplay = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function AdBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    brand_name: '',
    image_url: '',
    target_url: '',
    is_active: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ad-banners/admin');
      if (res.data.success) {
        setBanners(res.data.banners);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to fetch banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        brand_name: banner.brand_name,
        image_url: banner.image_url,
        target_url: banner.target_url || '',
        is_active: banner.is_active,
        start_date: banner.start_date ? formatForInput(banner.start_date) : '',
        end_date: banner.end_date ? formatForInput(banner.end_date) : ''
      });
    } else {
      setEditingBanner(null);
      setFormData({
        brand_name: '',
        image_url: '',
        target_url: '',
        is_active: true,
        start_date: '',
        end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.start_date) {
        payload.start_date = null;
      } else {
        payload.start_date = new Date(payload.start_date).toISOString();
      }
      
      if (!payload.end_date) {
        payload.end_date = null;
      } else {
        payload.end_date = new Date(payload.end_date).toISOString();
      }

      if (editingBanner) {
        await api.put(`/ad-banners/${editingBanner.banner_id}`, payload);
        toast({ title: 'Success', description: 'Banner updated successfully' });
      } else {
        await api.post('/ad-banners', payload);
        toast({ title: 'Success', description: 'Banner created successfully' });
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save banner', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/ad-banners/${id}`);
      toast({ title: 'Success', description: 'Banner deleted successfully' });
      fetchBanners();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
    }
  };

  const toggleActive = async (banner) => {
    try {
      await api.put(`/ad-banners/${banner.banner_id}`, { is_active: !banner.is_active });
      toast({ title: 'Success', description: 'Banner status updated' });
      fetchBanners();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="p-8 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ad Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage ad banners from partner brands.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} />
          New Banner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Preview</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Schedule</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Loading banners...</td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No ad banners found.</td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.banner_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6 w-48">
                      <div className="h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={banner.image_url} alt={banner.brand_name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{banner.brand_name}</div>
                      {banner.target_url && (
                        <a href={banner.target_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          <LinkIcon size={12} /> Link
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-600 flex flex-col gap-1">
                        {banner.start_date ? <span>Start: {formatForDisplay(banner.start_date)}</span> : <span className="text-gray-400">No start date</span>}
                        {banner.end_date ? <span>End: {formatForDisplay(banner.end_date)}</span> : <span className="text-gray-400">No end date</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleActive(banner)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          banner.is_active 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(banner)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.banner_id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    placeholder="e.g. Nike"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Image *</label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-orange-500 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50/30"
                    onClick={() => document.getElementById('banner-upload').click()}
                  >
                    <div className="space-y-2 text-center w-full">
                      {formData.image_url ? (
                         <div className="relative group w-full overflow-hidden rounded-lg">
                           <img src={formData.image_url} alt="Preview" className="mx-auto max-h-40 object-contain" />
                           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                             <span className="text-white text-sm font-semibold flex items-center gap-2"><ImageIcon size={18}/> Replace Image</span>
                           </div>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center justify-center py-4">
                           <div className="p-3 bg-white shadow-sm rounded-full mb-3">
                             <ImageIcon className="h-8 w-8 text-orange-500" />
                           </div>
                           <div className="flex text-sm text-gray-600 justify-center">
                             <span className="font-semibold text-orange-600 hover:text-orange-700">
                               Click to upload
                             </span>
                             <p className="pl-1">or drag and drop</p>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">High-res PNG, JPG, or WEBP up to 5MB</p>
                         </div>
                      )}
                    </div>
                  </div>
                  <input
                    id="banner-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                           toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
                           return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target Link URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    placeholder="https://example.com/promo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Banner is Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    {editingBanner ? 'Save Changes' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
