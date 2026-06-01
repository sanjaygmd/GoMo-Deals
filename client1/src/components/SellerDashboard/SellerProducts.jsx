import React, { useState, useContext, useEffect } from "react";
import { ProductContext } from "../../context/ProductContext/ProductContext";
import { useAuth } from "../../context/AuthContext";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import DeleteProduct from "./DeleteProduct";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  LayoutGrid,
  List,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel } from "../../utils/exportUtils";
import { useToast } from "../../hooks/use-toast";

const getColorHex = (color) => {
  const lowerColor = color?.toLowerCase() || '';
  if (lowerColor.includes('white') || lowerColor.includes('cream') || lowerColor.includes('ivory')) return '#FAFAF7';
  if (lowerColor.includes('black') || lowerColor.includes('obsidian') || lowerColor.includes('dark') || lowerColor.includes('slate') || lowerColor.includes('gray') || lowerColor.includes('grey') || lowerColor === 'black') return '#1A1A1A';
  if (lowerColor.includes('brown') || lowerColor.includes('tuscan') || lowerColor.includes('chestnut') || lowerColor.includes('clay') || lowerColor.includes('tan') || lowerColor.includes('beige') || lowerColor === 'brown') return '#7E5C45';
  if (lowerColor.includes('green') || lowerColor.includes('sage') || lowerColor.includes('emerald') || lowerColor.includes('mint') || lowerColor.includes('olive') || lowerColor === 'green') return '#4C6B5B';
  if (lowerColor.includes('blue') || lowerColor.includes('sapphire') || lowerColor.includes('indigo') || lowerColor.includes('navy') || lowerColor.includes('teal') || lowerColor === 'blue') return '#2E4A62';
  if (lowerColor.includes('multi') || lowerColor.includes('rainbow') || lowerColor.includes('gradient') || lowerColor === 'multi') return 'linear-gradient(135deg, #7E5C45, #4C6B5B, #2E4A62)';
  return '#E5E7EB'; // fallback
};

