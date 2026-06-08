import React, { useState, useEffect } from 'react';
import { getSellerBundles, createBundle, deleteBundle, toggleBundleStatus } from '../../services/bundleService';
import { getSellerProducts } from '../../services/productService';
import { toast } from 'react-hot-toast';
import { Plus, Package, Trash2, Power, Search, Loader2, DollarSign } from 'lucide-react';

const SellerBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: 10,
    product_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bundlesRes, productsRes] = await Promise.all([
      getSellerBundles(),
      getSellerProducts()
    ]);
    
    if (bundlesRes.success) setBundles(bundlesRes.data);
    if (productsRes.success) setProducts(productsRes.data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.product_ids.length < 2) {
      toast.error('Please select at least 2 products for the bundle');
      return;
    }

    setSubmitting(true);
    const res = await createBundle(formData);
    setSubmitting(false);

    if (res.success) {
      toast.success('Bundle created successfully');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', discount_percentage: 10, product_ids: [] });
      fetchData();
    } else {
      toast.error(res.message || 'Failed to create bundle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;
    const res = await deleteBundle(id);
    if (res.success) {
      toast.success('Bundle deleted');
      setBundles(bundles.filter(b => b.bundle_id !== id));
    }
  };

  const handleToggle = async (id) => {
    const res = await toggleBundleStatus(id);
    if (res.success) {
      setBundles(bundles.map(b => b.bundle_id === id ? { ...b, is_active: res.is_active } : b));
      toast.success(res.is_active ? 'Bundle activated' : 'Bundle deactivated');
    }
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => {
      const isSelected = prev.product_ids.includes(productId);
      if (isSelected) {
        return { ...prev, product_ids: prev.product_ids.filter(id => id !== productId) };
      } else {
        return { ...prev, product_ids: [...prev.product_ids, productId] };
      }
    });
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-955" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif italic text-orange-955 mb-2">Combo Deals</h1>
          <p className="text-orange-955/60 text-sm uppercase tracking-wider font-bold">
            Create product bundles to increase average order value
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-955 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-orange-900 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Create Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bundles.length === 0 ? (
          <div className="bg-white border border-orange-200 py-16 flex flex-col items-center text-center">
            <Package size={32} className="text-orange-200 mb-4" />
            <h3 className="text-lg font-serif italic text-orange-955 mb-2">No Bundles Yet</h3>
            <p className="text-xs uppercase tracking-widest text-orange-955/50 font-bold mb-6">Group products together and offer a discount</p>
            <button onClick={() => setIsModalOpen(true)} className="text-xs text-orange-600 font-bold uppercase tracking-widest border-b border-orange-600 pb-1">Create Your First Bundle</button>
          </div>
        ) : (
          bundles.map(bundle => (
            <div key={bundle.bundle_id} className="bg-white border border-orange-200 p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-orange-955">{bundle.title}</h3>
                  <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-black ${bundle.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {bundle.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-orange-900 mb-4">{bundle.description}</p>
                <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-sm">
                  <DollarSign size={14} className="text-orange-600" />
                  <span className="text-xs font-bold text-orange-900">{bundle.discount_percentage}% OFF total value</span>
                </div>
              </div>
              
              <div className="flex-1 border-l border-orange-100 pl-6">
                <h4 className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-3">Included Products</h4>
                <div className="space-y-2">
                  {bundle.items && bundle.items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 bg-orange-50/50 p-2 border border-orange-100">
                      <img src={item.thumbnail || '/placeholder.png'} alt={item.name} className="w-8 h-8 object-cover rounded-sm" />
                      <span className="text-xs font-medium text-orange-955 line-clamp-1">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-l border-orange-100 pl-6 justify-center">
                <button
                  onClick={() => handleToggle(bundle.bundle_id)}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold border border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <Power size={14} className={bundle.is_active ? 'text-rose-500' : 'text-emerald-500'} />
                  {bundle.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(bundle.bundle_id)}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-orange-955/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-orange-200 rounded-none shadow-2xl p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-orange-900/50 hover:text-orange-900">
              <Plus size={24} className="rotate-45" />
            </button>
            
            <h2 className="text-2xl font-serif italic text-orange-955 mb-6">Create New Bundle</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-2">Bundle Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 outline-none"
                  placeholder="e.g. Summer Essentials Kit"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 outline-none h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-2">Discount Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={formData.discount_percentage}
                  onChange={e => setFormData({...formData, discount_percentage: parseInt(e.target.value)})}
                  className="w-full border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-orange-900 font-bold mb-2">Select Products (Min. 2)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-orange-100 bg-orange-50/30">
                  {products.map(p => (
                    <div 
                      key={p.product_id}
                      onClick={() => toggleProductSelection(p.product_id)}
                      className={`cursor-pointer flex items-center gap-3 p-2 border transition-colors ${formData.product_ids.includes(p.product_id) ? 'border-orange-600 bg-orange-100' : 'border-orange-200 bg-white hover:border-orange-400'}`}
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${formData.product_ids.includes(p.product_id) ? 'bg-orange-600 border-orange-600' : 'border-orange-300'}`}>
                        {formData.product_ids.includes(p.product_id) && <Plus size={12} className="text-white rotate-45" />}
                      </div>
                      <img src={p.images?.[0] || '/placeholder.png'} className="w-8 h-8 object-cover shrink-0" alt="" />
                      <span className="text-xs font-medium text-orange-955 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-orange-600 mt-2 font-bold">{formData.product_ids.length} products selected</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-orange-100">
                <button
                  type="submit"
                  disabled={submitting || formData.product_ids.length < 2}
                  className="bg-orange-955 text-white px-8 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-orange-900 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerBundles;
