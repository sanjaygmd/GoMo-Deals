import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { 
  ArrowLeft, Upload, X, CheckCircle2, 
  AlertCircle, ShoppingBag, ImageIcon, IndianRupee,
  Layers, Ruler, Save, Settings
} from "lucide-react";
import { useProducts } from "../../../context/ProductContext/ProductContext";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { api } from "../../../services/api";

const inputClass = "w-full h-11 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:shadow-[0_0_15px_rgba(249,115,22,0.1)]";
const selectClass = "w-full h-11 px-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-black outline-none transition-all cursor-pointer";
const labelClass = "text-[9px] font-black text-stone-600 uppercase tracking-widest mb-1.5 block ml-1";

export default function AddProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { products, addProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    mrp: "",
    stock_quantity: "",
    weight: "",
    length: "",
    breadth: "",
    height: "",
    size: "",
    discount_percent: 0,
    brand: "",
    category_id: "",
    seller_id: "",
    recipient: "",
    occasion: "",
    color: "",
  });

  const [images, setImages] = useState([]); // Array of { url, variantTempId }
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({
    name: "Color",
    value: "",
    price: "",
    stock: "",
    sku: ""
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const [catRes, selRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/admin/sellers-data')
      ]);
      
      if (catRes.data.success) {
        setCategories(catRes.data.data.filter(c => !c.parent_category_id));
      }

      if (selRes.data.success) {
        setSellers(selRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const loadProductData = async () => {
      if (!isEditMode) return;
      setLoading(true);

      try {
        let existing = products.find(p => String(p.id) === String(id) || String(p.product_id) === String(id));
        
        const res = await api.get(`/products/${id}`);
        if (res.data.success && res.data.data) {
          existing = res.data.data;
        }

        if (existing) {
          setForm({
            name: existing.name || "",
            description: existing.description || "",
            sku: existing.sku || "",
            price: existing.price || "",
            mrp: existing.mrp || "",
            stock_quantity: existing.stock_quantity || existing.stock || "",
            weight: existing.weight || "",
            length: existing.length || "",
            breadth: existing.breadth || "",
            height: existing.height || "",
            brand: existing.brand || "",
            category_id: existing.category_id || "",
            seller_id: existing.seller_id || "",
            recipient: existing.recipient || "",
            occasion: existing.occasion || "",
            size: existing.size || "",
            discount_percent: existing.discount_percent || 0,
            color: existing.color || "",
          });

          let productImages = [];
          if (existing.pi_images) {
            productImages = existing.pi_images
              .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map(img => ({ url: img.image_url, variantTempId: img.variant_id }));
          } else if (existing.images) {
            productImages = existing.images.map(img => typeof img === 'string' ? { url: img, variantTempId: null } : img);
          }
          setImages(productImages);
          
          if (existing.variants) {
            setVariants(existing.variants.map(v => ({
              ...v,
              name: v.variant_name || v.name,
              value: v.variant_value || v.value,
              tempId: v.variant_id || v.id,
              stock: v.stock_quantity || v.stock
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load product data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [id, products, isEditMode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (e) => {
    setCurrentVariant({ ...currentVariant, [e.target.name]: e.target.value });
  };

  const addVariant = () => {
    if (!currentVariant.value) return;
    const tempId = 'v_' + Math.random().toString(36).substr(2, 9);
    
    const baseSku = form.sku || form.name.substring(0, 5).toUpperCase().replace(/\s+/g, '') || 'PROD';
    const entropy = Math.random().toString(36).substr(2, 6).toUpperCase();
    const variantSku = currentVariant.sku || `${baseSku}-${currentVariant.value.toUpperCase().replace(/\s+/g, '-')}-${entropy}`;
    setVariants([...variants, { ...currentVariant, sku: variantSku, tempId }]);
    setCurrentVariant({ ...currentVariant, value: "", sku: "" });
  };

  const removeVariant = (index) => {
    const v = variants[index];
    setVariants(variants.filter((_, i) => i !== index));
    setImages(images.map(img => img.variantTempId === v.tempId ? { ...img, variantTempId: null } : img));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImages(prev => [...prev, { url: dataUrl, variantTempId: null }]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const tagImageToVariant = (imageIndex, variantTempId) => {
    const newImages = [...images];
    newImages[imageIndex].variantTempId = variantTempId === "none" ? null : variantTempId;
    setImages(newImages);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (form.price && form.mrp) {
      const priceNum = Number(form.price);
      const mrpNum = Number(form.mrp);
      if (mrpNum > priceNum) {
        const pct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        form.discount_percent = pct;
      } else {
        form.discount_percent = 0;
      }
    }

    if (!form.name || !form.price || !form.category_id || !form.weight) {
      toast({ 
        variant: "destructive", 
        title: "Missing Information", 
        description: "Please fill in all required fields, including Product Weight for logistics." 
      });
      return;
    }

    if (images.length === 0) {
      toast({ variant: "destructive", title: "Images Required", description: "Please upload at least one product image." });
      return;
    }

    const variantSkus = new Set();
    for (const v of variants) {
      if (!v.sku) continue;
      if (variantSkus.has(v.sku)) {
        toast({ variant: "destructive", title: "Duplicate Variant SKU", description: `The SKU "${v.sku}" is used more than once among variants.` });
        setSubmitting(false);
        return;
      }
      variantSkus.add(v.sku);
    }

    const payload = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp || form.price),
      stock_quantity: Number(form.stock_quantity),
      weight: Number(form.weight) || 0,
      length: Number(form.length) || 0,
      breadth: Number(form.breadth) || 0,
      height: Number(form.height) || 0,
      size: form.size || "",
      discount_percent: form.discount_percent || 0,
      images: images,
      variants: variants,
      is_active: true
    };

    try {
      let res;
      if (isEditMode) {
        res = await updateProduct(id, payload);
        if (res && res.success) {
          toast({ title: "Product Updated", description: `${form.name} has been updated successfully.` });
          navigate("/admin/products");
        } else {
          toast({ variant: "destructive", title: "Update Failed", description: res?.error || "Failed to update product details." });
        }
      } else {
        res = await addProduct(payload);
        if (res && res.success) {
          setSuccessData({ name: form.name, category: categories.find(c => c.category_id === form.category_id)?.name, image: images[0].url });
          toast({ title: "Product Added", description: `${form.name} is now live.` });
        } else {
          toast({ variant: "destructive", title: "Registration Failed", description: res?.error || "This SKU might already exist in the database." });
        }
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "System Error", description: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-orange-955/40 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl border border-orange-100 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="relative h-44 bg-gradient-to-r from-orange-955 to-orange-850 flex items-center justify-center overflow-hidden">
             <div className="bg-white/10 border border-white/20 p-5 rounded-2xl shadow-lg relative z-10 text-white">
               <CheckCircle2 size={48} strokeWidth={2.5} />
             </div>
             <div className="absolute top-[-20%] left-[-20%] w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>
          </div>
          <div className="p-8 flex flex-col items-center text-center">
             <h2 className="text-2xl font-extrabold text-orange-955 mb-2 uppercase tracking-wide">Product Added!</h2>
             <p className="text-stone-500 mb-6 font-bold text-xs leading-relaxed">
               <span className="text-orange-955 font-extrabold">"{successData.name}"</span> has been added to the catalog.
             </p>
             <div className="w-24 h-24 rounded-2xl border border-orange-100 overflow-hidden mb-8 shadow-sm">
               <img src={successData.image} alt="Product" className="w-full h-full object-cover" />
             </div>
             <button onClick={() => navigate("/admin/products")} className="w-full h-12 rounded-xl bg-orange-955 hover:bg-orange-850 text-white font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-md">
               Back to Products
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border border-orange-100 rounded-full" />
        <div className="absolute inset-0 border border-orange-955 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Loading Product Information...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      
      {/* Executive Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-orange-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/products")} 
            className="h-10 w-10 flex items-center justify-center bg-white border border-orange-200 rounded-xl text-orange-700 hover:bg-orange-50 shadow-sm transition-all cursor-pointer active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-orange-955 tracking-tight uppercase leading-none">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-xs text-stone-500 font-bold mt-1.5 leading-none">
              {isEditMode ? "Update product details and stock availability." : "Fill in the details below to add a new product to your store."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => navigate("/admin/products")} className="h-11 px-6 rounded-xl bg-white border border-orange-200 text-orange-955 text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 cursor-pointer shadow-sm active:scale-95">
              Discard
           </button>
           <button 
             onClick={handleSubmit} 
             disabled={submitting} 
             className="h-11 px-8 rounded-xl bg-orange-955 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-850 cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
           >
             {submitting ? "Saving..." : <><Save size={14} /> {isEditMode ? "Save Changes" : "Save Product"}</>}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Configuration Columns */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Section 1: Basic Protocol */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100">
              <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                <ShoppingBag size={18} />
              </div>
              <h3 className="text-base font-extrabold text-orange-955 tracking-wide uppercase">Product Information</h3>
            </div>
            {form.discount_percent > 0 && (
              <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 mb-6 w-fit font-bold uppercase tracking-wider">
                <AlertCircle size={14} className="text-orange-500 animate-pulse" />
                <span>{form.discount_percent}% Discount Applied</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Name *</label>
                <input 
                  name="name" value={form.name} onChange={handleChange} 
                  placeholder="e.g. Minimalist Velvet Armchair" 
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>SKU Code</label>
                <input 
                  name="sku" value={form.sku} onChange={handleChange} 
                  placeholder="e.g. FUR-ARM-VLT-001" 
                  className={cn(inputClass, "font-mono")}
                />
              </div>
              <div>
                <label className={labelClass}>Default Color</label>
                <input 
                  name="color" value={form.color} onChange={handleChange} 
                  placeholder="e.g. Midnight Blue" 
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description *</label>
                <Textarea 
                  name="description" value={form.description} onChange={handleChange} 
                  placeholder="Enter a detailed description of your product..." 
                  className="w-full min-h-[140px] p-4 rounded-xl border border-orange-200 focus:border-orange-500 bg-orange-55/30 text-orange-955 text-xs font-bold leading-relaxed focus:bg-white transition-all shadow-inner focus:outline-none placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Matrix */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100">
                <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                  <IndianRupee size={18} />
                </div>
                <h3 className="text-base font-extrabold text-orange-955 tracking-wide uppercase">Pricing & Inventory</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Sale Price *</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>MRP (Original Price)</label>
                  <input name="mrp" type="number" value={form.mrp} onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total Stock *</label>
                  <input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} placeholder="0" className={inputClass} />
                </div>
             </div>
          </div>

          {/* Section 3: Variant Architecture */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100">
              <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                <Layers size={18} />
              </div>
              <h3 className="text-base font-extrabold text-orange-955 tracking-wide uppercase">Product Variants</h3>
            </div>
            
            <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="sm:col-span-1">
                  <label className={labelClass}>Parameter</label>
                  <select name="name" value={currentVariant.name} onChange={handleVariantChange} className={selectClass}>
                    <option value="Color">Color</option>
                    <option value="Material">Material</option>
                    <option value="Size">Size</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>Value</label>
                  <input name="value" value={currentVariant.value} onChange={handleVariantChange} placeholder="Red" className="w-full h-11 px-4 rounded-xl border border-orange-200 bg-white text-orange-955 text-xs font-bold" />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>Delta Price</label>
                  <input name="price" type="number" value={currentVariant.price} onChange={handleVariantChange} placeholder="+" className="w-full h-11 px-4 rounded-xl border border-orange-200 bg-white text-orange-955 text-xs font-bold" />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>Stock</label>
                  <input name="stock" type="number" value={currentVariant.stock} onChange={handleVariantChange} placeholder="0" className="w-full h-11 px-4 rounded-xl border border-orange-200 bg-white text-orange-955 text-xs font-bold" />
                </div>
                <div className="sm:col-span-1 flex items-end">
                   <button type="button" onClick={addVariant} className="w-full h-11 bg-orange-955 hover:bg-orange-850 text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer shadow-md active:scale-95">
                      Add Option
                   </button>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-5 border-t border-orange-100">
                  {variants.map((v, i) => (
                    <div key={i} className="bg-white border border-orange-150 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm animate-in zoom-in duration-200 group/v">
                      <div className="text-xs font-bold text-stone-750">
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider mr-1.5">{v.name}:</span>
                        {v.value}
                      </div>
                      {v.price && <span className="text-xs font-bold text-orange-955">₹{v.price}</span>}
                      <button type="button" onClick={() => removeVariant(i)} className="text-rose-500 hover:text-rose-700 transition-colors p-0.5 cursor-pointer border-none bg-none"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Visual Assets */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100">
                <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                  <ImageIcon size={18} />
                </div>
                <h3 className="text-base font-extrabold text-orange-955 tracking-wide uppercase">Product Images</h3>
             </div>
             
             <div className="border-2 border-dashed border-orange-200 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors bg-orange-50/20 group/upload">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="admin-images" />
                <label htmlFor="admin-images" className="cursor-pointer block group-hover/upload:scale-101 transition-transform">
                  <div className="w-16 h-16 bg-white border border-orange-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-orange-500 mb-4 transition-transform group-hover/upload:rotate-6">
                     <Upload size={24} />
                  </div>
                  <div className="text-base font-extrabold text-orange-955 mb-1.5 uppercase">Upload Product Images</div>
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Formats: JPEG, PNG. Drag or click here.</div>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
                   {images.map((img, i) => (
                      <div key={i} className="relative group/img flex flex-col items-center gap-2 animate-in zoom-in duration-200">
                        <div className="relative w-full aspect-square bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden p-2">
                           <img src={img.url} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                           <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-rose-500 text-white w-6 h-6 rounded-full text-xs shadow-md opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 flex items-center justify-center cursor-pointer">
                              <X size={12} strokeWidth={2.5} />
                           </button>
                        </div>

                        {variants.length > 0 && (
                          <select
                            value={img.variantTempId || "none"}
                            onChange={(e) => tagImageToVariant(i, e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-orange-200 bg-white text-orange-955 text-[8px] font-black uppercase tracking-wider outline-none cursor-pointer"
                          >
                            <option value="none">Main Image</option>
                            {variants.map((v) => (
                              <option key={v.tempId} value={v.tempId}>{v.name}: {v.value}</option>
                            ))}
                          </select>
                        )}
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-8">
           
           {/* Section 5: Categorization Matrix */}
           <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-2">
                 <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                    <Layers size={16} />
                 </div>
                 <h3 className="text-sm font-extrabold text-orange-955 uppercase tracking-wide">Category Settings</h3>
              </div>
              
              <div className="space-y-5">
                 <div>
                    <label className={labelClass}>Target Seller</label>
                    <select name="seller_id" value={form.seller_id} onChange={handleChange} className={selectClass}>
                       <option value="">Platform Owned (Admin)</option>
                       {sellers.map((sel) => (
                         <option key={sel.id} value={sel.id}>{sel.name}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Category *</label>
                    <select name="category_id" value={form.category_id} onChange={handleChange} className={selectClass}>
                       <option value="">Select Category</option>
                       {categories.map((cat) => (
                         <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Target Recipient</label>
                    <select name="recipient" value={form.recipient} onChange={handleChange} className={selectClass}>
                       <option value="Common">Common</option>
                       <option value="Him">Him</option>
                       <option value="Her">Her</option>
                       <option value="Kids">Kids</option>
                       <option value="Couples">Couples</option>
                       <option value="Grandparents">Grandparents</option>
                       <option value="Friends">Friends</option>
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Primary Occasion</label>
                    <select name="occasion" value={form.occasion} onChange={handleChange} className={selectClass}>
                       <option value="Common">Common</option>
                       <option value="Birthday">Birthday</option>
                       <option value="Anniversary">Anniversary</option>
                       <option value="Wedding">Wedding</option>
                       <option value="Housewarming">Housewarming</option>
                       <option value="Festival">Festival</option>
                       <option value="Corporate">Corporate</option>
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Brand</label>
                    <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand Name" className={inputClass} />
                 </div>
              </div>
           </div>

           {/* Section 6: Physical Topology */}
           <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-2">
                 <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-rose-500">
                    <Ruler size={16} />
                 </div>
                 <h3 className="text-sm font-extrabold text-orange-955 uppercase tracking-wide">Dimensions & Weight</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className={labelClass}>Weight (KG)</label>
                    <input name="weight" type="number" step="0.01" value={form.weight} onChange={handleChange} placeholder="0.00" className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Length (CM)</label>
                    <input name="length" type="number" value={form.length} onChange={handleChange} placeholder="0" className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Breadth (CM)</label>
                    <input name="breadth" type="number" value={form.breadth} onChange={handleChange} placeholder="0" className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Height (CM)</label>
                    <input name="height" type="number" value={form.height} onChange={handleChange} placeholder="0" className={inputClass} />
                 </div>
                 <div className="col-span-2">
                    <label className={labelClass}>Size (e.g., S, M, L, Custom)</label>
                    <input name="size" type="text" value={form.size} onChange={handleChange} placeholder="" className={inputClass} />
                  </div>
              </div>
           </div>

           {/* Deployment Summary */}
           <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-500">
                    <Settings size={16} />
                 </div>
                 <h4 className="text-sm font-extrabold text-orange-955 uppercase tracking-wide">Configuration State</h4>
              </div>
              <p className="text-stone-500 text-xs font-bold leading-relaxed mb-6 italic">
                 Verify that all product catalog specifications (weight, variants, SKU, price boundaries) are verified before submission.
              </p>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 bg-orange-955 hover:bg-orange-850 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                {submitting ? "Saving Product..." : <><Save size={14} /> Commit Changes</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
