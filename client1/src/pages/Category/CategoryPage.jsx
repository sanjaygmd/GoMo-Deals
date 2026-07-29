import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, RotateCcw, ArrowLeft, Star, ChevronDown, SlidersHorizontal, Check, X } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import { ProductContext } from '../../context/ProductContext/ProductContext';
import { useShop } from '../../context/ShopContext';
import { categorySubcategories } from '../../data/categories';

const CategoryPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { products: sellerProducts, fetchProducts: fetchSellerProducts, loading } = useContext(ProductContext);
  const { formatPrice, t } = useShop();
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'new' | 'best'

  useEffect(() => {
    if (type === 'flea-market' || type === 'flea_market') {
       navigate('/flea-market', { replace: true });
       return;
    }
  }, [type, navigate]);

  // Dynamic Sidebar Filter States
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-low' | 'price-high' | 'rating'
  const [selectedSubcategory, setSelectedSubcategory] = useState('all'); // 'all' | 'Grains & Rice' | 'Lentils & Dals'
  
  // Mobile UI state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setInitialLoading(true);
    setFilterType('all');
    setSelectedBrands([]);
    setPriceRange('all');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('featured');
    setSelectedSubcategory('all');

    const load = async () => {
      if (typeof fetchSellerProducts === 'function') {
        await fetchSellerProducts();
      }
      setInitialLoading(false);
    };
    load();
  }, [type, fetchSellerProducts]);

  // Base category-filtered products (by URL type)
  const baseProducts = useMemo(() => {
    if (!sellerProducts) return [];
    if (type === 'all' || !type) return sellerProducts;

    const typeLower = type.toLowerCase();
    const cleanType = typeLower.replace(/[^a-z0-9]/g, '');
    const isFleaMarket = typeLower === 'fleamarket' || typeLower === 'flea-market' || typeLower === 'daily-essentials-groceries';

    return sellerProducts.filter(p => {
      const fieldContains = (field, search) => {
        if (!field || !search) return false;
        const cleanField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSearch = search.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanField.includes(cleanSearch);
      };

      if (isFleaMarket) {
        const cat = (p.category_name || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const tags = (p.tags || '').toLowerCase();
        return cat.includes('grocery') || 
               cat.includes('groceries') || 
               cat.includes('staple') || 
               cat.includes('grain') || 
               cat.includes('lentil') ||
               cat.includes('rice') ||
               cat.includes('dal') ||
               tags.includes('grocery') || 
               tags.includes('flea market') || 
               name.includes('rice') || 
               name.includes('dal') || 
               name.includes('atta') || 
               name.includes('wheat');
      }

      const matchOccasionOrRecipient =
        fieldContains(p.recipient, typeLower) ||
        fieldContains(p.occasion, typeLower);

      const subcats = categorySubcategories[typeLower] || [];
      const matchSubcategory = subcats.some(sub => 
          fieldContains(p.category_name, sub.label) || 
          fieldContains(p.category_name, sub.slug) ||
          fieldContains(p.tags, sub.label) ||
          fieldContains(p.tags, sub.slug) ||
          fieldContains(p.room, sub.label) ||
          fieldContains(p.room, sub.slug) ||
          fieldContains(p.name, sub.label)
      );

      const matchCategory =
        fieldContains(p.category_name, typeLower) ||
        fieldContains(p.parent_category_name, typeLower) ||
        (p.category_id?.toString() === typeLower) ||
        (p.parent_category_id?.toString() === typeLower) ||
        fieldContains(p.tags, typeLower) ||
        fieldContains(p.name, typeLower) ||
        fieldContains(p.room, typeLower) ||
        matchSubcategory ||
        (cleanType === 'clothing' && (
          fieldContains(p.category_name, 'wear') || 
          fieldContains(p.parent_category_name, 'wear') || 
          fieldContains(p.category_name, 'dress') || 
          fieldContains(p.category_name, 'saree') || 
          fieldContains(p.category_name, 'kurtis') || 
          fieldContains(p.category_name, 'chudithar') ||
          fieldContains(p.category_name, 'clothing') ||
          fieldContains(p.parent_category_name, 'clothing')
        )) ||
        (cleanType === 'homeliving' && (fieldContains(p.category_name, 'home') || fieldContains(p.category_name, 'living') || fieldContains(p.category_name, 'kitchen') || fieldContains(p.parent_category_name, 'home') || fieldContains(p.parent_category_name, 'living') || fieldContains(p.parent_category_name, 'kitchen'))) ||
        (cleanType === 'sportsfitness' && (fieldContains(p.category_name, 'sports') || fieldContains(p.category_name, 'fitness') || fieldContains(p.category_name, 'gym') || fieldContains(p.category_name, 'yoga') || fieldContains(p.parent_category_name, 'sports') || fieldContains(p.parent_category_name, 'fitness') || fieldContains(p.parent_category_name, 'gym') || fieldContains(p.parent_category_name, 'yoga')));

      return matchOccasionOrRecipient || matchCategory;
    });
  }, [type, sellerProducts]);

  // New Arrivals: products added in last 30 days
  const newArrivals = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return baseProducts.filter(p => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at).getTime();
      return created >= thirtyDaysAgo;
    });
  }, [baseProducts]);

  // Best Sellers: top 20% by sales_count, or sales_count >= 10
  const bestSellers = useMemo(() => {
    const withSales = baseProducts.filter(p => p.sales_count != null && p.sales_count > 0);
    if (withSales.length === 0) return [];
    const sorted = [...withSales].sort((a, b) => b.sales_count - a.sales_count);
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
    return sorted.slice(0, topCount);
  }, [baseProducts]);

  // Dynamic Brands computed based on current category inventory
  const uniqueBrands = useMemo(() => {
    const brands = new Set();
    baseProducts.forEach(p => {
      if (p.brand && p.brand.trim()) {
        brands.add(p.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [baseProducts]);

  // Handle Brand checkbox selections
  const handleBrandChange = (brandName) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandName)) {
        return prev.filter(b => b !== brandName);
      } else {
        return [...prev, brandName];
      }
    });
  };

  // Final filtered list based on all filters & sort options
  const filteredProducts = useMemo(() => {
    let result = baseProducts;

    const isFleaMarket = type?.toLowerCase() === 'fleamarket' || type?.toLowerCase() === 'flea-market' || type?.toLowerCase() === 'daily-essentials-groceries';

    // 1. Apply primary tabs filter
    if (filterType === 'new') {
      result = newArrivals;
    } else if (filterType === 'best') {
      result = bestSellers;
    }

    // 1.5. Apply subcategory filter
    if (selectedSubcategory !== 'all') {
      const subClean = selectedSubcategory.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const fieldContains = (field, search) => {
        if (!field || !search) return false;
        return field.toLowerCase().replace(/[^a-z0-9-]/g, '').includes(search);
      };
      
      result = result.filter(p => 
        fieldContains(p.category_name, subClean) || 
        fieldContains(p.tags, subClean) || 
        fieldContains(p.name, subClean) || 
        fieldContains(p.description, subClean) ||
        fieldContains(p.room, subClean) ||
        (p.category_name && p.category_name.toLowerCase().replace(/[^a-z0-9-]/g, '') === subClean)
      );
    }

    // 2. Apply Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => p.brand && selectedBrands.includes(p.brand.trim()));
    }

    // 3. Apply Price Range filter
    if (priceRange !== 'all') {
      result = result.filter(p => {
        const price = Number(p.price);
        if (isFleaMarket) {
          if (priceRange === 'under-100') return price < 100;
          if (priceRange === '100-180') return price >= 100 && price <= 180;
          if (priceRange === 'over-180') return price > 180;
          return true;
        }
        if (priceRange === 'under-1000') return price < 1000;
        if (priceRange === '1000-5000') return price >= 1000 && price <= 5000;
        if (priceRange === '5000-10000') return price >= 5000 && price <= 10000;
        if (priceRange === '10000-25000') return price >= 10000 && price <= 25000;
        if (priceRange === 'over-25000') return price > 25000;
        return true;
      });
    }

    // 4. Apply Min Rating filter
    if (minRating > 0) {
      result = result.filter(p => Number(p.rating || 0) >= minRating || Number(p.rating || 0) === 0);
    }

    // 5. Apply Availability Stock filter
    if (inStockOnly) {
      result = result.filter(p => Number(p.stock_quantity || 0) > 0);
    }

    // 6. Apply Sort selection
    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }, [baseProducts, filterType, newArrivals, bestSellers, selectedBrands, priceRange, minRating, inStockOnly, sortBy, selectedSubcategory, type]);

  const activeFiltersCount = useMemo(() => {
    return [
      selectedBrands.length > 0,
      priceRange !== 'all',
      minRating > 0,
      inStockOnly,
      sortBy !== 'featured',
      selectedSubcategory !== 'all'
    ].filter(Boolean).length;
  }, [selectedBrands, priceRange, minRating, inStockOnly, sortBy, selectedSubcategory]);

  const handleClearAllFilters = () => {
    setSelectedBrands([]);
    setPriceRange('all');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('featured');
    setSelectedSubcategory('all');
  };

  const getTitle = () => {
    const typeLower = type?.toLowerCase();
    switch (typeLower) {
      case 'fleamarket':
      case 'flea-market':
      case 'daily-essentials-groceries':
        return 'Daily Essentials Flea Market';
      case 'him': return 'Gifts For Him';
      case 'her': return 'Gifts For Her';
      case 'kids': return 'Gifts For Kids';
      case 'birthday': return 'Birthday Collection';
      case 'anniversary': return 'Anniversary Collection';
      case 'electronics': return 'Electronics';
      case 'fashion': return 'Fashion & Apparel';
      case 'home-living': return 'Home & Living';
      case 'books': return 'Books & Stationery';
      case 'beauty': return 'Beauty & Grooming';
      case 'sports-fitness':
      case 'sports':
        return 'Sports & Fitness';
      case 'clothing': return 'Clothing';
      case 'mens': return 'Mens Collection';
      case 'women': return 'Womens Collection';
      case 'kids': return 'Kids Collection';
      case 'pooja-items': return 'Pooja Items';
      case 'toys': return 'Toys';
      case 'gifts': return 'Gifts';
      default: return 'Collection';
    }
  };

  const getSubtitle = () => {
    const typeLower = type?.toLowerCase();
    switch (typeLower) {
      case 'fleamarket':
      case 'flea-market':
      case 'daily-essentials-groceries':
        return 'Premium daily grocery staples, sourced directly and priced per kilogram.';
      case 'him': return 'Sophisticated expressions for the men who matter most.';
      case 'her': return 'Elegant gifts selected to celebrate her unique story.';
      case 'electronics': return 'Cutting-edge gadgets, premium audio, and smart accessories.';
      case 'fashion': return 'High-end apparel, premium footwear, and elegant accessories.';
      case 'home-living': return 'Quality kitchenware, beautiful decor, and exquisite furniture.';
      case 'books': return 'Captivating fiction, insightful biographies, and premium stationery.';
      case 'beauty': return 'Exquisite skincare, enchanting fragrances, and luxury cosmetics.';
      case 'sports-fitness':
      case 'sports':
        return 'High-performance gym gear, yoga essentials, and accessories.';
      case 'clothing': return 'Discover the latest trends in clothing for all occasions.';
      case 'mens': return 'Premium apparel, watches, and accessories for men.';
      case 'women': return 'Elegant clothes, watches, and accessories for women.';
      case 'kids': return 'Comfortable and fun clothing and toys for kids.';
      case 'pooja-items': return 'Authentic pooja items and spiritual accessories.';
      case 'toys': return 'Educational and fun toys for children of all ages.';
      case 'gifts': return 'Thoughtful gifts for every special occasion.';
      default: return 'Handpicked selections for life\'s most cherished moments.';
    }
  };

  const filters = [
    { key: 'all', label: t("all"), count: baseProducts.length },
    { key: 'new', label: t("whats_new"), count: newArrivals.length },
    { key: 'best', label: t("best_sellers"), count: bestSellers.length },
  ];

  // Helper to render filter sidebar controls
  const renderSidebarControls = () => {
    const isFleaMarket = type?.toLowerCase() === 'fleamarket' || type?.toLowerCase() === 'flea-market' || type?.toLowerCase() === 'daily-essentials-groceries';
    
    return (
      <div className="space-y-6 text-left">
        {/* Categories Sidebar section */}
        {type?.toLowerCase() !== 'healthy-foods' && (
          <div className="space-y-2.5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
              Categories
            </h4>
            <div className="space-y-2">
              {[
                { value: 'electronics', label: 'Electronics' },
                { value: 'fashion', label: 'Fashion' },
                { value: 'home-living', label: 'Home & Living' },
                { value: 'books', label: 'Books' },
                { value: 'beauty', label: 'Beauty' },
                { value: 'sports-fitness', label: 'Sports & Fitness' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'mens', label: 'Mens' },
                { value: 'women', label: 'Women' },
                { value: 'kids', label: 'Kids' },
                { value: 'pooja-items', label: 'Pooja Items' },
                { value: 'toys', label: 'Toys' },
                { value: 'gifts', label: 'Gifts' },
              ].map(cat => (
                <Link 
                  key={cat.value}
                  to={`/collection/${cat.value}`}
                  className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    type?.toLowerCase() === cat.value
                      ? 'border-orange-950 bg-orange-950 text-white ring-2 ring-orange-250/20'
                      : 'border-orange-200 bg-white group-hover:border-orange-400'
                  }`}>
                    {type?.toLowerCase() === cat.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Subcategory Filter */}
        {categorySubcategories[type?.toLowerCase()] && (
          <div className="space-y-2.5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
              Subcategories
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <label 
                className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
              >
                <input
                  type="radio"
                  name="subcategory"
                  checked={selectedSubcategory === 'all'}
                  onChange={() => setSelectedSubcategory('all')}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  selectedSubcategory === 'all'
                    ? 'border-orange-950 bg-orange-950 text-white ring-2 ring-orange-250/20'
                    : 'border-orange-200 bg-white group-hover:border-orange-400'
                }`}>
                  {selectedSubcategory === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>All {getTitle()}</span>
              </label>
              
              {categorySubcategories[type?.toLowerCase()].map(sub => (
                <label 
                  key={sub.slug} 
                  className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
                >
                  <input
                    type="radio"
                    name="subcategory"
                    checked={selectedSubcategory === sub.slug}
                    onChange={() => setSelectedSubcategory(sub.slug)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    selectedSubcategory === sub.slug
                      ? 'border-orange-950 bg-orange-950 text-white ring-2 ring-orange-250/20'
                      : 'border-orange-200 bg-white group-hover:border-orange-400'
                  }`}>
                    {selectedSubcategory === sub.slug && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{sub.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Brands Accordion */}
        {uniqueBrands.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
              {t("boutique")} Brands
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {uniqueBrands.map(brand => (
                <label 
                  key={brand} 
                  className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border rounded transition-all duration-200 flex items-center justify-center ${
                      selectedBrands.includes(brand)
                        ? 'border-orange-950 bg-orange-950 text-white'
                        : 'border-orange-200 bg-white group-hover:border-orange-400'
                    }`}>
                      {selectedBrands.includes(brand) && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="truncate">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Tiers Filter */}
        <div className="space-y-2.5">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
            {isFleaMarket ? 'Price per KG' : 'Price Range'}
          </h4>
          <div className="space-y-2">
            {(isFleaMarket ? [
              { value: 'all', label: 'All Prices' },
              { value: 'under-100', label: `Under ${formatPrice(100)}` },
              { value: '100-180', label: `${formatPrice(100)} - ${formatPrice(180)}` },
              { value: 'over-180', label: `Over ${formatPrice(180)}` }
            ] : [
              { value: 'all', label: 'All Prices' },
              { value: 'under-1000', label: `Under ${formatPrice(1000)}` },
              { value: '1000-5000', label: `${formatPrice(1000)} - ${formatPrice(5000)}` },
              { value: '5000-10000', label: `${formatPrice(5000)} - ${formatPrice(10000)}` },
              { value: '10000-25000', label: `${formatPrice(10000)} - ${formatPrice(25000)}` },
              { value: 'over-25000', label: `Over ${formatPrice(25000)}` }
            ]).map(tier => (
              <label 
                key={tier.value} 
                className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === tier.value}
                  onChange={() => setPriceRange(tier.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  priceRange === tier.value
                    ? 'border-orange-950 bg-orange-950 text-white ring-2 ring-orange-250/20'
                    : 'border-orange-200 bg-white group-hover:border-orange-400'
                }`}>
                  {priceRange === tier.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>{tier.label}</span>
              </label>
            ))}
          </div>
        </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-2.5">
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
          Customer Rating
        </h4>
        <div className="space-y-2">
          {[
            { rating: 0, label: 'All Ratings' },
            { rating: 4, label: '4★ & Above' },
            { rating: 3, label: '3★ & Above' }
          ].map(tier => (
            <label 
              key={tier.rating} 
              className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
            >
              <input
                type="radio"
                name="minRating"
                checked={minRating === tier.rating}
                onChange={() => setMinRating(tier.rating)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 ${
                minRating === tier.rating
                  ? 'border-orange-950 bg-orange-950 text-white ring-2 ring-orange-250/20'
                  : 'border-orange-200 bg-white group-hover:border-orange-400'
              }`}>
                {minRating === tier.rating && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="flex items-center gap-1.5">
                {tier.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div className="space-y-2.5">
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
          {t("availability")}
        </h4>
        <label 
          className="flex items-center gap-2.5 text-xs font-semibold text-orange-900/90 hover:text-orange-955 cursor-pointer select-none group"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={() => setInStockOnly(!inStockOnly)}
              className="sr-only"
            />
            <div className={`w-4 h-4 border rounded transition-all duration-200 flex items-center justify-center ${
              inStockOnly
                ? 'border-orange-950 bg-orange-950 text-white'
                : 'border-orange-200 bg-white group-hover:border-orange-400'
            }`}>
              {inStockOnly && <Check size={11} strokeWidth={3} />}
            </div>
          </div>
          <span>{t("in_stock")} Only</span>
        </label>
      </div>

      {/* Dynamic Sorting Selection */}
      <div className="space-y-2.5">
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-955 border-b border-orange-100 pb-2">
          Sort Products
        </h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-white border border-orange-200 rounded px-2.5 py-1.5 text-xs font-semibold text-orange-900 focus:outline-none focus:border-orange-950 focus:ring-1 focus:ring-orange-950 cursor-pointer"
        >
          <option value="featured">Featured / Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating: High to Low</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={handleClearAllFilters}
          className="w-full py-2 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-955 text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 rounded"
        >
          <RotateCcw size={10} strokeWidth={2.5} />
          Clear {activeFiltersCount} Filters
        </button>
      )}
    </div>
  );
};

  return (
    <div className="pt-8 pb-20 min-h-screen bg-[#fdfbf9]">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-12">
        
        {/* Curated Compact Premium Header Section */}
        <header className="mb-6 text-center max-w-2xl mx-auto border-b border-orange-100/40 pb-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[8.5px] uppercase tracking-[0.45em] text-orange-400 block mb-2 font-black"
          >
            GoMo boutique selection
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-serif italic text-orange-950 mb-3 tracking-wide font-normal"
          >
            {getTitle()}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-orange-900/65 text-xs font-semibold uppercase tracking-[0.2em] leading-relaxed max-w-xl mx-auto"
          >
            {getSubtitle()}
          </motion.p>
        </header>

        {/* Filters and Search Tabs header */}
        {!initialLoading && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-orange-50 pb-4">
            
            {/* Left Tabs (All / New / Best) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={`
                    relative flex items-center gap-2 px-4 py-1.5 text-[9.5px] uppercase tracking-widest font-black
                    border transition-all duration-300 rounded-sm cursor-pointer active:scale-95
                    ${filterType === f.key
                      ? 'bg-orange-950 border-orange-955 text-white shadow-md'
                      : 'bg-white border-orange-100/80 text-orange-900 hover:border-orange-400'
                    }
                  `}
                >
                  {f.label}
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-1 rounded-full text-[8px] font-black
                      ${filterType === f.key
                        ? 'bg-white/20 text-white'
                        : 'bg-orange-100/80 text-orange-600'
                      }
                    `}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </motion.div>

            {/* Right Controls (Mobile Filter Trigger & sorting display) */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-1.5 text-[9.5px] uppercase tracking-widest font-black border border-orange-200 hover:bg-orange-50 text-orange-955 cursor-pointer rounded"
              >
                <SlidersHorizontal size={12} />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>

              <span className="text-[9px] text-orange-400 font-extrabold uppercase tracking-widest leading-none">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Boutique Grid */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Desktop Left-hand Filter Sidebar */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-28 bg-[#fdfbf9] border border-orange-100/70 p-6 rounded-none shadow-[0_2px_15px_rgba(67,23,5,0.015)] select-none">
            {renderSidebarControls()}
          </aside>

          {/* Right Product Grid Area */}
          <div className="flex-grow w-full">
            {initialLoading || loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col bg-white border border-orange-100/75 rounded-2xl p-4 h-full relative space-y-4 shadow-sm"
                  >
                    {/* Image Container skeleton */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-orange-100/50 animate-shimmer" />

                    {/* Info Block skeleton */}
                    <div className="space-y-3 flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Brand skeleton */}
                        <div className="h-2.5 rounded w-1/4 animate-shimmer" />
                        {/* Name skeletons */}
                        <div className="h-4 rounded w-5/6 animate-shimmer" />
                      </div>

                      {/* Price & Actions skeleton */}
                      <div className="pt-4 border-t border-orange-100/70 flex items-center justify-between gap-4">
                        {/* Price skeleton */}
                        <div className="h-5 rounded w-1/3 animate-shimmer" />
                        {/* Action buttons skeleton */}
                        <div className="flex gap-2">
                          <div className="w-9 h-9 rounded-full animate-shimmer" />
                          <div className="w-9 h-9 rounded-full animate-shimmer" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={filterType + priceRange + selectedBrands.length + minRating + inStockOnly + sortBy}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12"
                >
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.product_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.04 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : baseProducts.length === 0 ? (
              <div className="py-24 text-center max-w-xl mx-auto px-4 bg-orange-50/10 border border-orange-100/60 rounded-none p-8 backdrop-blur-sm shadow-sm">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner transition-transform duration-350 hover:scale-105">
                  <ShoppingBag size={28} strokeWidth={1.5} className="animate-bounce-subtle" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-orange-955 mb-3 uppercase">
                  {t("collection")} Coming Soon
                </h3>
                <p className="text-orange-500 text-xs font-light leading-relaxed max-w-sm mx-auto mb-8">
                  We are currently preparing exciting new items for the <strong className="font-extrabold">{getTitle()}</strong> collection. In the meantime, explore our other e-commerce departments.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-orange-900 text-white text-xs uppercase tracking-widest font-black rounded-xl hover:bg-orange-850 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <ArrowLeft size={13} strokeWidth={2.5} />
                  {t("start_shopping")}
                </Link>
              </div>
            ) : (
              <div className="py-24 text-center max-w-md mx-auto px-4 bg-white border border-orange-150 rounded-none p-8 shadow-sm">
                <p className="text-orange-400 uppercase tracking-widest text-[9px] font-black mb-2">
                  No products match your filters
                </p>
                <p className="text-orange-550/80 text-xs font-medium mb-6 leading-relaxed">
                  Try clearing your selected brands, price range, or minimum rating to explore more of our category products.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[9px] uppercase tracking-widest text-orange-900 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 transition-colors font-extrabold rounded cursor-pointer active:scale-95"
                >
                  <RotateCcw size={11} strokeWidth={2.5} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-Up Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 z-[150] cursor-pointer lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#fdfbf9] border-t border-orange-100 rounded-t-2xl shadow-2xl z-[160] overflow-y-auto px-6 py-6 lg:hidden custom-scrollbar flex flex-col text-left"
            >
              <div className="flex justify-between items-center border-b border-orange-100 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-orange-955" />
                  <span className="text-xs font-black uppercase tracking-wider text-orange-955">Shopping Filters</span>
                </div>
                <button 
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-orange-400 hover:text-orange-950 p-1.5 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-grow space-y-6 overflow-y-auto">
                {renderSidebarControls()}
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-orange-950 hover:bg-orange-900 text-white py-3.5 text-[8.5px] uppercase tracking-widest font-black cursor-pointer active:scale-95 transition-all rounded mt-6 h-12 flex items-center justify-center"
              >
                Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryPage;
