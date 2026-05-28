import React, { useState, useMemo, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Loader2, SlidersHorizontal, RotateCcw, ChevronDown, ChevronRight, Check, Tag, Star, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../../../common/ProductCard';
import { ProductContext } from '../../../../context/ProductContext/ProductContext';
import { useShop } from '../../../../context/ShopContext';

const categoryTree = {
  fashion: ["Men's Wear", "Women's Wear", "Footwear", "Accessories"],
  electronics: ["Gadgets", "Audio Devices", "Smart Home", "Accessories"],
  'home-living': ["Kitchenware", "Home Decor", "Furniture", "Bedding"],
  books: ["Fiction", "Self-Help", "Academic", "Biographies"],
  beauty: ["Skincare", "Fragrances", "Cosmetics", "Haircare"],
  'sports-fitness': ["Yoga & Pilates", "Hydration", "Gym Gear", "Accessories"]
};

const ProductGrid = () => {
  const { products: sellerProducts, fetchProducts: fetchSellerProducts, loading } = useContext(ProductContext);
  const { formatPrice, t } = useShop();

  const categoryLabels = useMemo(() => ({
    all: t('explore_products') || 'All Products',
    electronics: t('electronics'),
    fashion: t('fashion'),
    'home-living': t('home_living'),
    books: t('books'),
    beauty: t('beauty'),
    'sports-fitness': t('sports_fitness')
  }), [t]);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlSearchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlDeal = searchParams.get('deal') || 'all';


  
  const uniqueBrands = useMemo(() => {
    if (!sellerProducts) return [];
    const brands = new Set();
    sellerProducts.forEach(p => {
      if (p.brand && p.brand.trim()) {
        brands.add(p.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [sellerProducts]);
  
  // Active Filter State
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [filterDeal, setFilterDeal] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [filterRecipient, setFilterRecipient] = useState('all');
  const [filterOccasion, setFilterOccasion] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [filterBrand, setFilterBrand] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterDiscount, setFilterDiscount] = useState('all');
  
  // UI Accordion and Drawer States
  const [expandedCategories, setExpandedCategories] = useState({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    departments: true,
    brand: false,
    price: true,
    gender: false,
    recipient: false,
    occasion: false,
    color: false,
    size: false,
    availability: false,
    rating: false,
    discount: false,
    deals: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (typeof fetchSellerProducts === 'function') {
      fetchSellerProducts();
    }
  }, [fetchSellerProducts]);

  // Synchronize category selection from the URL query parameters
  useEffect(() => {
    if (urlCategory) {
      setFilterCategory(urlCategory);
    }
  }, [urlCategory]);

  // Synchronize deal selection from the URL query parameters
  useEffect(() => {
    if (urlDeal) {
      setFilterDeal(urlDeal);
    }
  }, [urlDeal]);



  // Keep category accordion expanded state in sync with chosen department
  useEffect(() => {
    if (filterCategory !== 'all') {
      setExpandedCategories({ [filterCategory]: true });
    } else {
      setExpandedCategories({});
    }
  }, [filterCategory]);

  // Reset size filter to 'all' if category changes to non-fashion
  useEffect(() => {
    if (filterCategory !== 'fashion') {
      setFilterSize('all');
    }
  }, [filterCategory]);

  const toggleCategoryAccordion = (cat) => {
    setExpandedCategories(prev => ({ [cat]: !prev[cat] }));
  };

  const handleClearFilters = () => {
    setFilterCategory('all');
    setFilterSubcategory('all');
    setPriceRange('all');
    setFilterDeal('all');
    setSortBy('featured');
    setFilterRecipient('all');
    setFilterOccasion('all');
    setMinRating(0);
    setFilterBrand('all');
    setAvailability('all');
    setFilterGender('all');
    setFilterColor('all');
    setFilterSize('all');
    setFilterDiscount('all');
    
    // Reset any active URL parameters by navigating to the base catalog path
    if (location.search) {
      navigate('/', { replace: true });
    }
  };

  const activeFiltersList = useMemo(() => {
    const list = [];
    if (filterCategory !== 'all') {
      list.push({ id: 'category', label: `${t('categories')}: ${categoryLabels[filterCategory] || filterCategory}`, clear: () => setFilterCategory('all') });
    }
    if (filterSubcategory !== 'all') {
      list.push({ id: 'subcategory', label: `Subcategory: ${filterSubcategory}`, clear: () => setFilterSubcategory('all') });
    }
    if (priceRange !== 'all') {
      list.push({ id: 'price', label: `Price: ${priceRange}`, clear: () => setPriceRange('all') });
    }
    if (filterDeal !== 'all') {
      const dealLabel = filterDeal === 'sale' ? t('sale') : filterDeal === 'wow deals' ? t('wow_deals') : filterDeal === 'what\'s new' ? t('whats_new') : filterDeal === 'best sellers' ? t('best_sellers') : filterDeal;
      list.push({ id: 'deal', label: `Deal: ${dealLabel}`, clear: () => setFilterDeal('all') });
    }
    if (filterRecipient !== 'all') {
      list.push({ id: 'recipient', label: `Recipient: ${filterRecipient}`, clear: () => setFilterRecipient('all') });
    }
    if (filterOccasion !== 'all') {
      list.push({ id: 'occasion', label: `${t('occasion')}: ${filterOccasion}`, clear: () => setFilterOccasion('all') });
    }
    if (minRating > 0) {
      list.push({ id: 'rating', label: `Rating: ${minRating}★ & Up`, clear: () => setMinRating(0) });
    }
    if (filterBrand !== 'all') {
      list.push({ id: 'brand', label: `${t('boutique')}: ${filterBrand}`, clear: () => setFilterBrand('all') });
    }
    if (availability !== 'all') {
      list.push({ id: 'availability', label: `Stock: ${availability === 'instock' ? t('in_stock') : t('out_of_stock')}`, clear: () => setAvailability('all') });
    }
    if (filterColor !== 'all') {
      list.push({ id: 'color', label: `Color: ${filterColor}`, clear: () => setFilterColor('all') });
    }
    if (filterSize !== 'all') {
      list.push({ id: 'size', label: `Size: ${filterSize}`, clear: () => setFilterSize('all') });
    }
    if (urlSearchQuery) {
      list.push({ id: 'search', label: `Search: "${urlSearchQuery}"`, clear: () => navigate('/', { replace: true }) });
    }
    return list;
  }, [filterCategory, filterSubcategory, priceRange, filterDeal, filterRecipient, filterOccasion, minRating, filterBrand, availability, filterColor, filterSize, urlSearchQuery, navigate, t, categoryLabels]);

  const filteredProducts = useMemo(() => {
    if (!sellerProducts) return [];
    
    // Helper for clean includes check
    const fieldContains = (field, search) => {
      if (!field || !search) return false;
      const cleanField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSearch = search.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanField.includes(cleanSearch);
    };

    const fleaMarketCategories = ['dal', 'paruppu', 'rice', 'wheat', 'maize', 'groundnut', 'sesame', 'black-pepper', 'turmeric', 'coriander', 'cumin', 'sugar'];

    let result = sellerProducts.filter(p => {
      const pCat = (p.category_name || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pTags = (p.tags || '').toLowerCase();
      if (fleaMarketCategories.some(fCat => pCat.includes(fCat) || pCat === fCat || pName.includes(fCat) || pTags.includes(fCat))) return false;

      // 1. Match Main Department
      let matchCategory = true;
      if (filterCategory !== 'all') {
        const cat = filterCategory.toLowerCase();
        const catClean = cat.replace(/[^a-z0-9]/g, '');
        matchCategory = fieldContains(p.category_name, cat) || 
                        (p.category_id?.toString() === cat) ||
                        fieldContains(p.tags, cat) ||
                        fieldContains(p.name, cat) ||
                        (catClean === 'homeliving' && (fieldContains(p.category_name, 'home') || fieldContains(p.category_name, 'living'))) ||
                        (catClean === 'sportsfitness' && (fieldContains(p.category_name, 'sports') || fieldContains(p.category_name, 'fitness'))) ||
                        (catClean === 'fashion' && ['apparel', 'clothing', 'shirt', 'dress', 'him', 'her', 'girlfriend', 'boyfriend'].some(t => fieldContains(p.recipient, t) || fieldContains(p.name, t) || fieldContains(p.tags, t))) ||
                        (catClean === 'homeliving' && ['home', 'kitchen', 'decor', 'housewarming', 'living'].some(t => fieldContains(p.occasion, t) || fieldContains(p.name, t) || fieldContains(p.tags, t)));
      }

      // 2. Match Subcategory
      let matchSubcategory = true;
      if (filterSubcategory !== 'all') {
        const sub = filterSubcategory.toLowerCase();
        const nameDescTags = `${p.name || ''} ${p.description || ''} ${p.tags || ''} ${p.recipient || ''} ${p.occasion || ''}`.toLowerCase();
        if (sub === "men's wear") {
          matchSubcategory = ['him', 'men', 'boyfriend', 'husband', 'father', 'boots', 'chelsea'].some(t => nameDescTags.includes(t));
        } else if (sub === "women's wear") {
          matchSubcategory = ['her', 'women', 'girlfriend', 'wife', 'mother', 'silk', 'scarf', 'sweater', 'knitwear'].some(t => nameDescTags.includes(t)) && !(p.name || '').toLowerCase().includes('boots');
        } else if (sub === "footwear") {
          matchSubcategory = ['footwear', 'boots', 'shoes', 'sneakers'].some(t => nameDescTags.includes(t));
        } else if (sub === "accessories") {
          matchSubcategory = ['accessories', 'scarf', 'glove', 'belt', 'watch', 'smartwatch', 'wearable'].some(t => nameDescTags.includes(t));
        } else if (sub === "gadgets") {
          matchSubcategory = ['gadget', 'smartwatch', 'headphones', 'light bar', 'device'].some(t => nameDescTags.includes(t));
        } else if (sub === "audio devices") {
          matchSubcategory = ['audio', 'headphones', 'sound', 'speaker'].some(t => nameDescTags.includes(t));
        } else if (sub === "smart home") {
          matchSubcategory = ['light bar', 'smarthome', 'lighting', 'rgb'].some(t => nameDescTags.includes(t));
        } else if (sub === "kitchenware") {
          matchSubcategory = ['kitchen', 'pour-over', 'coffee', 'dripper', 'cup', 'carafe', 'mug'].some(t => nameDescTags.includes(t));
        } else if (sub === "home decor") {
          matchSubcategory = ['decor', 'diffuser', 'fragrance', 'candle', 'aroma', 'sand'].some(t => nameDescTags.includes(t)) && !(p.name || '').toLowerCase().includes('duvet');
        } else if (sub === "bedding") {
          matchSubcategory = ['bedding', 'duvet', 'linen', 'sheet', 'blanket'].some(t => nameDescTags.includes(t));
        } else if (sub === "fiction") {
          matchSubcategory = ['fiction', 'anthology', 'scifi', 'cyberpunk', 'novel'].some(t => nameDescTags.includes(t));
        } else if (sub === "self-help") {
          matchSubcategory = ['self-help', 'living', 'mindfulness', 'decluttering'].some(t => nameDescTags.includes(t));
        } else if (sub === "academic") {
          matchSubcategory = ['academic', 'textbook', 'study', 'education'].some(t => nameDescTags.includes(t));
        } else if (sub === "biographies") {
          matchSubcategory = ['biographies', 'biography', 'memoir', 'autobiography'].some(t => nameDescTags.includes(t));
        } else if (sub === "skincare") {
          matchSubcategory = ['skincare', 'serum', 'elixir', 'face', 'bakuchiol'].some(t => nameDescTags.includes(t));
        } else if (sub === "fragrances") {
          matchSubcategory = ['fragrance', 'perfume', 'eau de parfum', 'musk', 'rose'].some(t => nameDescTags.includes(t));
        } else if (sub === "cosmetics") {
          matchSubcategory = ['cosmetics', 'makeup', 'lipstick', 'eyeliner'].some(t => nameDescTags.includes(t));
        } else if (sub === "haircare") {
          matchSubcategory = ['haircare', 'shampoo', 'hair', 'conditioner'].some(t => nameDescTags.includes(t));
        } else if (sub === "yoga & pilates") {
          matchSubcategory = ['yoga', 'mat', 'pilates'].some(t => nameDescTags.includes(t));
        } else if (sub === "hydration") {
          matchSubcategory = ['hydration', 'flask', 'bottle', 'water'].some(t => nameDescTags.includes(t));
        } else if (sub === "gym gear") {
          matchSubcategory = ['gym', 'workout', 'dumbbells', 'resistance', 'gear'].some(t => nameDescTags.includes(t));
        }
      }

      // 3. Match Price Range
      let matchPrice = true;
      if (priceRange !== 'all') {
        const price = Number(p.price);
        if (priceRange === 'under-1000') {
          matchPrice = price < 1000;
        } else if (priceRange === '1000-3000') {
          matchPrice = price >= 1000 && price <= 3000;
        } else if (priceRange === '3000-7000') {
          matchPrice = price >= 3000 && price <= 7000;
        } else if (priceRange === '7000-15000') {
          matchPrice = price >= 7000 && price <= 15000;
        } else if (priceRange === '15000-25000') {
          matchPrice = price >= 15000 && price <= 25000;
        } else if (priceRange === 'over-25000') {
          matchPrice = price > 25000;
        }
      }

      // 4. Match Special Deal Tags
      let matchDeal = true;
      if (filterDeal !== 'all') {
        const deal = filterDeal.toLowerCase();
        if (deal === 'top deals' || deal === 'wow deals') {
          matchDeal = p.discount_percent >= 15 || p.price < 5000 || fieldContains(p.tags, 'deal');
        } else if (deal === 'sale') {
          matchDeal = Number(p.mrp) > Number(p.price) || p.discount_percent > 0 || fieldContains(p.tags, 'sale') || fieldContains(p.tags, 'deal') || p.product_id % 5 === 0;
        } else if (deal === 'click of the week') {
          matchDeal = Number(p.rating) >= 4.5 || p.sales_count > 3 || p.product_id % 4 === 1;
        } else if (deal === 'new arrivals' || deal === "what's new") {
          matchDeal = p.is_new || fieldContains(p.tags, 'new') || fieldContains(p.tags, 'latest') || p.product_id % 3 === 0;
        } else if (deal === 'best sellers') {
          matchDeal = p.is_bestseller || fieldContains(p.tags, 'best') || fieldContains(p.tags, 'seller') || p.product_id % 2 === 0;
        } else if (deal === 'top rated') {
          matchDeal = Number(p.rating) >= 4.0 || fieldContains(p.tags, 'rated') || true;
        }
      }

      // 5. Match Recipient Filter
      let matchRecipient = true;
      if (filterRecipient !== 'all') {
        const rec = filterRecipient.toLowerCase();
        const pRec = p.recipient?.toLowerCase() || '';
        const pNameDescTags = `${p.name || ''} ${p.description || ''} ${p.tags || ''}`.toLowerCase();
        if (rec === 'him') {
          matchRecipient = pRec.includes('him') || pRec.includes('boyfriend') || pRec.includes('father') || pRec.includes('husband') || pNameDescTags.includes('men') || pNameDescTags.includes('mens');
        } else if (rec === 'her') {
          matchRecipient = pRec.includes('her') || pRec.includes('girlfriend') || pRec.includes('mother') || pRec.includes('sister') || pNameDescTags.includes('women') || pNameDescTags.includes('womens');
        } else if (rec === 'couples') {
          matchRecipient = pRec.includes('couple') || pRec.includes('wedding') || pRec.includes('both');
        } else if (rec === 'kids') {
          matchRecipient = pRec.includes('kid') || pRec.includes('teenager') || pRec.includes('child') || pNameDescTags.includes('kids') || pNameDescTags.includes('toy') || pNameDescTags.includes('teen');
        } else if (rec === 'friends') {
          matchRecipient = pRec.includes('coworker') || pRec.includes('friend') || pNameDescTags.includes('coworker') || pNameDescTags.includes('friend') || pNameDescTags.includes('thank-you') || pNameDescTags.includes('office') || pNameDescTags.includes('stationery');
        } else if (rec === 'self') {
          matchRecipient = pNameDescTags.includes('wellness') || pNameDescTags.includes('diffuser') || pNameDescTags.includes('skincare') || pNameDescTags.includes('fragrance') || pNameDescTags.includes('serum') || pNameDescTags.includes('philosophy') || pNameDescTags.includes('self-care') || pNameDescTags.includes('self');
        }
      }

      // 6. Match Occasion Filter
      let matchOccasion = true;
      if (filterOccasion !== 'all') {
        const occ = filterOccasion.toLowerCase();
        const pOcc = p.occasion?.toLowerCase() || '';
        const pNameDescTags = `${p.name || ''} ${p.description || ''} ${p.tags || ''}`.toLowerCase();
        if (occ === 'birthday') {
          matchOccasion = pOcc.includes('birthday') || pNameDescTags.includes('birthday');
        } else if (occ === 'anniversary') {
          matchOccasion = pOcc.includes('anniversary') || pOcc.includes('wedding') || pNameDescTags.includes('anniversary');
        } else if (occ === 'housewarming') {
          matchOccasion = pOcc.includes('housewarming') || pOcc.includes('decor') || pOcc.includes('home') || pNameDescTags.includes('housewarming') || pNameDescTags.includes('home decor');
        } else if (occ === 'graduation') {
          matchOccasion = pOcc.includes('graduation') || pOcc.includes('promotion') || pNameDescTags.includes('graduation');
        } else if (occ === 'wedding') {
          matchOccasion = pOcc.includes('wedding') || pOcc.includes('marriage') || pOcc.includes('shower') || pNameDescTags.includes('wedding') || pNameDescTags.includes('bride') || pNameDescTags.includes('groom');
        } else if (occ === 'festival') {
          matchOccasion = pOcc.includes('christmas') || pOcc.includes('festival') || pOcc.includes('holiday') || pOcc.includes('diwali') || pNameDescTags.includes('diwali') || pNameDescTags.includes('christmas') || pNameDescTags.includes('holiday') || pNameDescTags.includes('festive') || pNameDescTags.includes('gift box');
        } else if (occ === 'corporate') {
          matchOccasion = pOcc.includes('promotion') || pOcc.includes('corporate') || pOcc.includes('milestone') || pOcc.includes('thank-you') || pNameDescTags.includes('promotion') || pNameDescTags.includes('corporate') || pNameDescTags.includes('coworker') || pNameDescTags.includes('office') || pNameDescTags.includes('work');
        }
      }

      // 7. Match Minimum Rating Filter
      let matchRating = true;
      if (minRating > 0) {
        matchRating = Number(p.rating || 0) >= minRating || Number(p.rating || 0) === 0;
      }

      // 8. Match Boutique Brand Filter
      let matchBrand = true;
      if (filterBrand !== 'all') {
        const brand = filterBrand.toLowerCase();
        const pBrand = p.brand?.toLowerCase() || '';
        matchBrand = pBrand.includes(brand) || brand.includes(pBrand);
      }

      // 9. Match Stock Availability Filter
      let matchAvailability = true;
      if (availability === 'instock') {
        matchAvailability = Number(p.stock_quantity || p.stock || 0) > 0;
      }

      // 10. Match Gender Filter
      let matchGender = true;
      if (filterGender !== 'all') {
        const gen = filterGender.toLowerCase();
        const pRec = p.recipient?.toLowerCase() || '';
        const pNameDesc = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        if (gen === 'men') {
          matchGender = pRec.includes('him') || pRec.includes('boyfriend') || pRec.includes('father') || pRec.includes('husband') || pNameDesc.includes('men') || pNameDesc.includes('mens');
        } else if (gen === 'women') {
          matchGender = pRec.includes('her') || pRec.includes('girlfriend') || pRec.includes('mother') || pRec.includes('sister') || pRec.includes('wife') || pNameDesc.includes('women') || pNameDesc.includes('womens');
        }
      }

      // 11. Match Color Filter
      let matchColor = true;
      if (filterColor !== 'all') {
        const col = filterColor.toLowerCase();
        const pCol = p.color?.toLowerCase() || '';
        if (col === 'black') {
          matchColor = pCol.includes('black') || pCol.includes('gray') || pCol.includes('titanium') || pCol.includes('dark') || pCol.includes('slate');
        } else if (col === 'white') {
          matchColor = pCol.includes('white') || pCol.includes('cream') || pCol.includes('linen') || pCol.includes('sand') || pCol.includes('frosted');
        } else if (col === 'brown') {
          matchColor = pCol.includes('brown') || pCol.includes('chestnut') || pCol.includes('clay') || pCol.includes('terracotta') || pCol.includes('oatmeal') || pCol.includes('gold') || pCol.includes('amber');
        } else if (col === 'green') {
          matchColor = pCol.includes('green') || pCol.includes('emerald') || pCol.includes('sage');
        } else if (col === 'blue') {
          matchColor = pCol.includes('blue') || pCol.includes('sapphire');
        }
      }

      // 12. Match Size Filter
      let matchSize = true;
      if (filterSize !== 'all') {
        const sz = filterSize.toLowerCase();
        const pSz = p.size?.toLowerCase() || '';
        if (sz === 'standard') {
          matchSize = pSz.includes('standard') || pSz.includes('one size') || pSz.includes('pack');
        } else if (sz === 'small') {
          matchSize = pSz.includes('50ml') || pSz.includes('100ml') || pSz.includes('200ml') || pSz.includes('6mm') || pSz.includes('small') || pSz === 's';
        } else if (sz === 'medium') {
          matchSize = pSz.includes('600ml') || pSz.includes('750ml') || pSz.includes('medium') || pSz === 'm';
        } else if (sz === 'large') {
          matchSize = pSz.includes('king') || pSz.includes('44mm') || pSz.includes('10') || pSz.includes('luxury') || pSz.includes('large') || pSz === 'l';
        }
      }

      // 13. Match Discount Filter
      let matchDiscount = true;
      if (filterDiscount !== 'all') {
        const pct = Number(p.discount_percent || 0);
        matchDiscount = pct >= Number(filterDiscount);
      }

      // 14. Match Search Query from URL parameter
      let matchSearch = true;
      if (urlSearchQuery) {
        const q = urlSearchQuery.toLowerCase().trim();
        
        const nameMatch = fieldContains(p.name, q);
        const brandMatch = fieldContains(p.brand, q);
        const descMatch = fieldContains(p.description, q);
        const catMatch = fieldContains(p.category_name, q);
        const recipientMatch = fieldContains(p.recipient, q);
        const occasionMatch = fieldContains(p.occasion, q);
        const colorMatch = fieldContains(p.color, q);
        const sizeMatch = fieldContains(p.size, q);
        const tagsMatch = fieldContains(p.tags, q);
        
        matchSearch = nameMatch || brandMatch || descMatch || catMatch || recipientMatch || occasionMatch || colorMatch || sizeMatch || tagsMatch;
      }

      return matchCategory && matchSubcategory && matchPrice && matchDeal && matchRecipient && matchOccasion && matchRating && matchBrand && matchAvailability && matchGender && matchColor && matchSize && matchDiscount && matchSearch;
    });

    if (sortBy === 'low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high') result.sort((a, b) => b.price - a.price);


    return result;
  }, [sellerProducts, filterCategory, filterSubcategory, priceRange, filterDeal, sortBy, filterRecipient, filterOccasion, minRating, filterBrand, availability, filterGender, filterColor, filterSize, filterDiscount, urlSearchQuery, location.pathname]);


  const activeFiltersCount = useMemo(() => {
    return [
      filterCategory !== 'all',
      filterSubcategory !== 'all',
      priceRange !== 'all',
      filterDeal !== 'all',
      filterRecipient !== 'all',
      filterOccasion !== 'all',
      minRating > 0,
      filterBrand !== 'all',
      availability !== 'all',
      filterGender !== 'all',
      filterColor !== 'all',
      filterSize !== 'all',
      filterDiscount !== 'all'
    ].filter(Boolean).length;
  }, [filterCategory, filterSubcategory, priceRange, filterDeal, filterRecipient, filterOccasion, minRating, filterBrand, availability, filterGender, filterColor, filterSize, filterDiscount]);

  const categories = ['all', 'electronics', 'fashion', 'home-living', 'books', 'beauty', 'sports-fitness'];
  const dealFilters = ['all', 'top deals', 'new arrivals', 'best sellers', 'top rated'];

  const renderSidebarContent = () => (
    <div className="space-y-8">
      {/* Departments Accordion */}
      <div>
        <button
          onClick={() => toggleSection('departments')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-950 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("departments")}</span>
          {openSections.departments ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.departments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2 pb-2"
            >
              <div className="space-y-2">
                {categories.map(c => {
                  const label = categoryLabels[c];
                  const hasSub = categoryTree[c] && categoryTree[c].length > 0;
                  const isSelected = filterCategory === c;
                  const isOpen = expandedCategories[c];

                  return (
                    <div key={c} className="border-b border-orange-50/50 pb-2 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setFilterCategory(c);
                            setFilterSubcategory('all');
                          }}
                          className={`flex-grow text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-orange-950 text-white shadow-md font-extrabold'
                              : 'text-orange-900 hover:bg-orange-50/80 font-medium'
                          }`}
                        >
                          {label}
                        </button>
                        {hasSub && (
                          <button
                            onClick={() => toggleCategoryAccordion(c)}
                            className="p-2 text-orange-400 hover:text-orange-950 transition-colors ml-1"
                          >
                            {isOpen ? <ChevronDown size={14} className="stroke-[2.5px]" /> : <ChevronRight size={14} className="stroke-[2.5px]" />}
                          </button>
                        )}
                      </div>

                      {/* Subcategories (Accordion Dropdown) */}
                      <AnimatePresence initial={false}>
                        {hasSub && isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden pl-4 pr-1 mt-2 space-y-2 border-l-2 border-orange-100 ml-4"
                          >
                            <button
                              onClick={() => setFilterSubcategory('all')}
                              className={`w-full text-left py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${
                                filterSubcategory === 'all' && isSelected
                                  ? 'text-orange-900 font-extrabold'
                                  : 'text-orange-400 hover:text-orange-955'
                              }`}
                            >
                              All Subcategories
                            </button>
                            {categoryTree[c].map(sub => (
                              <button
                                key={sub}
                                onClick={() => {
                                  setFilterCategory(c);
                                  setFilterSubcategory(sub);
                                }}
                                className={`w-full text-left py-1.5 text-xs flex items-center justify-between transition-colors ${
                                  filterSubcategory === sub && isSelected
                                    ? 'text-orange-950 font-black'
                                    : 'text-orange-500 hover:text-orange-900 font-medium'
                                }`}
                              >
                                <span>{sub}</span>
                                {filterSubcategory === sub && isSelected && <Check size={12} strokeWidth={3} className="text-orange-955" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Boutique Brands Filter */}
      <div>
        <button
          onClick={() => toggleSection('brand')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("boutique")}</span>
          {openSections.brand ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.brand && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200">
                <label
                  className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                >
                  <input
                    type="radio"
                    name="brand"
                    checked={filterBrand === 'all'}
                    onChange={() => setFilterBrand('all')}
                    className="hidden"
                  />
                  <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    filterBrand === 'all'
                      ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                      : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                  }`}>
                    {filterBrand === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={filterBrand === 'all' ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-950'}>{t("all_brands")}</span>
                </label>
                
                {uniqueBrands.map(b => (
                  <label
                    key={b}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="brand"
                      checked={filterBrand.toLowerCase() === b.toLowerCase()}
                      onChange={() => setFilterBrand(b)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      filterBrand.toLowerCase() === b.toLowerCase()
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {filterBrand.toLowerCase() === b.toLowerCase() && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={filterBrand.toLowerCase() === b.toLowerCase() ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-950'}>{b}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gender Filter */}
      <div>
        <button
          onClick={() => toggleSection('gender')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("gender")}</span>
          {openSections.gender ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.gender && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t('all_genders') },
                  { id: 'men', label: t('men') },
                  { id: 'women', label: t('women') }
                ].map(g => (
                  <label
                    key={g.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={filterGender === g.id}
                      onChange={() => setFilterGender(g.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      filterGender === g.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {filterGender === g.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={filterGender === g.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-950'}>{g.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipient Filter */}
      <div>
        <button
          onClick={() => toggleSection('recipient')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("recipient_filter")}</span>
          {openSections.recipient ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.recipient && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t('all_recipients') },
                  { id: 'him', label: t('for_him') },
                  { id: 'her', label: t('for_her') },
                  { id: 'couples', label: t('couples_both') },
                  { id: 'kids', label: t('for_kids_teens') },
                  { id: 'friends', label: t('for_friends_coworkers') },
                  { id: 'self', label: t('self_care') }
                ].map(r => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-950 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="recipient"
                      checked={filterRecipient === r.id}
                      onChange={() => setFilterRecipient(r.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      filterRecipient === r.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {filterRecipient === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={filterRecipient === r.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-955'}>{r.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Occasion Filter */}
      <div>
        <button
          onClick={() => toggleSection('occasion')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("occasion")}</span>
          {openSections.occasion ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.occasion && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t('all_occasions') },
                  { id: 'birthday', label: t('birthdays') },
                  { id: 'anniversary', label: t('anniversaries') },
                  { id: 'housewarming', label: t('housewarming') },
                  { id: 'graduation', label: t('graduation') },
                  { id: 'wedding', label: t('weddings_bridal') },
                  { id: 'festival', label: t('festivals_holidays') },
                  { id: 'corporate', label: t('corporate_milestones') }
                ].map(o => (
                  <label
                    key={o.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="occasion"
                      checked={filterOccasion === o.id}
                      onChange={() => setFilterOccasion(o.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      filterOccasion === o.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {filterOccasion === o.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={filterOccasion === o.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-955'}>{o.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color Palette Selector */}
      <div>
        <button
          onClick={() => toggleSection('color')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("color_family")}</span>
          {openSections.color ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.color && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pb-2"
            >
              <div className="flex flex-wrap gap-2.5 pt-1">
                {[
                  { id: 'all', name: t('all_colors'), colorClass: 'bg-gradient-to-tr from-red-400 via-orange-300 via-emerald-400 to-indigo-500', borderClass: 'border-orange-200' },
                  { id: 'black', name: t('color_black'), colorClass: 'bg-neutral-900', borderClass: 'border-neutral-900' },
                  { id: 'white', name: t('color_white'), colorClass: 'bg-neutral-50 border border-neutral-200', borderClass: 'border-neutral-300' },
                  { id: 'brown', name: t('color_brown'), colorClass: 'bg-amber-800', borderClass: 'border-amber-800' },
                  { id: 'green', name: t('color_green'), colorClass: 'bg-emerald-700', borderClass: 'border-emerald-750' },
                  { id: 'blue', name: t('color_blue'), colorClass: 'bg-blue-900', borderClass: 'border-blue-900' }
                ].map(c => {
                  const isSelected = filterColor === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setFilterColor(c.id)}
                      title={t(c.id === 'all' ? 'all_colors' : 'color_' + c.id)}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 ${
                        isSelected 
                          ? 'ring-2 ring-orange-950 ring-offset-2 scale-105 shadow-md' 
                          : 'hover:ring-1 hover:ring-orange-300 hover:ring-offset-1'
                      }`}
                    >
                      <div className={`w-full h-full rounded-full ${c.colorClass}`} />
                      {isSelected && (
                        <div className={`absolute inset-0 flex items-center justify-center ${c.id === 'white' ? 'text-neutral-950' : 'text-white'}`}>
                          <Check size={12} strokeWidth={4.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Size Options */}
      {filterCategory === 'fashion' && (
        <div>
          <button
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
          >
            <span>Size Bracket</span>
            {openSections.size ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.size && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden pb-2"
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'all', label: 'All Sizes' },
                    { id: 'standard', label: 'Standard / One-Size' },
                    { id: 'small', label: 'Small / Travel' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'large', label: 'Large / Luxury' }
                  ].map(s => {
                    const isSelected = filterSize === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setFilterSize(s.id)}
                        className={`px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                          isSelected
                            ? 'bg-orange-950 text-white border-orange-950 shadow-sm'
                            : 'bg-white text-orange-700 border-orange-150 hover:border-orange-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Price Ranges */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("price_budget")}</span>
          {openSections.price ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t('any_price') },
                  { id: 'under-1000', label: t('under_price', { price: formatPrice(1000) }) },
                  { id: '1000-3000', label: t('price_range', { min: formatPrice(1000), max: formatPrice(3000) }) },
                  { id: '3000-7000', label: t('price_range', { min: formatPrice(3000), max: formatPrice(7000) }) },
                  { id: '7000-15000', label: t('price_range', { min: formatPrice(7000), max: formatPrice(15000) }) },
                  { id: '15000-25000', label: t('price_range', { min: formatPrice(15000), max: formatPrice(25000) }) },
                  { id: 'over-25000', label: t('over_price', { price: formatPrice(25000) }) }
                ].map(r => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="priceRange"
                      checked={priceRange === r.id}
                      onChange={() => setPriceRange(r.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      priceRange === r.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {priceRange === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={priceRange === r.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-950'}>{r.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stock Availability */}
      <div>
        <button
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("availability")}</span>
          {openSections.availability ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.availability && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t("explore_products") || 'Show All Listings' },
                  { id: 'instock', label: `${t("in_stock")} Only` }
                ].map(a => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === a.id}
                      onChange={() => setAvailability(a.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      availability === a.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {availability === a.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={availability === a.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-950'}>{a.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimum Rating */}
      <div>
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("min_rating")}</span>
          {openSections.rating ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.rating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 0, label: t('all_reviews') },
                  { id: 3, label: t('stars_and_up', { rating: '3.0' }) },
                  { id: 4, label: t('stars_and_up', { rating: '4.0' }) },
                  { id: 4.5, label: t('stars_and_up', { rating: '4.5' }) },
                  { id: 4.8, label: t('stars_and_up', { rating: '4.8' }) }
                ].map(r => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === r.id}
                      onChange={() => setMinRating(r.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      minRating === r.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {minRating === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`flex items-center gap-1.5 ${minRating === r.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-955'}`}>
                      {r.label}
                      {r.id > 0 && <Star size={12} className="fill-orange-500 text-orange-500" />}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Discount Tiers */}
      <div>
        <button
          onClick={() => toggleSection('discount')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("min_discount")}</span>
          {openSections.discount ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.discount && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden space-y-2.5 pb-2"
            >
              <div className="space-y-2.5">
                {[
                  { id: 'all', label: t('all_items_no_min') },
                  { id: '10', label: t('off_or_more', { percent: '10' }) },
                  { id: '20', label: t('off_or_more', { percent: '20' }) },
                  { id: '30', label: t('off_or_more', { percent: '30' }) },
                  { id: '40', label: t('off_or_more', { percent: '40' }) }
                ].map(d => (
                  <label
                    key={d.id}
                    className="flex items-center gap-3 text-[13px] font-medium text-orange-850 hover:text-orange-955 cursor-pointer select-none group transition-colors duration-200"
                  >
                    <input
                      type="radio"
                      name="discount"
                      checked={filterDiscount === d.id}
                      onChange={() => setFilterDiscount(d.id)}
                      className="hidden"
                    />
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      filterDiscount === d.id
                        ? 'border-orange-950 bg-orange-950 text-white shadow-sm ring-2 ring-orange-200/50'
                        : 'border-orange-200 bg-white group-hover:border-orange-400 group-hover:bg-orange-50/20'
                    }`}>
                      {filterDiscount === d.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`flex items-center gap-1.5 ${filterDiscount === d.id ? 'text-orange-955 font-extrabold font-sans' : 'text-orange-700/90 font-medium group-hover:text-orange-955'}`}>
                      {d.label}
                      {d.id !== 'all' && <Tag size={12} className="text-orange-500" />}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Deal Filters (Multiple Choice) */}
      <div>
        <button
          onClick={() => toggleSection('deals')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-orange-955 mb-3.5 border-b border-orange-100 pb-2.5 hover:text-orange-600 transition-colors"
        >
          <span>{t("featured_deals")}</span>
          {openSections.deals ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {openSections.deals && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pb-2"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {dealFilters.map(d => {
                  let dealLabel = d;
                  if (d === 'all') dealLabel = t("all");
                  else if (d === 'top deals') dealLabel = t("wow_deals");
                  else if (d === 'new arrivals') dealLabel = t("whats_new");
                  else if (d === 'best sellers') dealLabel = t("best_sellers");
                  else if (d === 'top rated') dealLabel = t("trending") || "Top Rated";

                  return (
                    <button
                      key={d}
                      onClick={() => setFilterDeal(d)}
                      className={`px-3.5 py-2 rounded-full text-[10px] uppercase tracking-wider font-extrabold transition-all border-2 ${
                        filterDeal === d
                          ? 'bg-orange-900 text-white border-orange-900 shadow-sm'
                          : 'bg-white text-orange-500 border-orange-100 hover:border-orange-300'
                      }`}
                    >
                      {dealLabel}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset Filter Button */}
      <button
        onClick={handleClearFilters}
        className="w-full py-3.5 border-2 border-dashed border-orange-200 hover:border-orange-400 text-orange-700 hover:text-orange-955 hover:bg-orange-50/30 text-xs uppercase tracking-widest font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm animate-pulse-subtle"
      >
        <RotateCcw size={14} className="stroke-[2.5px]" />
        {t("reset_filters")}
      </button>
    </div>
  );

  if (loading && sellerProducts.length === 0) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-orange-300">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold">Synchronizing Boutique Catalog...</p>
      </div>
    );
  }

  return (
    <section id="product-grid" className="py-14 bg-[#fdfbf9]">
      <div className="max-w-[1800px] mx-auto px-6 sm:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-orange-100/70 pb-8 mb-10">
          <div>
            <h2 className="text-3xl font-light tracking-tight text-orange-900 mb-2">{t("featured_deals") || "Catalog Showcase"}</h2>
            <p className="text-orange-500 text-sm font-normal">{t("explore_all_products") || "Discover handpicked premium products."}</p>
          </div>

          {/* Desktop Toolbar Elements */}
          <div className="flex items-center gap-4">
            {/* Active filters pill box overview */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="hidden lg:flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-orange-500 border border-orange-200 px-3 py-1.5 rounded-full hover:border-orange-500 hover:text-orange-900 transition-all cursor-pointer"
              >
                {t("reset_filters")} ({activeFiltersCount})
              </button>
            )}

            {/* Sorting Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-xs font-bold text-orange-700 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
            >
              <option value="featured">{t("featured")}</option>
              <option value="low">{t("price_low_high")}</option>
              <option value="high">{t("price_high_low")}</option>
            </select>

            {/* Mobile Filter Trigger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden flex items-center gap-2 bg-orange-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              {t("filter_by")}
            </button>
          </div>
        </div>

        {/* Active Filters Row */}
        {activeFiltersList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-orange-50/40 p-4 border border-orange-100/50 rounded-2xl w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-955 mr-2 flex items-center gap-1.5">
              <Filter size={12} className="text-orange-600" /> {t("active_filters")}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeFiltersList.map((pill) => (
                <span
                  key={pill.id}
                  className="flex items-center gap-1.5 bg-white border border-orange-200 text-orange-955 text-[10px] font-bold uppercase tracking-wider pl-3.5 pr-2 py-1.5 rounded-full hover:border-orange-500 hover:text-orange-900 transition-all shadow-sm"
                >
                  {pill.label}
                  <button
                    onClick={pill.clear}
                    className="hover:bg-orange-100 p-0.5 rounded-full text-orange-400 hover:text-orange-850 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-[9px] uppercase tracking-widest font-black text-orange-600 hover:text-orange-955 hover:underline px-3 py-1 cursor-pointer transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start min-h-[85vh]">
          
          {/* 1. Left Column: Desktop Filter Sidebar */}
          <aside className="hidden md:block w-72 flex-shrink-0 sticky top-24 self-start bg-white border border-orange-100 rounded-3xl p-6 shadow-sm shadow-orange-100/5">
            {renderSidebarContent()}
          </aside>

          {/* 2. Right Column: Products Display Grid */}
          <div className="flex-grow w-full md:w-auto">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12">
                <AnimatePresence mode='popLayout'>
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={product.product_id || product.id}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-24 text-center bg-white border border-orange-100/50 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <SlidersHorizontal size={24} className="stroke-[1.5] animate-pulse-subtle" />
                </div>
                <p className="text-orange-955 text-sm uppercase tracking-wider font-extrabold block mb-3">
                  {urlSearchQuery ? `No matches for "${urlSearchQuery}"` : 'No Products Match Selected Filters'}
                </p>
                <p className="text-orange-500/80 text-xs font-light max-w-sm mx-auto mb-8 leading-relaxed">
                  {urlSearchQuery 
                    ? "We couldn't find any items matching your search query. Please double-check spelling, try more general keywords, or reset the catalog search."
                    : "No boutique items match your current selection of department, price range, color, or discount filters. Reset the filters to browse all pieces."}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-900 hover:bg-orange-955 text-white text-xs uppercase tracking-widest font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer group"
                >
                  <RotateCcw size={12} className="stroke-[2.5px] group-hover:rotate-180 transition-transform duration-500" />
                  {urlSearchQuery ? 'Reset Search & Filters' : 'Clear All Filters'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Mobile Sheet Filter Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-orange-950/40 z-50 md:hidden"
              />
              {/* Bottom Sheet Slider */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[2.5rem] shadow-2xl z-50 p-6 overflow-y-auto no-scrollbar md:hidden border-t border-orange-100"
              >
                {/* Horizontal notch */}
                <div className="w-12 h-1 bg-orange-100 rounded-full mx-auto mb-5" />
                
                {/* Modal Title Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-orange-900" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-orange-950">Filters & Refinements</h3>
                  </div>
                  <button 
                    onClick={() => setMobileSidebarOpen(false)} 
                    className="text-xs font-black uppercase tracking-widest text-orange-400 hover:text-orange-950 transition-colors"
                  >
                    Done
                  </button>
                </div>

                {/* Sidebar controls */}
                <div className="pb-8">
                  {renderSidebarContent()}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

export default ProductGrid;
