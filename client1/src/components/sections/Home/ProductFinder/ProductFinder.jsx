// ProductFinder.jsx - renamed from GiftFinder
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductContext } from '../../../../context/ProductContext/ProductContext';
import { useShop } from '../../../../context/ShopContext';

const ProductFinder = () => {
  const { products: sellerProducts, fetchProducts: fetchSellerProducts } = useContext(ProductContext);
  const { formatPrice, t } = useShop();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  const steps = useMemo(() => [
    {
      id: 'category',
      title: t('which_department'),
      options: [
        { id: 'electronics', label: t('electronics_tech'), value: 'electronics' },
        { id: 'fashion', label: t('fashion_apparel'), value: 'fashion' },
        { id: 'home', label: t('home_kitchen'), value: 'home' },
        { id: 'books', label: t('books_stationery'), value: 'books' },
        { id: 'beauty', label: t('beauty_grooming'), value: 'beauty' }
      ]
    },
    {
      id: 'lifestyle',
      title: t('primary_preference'),
      options: [
        { id: 'premium', label: t('premium_quality_design'), value: 'premium' },
        { id: 'value', label: t('utility_high_value'), value: 'value' },
        { id: 'new', label: t('new_arrivals_trending'), value: 'new' },
        { id: 'top', label: t('top_rated_best_sellers'), value: 'top' }
      ]
    },
    {
      id: 'budget',
      title: t('budget_tier'),
      options: [
        { id: 'value', label: t('budget_value', { price: formatPrice(2000) }), value: [0, 2000] },
        { id: 'mid', label: t('budget_mid', { min: formatPrice(2000), max: formatPrice(10000) }), value: [2000, 10000] },
        { id: 'premium', label: t('budget_premium', { price: formatPrice(10000) }), value: [10000, 1000000] }
      ]
    }
  ], [formatPrice, t]);

  useEffect(() => {
    if (typeof fetchSellerProducts === 'function') {
      fetchSellerProducts();
    }
  }, [fetchSellerProducts]);

  const handleSelect = (stepId, value) => {
    setSelections(prev => ({ ...prev, [stepId]: value }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setSelections({});
    setIsFinished(false);
  };

  const filteredResults = (sellerProducts || []).filter(p => {
    const matchCategory = !selections.category ||
      (p.category_name?.toLowerCase().includes(selections.category)) ||
      (p.category_id?.toString() === selections.category) ||
      (p.tags?.toLowerCase().includes(selections.category)) ||
      (p.name?.toLowerCase().includes(selections.category));
    const matchBudget = !selections.budget ||
      (p.price >= selections.budget[0] && p.price <= selections.budget[1]);
    return matchCategory && matchBudget;
  }).slice(0, 3);

  return (
    <section id="product-finder" className="py-24 bg-orange-700 text-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <Sparkles className="text-white w-6 h-6" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-4 uppercase italic font-serif">{t("gomo_smart_assistant")}</h2>
          <p className="text-orange-500 text-[10px] uppercase tracking-[0.3em] max-w-md font-bold">{t("smart_assistant_desc")}</p>
        </div>
        <div className="min-h-[400px] flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div key={steps[currentStep].id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.4 }} className="w-full">
                <div className="text-center mb-12">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500 block mb-2 font-black">
                    {t("question_step", { current: currentStep + 1, total: steps.length })}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif italic">{steps[currentStep].title}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {steps[currentStep].options.map(option => (
                    <button key={option.id} onClick={() => handleSelect(steps[currentStep].id, option.value)} className="group relative p-8 bg-white/5 border border-white/10 rounded-sm hover:bg-white hover:text-orange-900 transition-all duration-700 text-left">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-bold">{option.label}</span>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                        <ArrowRight size={16} strokeWidth={1} />
                      </div>
                    </button>
                  ))}
                </div>
                {currentStep > 0 && (
                  <button onClick={() => setCurrentStep(prev => prev - 1)} className="mt-12 mx-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-orange-500 hover:text-white transition-colors">
                    <ChevronLeft size={14} /> {t("back")}
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="text-center mb-16">
                  <h3 className="text-2xl sm:text-3xl font-serif italic mb-4">{t("recommended_for_you_finder")}</h3>
                  <p className="text-orange-500 text-[10px] uppercase tracking-widest font-bold">{t("based_on_preferences")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                  {filteredResults.length > 0 ? filteredResults.map(product => (
                    <Link to={`/product/${product.product_id}`} key={product.product_id} className="group flex flex-col items-center cursor-pointer">
                      <div className="relative aspect-[3/4] w-full overflow-hidden mb-6 bg-orange-900 rounded-lg">
                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                      </div>
                      <h4 className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold group-hover:text-orange-400 transition-colors text-center">{product.name}</h4>
                      <span className="text-[12px] font-medium text-orange-400">{formatPrice(product.price)}</span>
                    </Link>
                  )) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-orange-500 text-[10px] uppercase tracking-[0.5em] font-black">{t("no_products_finder")}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-8">
                  <button onClick={() => {
                    const grid = document.getElementById('product-grid');
                    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
                    reset();
                  }} className="px-16 py-6 bg-white text-orange-900 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-orange-200 transition-all duration-700 rounded-full">
                    {t("explore_products")}
                  </button>
                  <button onClick={reset} className="text-[10px] uppercase tracking-[0.3em] text-orange-500 hover:text-white transition-colors">
                    {t("cancel")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ProductFinder;