const SellerProducts = () => {
  const { products: sellerProducts, fetchProducts: fetchSellerProducts } = useContext(ProductContext);
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id;
  const { toast } = useToast();

  useEffect(() => {
    if (sellerId) {
      fetchSellerProducts(sellerId);
    }
  }, [sellerId, fetchSellerProducts]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priceSort, setPriceSort] = useState("none");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  let filteredProducts = sellerProducts.filter(p => {
    const pSellerId = String(p.seller_id || '').toLowerCase();
    const sId = String(sellerId || '').toLowerCase();
    return pSellerId === sId;
  });

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (statusFilter !== "All") {
    filteredProducts = filteredProducts.filter(p => p.status === statusFilter);
  }

  if (priceSort === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (priceSort === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const handleExport = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast({ title: "Export Failed", description: "No products available to export.", variant: "destructive" });
      return;
    }
    
    try {
      const dataToExport = filteredProducts.map(p => ({
        "Product ID": p.product_id || p.id || "N/A",
        "SKU": p.sku || "N/A",
        "Name": p.name || "N/A",
        "Brand": p.brand || "N/A",
        "Category": p.category || "N/A",
        "Base Price (₹)": p.price || 0,
        "Original MRP (₹)": p.mrp || 0,
        "Discount (%)": p.discount_percent || 0,
        "Stock Quantity": p.stock_quantity || 0,
        "Status": p.status || "Active",
        "Date Added": p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"
      }));
      
      exportToExcel(dataToExport, 'Seller_Products');
      toast({ title: "Export Successful", description: "Product inventory exported to Excel." });
    } catch (error) {
      console.error(error);
      toast({ title: "Export Failed", description: "An error occurred while generating the Excel file.", variant: "destructive" });
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-orange-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Package size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 font-black">Inventory Management</span>
          </div>
          <h1 className="text-4xl font-semibold text-orange-950 tracking-tight">
            Product <span className="font-bold text-orange-600">Collections</span>
          </h1>
          <p className="text-[11px] text-orange-500 uppercase tracking-[0.2em]">
            You have {filteredProducts.length} active listings across your boutique.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:text-orange-950 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY SKU OR NAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-6 py-3 bg-orange-50 border border-orange-100 text-[10px] uppercase tracking-widest outline-none focus:border-orange-950 focus:bg-white transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="px-8 py-3 bg-orange-950 text-white text-[10px] uppercase tracking-widest font-black hover:bg-orange-800 transition-all flex items-center gap-3 shadow-xl"
          >
            <Plus size={14} /> Add New Product
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3 bg-white text-orange-950 border border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
          >
            <Download size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-white border border-orange-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-[0.3em] text-orange-400 font-black">View mode</span>
            <div className="flex border border-orange-100 p-1">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all ${viewMode === 'list' ? 'bg-orange-950 text-white' : 'text-orange-500 hover:text-orange-950'}`}
              >
                <List size={14} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-orange-950 text-white' : 'text-orange-500 hover:text-orange-950'}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-orange-100 hidden md:block"></div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-orange-400 font-black">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border-b border-transparent hover:border-orange-300 transition-all pb-0.5"
              >
                <option value="All">All Items</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-orange-400 font-black">Sort:</span>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border-b border-transparent hover:border-orange-300 transition-all pb-0.5"
              >
                <option value="none">Position</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {(searchQuery || statusFilter !== "All" || priceSort !== "none") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
              setPriceSort("none");
            }}
            className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
          >
            Clear All Refinements
          </button>
        )}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-orange-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-orange-50 text-[9px] text-orange-600 uppercase tracking-[0.4em] font-black border-b border-orange-100">
                    <th className="px-10 py-6 font-black">Product Details</th>
                    <th className="px-10 py-6 font-black">Price Point</th>
                    <th className="px-10 py-6 font-black">Inventory</th>
                    <th className="px-10 py-6 font-black">Visibility</th>
                    <th className="px-10 py-6 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, idx) => (
                      <tr key={product.product_id} className="group hover:bg-orange-50/50 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-orange-100 overflow-hidden border border-orange-100 shrink-0">
                              <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <p className="text-[11px] font-black uppercase tracking-wider text-orange-950 truncate">
                                {product.name}
                              </p>
                              <div className="flex flex-wrap gap-2 items-center text-[7px] font-bold uppercase tracking-widest">
                                <span className="text-orange-500 font-extrabold">
                                  SKU: {product.product_id.toString().slice(-8).toUpperCase()}
                                </span>
                                {product.brand && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-orange-200"></span>
                                    <span className="text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 font-black">{product.brand}</span>
                                  </>
                                )}
                                {product.recipient && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-orange-200"></span>
                                    <span className="text-orange-600 bg-orange-50/50 border border-orange-100/50 px-1.5 py-0.5">{product.recipient}</span>
                                  </>
                                )}
                                {product.occasion && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-orange-200"></span>
                                    <span className="text-orange-950 bg-orange-50/70 border border-orange-100/50 px-1.5 py-0.5">{product.occasion}</span>
                                  </>
                                )}
                                {product.color && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-orange-200"></span>
                                    <span className="flex items-center gap-1 text-orange-850 bg-orange-50 border border-orange-100 px-1.5 py-0.5 font-black">
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full border border-orange-200" 
                                        style={{ background: getColorHex(product.color) }} 
                                      />
                                      {product.color}
                                    </span>
                                  </>
                                )}
                                {product.size && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-orange-200"></span>
                                    <span className="text-orange-600 bg-white border border-orange-100 px-1.5 py-0.5 font-black">{product.size}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-sm font-bold text-orange-950">₹{Number(product.discountPrice || product.price).toLocaleString()}</p>
                          {Number(product.price) > Number(product.discountPrice) && (
                            <p className="text-[9px] text-orange-500 line-through uppercase tracking-tighter mt-1 font-bold">₹{Number(product.price).toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-2">
                             <div className={`text-[10px] font-black uppercase tracking-widest ${product.stock_quantity < 10 ? 'text-rose-600' : 'text-orange-950'}`}>
                               {product.stock_quantity || 0} Stocks
                             </div>
                             <div className="w-24 h-px bg-orange-100 relative">
                                <div 
                                  className={`h-full absolute left-0 top-0 ${product.stock_quantity < 10 ? 'bg-rose-400' : 'bg-orange-950'}`} 
                                  style={{ width: `${Math.min(100, (product.stock_quantity / 50) * 100)}%` }}
                                />
                             </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`text-[8px] font-black uppercase tracking-[0.4em] px-3 py-1 border ${
                            product.is_active ? "text-orange-600 border-orange-200 bg-orange-50" : "text-orange-600 border-orange-200 bg-orange-100"
                          }`}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                         <td className="px-10 py-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => { setSelectedProduct(product); setShowEdit(true); }}
                              className="p-3 text-orange-600 hover:text-orange-950 hover:bg-orange-100 transition-all"
                            >
                              <Edit3 size={16} strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={() => { setSelectedProduct(product); setShowDelete(true); }}
                              className="p-3 text-orange-600 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                            <button className="p-3 text-orange-600 hover:text-orange-950 hover:bg-orange-100 transition-all">
                              <ExternalLink size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-10 py-32 text-center text-[10px] uppercase tracking-[0.6em] text-orange-400">
                        No collections found matching your refinement
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.product_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white border border-orange-100 hover:border-orange-950 transition-all duration-500 shadow-sm hover:shadow-2xl overflow-hidden"
              >
                <div className="aspect-square relative overflow-hidden bg-orange-100">
                  <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-orange-950/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
                    <button 
                      onClick={() => { setSelectedProduct(product); setShowEdit(true); }}
                      className="w-10 h-10 bg-white text-orange-900 flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => { setSelectedProduct(product); setShowDelete(true); }}
                      className="w-10 h-10 bg-white text-rose-500 flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`text-[7px] font-black uppercase tracking-[0.3em] px-2 py-1 ${
                      product.is_active ? "bg-orange-600 text-white" : "bg-orange-600 text-white"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                 <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    {product.brand && (
                      <p className="text-[7.5px] uppercase tracking-[0.2em] text-amber-600 font-black">{product.brand}</p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-950 truncate">{product.name}</p>
                  </div>
                  
                  {/* Visual Specifications summary */}
                  <div className="flex flex-wrap gap-2 text-[7px] uppercase tracking-wider font-extrabold text-orange-500 border-t border-orange-50 pt-2 pb-1">
                    {product.color && (
                      <span className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded border border-orange-100/50">
                        <span 
                          className="w-1.5 h-1.5 rounded-full border border-orange-200 shrink-0"
                          style={{ background: getColorHex(product.color) }} 
                        />
                        {product.color}
                      </span>
                    )}
                    {product.size && (
                      <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-100/50 font-black text-orange-950">{product.size}</span>
                    )}
                    {(product.recipient || product.occasion) && (
                      <span className="bg-orange-50/50 px-2 py-0.5 rounded border border-orange-50 font-medium">
                        {product.recipient || product.occasion}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-orange-50 pt-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-orange-950">₹{Number(product.discountPrice || product.price).toLocaleString()}</p>
                      {Number(product.price) > Number(product.discountPrice) && (
                        <p className="text-[8px] text-orange-400 line-through">₹{Number(product.price).toLocaleString()}</p>
                      )}
                    </div>
                    <p className="text-[8px] uppercase tracking-widest text-orange-600 font-bold">{product.stock_quantity || 0} stocks</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <AddProduct onClose={() => setShowAdd(false)} />}
        {showEdit && <EditProduct product={selectedProduct} onClose={() => setShowEdit(false)} />}
        {showDelete && <DeleteProduct product={selectedProduct} onClose={() => setShowDelete(false)} />}
      </AnimatePresence>

    </div>
  );
};

export default SellerProducts;