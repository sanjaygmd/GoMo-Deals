import React, { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProductContext } from "../../context/ProductContext/ProductContext";
import { useAuth } from "../../context/AuthContext";
import * as productService from "../../services/productService";
import { X, Save, AlertCircle, Gift, Target, Sparkles, Palette } from "lucide-react";
import { motion } from "framer-motion";

const EditProduct = ({ product, onClose }) => {
  const { updateProduct, updateVariant, fetchProducts: fetchSellerProducts } = useContext(ProductContext);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizeValue, setCustomSizeValue] = useState("");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apparelType, setApparelType] = useState("");
  const [isFleaMarketOverride, setIsFleaMarketOverride] = useState(
    (product?.description || "").toLowerCase().includes("flea market") || (product?.tags || []).includes("flea market")
  );

  const [form, setForm] = useState({
    name: product?.name || "",
    description: (product?.description || "").replace(/\[Tags:.*?\]/gi, '').trim(),
    price: product?.discountPrice || product?.price || "",
    mrp: product?.mrp || product?.basePrice || "",
    stock_quantity: product?.stock || product?.stock_quantity || "",
    brand: product?.brand || "",
    category_id: product?.category_id || "",
    recipient: product?.recipient || "",
    occasion: product?.occasion || "",
    sku: product?.sku || "",
    weight: product?.weight || "",
    length: product?.length || "",
    breadth: product?.breadth || "",
    height: product?.height || "",
    variant_name: product?.variant_name || "",
    variant_value: product?.variant_value || "",
    color: product?.color || "",
    size: product?.size || "",
    discount_percent: product?.discount_percent || 0
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

  useEffect(() => {
    const fetchCats = async () => {
      const res = await productService.getCategories();
      if (res.success) setCategories(res.data);
    };
    fetchCats();
  }, []);

  // Initialize custom brand / custom size / custom color states based on loaded product
  useEffect(() => {
    if (product) {
      const isBoutique = boutiqueBrands.includes(product.brand);
      setIsCustomBrand(!isBoutique && !!product.brand);
      setCustomBrandName(!isBoutique ? product.brand || "" : "");

      const stdSizes = ["Standard / One-Size", "Small (S)", "Medium (M)", "Large (L)"];
      const isStandard = stdSizes.includes(product.size);
      setIsCustomSize(!isStandard && !!product.size);
      setCustomSizeValue(!isStandard ? product.size || "" : "");

      const stdColors = ["Obsidian Black", "Ivory White", "Tuscan Brown", "Sage Green", "Sapphire Blue", "Boutique Multi"];
      const isStdColor = stdColors.includes(product.color);
      setIsCustomColor(!isStdColor && !!product.color);
      setCustomColorName(!isStdColor ? product.color || "" : "");

      const desc = product.description || "";
      if (desc.includes("[Tags: men, wear, clothing]")) {
        setApparelType("mens");
      } else if (desc.includes("[Tags: women, wear, clothing]")) {
        setApparelType("womens");
      } else if (desc.includes("[Tags: footwear, shoes, sneakers]")) {
        setApparelType("footwear");
      } else if (desc.includes("[Tags: accessories, fashion]")) {
        setApparelType("accessories");
      } else if (desc.includes("[Tags: fashion]")) {
        setApparelType("other");
      } else {
        setApparelType("");
      }
    }
  }, [product]);

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isFleaMarketProductSelected = isFleaMarketOverride || selectedCategory?.name?.toLowerCase().includes("flea market");
    if (isFleaMarketProductSelected && user?.seller_subscription !== 'pro' && user?.seller_subscription !== 'enterprise') {
      setValidationError("Pro or Enterprise subscription is required to list products on the B2B Flea Market Exchange. Please upgrade your subscription first.");
      return;
    }
    if (isClothing && !apparelType) {
      setValidationError("Apparel Type is required for clothing products.");
      return;
    }
    setLoading(true);
    try {
      const sanitizedForm = { ...form };
      if (isClothing) {
        const tagsMap = {
          mens: "[Tags: men, wear, clothing]",
          womens: "[Tags: women, wear, clothing]",
          footwear: "[Tags: footwear, shoes, sneakers]",
          accessories: "[Tags: accessories, fashion]",
          other: "[Tags: fashion]"
        };
        const tagsToAppend = tagsMap[apparelType] || "[Tags: fashion]";
        sanitizedForm.description = `${form.description || ""}\n\n${tagsToAppend}`;
      } else if (!isMarketProduct) {
        sanitizedForm.size = "";
      }

      if (isFleaMarketOverride) {
        sanitizedForm.description = `${sanitizedForm.description || ""}\n\n[Tags: flea market, commodity, bulk]`;
      }

      ['price', 'mrp', 'stock_quantity', 'weight', 'length', 'breadth', 'height'].forEach(key => {
        if (sanitizedForm[key] === "" || sanitizedForm[key] === undefined) {
          sanitizedForm[key] = null;
        }
      });

      let res;
      if (product.isVariant) {
        res = await updateVariant(product.variantId, sanitizedForm);
      } else {
        res = await updateProduct(product.product_id || product.id, sanitizedForm);
      }

      if (res.success) {
        if (product.seller_id) {
          await fetchSellerProducts(product.seller_id);
        } else {
          await fetchSellerProducts();
        }
        onClose();
      } else {
        setValidationError(res.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setValidationError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-4 bg-orange-50 border-[0.5px] border-orange-200 text-orange-950 text-[11px] uppercase tracking-widest outline-none focus:bg-white focus:border-orange-950 transition-all placeholder:text-orange-400";
  const labelClass = "text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 mb-2 block ml-1";
  const lockedInputClass = "w-full px-4 py-4 bg-orange-100 border-[0.5px] border-orange-200 text-orange-400 text-[11px] uppercase tracking-widest cursor-not-allowed";

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
        className="bg-white w-full max-w-3xl flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* Header */}
         <div className="flex justify-between items-center px-12 py-8 border-b border-orange-100 bg-orange-50/30">
          <div>
            <h2 className="text-2xl font-semibold text-orange-900 tracking-tight">Refine Collection</h2>
            <p className="text-[10px] text-orange-500 uppercase tracking-[0.3em] mt-1 font-black">Updating gift identity</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white transition-colors text-orange-400 hover:text-orange-950">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-12 py-10 no-scrollbar max-h-[70vh]">
          {validationError && (
            <div className="mb-8 p-5 bg-rose-50 border-[0.5px] border-rose-200 text-rose-950 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={14} className="text-rose-600" />
                <span>{validationError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setValidationError("")}
                className="text-rose-400 hover:text-rose-905 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-12">
            
            {/* Section 1: Identity */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[0.5px] bg-orange-900"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-900">01. Identity</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-1">
                  <label className={labelClass}>Collection Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>SKU / Model Ref</label>
                  <input name="sku" value={form.sku} onChange={handleChange} className={inputClass} />
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
                  <label className={labelClass}>Gift Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows="3" className={inputClass} />
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="flex items-start gap-4 cursor-pointer p-5 border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 transition-colors rounded-xl">
                    <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border-2 transition-colors ${isFleaMarketOverride ? "bg-orange-600 border-orange-600" : "bg-white border-orange-300"}`}>
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
                      {isFleaMarketOverride && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-orange-950 block mb-1">List on B2B Flea Market Exchange</span>
                      <span className="text-[9px] text-orange-500 font-bold tracking-wide">Enable this if you are selling agricultural commodities, staples, or bulk items. This overrides the category default and lists your product directly in the Flea Market Exchange.</span>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Section 2: Curation */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[0.5px] bg-orange-900"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-900">02. Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                : "border-orange-200 bg-white text-orange-950 hover:border-orange-400"
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
              </div>
            </section>

            {/* Section 3: Commercials */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[0.5px] bg-orange-900"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-900">03. Commercials</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-1 relative">
                  <label className={labelClass}>Selling Price</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} className={inputClass} required />
                </div>
                <div className="space-y-1 relative">
                  <label className={labelClass}>Original MRP</label>
                  <input name="mrp" type="number" value={form.mrp} onChange={handleChange} className={inputClass} />
                  {form.discount_percent > 0 && (
                    <div className="absolute right-3 top-8 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 inline-flex items-center gap-1">
                      <Sparkles size={8} />
                      <span>{form.discount_percent}% Save</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Current Stock</label>
                  <input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
            </section>

            {/* Section 4: Fixed Attributes */}
            <section className="bg-orange-50 p-8 border-[0.5px] border-orange-100 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-[0.5px] bg-orange-300"></div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-300">Fixed Attributes</h3>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black text-orange-300 uppercase tracking-widest">
                   <AlertCircle size={10} /> Reference Only
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                {product.isVariant && (
                  <>
                    <div className="space-y-1">
                      <label className={labelClass}>Variant Type</label>
                      <input name="variant_name" value={form.variant_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClass}>Variant Value</label>
                      <input name="variant_value" value={form.variant_value} onChange={handleChange} className={inputClass} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className={labelClass}>Category</label>
                  <input value={categories.find(c => c.category_id === form.category_id)?.name || "Universal"} disabled className={lockedInputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Weight</label>
                  <input value={`${form.weight || 0} KG`} disabled className={lockedInputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Dimensions</label>
                  <input value={`${form.length || 0}x${form.breadth || 0}x${form.height || 0}`} disabled className={lockedInputClass} />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
         <div className="px-12 py-8 border-t border-orange-100 bg-white flex justify-end gap-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 hover:text-orange-950 transition-colors px-8"
          >
            Cancel
          </button>
          <button 
            form="edit-product-form"
            type="submit" 
            disabled={loading}
            className="bg-orange-950 text-white text-[10px] font-bold uppercase tracking-[0.4em] px-12 py-5 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? "Updating..." : "Commit Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.getElementById("modal-root")
  );
};

export default EditProduct;
