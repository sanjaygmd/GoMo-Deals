import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { 
  Search, Plus, Package, Eye, Edit, Trash2, Home, Sofa, Bed, Lamp, Grid, 
  ListFilter, Zap, ShieldAlert, CheckCircle2, IndianRupee, Layers,
  TrendingUp, BarChart3, PackageCheck, LayoutGrid, Download, Gift, Heart, PartyPopper, CalendarDays,
  AlertTriangle, Power, ExternalLink, X
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ProductContext } from "../../../context/ProductContext/ProductContext";
import { useAdminSearch } from "../../admin/contexts/AdminSearchContext";
import { useState, useMemo, useEffect, useContext } from "react";
import { cn } from "../../../lib/utils";
import { api } from "../../../services/api";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from "framer-motion";
import { StatCard } from "../components/StatCard";

const CHART_COLORS = ['#f97316', '#ea580c', '#0c0a09', '#c2410c', '#fdba74', '#9a3412'];

const OccasionIcon = ({ occasion, className }) => {
  const o = occasion?.toLowerCase() || '';
  if (o.includes('birthday')) return <PartyPopper className={className} />;
  if (o.includes('anniversary')) return <Heart className={className} />;
  if (o.includes('wedding')) return <CalendarDays className={className} />;
  return <Gift className={className} />;
};

