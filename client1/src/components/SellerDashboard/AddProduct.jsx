import React, { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProductContext } from "../../context/ProductContext/ProductContext";
import { useAuth } from "../../context/AuthContext";
import * as productService from "../../services/productService";
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Gift,
  Target,
  Palette,
  Link
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AddProduct = ({ onClose }) => {
  const { addProduct, fetchProducts: fetchSellerProducts } = useContext(ProductContext);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizeValue, setCustomSizeValue] = useState("");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [apparelType, setApparelType] = useState("");
  const [isFleaMarketOverride, setIsFleaMarketOverride] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    stock_quantity: "",
    brand: "",
    category_id: "",
    subcategory_id: "",
    recipient: "",
    occasion: "",
    sku: "",
    images: [], // { url, isPrimary, variantTempId }
    variants: [], // { tempId, name: "Color", value, price, stock, weight, sku }
    weight: "",
    length: "",
    breadth: "",
    height: "",
    discount_percent: 0,
    color: "",
    size: ""
  });

  const boutiqueBrands = ["AcousticLab", "Aurelia", "Vanguard", "Maison", "Zen Garden"];
  const selectedCategory = categories.find(c => c.category_id === form.category_id);
  const isClothing = selectedCategory?.name?.toLowerCase() === "fashion";
  const isMarketProduct = isFleaMarketOverride ||
                          selectedCategory?.name?.toLowerCase().includes("groceries") || 
                          selectedCategory?.name?.toLowerCase().includes("daily essentials") ||
                          selectedCategory?.name?.toLowerCase().includes("flea market") ||
                          form.category_id === "3430fc10-b636-42f1-8be6-0e47179e6425";
  
  const recipientsList = [
    { value: "him", label: "Him (Men)" },
    { value: "her", label: "Her (Women)" },
    { value: "kids", label: "Kids & Toys" },
    { value: "couples", label: "Couples & Weddings" },
    { value: "friends", label: "Friends & Coworkers" },
    { value: "self", label: "Self-Care & Personal" },
    { value: "common", label: "Everyday / Common" }
  ];

  const occasionsList = [
    { value: "birthday", label: "Birthday" },
    { value: "anniversary", label: "Anniversary" },
    { value: "wedding", label: "Wedding & Celebrations" },
    { value: "housewarming", label: "Housewarming & Decor" },
    { value: "graduation", label: "Graduation & Milestone" },
    { value: "festival", label: "Festive & Holidays" },
    { value: "corporate", label: "Corporate & Milestones" },
    { value: "common", label: "Everyday Elegance" }
  ];

  const colorFamilies = [
    { id: "black", name: "Obsidian Black", hex: "#1A1A1A" },
    { id: "white", name: "Ivory White", hex: "#F5F5F0", border: "border border-orange-200" },
    { id: "brown", name: "Tuscan Brown", hex: "#7E5C45" },
    { id: "green", name: "Sage Green", hex: "#4C6B5B" },
    { id: "blue", name: "Sapphire Blue", hex: "#2E4A62" },
    { id: "multi", name: "Boutique Multi", hex: "linear-gradient(135deg, #7E5C45, #4C6B5B, #2E4A62)" },
    { id: "custom", name: "Custom Color", hex: "conic-gradient(from 0deg, red, yellow, green, blue, purple, red)" }
  ];

  const sizeBrackets = [
    { id: "standard", name: "Standard / One-Size", desc: "One-size fits all" },
    { id: "small", name: "Small (S)", desc: "Compact sizing" },
    { id: "medium", name: "Medium (M)", desc: "Mid-format sizing" },
    { id: "large", name: "Large (L)", desc: "Oversized / Luxury" },
    { id: "custom", name: "Custom Size", desc: "Custom specific sizing" }
  ];

  const marketSizeBrackets = [
    { id: "1kg", name: "1 KG Pack", desc: "1 KG standard pack" },
    { id: "2kg", name: "2 KG Pack", desc: "2 KG standard pack" },
    { id: "5kg", name: "5 KG Bag", desc: "5 KG large bag" },
    { id: "10kg", name: "10 KG Bag", desc: "10 KG bulk bag" },
    { id: "custom", name: "Custom Weight", desc: "Custom pack weight" }
  ];

  useEffect(() => {
    const fetchCats = async () => {
      const res = await productService.getCategories();
      if (res.success) setCategories(res.data);
    };
    fetchCats();
  }, []);

  // Fetch subcategories whenever category changes
  useEffect(() => {
    const fetchSubs = async () => {
      if (!form.category_id) {
        setSubcategories([]);
        return;
      }
      const res = await productService.getSubcategories(form.category_id);
      if (res.success) setSubcategories(res.data);
    };
    fetchSubs();
  }, [form.category_id]);
  useEffect(() => {
    setIsStepTransitioning(true);
    const timer = setTimeout(() => {
      setIsStepTransitioning(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Dynamic Discount calculation
  useEffect(() => {
    const priceNum = parseFloat(form.price);
    const mrpNum = parseFloat(form.mrp);
    if (priceNum && mrpNum && mrpNum > priceNum) {
      const pct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      setForm(prev => {
        if (prev.discount_percent !== pct) {
          return { ...prev, discount_percent: pct };
        }
        return prev;
      });
    } else {
      setForm(prev => {
        if (prev.discount_percent !== 0) {
          return { ...prev, discount_percent: 0 };
        }
        return prev;
      });
    }
  }, [form.price, form.mrp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          images: [...prev.images, { 
            url: reader.result, 
            isPrimary: prev.images.length === 0,
            variantTempId: null // Default to main product
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setImageVariant = (index, variantTempId) => {
    const newImages = [...form.images];
    newImages[index].variantTempId = variantTempId === "main" ? null : variantTempId;
    setForm({ ...form, images: newImages });
  };

  const addColorVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { 
        tempId: 'v_' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: "Color", 
        value: "", 
        price: prev.price || "", 
        stock: prev.stock_quantity || "", 
        weight: prev.weight || "", 
        sku: "" 
      }]
    }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants];
    newVariants[index][field] = value;
    setForm({ ...form, variants: newVariants });
  };

  const removeVariant = (index) => {
    setForm(prev => {
        const variantToRemove = prev.variants[index];
        // Clean up image associations for this variant
        const newImages = prev.images.map(img => 
            img.variantTempId === variantToRemove.tempId ? { ...img, variantTempId: null } : img
        );
        return {
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
            images: newImages
        };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isStepTransitioning) return;
    
    // Prevent premature submission - if user hits Enter on steps 1-3, just move to next step
    if (currentStep < 4) {
      setValidationError("");
      setIsStepTransitioning(true);
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Comprehensive Validation for Final Step
    const isFleaMarketProductSelected = isFleaMarketOverride || selectedCategory?.name?.toLowerCase().includes("flea market");
    if (isFleaMarketProductSelected && user?.seller_subscription !== 'pro' && user?.seller_subscription !== 'enterprise') {
      setValidationError("Pro or Enterprise subscription is required to list products on the B2B Flea Market Exchange. Please upgrade your subscription first.");
      setCurrentStep(2); // Redirect to Details step
      return;
    }

    if (!form.name || !form.price || !form.category_id) {
      setValidationError("Basic information (Title, Category, Price) is required.");
      setCurrentStep(1); // Take them back to fix it
      return;
    }

    if (isClothing && !apparelType) {
      setValidationError("Apparel Type is required for clothing products.");
      setCurrentStep(2);
      return;
    }

    if (form.images.length === 0) {
      setValidationError("Please upload at least one image of your product.");
      setCurrentStep(3);
      return;
    }

    if (!form.weight || parseFloat(form.weight) <= 0) {
      setValidationError("Logistics Error: Gross weight is required for shipping calculations.");
      setCurrentStep(4);
      return;
    }

    setValidationError("");
    setLoading(true);
    try {
      const submissionForm = { ...form };
      if (form.subcategory_id) {
        submissionForm.category_id = form.subcategory_id;
      }
      
      if (isClothing) {
        const tagsMap = {
          mens: "[Tags: men, wear, clothing]",
          womens: "[Tags: women, wear, clothing]",
          footwear: "[Tags: footwear, shoes, sneakers]",
          accessories: "[Tags: accessories, fashion]",
          other: "[Tags: fashion]"
        };
        const tagsToAppend = tagsMap[apparelType] || "[Tags: fashion]";
        submissionForm.description = `${form.description || ""}\n\n${tagsToAppend}`;
      } else if (!isMarketProduct) {
        // Clear size for non-clothing categories except daily essentials
        submissionForm.size = "";
      }

      if (isFleaMarketOverride) {
        submissionForm.description = `${submissionForm.description || ""}\n\n[Tags: flea market, commodity, bulk]`;
      }

      if (!hasVariants) {
        submissionForm.variants = [];
        // Reset image associations
        submissionForm.images = submissionForm.images.map(img => ({ ...img, variantTempId: null }));
      } else {
        const invalid = submissionForm.variants.some(v => !v.value);
        if (invalid) {
          setValidationError("Please provide color names for all variations");
          setLoading(false);
          return;
        }
      }

      const res = await addProduct(submissionForm);
      if (res.success) {
        await fetchSellerProducts();
        onClose();
      } else {
        setValidationError(res.error || "Failed to publish item");
      }
    } catch (err) {
      console.error(err);
      setValidationError("Something went wrong during publication");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const target = e.target;
      // If it's a textarea, let it handle Enter normally
      if (target.tagName.toLowerCase() === "textarea") return;
      
      e.preventDefault();
      if (currentStep < 4) {
        setValidationError("");
        setIsStepTransitioning(true);
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const steps = [
    { id: 1, name: "Identity", icon: Sparkles },
    { id: 2, name: "Details", icon: Gift },
    { id: 3, name: "Presentation", icon: ImageIcon },
    { id: 4, name: "Logistics", icon: Target },
  ];

  const inputClass = "w-full px-5 py-4 bg-orange-50 border-[0.5px] border-orange-200 text-orange-950 text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-orange-950 transition-all placeholder:text-orange-400";
  const labelClass = "text-[9px] font-black uppercase tracking-[0.4em] text-orange-600 mb-2.5 block ml-1";

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-orange-950/90 backdrop-blur-2xl flex items-center justify-center z-[9999] p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl h-[85vh] flex shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Progress Sidebar */}
        <div className="w-72 bg-orange-950 p-12 hidden lg:flex flex-col">
          <div className="mb-20">
            <h2 className="text-white text-2xl font-semibold tracking-tighter">GoMo Portal</h2>
            <p className="text-white/30 text-[8px] uppercase tracking-[0.5em] mt-3 font-black">Publish Collection 2024</p>
          </div>
          
          <div className="flex-1 space-y-12">
            {steps.map(step => (
              <div 
                key={step.id} 
                className={`flex items-center gap-6 transition-all duration-700 cursor-pointer
                  ${currentStep >= step.id ? "text-white" : "text-white/20"}`}
                onClick={() => {
                  if (isStepTransitioning) return;
                  setValidationError("");
                  setIsStepTransitioning(true);
                  setCurrentStep(step.id);
                }}
              >
                <div className={`w-8 h-8 flex items-center justify-center border-[0.5px]
                  ${currentStep >= step.id ? "border-white" : "border-white/10"}`}>
                  <step.icon size={12} strokeWidth={1} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.4em]">{step.name}</span>
                {currentStep > step.id && <CheckCircle2 size={10} className="text-white ml-auto" />}
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-white/5">
             <button onClick={onClose} className="text-white/30 hover:text-white text-[9px] font-bold uppercase tracking-[0.4em] transition-colors">
                Discard Draft
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="px-12 py-10 flex justify-between items-center border-b-[0.5px] border-orange-100 bg-orange-50/30">
            <div>
              <h3 className="text-xl font-semibold text-orange-950">{steps.find(s => s.id === currentStep).name} Details</h3>
              <p className="text-[9px] text-orange-500 uppercase tracking-[0.4em] mt-1.5 font-black">Step {currentStep} of 4</p>
            </div>
            <button onClick={onClose} className="p-3 text-orange-400 hover:text-orange-950 transition-colors">
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {validationError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mx-12 mt-6 p-5 bg-rose-50 border-[0.5px] border-rose-200 text-rose-950 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={14} className="text-rose-600" />
                <span>{validationError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setValidationError("")}
                className="text-rose-400 hover:text-rose-900 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          <div className="flex-1 overflow-y-auto px-12 py-12 no-scrollbar">
            <form id="add-product-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="md:col-span-2 space-y-1">
                      <label className={labelClass}>Product Title *</label>
                      <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="E.G. HANDCRAFTED LEATHER TRINKET BOX" required />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>SKU / Reference Code</label>
                      <input name="sku" value={form.sku} onChange={handleChange} className={inputClass} placeholder="GoMo-BOU-001" />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Boutique Brand</label>
                      <select 
                        value={isCustomBrand ? "custom" : form.brand} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setIsCustomBrand(true);
                            setForm(prev => ({ ...prev, brand: customBrandName || "" }));
                          } else {
                            setIsCustomBrand(false);
                            setForm(prev => ({ ...prev, brand: val }));
                          }
                        }} 
                        className={inputClass}
                      >
                        <option value="">Select Boutique Brand</option>
                        {boutiqueBrands.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="custom">Other / Custom Brand</option>
                      </select>
                      
                      {isCustomBrand && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 overflow-hidden"
                        >
                          <input 
                            type="text" 
                            value={customBrandName} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomBrandName(val);
                              setForm(prev => ({ ...prev, brand: val }));
                            }} 
                            className={inputClass} 
                            placeholder="ENTER CUSTOM BRAND NAME..."
                          />
                        </motion.div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className={labelClass}>Collection Description</label>
                      <textarea name="description" value={form.description} onChange={handleChange} rows="4" className={inputClass} placeholder="DESCRIBE THE ARTISTRY AND DETAIL..." />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <label className={labelClass}>Target Recipient</label>
                      <select name="recipient" value={form.recipient} onChange={handleChange} className={inputClass}>
                        <option value="">Universal Selection</option>
                        {recipientsList.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Primary Occasion</label>
                      <select name="occasion" value={form.occasion} onChange={handleChange} className={inputClass}>
                        <option value="">Everyday Elegance</option>
                        {occasionsList.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Boutique Segment (Category) *</label>
                        <select name="category_id" value={form.category_id} onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            category_id: val,
                            subcategory_id: "",
                            size: ""
                          }));
                          setApparelType("");
                          setIsCustomSize(false);
                          setCustomSizeValue("");
                        }} className={inputClass} required>
                         <option value="">Select Product Category</option>
                         {categories.filter(cat => !cat.parent_category_id).map(cat => (
                           <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                         ))}
                       </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className={labelClass}>Subcategory *</label>
                      <select 
                        name="subcategory_id" 
                        value={form.subcategory_id || ''} 
                        onChange={handleChange} 
                        className={inputClass} 
                        disabled={!form.category_id}
                        required
                      >
                        {form.category_id ? (
                          <>
                            <option value="">Select Subcategory</option>
                            {subcategories.map(sub => (
                              <option key={sub.category_id} value={sub.category_id}>{sub.name}</option>
                            ))}
                          </>
                        ) : (
                          <option value="">Select Category First</option>
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-start gap-4 cursor-pointer p-5 border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 transition-colors rounded-xl">
                        <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border-2 transition-colors ${isFleaMarketOverride ? "bg-orange-600 border-orange-600" : "bg-white border-orange-300"}`}>
                          {isFleaMarketOverride && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isFleaMarketOverride} 
                          onChange={(e) => {
                            if (e.target.checked && user?.seller_subscription !== 'pro' && user?.seller_subscription !== 'enterprise') {
                              setValidationError("Pro or Enterprise subscription is required to list products on the B2B Flea Market Exchange. Please upgrade your subscription.");
                              return;
                            }
                            setIsFleaMarketOverride(e.target.checked);
                          }} 
                          className="hidden" 
                        />
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-orange-950 block mb-1">List on B2B Flea Market Exchange</span>
                          <span className="text-[9px] text-orange-500 font-bold tracking-wide">Enable this if you are selling agricultural commodities, staples, or bulk items. This overrides the category default and lists your product directly in the Flea Market Exchange.</span>
                        </div>
                      </label>
                    </div>

                    {isClothing && (
                      <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Apparel Type *</label>
                        <select 
                          value={apparelType} 
                          onChange={(e) => setApparelType(e.target.value)} 
                          className={inputClass}
                          required={isClothing}
                        >
                          <option value="">Select Apparel Type</option>
                          <option value="mens">Men's Wear</option>
                          <option value="womens">Women's Wear</option>
                          <option value="footwear">Footwear</option>
                          <option value="accessories">Accessories</option>
                          <option value="other">Other / Accessories</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-1 relative">
                      <label className={labelClass}>{isMarketProduct ? "Base Price (₹ per KG) *" : "Base Price (₹) *"}</label>
                      <input name="price" type="number" value={form.price} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div className="space-y-1 relative">
                      <label className={labelClass}>{isMarketProduct ? "Original MRP (₹ per KG)" : "Original MRP (₹)"}</label>
                      <input name="mrp" type="number" value={form.mrp} onChange={handleChange} className={inputClass} />
                      {form.discount_percent > 0 && (
                        <div className="absolute right-3 top-8 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 inline-flex items-center gap-1">
                          <Sparkles size={8} />
                          <span>{form.discount_percent}% Save</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>{isMarketProduct ? "Base Stock Qty (in KG) *" : "Base Stock Qty *"}</label>
                      <input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} className={inputClass} required />
                    </div>

                    {/* Color Family swatches */}
                    <div className="md:col-span-2 space-y-4 pt-6 border-t border-orange-100/50">
                      <div>
                        <label className={labelClass}>Color Family (For Filtering)</label>
                        <p className="text-[7px] text-orange-500 uppercase tracking-widest mt-1 mb-3">Choose a boutique standard or select custom to type any color name</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {colorFamilies.map(c => {
                          let isActive = false;
                          if (c.id === "custom") {
                            isActive = isCustomColor;
                          } else {
                            isActive = !isCustomColor && (form.color?.toLowerCase() === c.name.toLowerCase() || form.color?.toLowerCase() === c.id);
                          }
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => {
                                setValidationError("");
                                if (c.id === "custom") {
                                  setIsCustomColor(true);
                                  setForm(prev => ({ ...prev, color: customColorName || "" }));
                                } else {
                                  setIsCustomColor(false);
                                  setForm(prev => ({ ...prev, color: c.name }));
                                }
                              }}
                              className={`flex items-center gap-3 px-5 py-3 border transition-all duration-300 ${
                                isActive 
                                  ? "border-orange-950 bg-orange-50/50 shadow-sm" 
                                  : "border-orange-200 bg-white hover:border-orange-400"
                              }`}
                            >
                              <div 
                                className={`w-5 h-5 rounded-full ${c.border || ""}`}
                                style={{ background: c.hex }}
                              >
                                {isActive && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className={`w-1.5 h-1.5 rounded-full ${c.id === 'white' ? 'bg-orange-950' : 'bg-white'}`}></div>
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-950">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {isCustomColor ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-1.5 mt-4 overflow-hidden"
                        >
                          <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Custom Color Name *</label>
                          <input 
                            type="text" 
                            name="color"
                            value={customColorName} 
                            onChange={(e) => {
                              setValidationError("");
                              const val = e.target.value;
                              setCustomColorName(val);
                              setForm(prev => ({ ...prev, color: val }));
                            }} 
                            className={inputClass} 
                            placeholder="E.G. CHAMPAGNE GOLD, DUSTY ROSE, INDIGO DUSK..."
                            required={isCustomColor}
                          />
                        </motion.div>
                      ) : (
                        <div className="space-y-1.5 mt-4">
                          <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Exact Color Name</label>
                          <input 
                            type="text" 
                            name="color"
                            value={form.color} 
                            onChange={(e) => {
                              setValidationError("");
                              handleChange(e);
                            }} 
                            className={inputClass} 
                            placeholder="E.G. OBSIDIAN BLACK, SAGE GREEN, CHAMPAGNE GOLD..."
                            disabled
                          />
                        </div>
                      )}
                    </div>
                    {/* Size Bracket Selector */}
                    {isClothing && (
                      <div className="md:col-span-2 space-y-4 pt-6 border-t border-orange-100/50">
                        <div>
                          <label className={labelClass}>Size Bracket (For Filtering)</label>
                          <p className="text-[7px] text-orange-500 uppercase tracking-widest mt-1 mb-3">Select standard size options or enter a custom size value</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {sizeBrackets.map(sz => {
                            let isBracketActive = false;
                            if (sz.id === "custom") {
                              isBracketActive = isCustomSize;
                            } else {
                              isBracketActive = !isCustomSize && (form.size?.toLowerCase() === sz.name.toLowerCase() || form.size?.toLowerCase() === sz.id);
                            }
                            return (
                              <button
                                type="button"
                                key={sz.id}
                                onClick={() => {
                                  setValidationError("");
                                  if (sz.id === "custom") {
                                    setIsCustomSize(true);
                                    setForm(prev => ({ ...prev, size: customSizeValue || "" }));
                                  } else {
                                    setIsCustomSize(false);
                                    setForm(prev => ({ ...prev, size: sz.name }));
                                  }
                                }}
                                className={`px-5 py-3 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                                  isBracketActive 
                                    ? "border-orange-950 bg-orange-950 text-white shadow-sm" 
                                    : "border-orange-200 bg-white text-orange-955 hover:border-orange-400"
                                }`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{sz.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isCustomSize ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-1.5 mt-4 overflow-hidden"
                          >
                            <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Custom Size / Dimensions *</label>
                            <input 
                              type="text" 
                              name="size"
                              value={customSizeValue} 
                              onChange={(e) => {
                                setValidationError("");
                                const val = e.target.value;
                                setCustomSizeValue(val);
                                setForm(prev => ({ ...prev, size: val }));
                              }} 
                              className={inputClass} 
                              placeholder="E.G. 28X30, XL, 32, 38..."
                              required={isCustomSize}
                            />
                          </motion.div>
                        ) : (
                          <div className="space-y-1.5 mt-4">
                            <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Exact Size / Dimensions</label>
                            <input 
                              type="text" 
                              name="size"
                              value={form.size} 
                              onChange={(e) => {
                                setValidationError("");
                                handleChange(e);
                              }} 
                              className={inputClass} 
                              placeholder="E.G. STANDARD / ONE-SIZE, SMALL (S), MEDIUM (M), LARGE (L)..."
                              disabled
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flea Market Weight Selector */}
                    {isMarketProduct && (
                      <div className="md:col-span-2 space-y-4 pt-6 border-t border-orange-100/50">
                        <div>
                          <label className={labelClass}>Staples Pack Size / Weight Class *</label>
                          <p className="text-[7px] text-orange-500 uppercase tracking-widest mt-1 mb-3">Select standard pack weights or enter a custom packaging weight</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {marketSizeBrackets.map(sz => {
                            let isBracketActive = false;
                            if (sz.id === "custom") {
                              isBracketActive = isCustomSize;
                            } else {
                              isBracketActive = !isCustomSize && (form.size?.toLowerCase() === sz.name.toLowerCase() || form.size?.toLowerCase() === sz.id);
                            }
                            return (
                              <button
                                type="button"
                                key={sz.id}
                                onClick={() => {
                                  setValidationError("");
                                  if (sz.id === "custom") {
                                    setIsCustomSize(true);
                                    setForm(prev => ({ ...prev, size: customSizeValue || "" }));
                                  } else {
                                    setIsCustomSize(false);
                                    setForm(prev => ({ ...prev, size: sz.name }));
                                  }
                                }}
                                className={`px-5 py-3 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                                  isBracketActive 
                                    ? "border-orange-950 bg-orange-950 text-white shadow-sm" 
                                    : "border-orange-200 bg-white text-orange-955 hover:border-orange-400"
                                }`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{sz.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isCustomSize ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-1.5 mt-4 overflow-hidden"
                          >
                            <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Custom Packaging Weight *</label>
                            <input 
                              type="text" 
                              name="size"
                              value={customSizeValue} 
                              onChange={(e) => {
                                setValidationError("");
                                const val = e.target.value;
                                setCustomSizeValue(val);
                                setForm(prev => ({ ...prev, size: val }));
                              }} 
                              className={inputClass} 
                              placeholder="E.G. 500 G Pack, 25 KG Jute Bag..."
                              required={isCustomSize}
                            />
                          </motion.div>
                        ) : (
                          <div className="space-y-1.5 mt-4">
                            <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black ml-1 block">Exact Pack Weight / Size</label>
                            <input 
                              type="text" 
                              name="size"
                              value={form.size} 
                              onChange={(e) => {
                                setValidationError("");
                                handleChange(e);
                              }} 
                              className={inputClass} 
                              placeholder="E.G. 1 KG PACK, 5 KG BAG..."
                              disabled
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Color Variants Section */}
                    <div className="md:col-span-2 pt-12 border-t border-orange-100">
                       <div className="flex justify-between items-center mb-10">
                          <div className="flex items-center gap-4">
                             <Palette size={16} strokeWidth={1} className="text-orange-600" />
                             <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-900">Color Palette Override</h4>
                                <p className="text-[7px] text-orange-500 uppercase tracking-widest mt-1">Define variant specific colors overrides if applicable</p>
                             </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const targetState = !hasVariants;
                              setHasVariants(targetState);
                              if (targetState && form.variants.length === 0) addColorVariant();
                            }}
                             className={`px-8 py-3 text-[8px] font-bold uppercase tracking-widest transition-all duration-500
                              ${hasVariants ? "bg-orange-950 text-white shadow-xl" : "bg-orange-50 text-orange-600 hover:text-orange-950 border-[0.5px] border-orange-200"}`}
                          >
                            {hasVariants ? "Options Enabled" : "Enable Colors"}
                          </button>
                       </div>

                       {hasVariants && (
                         <div className="space-y-6">
                            <AnimatePresence mode="popLayout">
                               {form.variants.map((variant, idx) => (
                                 <motion.div 
                                   key={variant.tempId}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, x: -20 }}
                                   className="grid grid-cols-1 sm:grid-cols-5 gap-6 p-8 bg-orange-50 border-[0.5px] border-orange-100 items-end group hover:bg-white hover:border-orange-950 transition-all duration-500"
                                 >
                                    <div className="sm:col-span-1 space-y-1">
                                       <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Color Name</label>
                                       <input 
                                         value={variant.value} 
                                         onChange={(e) => updateVariant(idx, "value", e.target.value)} 
                                         placeholder="E.G. MIDNIGHT"
                                         className="w-full bg-white border-[0.5px] border-orange-100 p-4 text-[10px] uppercase tracking-widest outline-none focus:border-orange-950 transition-colors"
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Price override</label>
                                       <input 
                                         type="number"
                                         value={variant.price} 
                                         onChange={(e) => updateVariant(idx, "price", e.target.value)} 
                                         placeholder={form.price}
                                         className="w-full bg-white border-[0.5px] border-orange-100 p-4 text-[10px] outline-none focus:border-orange-950"
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Stock override</label>
                                       <input 
                                         type="number"
                                         value={variant.stock} 
                                         onChange={(e) => updateVariant(idx, "stock", e.target.value)} 
                                         placeholder={form.stock_quantity}
                                         className="w-full bg-white border-[0.5px] border-orange-100 p-4 text-[10px] outline-none focus:border-orange-950"
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[8px] uppercase tracking-widest text-orange-400 font-black">Ref SKU</label>
                                       <input 
                                         value={variant.sku} 
                                         onChange={(e) => updateVariant(idx, "sku", e.target.value)} 
                                         placeholder="AUTO-GEN"
                                         className="w-full bg-white border-[0.5px] border-orange-100 p-4 text-[10px] uppercase tracking-widest outline-none focus:border-orange-950"
                                       />
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => removeVariant(idx)}
                                      className="p-4 text-orange-300 hover:text-rose-500 transition-colors flex justify-center"
                                    >
                                       <Trash2 size={16} strokeWidth={1} />
                                    </button>
                                 </motion.div>
                               ))}
                            </AnimatePresence>
                            
                            <button 
                              type="button"
                              onClick={addColorVariant}
                              className="w-full py-6 border-[0.5px] border-dashed border-orange-200 text-orange-400 hover:text-orange-950 hover:border-orange-950 transition-all flex items-center justify-center gap-4 group"
                            >
                               <Plus size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                               <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Add Another Color Variant</span>
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <div className="border-[0.5px] border-dashed border-orange-200 p-20 flex flex-col items-center justify-center bg-orange-50 group hover:border-orange-950 transition-all duration-700">
                    <input type="file" multiple onChange={handleImageAdd} className="hidden" id="image-upload" accept="image/*" />
                    <label htmlFor="image-upload" className="flex flex-col items-center gap-8 cursor-pointer">
                       <div className="w-16 h-16 bg-white shadow-sm flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:shadow-xl">
                          <Upload size={24} strokeWidth={1} />
                       </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-orange-950">Import Visual Media</p>
                          <p className="text-[8px] text-orange-500 uppercase tracking-[0.2em] mt-3 font-black">Recommended: 2000x2000px · White Background · 3:4 Ratio</p>
                       </div>
                    </label>
                  </div>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="aspect-[4/5] bg-orange-50 relative group border-[0.5px] border-orange-100 overflow-hidden flex flex-col">
                          <div className="relative flex-1 overflow-hidden">
                            <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-orange-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button type="button" onClick={() => removeImage(idx)} className="p-3 bg-white text-rose-500 hover:bg-rose-50 transition-colors shadow-2xl">
                                <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                            {img.isPrimary && (
                                <div className="absolute top-0 left-0 px-4 py-2 bg-orange-950 text-white text-[8px] font-bold uppercase tracking-[0.3em]">
                                Primary
                                </div>
                            )}
                          </div>
                          
                          {/* Variant Association Dropdown */}
                          {hasVariants && (
                              <div className="p-3 bg-white border-t-[0.5px] border-orange-100">
                                  <div className="flex items-center gap-2 mb-2">
                                      <Link size={10} className="text-orange-400" />
                                      <span className="text-[7px] font-bold uppercase tracking-widest text-orange-400">Association</span>
                                  </div>
                                  <select 
                                    value={img.variantTempId || "main"} 
                                    onChange={(e) => setImageVariant(idx, e.target.value)}
                                    className="w-full bg-orange-50 border-none text-[8px] uppercase tracking-widest font-black py-2 px-2 outline-none focus:ring-1 focus:ring-orange-950"
                                  >
                                      <option value="main">Main Product</option>
                                      {form.variants.map(v => (
                                          <option key={v.tempId} value={v.tempId}>
                                              {v.value || "Untitled Color"}
                                          </option>
                                      ))}
                                  </select>
                              </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                   <div className="bg-orange-50 p-12 border-[0.5px] border-orange-100 mb-10 flex items-start gap-6">
                      <AlertCircle size={20} className="text-orange-400 mt-1" strokeWidth={1} />
                      <div>
                         <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] text-orange-900 mb-2">Logistics Protocol</h5>
                         <p className="text-[9px] text-orange-500 leading-relaxed uppercase tracking-wider max-w-2xl">
                            Accurate dimensional data is required for automated fulfillment via GoMo Logistics. Please provide the final boxed dimensions and weight.
                         </p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-1">
                      <label className={labelClass}>Gross Weight (KG)</label>
                      <input name="weight" type="number" step="0.01" value={form.weight} onChange={handleChange} className={inputClass} placeholder="0.50" />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Box Length (CM)</label>
                      <input name="length" type="number" step="0.1" value={form.length} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Box Breadth (CM)</label>
                      <input name="breadth" type="number" step="0.1" value={form.breadth} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Box Height (CM)</label>
                      <input name="height" type="number" step="0.1" value={form.height} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          <div className="px-12 py-12 border-t-[0.5px] border-orange-50 flex justify-between items-center bg-white">
            <button 
              type="button" 
              onClick={() => {
                if (isStepTransitioning) return;
                setValidationError("");
                setIsStepTransitioning(true);
                setCurrentStep(prev => prev - 1);
              }}
              disabled={currentStep === 1 || loading || isStepTransitioning}
              className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-500
                ${currentStep === 1 ? "opacity-0 invisible" : "text-orange-300 hover:text-orange-950"} disabled:opacity-30`}
            >
              Back to {currentStep > 1 ? steps[currentStep-2].name : ""}
            </button>
            
            <div className="flex gap-10">
               {currentStep < 4 ? (
                  <button 
                    type="button"
                    disabled={loading || isStepTransitioning}
                    onClick={() => {
                      setValidationError("");
                      setIsStepTransitioning(true);
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="flex items-center gap-6 bg-orange-950 text-white px-16 py-6 hover:bg-orange-600 transition-all duration-700 group disabled:opacity-50"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Continue to {steps[currentStep].name}</span>
                    <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                  </button>
               ) : (
                  <button 
                    form="add-product-form"
                    type="submit" 
                    disabled={loading || isStepTransitioning}
                    className="bg-orange-950 text-white px-20 py-6 hover:bg-orange-600 transition-all duration-700 shadow-2xl disabled:opacity-50 relative overflow-hidden group"
                  >
                    <div className="relative z-10 flex items-center gap-4">
                       <span className="text-[10px] font-bold uppercase tracking-[0.6em]">{loading ? "Synchronizing..." : "Publish Product"}</span>
                    </div>
                    <div className="absolute inset-0 bg-orange-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  </button>
               )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-root")
  );
};

export default AddProduct;