function ProductImage({ src, name, size = 64 }) {
  const [imgError, setImgError] = useState(false);
  const isRealImage = src && !imgError && (src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/"));

  return (
    <div className="shrink-0 rounded-2xl border border-orange-100 bg-orange-50 flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
      {isRealImage ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-orange-950 text-white font-bold text-lg rounded-2xl">
           {name ? name[0] : <Package className="w-6 h-6 text-orange-400" />}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { searchQuery: search, setSearchQuery: setSearch } = useAdminSearch();
  const { deleteProduct } = useContext(ProductContext) || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: "" });
  const [quickView, setQuickView] = useState({ show: false, product: null });

  const fetchAdminProducts = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/products');
      if (resp.data.success) {
        setProducts(Array.isArray(resp.data.data) ? resp.data.data : []);
      }
    } catch (err) {
      console.error('Fetch products failed:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const getStatus = (product) => {
    if (!product.is_active) return "Inactive";
    if (product.stock === 0) return "Out of Stock";
    if (product.stock < 10) return "Low Stock";
    return "Active";
  };

  const filtered = useMemo(() => {
    let res = products.filter(p => !p.isVariant);
    
    if (ownerFilter === "Platform") {
      res = res.filter(p => !p.seller_id);
    } else if (ownerFilter === "Sellers") {
      res = res.filter(p => p.seller_id);
    }
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        (p.room && p.room.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return res.map(p => ({ ...p, status: getStatus(p) }));
  }, [products, search, ownerFilter]);

  const dynamicStockData = useMemo(() => {
    const baseProducts = products.filter(p => !p.isVariant);
    const rooms = Array.from(new Set(baseProducts.map(p => p.room || "Other")));
    return rooms.map(room => {
      const roomProducts = baseProducts.filter(p => (p.room || "Other") === room);
      return {
        name: room,
        value: roomProducts.length,
        active: roomProducts.filter(p => p.stock > 0).length
      };
    }).sort((a, b) => b.value - a.value);
  }, [products]);

  const toggleStatus = async (product) => {
    const targetStatus = !product.is_active;
    setProducts(prev => prev.map(p => 
      p.product_id === product.product_id ? { ...p, is_active: targetStatus } : p
    ));

    try {
      const resp = await api.put(`/products/${product.product_id}`, {
        is_active: targetStatus
      });
      if (!resp.data.success) {
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id ? { ...p, is_active: !targetStatus } : p
        ));
      }
    } catch (err) {
      console.error('Toggle status failed:', err);
      setProducts(prev => prev.map(p => 
        p.product_id === product.product_id ? { ...p, is_active: !targetStatus } : p
      ));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const res = await deleteProduct(deleteModal.id);
    if (res.success) {
      setDeleteModal({ show: false, id: null, name: "" });
      fetchAdminProducts();
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) return;

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("GoMo BOUTIQUE CATALOG", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Inventory Size: ${filtered.length} Items`, 14, 36);
    doc.text(`Status: ${ownerFilter} Records`, 14, 42);

    const tableColumn = ["ID", "PRODUCT NAME", "SKU", "CATEGORY", "PRICE", "STOCK", "STATUS"];
    const tableRows = filtered.map(p => [
      p.product_id.split('-')[0].toUpperCase(),
      p.name,
      p.sku || 'N/A',
      p.room || 'General',
      `INR ${Number(p.price || 0).toLocaleString()}`,
      p.stock,
      p.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 4, font: "helvetica" },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 50 },
      didDrawPage: (data) => {
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });

    doc.save(`GoMo_Catalog_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border border-orange-100 rounded-full" />
        <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Loading Catalog...</p>
    </div>
  );

  return (
    <>
      <div className="space-y-12 pb-16 animate-in fade-in duration-700">
        
        {/* Elegant Light Welcome Header (Matches Dashboard and Seller Welcome exact layouts) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ShieldAlert size={14} className="text-orange-600" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Platform Inventory System</span>
            </div>
            <h1 className="text-4xl font-extrabold text-orange-955 tracking-tight">
              Product Catalog
            </h1>
            <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em] max-w-xl">
              Configure platform stocks, pricing, and catalog segments across all categories.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExport}
              className="px-8 py-3 bg-white text-orange-955 border border-orange-200 hover:bg-orange-50 text-[10px] uppercase tracking-widest font-black transition-all flex items-center gap-3 shadow-sm cursor-pointer active:scale-98"
            >
               <Download size={14} /> Export List
            </button>
            <button 
              onClick={() => navigate("/admin/products/add")} 
              className="px-8 py-3 bg-orange-955 text-white text-[10px] uppercase tracking-widest font-black hover:bg-orange-850 transition-all flex items-center gap-3 shadow-xl cursor-pointer active:scale-98"
            >
               <Plus size={14} /> New Creation
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Collection" 
            value={products.filter(p => !p.isVariant).length} 
            icon={Package} 
          />
          <StatCard 
            title="Active Categories" 
            value={dynamicStockData.length} 
            icon={Layers} 
          />
          <StatCard 
            title="Inventory Valuation" 
            value={`₹${Math.round(filtered.reduce((s, p) => s + (Number(p.price) || 0), 0) / 1000)}k`} 
            icon={IndianRupee} 
          />
        </div>

        {/* Main Product Table */}
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-orange-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-extrabold text-orange-955 tracking-tight">Catalog Inventory</h3>
              <p className="text-[9px] text-orange-500 font-bold mt-1 uppercase tracking-widest">Full inventory database access</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
               <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                  <input 
                    placeholder="Search products..." 
                    className="w-full h-11 pl-11 pr-4 border border-orange-200 focus:border-orange-500 bg-orange-50/30 text-orange-955 text-[10px] font-bold uppercase tracking-wider focus:outline-none placeholder:text-stone-400 transition-all rounded-xl focus:shadow-[0_0_15px_rgba(249,115,22,0.1)] focus:bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
               <div className="flex bg-orange-50/50 p-1 rounded-2xl gap-2 border border-orange-100 shadow-sm">
                  {['All', 'Platform', 'Sellers'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setOwnerFilter(f)}
                      className={cn(
                        "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                        ownerFilter === f 
                          ? "bg-orange-955 text-white shadow-md" 
                          : "text-orange-500 hover:bg-orange-50"
                      )}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Identity</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest">Segment</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Valuation</th>
                  <th className="px-6 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Inventory</th>
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-stone-850">
                {filtered.map((p) => (
                  <tr key={p.product_id} className="transition-all duration-200 hover:bg-orange-50/20 border-b border-orange-100 last:border-b-0 group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-6">
                        <ProductImage src={p.thumbnail} name={p.name} size={64} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-orange-955 group-hover:text-orange-600 transition-colors uppercase tracking-wide truncate">{p.name}</p>
                          <p className="text-[9px] font-bold text-stone-500 uppercase mt-1 tracking-wider">
                             SKU: <span className="text-stone-700">{p.sku || `ITEM-${p.product_id.split('-')[0].toUpperCase()}`}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2.5">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-[9px] font-black uppercase tracking-widest border border-orange-200 w-fit">
                            <OccasionIcon occasion={p.occasion} className="h-3 w-3" />
                            {p.occasion || 'Everyday'}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-bold text-orange-955">₹{Number(p.price || 0).toLocaleString('en-IN')}</p>
                      {p.mrp > p.price && <p className="text-[9px] text-stone-400 line-through font-bold mt-0.5">₹{p.mrp.toLocaleString('en-IN')}</p>}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                         <span className={cn("text-sm font-bold tracking-wider", p.stock < 10 ? 'text-rose-600 font-extrabold' : 'text-stone-850')}>
                            {p.stock} Units
                          </span>
                          <div className="w-24 h-1.5 bg-orange-50 rounded-full mt-2 overflow-hidden border border-orange-100">
                             <div className={cn("h-full rounded-full transition-all duration-500", p.stock < 10 ? 'bg-rose-500' : 'bg-orange-500')} 
                                  style={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }} />
                          </div>
                       </div>
                     </td>
                     <td className="px-8 py-5 text-center">
                        <span className={cn("inline-block px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border shadow-sm",
                          p.status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                          p.status === 'Low Stock' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                          p.status === 'Inactive' ? 'border-zinc-200 bg-zinc-50 text-zinc-500' :
                          'border-rose-250 bg-rose-50 text-rose-700'
                        )}>
                          {p.status}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => setQuickView({ show: true, product: p })}
                           className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95" 
                           title="Quick View"
                         >
                           <Eye size={16} />
                         </button>
                         <button 
                           onClick={() => navigate(`/admin/products/edit/${p.product_id}`)} 
                           className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-orange-955 hover:text-white border border-orange-150 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95" 
                           title="Edit Product"
                         >
                           <Edit size={16} />
                         </button>
                         <button 
                           onClick={() => setDeleteModal({ show: true, id: p.product_id, name: p.name })} 
                           className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 hover:bg-rose-600 hover:text-white border border-orange-150 hover:border-rose-300 text-orange-600 shadow-sm transition-all cursor-pointer active:scale-95" 
                           title="Delete Product"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

        {/* Category Distribution Visualization */}
        <div className="bg-white border border-orange-100 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-50 rounded-full -ml-48 -mt-48 group-hover:bg-orange-100 transition-colors"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-8">
            <div>
              <h3 className="text-xl font-extrabold text-orange-955 tracking-tight">Category Breakdown</h3>
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1">Product count per department</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-50 border border-orange-100">
                  <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Active Stock</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="h-[400px] w-full min-h-[400px] min-w-0 relative flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={dynamicStockData}
                    innerRadius={110}
                    outerRadius={150}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                    animationDuration={1500}
                  >
                    {dynamicStockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px', background: '#ffffff' }}
                    itemStyle={{ fontWeight: '800', color: '#0c0a09', fontSize: '13px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl font-extrabold text-orange-955 tracking-tighter leading-none">{products.filter(p => !p.isVariant).length}</span>
                 <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-2">Total SKU's</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {dynamicStockData.map((item, index) => (
                 <div key={item.name} className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 hover:border-orange-950 transition-all duration-500 group/item relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-20 h-20 blur-2xl -mr-10 -mt-10 opacity-5 group-hover/item:opacity-10 transition-opacity" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                     <span className="text-[12px] font-bold text-orange-955 uppercase tracking-wider truncate">{item.name}</span>
                   </div>
                   <div className="flex items-end justify-between relative z-10">
                     <div>
                       <p className="text-3xl font-extrabold text-orange-955 tracking-tight leading-none">{item.value}</p>
                       <p className="text-[9px] font-black text-stone-500 mt-1 uppercase tracking-widest">Total Items</p>
                     </div>
                     <div className="text-right">
                       <p className="text-base font-extrabold text-orange-600 leading-none">{item.active}</p>
                       <p className="text-[8px] font-black text-stone-500 mt-0.5 uppercase tracking-widest">In Stock</p>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-orange-955/40 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-[450px] shadow-2xl border border-orange-100 overflow-hidden">
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-orange-955 mb-2 uppercase">Delete Product?</h3>
                <p className="text-stone-500 mb-8 text-xs leading-relaxed font-bold">
                  Are you sure you want to remove <span className="text-orange-955 font-black">"{deleteModal.name}"</span>? This action is permanent and cannot be reversed.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setDeleteModal({ show: false, id: null, name: "" })}
                    className="h-12 rounded-xl bg-white border border-orange-200 text-orange-700 font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="h-12 rounded-xl bg-rose-650 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-550 transition-all cursor-pointer border border-rose-500/30"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickView.show && quickView.product && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-orange-955/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] shadow-2xl border border-orange-100 overflow-hidden relative flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setQuickView({ show: false, product: null })}
                className="absolute top-6 right-6 z-20 h-10 w-10 bg-orange-50 hover:bg-orange-105 border border-orange-205 rounded-full flex items-center justify-center text-orange-750 transition-all"
              >
                <X size={20} />
              </button>

              <div className="md:w-1/2 h-full bg-orange-50/50 relative overflow-hidden group border-r border-orange-100">
                <img 
                  src={quickView.product.thumbnail || quickView.product.images?.[0]} 
                  alt={quickView.product.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:w-1/2 p-12 flex flex-col h-full overflow-y-auto no-scrollbar bg-white">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200">
                      {quickView.product.room || 'Premium Collection'}
                    </span>
                    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", 
                      quickView.product.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-250" : "bg-rose-50 text-rose-700 border-rose-200")}>
                      {quickView.product.is_active ? 'Public' : 'Hidden'}
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold text-orange-955 tracking-tight mb-6 uppercase">
                    {quickView.product.name}
                  </h2>

                  <div className="flex items-end gap-3 mb-8 pb-8 border-b border-orange-100">
                    <span className="text-3xl font-extrabold text-orange-955">₹{Number(quickView.product.price).toLocaleString()}</span>
                    {quickView.product.mrp > quickView.product.price && (
                      <span className="text-lg text-stone-400 line-through mb-0.5 font-bold">₹{Number(quickView.product.mrp).toLocaleString()}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5">Inventory Stock</p>
                      <p className="text-xl font-bold text-orange-955">{quickView.product.stock} Units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5">Reference SKU</p>
                      <p className="text-xl font-bold text-orange-955">{quickView.product.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5">Product Weight</p>
                      <p className="text-xl font-bold text-orange-955">{quickView.product.weight || '0.5'} KG</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5">Primary Occasion</p>
                      <p className="text-xl font-bold text-orange-955">{quickView.product.occasion || 'Everyday'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Collection Description</p>
                    <p className="text-stone-700 leading-relaxed font-bold text-sm">
                      {quickView.product.description || 'No description available for this product.'}
                    </p>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                   <button 
                     onClick={() => navigate(`/admin/products/edit/${quickView.product.product_id}`)}
                     className="flex-1 h-12 bg-orange-955 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-850 transition-all shadow-md active:scale-95 cursor-pointer"
                   >
                     Edit Details
                   </button>
                   <button 
                     onClick={() => window.open(`/product/${quickView.product.product_id}`, "_blank")}
                     className="flex-1 h-12 bg-white text-orange-955 rounded-xl font-black text-[10px] uppercase tracking-widest border border-orange-200 hover:bg-orange-50 transition-all active:scale-95 cursor-pointer"
                   >
                     Live View
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
