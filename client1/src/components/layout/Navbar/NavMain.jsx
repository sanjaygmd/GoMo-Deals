import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { Search, User, Heart, ShoppingCart, Menu, X, ShieldCheck, ShoppingBag, Package, Bell, CheckCircle2, AlertTriangle, Info, Mail, MapPin, ChevronDown, ChevronRight, Clock, Tag, Truck, XCircle, RefreshCw, Globe, Crown, History } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import gmdLogo from '../../../assets/GMD_Logo.png';
import { useShop } from '../../../context/ShopContext';
import { useAuth } from '../../../context/AuthContext';
import * as authService from '../../../services/authService';
import { ProductContext } from '../../../context/ProductContext/ProductContext';
import { categorySubcategories } from '../../../data/categories';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomerNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../../services/notificationService';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';

const NavMain = ({ scrolled, isHome }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCategory, setSearchCategory] = useState('all');
    const [searchHistory, setSearchHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('shopping_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [shoppingHistoryOpen, setShoppingHistoryOpen] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [allMenuOpen, setAllMenuOpen] = useState(false);
    const [expandedDept, setExpandedDept] = useState(null);
    const [expandedMobileDept, setExpandedMobileDept] = useState(null);
    const [showFleaDropdown, setShowFleaDropdown] = useState(false);
    const fleaDropdownRef = useRef(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [hoveredCat, setHoveredCat] = useState(null);         // key of hovered category
    const [catDropdownPos, setCatDropdownPos] = useState({ top: 0, left: 0 }); // portal position
    const catAnchorRefs = useRef({});  // map of cat.key → DOM element ref
    const catHoverTimer = useRef(null); // debounce timer to avoid flicker

    const searchContainerRef = useRef(null);
    const countryContainerRef = useRef(null);
    const languageContainerRef = useRef(null);
    const subnavRef = useRef(null);

    // Flea Market commodity categories for the dropdown
    const FLEA_CATEGORIES = [
        { slug: 'all', label: 'All Products' },
        { slug: 'dal', label: 'Dal' },
        { slug: 'paruppu', label: 'Paruppu' },
        { slug: 'rice', label: 'Rice' },
        { slug: 'wheat', label: 'Wheat' },
        { slug: 'maize', label: 'Maize / Corn' },
        { slug: 'groundnut', label: 'Groundnut' },
        { slug: 'sesame', label: 'Sesame Seeds' },
        { slug: 'black-pepper', label: 'Black Pepper' },
        { slug: 'turmeric', label: 'Turmeric' },
        { slug: 'coriander', label: 'Coriander Seeds' },
        { slug: 'cumin', label: 'Cumin' },
        { slug: 'sugar', label: 'Sugar' },
    ];

    const handleFleaCategoryClick = (slug) => {
        setShowFleaDropdown(false);
        navigate(`/flea-market?category=${slug}`);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setSearchOpen(false);
                setShowCategoryDropdown(false);
            }
            if (countryContainerRef.current && !countryContainerRef.current.contains(event.target)) {
                setShowCountryDropdown(false);
            }
            if (languageContainerRef.current && !languageContainerRef.current.contains(event.target)) {
                setShowLanguageDropdown(false);
            }
            if (fleaDropdownRef.current && !fleaDropdownRef.current.contains(event.target)) {
                setShowFleaDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const subnav = subnavRef.current;
        if (!subnav) return;

        const handleWheel = (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                subnav.scrollLeft += e.deltaY;
            }
        };

        subnav.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            subnav.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const {
        cartCount,
        wishlist,
        cartDrawerOpen,
        setCartDrawerOpen,
        wishlistDrawerOpen,
        setWishlistDrawerOpen,
        selectedCountry,
        changeCountry,
        countriesList,
        formatPrice,
        language,
        languagesList,
        changeLanguage,
        t
    } = useShop();
    const { user, logout: localLogout } = useAuth();
    const { products: sellerProducts, fetchProducts: fetchSellerProducts } = useContext(ProductContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const searchCategories = [
        { value: 'all', label: 'All Departments' },
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
    ];

    const fetchNotifications = async () => {
        if (user && (user.customer_id || user.id)) {
            const res = await getCustomerNotifications(user.customer_id || user.id);
            if (res.success) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter(n => !n.is_read).length);
            }
        }
    };

    const handleMarkAsRead = async (id) => {
        const res = await markNotificationAsRead(id);
        if (res.success) {
            fetchNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        if (user && (user.customer_id || user.id)) {
            const res = await markAllNotificationsAsRead(user.customer_id || user.id);
            if (res.success) {
                fetchNotifications();
            }
        }
    };

    const handleDelete = async (id) => {
        const res = await deleteNotification(id);
        if (res.success) {
            fetchNotifications();
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000); // 20s live update poll
        return () => clearInterval(interval);
    }, [user]);

    // Synchronize navbar search query and category input fields with URL parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search') || '';
        const cat = params.get('category') || 'all';
        setSearchQuery(search);
        setSearchCategory(cat);
    }, [location.search]);

    const activeDeal = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('deal')?.toLowerCase() || '';
    }, [location.search]);

    const activeCategory = useMemo(() => {
        if (location.pathname.startsWith('/collection/')) {
            return location.pathname.substring('/collection/'.length).toLowerCase();
        }
        return '';
    }, [location.pathname]);


    useEffect(() => {
        if (searchOpen && (!sellerProducts || sellerProducts.length === 0)) {
            if (typeof fetchSellerProducts === 'function') {
                fetchSellerProducts();
            }
        }
    }, [searchOpen, sellerProducts, fetchSellerProducts]);



    const handleLogout = async () => {
        try {
            await authService.logout();
            localLogout();
            navigate('/login');
        } catch (err) {
            console.error("LOGOUT ERROR:", err);
            localLogout(); // Still logout locally
            navigate('/login');
        }
    };

    const handleSearchFocus = () => {
        setSearchOpen(true);
        if (!sellerProducts || sellerProducts.length === 0) {
            if (typeof fetchSellerProducts === 'function') {
                fetchSellerProducts();
            }
        }
    };

    const filteredSearch = useMemo(() => {
        if (!searchQuery.trim() || !sellerProducts) return [];
        const q = searchQuery.toLowerCase().trim();

        return sellerProducts.filter(p => {
            // Check department category filter if category selected is not 'all'
            if (searchCategory !== 'all') {
                const catClean = (p.category_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const searchClean = searchCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!catClean.includes(searchClean)) {
                    return false;
                }
            }

            // Check direct name match
            if ((p.name || '').toLowerCase().includes(q)) return true;

            // Check brand match
            if ((p.brand || '').toLowerCase().includes(q)) return true;

            // Check description match
            if ((p.description || '').toLowerCase().includes(q)) return true;

            // Check occasion/recipient match
            if ((p.recipient || '').toLowerCase().includes(q)) return true;
            if ((p.occasion || '').toLowerCase().includes(q)) return true;

            // Check color/size match
            if ((p.color || '').toLowerCase().includes(q)) return true;
            if ((p.size || '').toLowerCase().includes(q)) return true;

            // Check tags match
            if ((p.tags || '').toLowerCase().includes(q)) return true;

            return false;
        });
    }, [searchQuery, searchCategory, sellerProducts]);

    const scrollToGrid = () => {
        if (!isHome) {
            navigate('/');
            setTimeout(() => {
                const grid = document.getElementById('product-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const grid = document.getElementById('product-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setSearchOpen(false);

        if (searchQuery.trim()) {
            setSearchHistory(prev => {
                const query = searchQuery.trim();
                const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10);
                localStorage.setItem('shopping_history', JSON.stringify(newHistory));
                return newHistory;
            });
        }

        const targetUrl = `/?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(searchCategory)}`;

        if (location.pathname !== '/') {
            navigate(targetUrl);
            setTimeout(() => {
                const grid = document.getElementById('product-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth' });
            }, 200);
        } else {
            navigate(targetUrl);
            const grid = document.getElementById('product-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDealClick = (dealName) => {
        setAllMenuOpen(false);
        const targetUrl = `/?deal=${encodeURIComponent(dealName)}`;

        if (location.pathname !== '/') {
            navigate(targetUrl);
            setTimeout(() => {
                const grid = document.getElementById('product-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth' });
            }, 200);
        } else {
            navigate(targetUrl);
            const grid = document.getElementById('product-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    };


    const scrollToFeatured = () => {
        if (!isHome) {
            navigate('/');
            setTimeout(() => {
                const section = document.getElementById('product-grid');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const section = document.getElementById('product-grid');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <div className="w-full flex flex-col bg-white">
                {/* Row 1: Main Header */}
                <div className={`w-full flex items-center justify-between gap-2 md:gap-5 px-2 sm:px-4 md:px-8 border-b border-orange-100/40 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-[0_2px_15px_rgba(249,115,22,0.015)] relative z-50 ${scrolled ? 'py-1 shadow-sm shadow-orange-500/5' : 'py-1.5 md:py-2'}`}>
                    {/* Logo, Hamburger & Delivery Locator Group */}
                    <div className="flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 flex-shrink-0">
                        {/* Logo & Mobile Menu Hamburger */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button className="md:hidden text-orange-900/80 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-100/50 hover:shadow-[0_2px_8px_rgba(249,115,22,0.06)] p-1.5 rounded-full transition-all duration-300 active:scale-90" onClick={() => setMobileMenuOpen(true)}>
                                <Menu size={22} strokeWidth={1.5} />
                            </button>
                            <Link to="/" className="flex items-center overflow-visible transition-transform duration-300 active:scale-98">
                                <img
                                    src={gmdLogo}
                                    alt="GoMo Deals Logo"
                                    className="h-auto w-auto max-w-[100px] sm:max-w-[140px] md:max-w-[200px] max-h-16 md:max-h-20 object-contain transition-all duration-300 hover:scale-[1.05] hover:brightness-105 active:scale-95 filter drop-shadow(0 4px 15px rgba(234, 88, 12, 0.22))"
                                    style={{ contentVisibility: 'auto' }}
                                />
                            </Link>
                        </div>

                        {/* Delivery Locator - Interactive Country Picker */}
                        <div
                            ref={countryContainerRef}
                            className="relative hidden lg:block flex-shrink-0"
                        >
                            <div
                                onClick={() => {
                                    setShowCountryDropdown(!showCountryDropdown);
                                    setShowLanguageDropdown(false);
                                    setShowCategoryDropdown(false);
                                    setSearchOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-orange-100 bg-orange-50/15 hover:bg-[#fff9f6] hover:border-orange-300 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-[0_4px_16px_rgba(249,115,22,0.06)] hover:-translate-y-0.5 select-none"
                            >
                                <div className="w-7.5 h-7.5 rounded-full bg-orange-100/60 flex items-center justify-center text-orange-600 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_2.5px_8px_rgba(249,115,22,0.3)] flex-shrink-0">
                                    <span className="text-[13px] font-sans leading-none">{selectedCountry.flag}</span>
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[8.5px] text-orange-400 uppercase tracking-widest leading-none font-bold">{t("deliver_to")}</span>
                                    <span className="text-[11px] font-extrabold text-orange-955 leading-tight transition-colors group-hover:text-orange-600 flex items-center gap-1">
                                        <span>{selectedCountry.name}</span>
                                        <ChevronDown size={10} className={`text-orange-400 group-hover:text-orange-600 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showCountryDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute top-[calc(100%+8px)] left-0 w-52 bg-white/95 backdrop-blur-md border border-orange-100 shadow-[0_12px_36px_rgba(249,115,22,0.16)] rounded-2xl py-3 z-[150] overflow-hidden"
                                    >
                                        <div className="px-4 py-2 border-b border-orange-50/60 mb-1.5">
                                            <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black leading-none">{t("select_location")}</p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
                                            {countriesList.map(country => (
                                                <button
                                                    key={country.name}
                                                    type="button"
                                                    onClick={() => {
                                                        changeCountry(country.name);
                                                        setShowCountryDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all flex items-center justify-between group/item cursor-pointer border border-transparent ${selectedCountry.name === country.name
                                                            ? 'bg-orange-50/50 text-orange-600 font-extrabold border-orange-100/30'
                                                            : 'text-orange-955 hover:text-orange-600 font-bold'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[15px]">{country.flag}</span>
                                                        <span className="text-[11.5px] uppercase tracking-wider">{country.name}</span>
                                                    </div>
                                                    <span className="text-[9px] text-orange-400 group-hover/item:text-orange-600 bg-orange-50/40 px-1.5 py-0.5 rounded border border-orange-100/10 font-bold uppercase tracking-wider">
                                                        {country.symbol} ({country.currency})
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Interactive Language Picker */}
                        <div
                            ref={languageContainerRef}
                            className="relative hidden lg:block flex-shrink-0"
                        >
                            <div
                                onClick={() => {
                                    setShowLanguageDropdown(!showLanguageDropdown);
                                    setShowCountryDropdown(false);
                                    setShowCategoryDropdown(false);
                                    setSearchOpen(false);
                                }}
                                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-orange-100 bg-orange-50/15 hover:bg-[#fff9f6] hover:border-orange-300 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-[0_4px_16px_rgba(249,115,22,0.06)] hover:-translate-y-0.5 select-none"
                            >
                                <div className="w-7.5 h-7.5 rounded-full bg-orange-100/60 flex items-center justify-center text-orange-600 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_2.5px_8px_rgba(249,115,22,0.3)] flex-shrink-0">
                                    <span className="text-[13px] font-sans leading-none">{(languagesList.find(l => l.code === language) || languagesList[0]).flag}</span>
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[8.5px] text-orange-400 uppercase tracking-widest leading-none font-bold">{t("interface_language")}</span>
                                    <span className="text-[11px] font-extrabold text-orange-955 leading-tight transition-colors group-hover:text-orange-600 flex items-center gap-1">
                                        <span>{(languagesList.find(l => l.code === language) || languagesList[0]).nativeName}</span>
                                        <ChevronDown size={10} className={`text-orange-400 group-hover:text-orange-600 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showLanguageDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute top-[calc(100%+8px)] left-0 w-52 bg-white/95 backdrop-blur-md border border-orange-100 shadow-[0_12px_36px_rgba(249,115,22,0.16)] rounded-2xl py-3 z-[150] overflow-hidden"
                                    >
                                        <div className="px-4 py-2 border-b border-orange-50/60 mb-1.5">
                                            <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black leading-none">{t("interface_language")}</p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
                                            {languagesList.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => {
                                                        changeLanguage(lang.code);
                                                        setShowLanguageDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all flex items-center justify-between group/item cursor-pointer border border-transparent ${language === lang.code
                                                            ? 'bg-orange-50/50 text-orange-600 font-extrabold border-orange-100/30'
                                                            : 'text-orange-955 hover:text-orange-600 font-bold'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[15px]">{lang.flag}</span>
                                                        <span className="text-[11.5px] uppercase tracking-wider">{lang.nativeName}</span>
                                                    </div>
                                                    {language === lang.code && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Redesigned Central Luxury Search Bar */}
                    <div ref={searchContainerRef} className={`hidden md:flex flex-1 items-center max-w-xl relative ${searchOpen ? 'z-[141]' : 'z-30'}`}>
                        <div className="flex items-center w-full rounded-md border border-orange-200 bg-orange-50/5 hover:bg-orange-50/10 focus-within:bg-white shadow-[0_2px_10px_rgba(249,115,22,0.01)] focus-within:shadow-[0_6px_24px_rgba(249,115,22,0.08)] focus-within:border-orange-500 transition-all duration-300 h-10 group/search-bar">

                            {/* Custom Category Dropdown Selector */}
                            <div className="relative flex-shrink-0 h-full flex items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryDropdown(!showCategoryDropdown);
                                        setSearchOpen(false);
                                    }}
                                    className="pl-4 pr-3 py-2 bg-orange-50/30 hover:bg-orange-100/40 border-r border-orange-100/50 transition-all duration-200 h-full flex items-center gap-1.5 text-[10px] text-orange-955 font-extrabold uppercase tracking-wider focus:outline-none cursor-pointer rounded-l-md"
                                >
                                    <span>{t((searchCategories.find(c => c.value === searchCategory) || searchCategories[0]).value)}</span>
                                    <ChevronDown size={11} className={`text-orange-600 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showCategoryDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute top-[calc(100%+8px)] left-0 w-48 bg-white border-2 border-orange-200 shadow-[0_12px_36px_rgba(249,115,22,0.16)] rounded-md py-2 z-[150] overflow-hidden"
                                        >
                                            {searchCategories.map(cat => (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchCategory(cat.value);
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${searchCategory === cat.value
                                                            ? 'bg-orange-50 text-orange-600 font-extrabold'
                                                            : 'text-orange-955 hover:bg-orange-50/50 hover:text-orange-600'
                                                        }`}
                                                >
                                                    <span>{t(cat.value)}</span>
                                                    {searchCategory === cat.value && <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Search Input Box */}
                            <div className="flex-1 flex items-center px-3.5 h-full">
                                <Search size={14} className="text-orange-450/70 mr-2 flex-shrink-0 transition-colors group-focus-within/search-bar:text-orange-500" />
                                <input
                                    id="navbar-search-input"
                                    type="text"
                                    value={searchQuery}
                                    onFocus={() => {
                                        handleSearchFocus();
                                        setShowCategoryDropdown(false);
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearchFocus();
                                    }}
                                    placeholder={t("search_placeholder")}
                                    className="bg-transparent text-xs font-semibold w-full focus:outline-none text-orange-955 placeholder-orange-300/80"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                                        className="transition-all duration-200 text-orange-400 hover:text-orange-600 p-1.5 rounded-full hover:bg-orange-100/60 hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Premium Boxy Action Button */}
                            <button
                                onClick={handleSearchSubmit}
                                className="h-full px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center text-white cursor-pointer transition-all duration-300 rounded-r-md group/btn flex-shrink-0 border-l border-orange-100/50 hover:shadow-[inset_0_-2px_10px_rgba(0,0,0,0.05)] active:brightness-95"
                            >
                                <Search size={15} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform duration-200" />
                            </button>
                        </div>

                        {/* Search Autocomplete Suggestions Popup */}
                        <AnimatePresence>
                            {searchOpen && searchQuery.trim() !== '' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[125%] max-w-2xl bg-white z-[150] shadow-[0_20px_50px_rgba(249,115,22,0.2)] border-2 border-orange-200 rounded-md overflow-hidden p-6 max-h-[60vh] overflow-y-auto custom-scrollbar"
                                >
                                    <div className="flex items-center justify-between mb-4 border-b border-orange-100 pb-2">
                                        <span className="text-[12px] font-extrabold uppercase tracking-wider text-orange-900">{t("search_results")}</span>
                                        <span className="text-[12px] font-extrabold uppercase tracking-wider text-orange-600">{t("matches", { count: filteredSearch.length })}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                                        {filteredSearch.slice(0, 8).map(product => (
                                            <Link
                                                to={`/product/${product.product_id}`}
                                                key={product.product_id}
                                                onClick={() => setSearchQuery('')}
                                                className="group flex flex-col gap-2.5 p-1.5 rounded-xl hover:bg-orange-50/40 transition-all duration-300 text-left"
                                            >
                                                <div className="aspect-[3/4] bg-orange-50 overflow-hidden rounded-lg border border-orange-100/40 shadow-sm relative">
                                                    <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                </div>
                                                <div className="text-left px-0.5">
                                                    <h4 className="text-[12px] uppercase tracking-wide font-extrabold text-orange-950 line-clamp-1 group-hover:text-orange-600 transition-colors">{product.name}</h4>
                                                    <p className="text-[12px] text-orange-700 mt-0.5 font-black">{formatPrice(product.price)}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {filteredSearch.length === 0 && (
                                        <div className="py-12 text-center space-y-3">
                                            <Search size={22} className="mx-auto text-orange-300" strokeWidth={1.5} />
                                            <p className="text-[12px] font-extrabold uppercase tracking-wide text-orange-600">No results found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                            {searchOpen && searchQuery.trim() === '' && searchHistory.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[125%] max-w-2xl bg-white z-[150] shadow-[0_20px_50px_rgba(249,115,22,0.2)] border-2 border-orange-200 rounded-md overflow-hidden"
                                >
                                    <div className="px-5 py-4 border-b border-orange-100/60 bg-gradient-to-br from-white to-orange-50/30 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                <History size={12} strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-955">Recent Searches</h3>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <div className="flex flex-col">
                                            {searchHistory.map((query, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSearchQuery(query);
                                                        setSearchOpen(false);
                                                        navigate(`/?search=${encodeURIComponent(query)}&category=${encodeURIComponent(searchCategory)}`);
                                                    }}
                                                    className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50/50 border-b border-orange-50/40 last:border-0 transition-colors text-left"
                                                >
                                                    <History size={14} className="text-orange-400" />
                                                    <span className="text-xs font-semibold text-orange-900 truncate">{query}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Header Navigation: Accounts, Returns, Wishlist & Cart */}
                    <div className="flex items-center justify-end gap-1.5 sm:gap-3 md:gap-4 flex-shrink-0">
                        {/* Account Menu */}
                        <div
                            className="relative hidden md:block cursor-pointer py-1.5 px-3 rounded-full hover:bg-gradient-to-r hover:from-white hover:to-orange-50/20 border border-transparent hover:border-orange-200/60 hover:shadow-[0_4px_12px_rgba(249,115,22,0.03)] transition-all duration-300 group"
                            onMouseEnter={() => setShowAccountMenu(true)}
                            onMouseLeave={() => setShowAccountMenu(false)}
                        >
                            <div className="flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded-full bg-orange-100/60 flex items-center justify-center text-orange-600 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_2.5px_8px_rgba(249,115,22,0.28)] flex-shrink-0">
                                    <User size={13} className="group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[9px] text-orange-400 uppercase tracking-widest leading-none font-bold">
                                        {user ? `${t("welcome").split(",")[0]}, ${(user.full_name || user.name || user.store_name || 'Partner').split(' ')[0]}` : t("hello_sign_in")}
                                    </span>
                                    <span className="text-[11px] font-extrabold text-orange-955 leading-tight flex items-center gap-0.5">
                                        {t("account_lists")} <ChevronDown size={9} className="text-orange-400 group-hover:rotate-180 transition-transform duration-350" />
                                    </span>
                                </div>
                            </div>

                            {showAccountMenu && (
                                <div className="absolute top-full right-0 pt-2.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="bg-white/95 backdrop-blur-md border border-orange-100 shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-2xl py-3 w-56 overflow-hidden">
                                        <div className="px-5 py-2.5 mb-2 border-b border-orange-50/60 bg-orange-50/20">
                                            <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black">
                                                {user ? `${t("welcome")}, ${(user.full_name || user.name || user.store_name || 'Partner')}` : t("account")}
                                            </p>
                                        </div>

                                        {!user ? (
                                            <div className="flex flex-col px-1.5 gap-0.5">
                                                <Link to="/login" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-900 group-hover/item:scale-125 transition-transform" />
                                                    <span className="text-[10px] uppercase tracking-wider">Customer Login</span>
                                                </Link>
                                                <Link to="/seller-login" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover/item:scale-125 transition-transform" style={{ backgroundColor: '#ea580c' }} />
                                                    <span className="text-[10px] uppercase tracking-wider">Seller Login</span>
                                                </Link>
                                                <Link to="/admin-login" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover/item:scale-125 transition-transform" />
                                                    <span className="text-[10px] uppercase tracking-wider">Admin Login</span>
                                                </Link>
                                                <Link to="/membership" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                    <span className="text-[10px] uppercase tracking-wider">Membership Benefits</span>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col px-1.5 gap-0.5">
                                                {(user.role === 'admin' || user.role === 'super_admin') && (
                                                    <Link to="/admin" className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 font-black border-b border-orange-50/60">
                                                        <ShieldCheck size={14} className="text-orange-900" />
                                                        <span className="text-[10px] uppercase tracking-wider text-orange-900">{t("admin_dashboard")}</span>
                                                    </Link>
                                                )}
                                                {user.role !== 'admin' && user.role !== 'super_admin' && (
                                                    <>
                                                        <Link to="/profile" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                            <User size={13} strokeWidth={2} className="text-orange-600 group-hover/item:scale-110 transition-transform" />
                                                            <span className="text-[10px] uppercase tracking-wider">{t("my_profile")}</span>
                                                        </Link>
                                                        <Link to="/my-orders" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/10 rounded-xl transition-all text-orange-955 hover:text-orange-600 font-bold border border-transparent hover:border-orange-100/30 group/item">
                                                            <ShoppingBag size={13} strokeWidth={2} className="text-orange-600 group-hover/item:scale-110 transition-transform" />
                                                            <span className="text-[10px] uppercase tracking-wider">{t("my_orders")}</span>
                                                        </Link>
                                                        <Link to="/membership" className="flex items-center gap-3 px-3.5 py-2 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50/30 rounded-xl transition-all text-orange-955 hover:text-amber-600 font-bold border border-transparent hover:border-amber-100/40 group/item">
                                                            <span className="text-sm">{
                                                                user?.membership === 'platinum' ? '💎' :
                                                                    user?.membership === 'gold' ? '👑' :
                                                                        user?.membership === 'silver' ? '⭐' : '🛍️'
                                                            }</span>
                                                            <span className="text-[10px] uppercase tracking-wider">Membership</span>
                                                        </Link>
                                                    </>
                                                )}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-red-50 rounded-xl transition-all text-red-500 text-left border border-transparent hover:border-red-100/30 border-t border-orange-50/60 mt-1 cursor-pointer font-bold"
                                                >
                                                    <X size={13} strokeWidth={2} />
                                                    <span className="text-[10px] uppercase tracking-wider">{t("logout")}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live Notifications (Bell) */}
                        {user && (user.role !== 'admin' && user.role !== 'super_admin') && (
                            <div className="relative flex items-center">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center border border-transparent hover:border-orange-100/80 hover:bg-white text-orange-955 hover:text-orange-600 hover:scale-105 hover:shadow-[0_4px_12px_rgba(249,115,22,0.06)] active:scale-95 transition-all duration-300 relative p-0 cursor-pointer hover-bell-shake"
                                >
                                    <Bell size={20} strokeWidth={1.5} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse shadow-[0_2px_4px_rgba(234,88,12,0.25)]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {notificationsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute top-full right-[-16px] sm:right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-96 bg-white border border-orange-100 z-[200] overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(234,88,12,0.08),0_4px_12px_rgba(0,0,0,0.03)] text-neutral-800"
                                        >
                                            {/* Header */}
                                            <div className="p-4 border-b border-orange-100/60 flex justify-between items-center bg-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-neutral-900">Updates</span>
                                                    {unreadCount > 0 && (
                                                        <span className="bg-orange-50 text-orange-600 text-[9px] px-2 py-0.5 font-bold rounded-full border border-orange-100/80">
                                                            {unreadCount} new
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {notifications.length > 0 && (
                                                        <button
                                                            onClick={handleMarkAllAsRead}
                                                            className="text-[9.5px] uppercase tracking-wider font-extrabold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer hover:underline"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                    <button onClick={() => setNotificationsOpen(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-50 cursor-pointer">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Cards list */}
                                            <div className="max-h-[280px] sm:max-h-[380px] overflow-y-auto py-2.5 px-3.5 custom-scrollbar bg-white space-y-2">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notification) => {
                                                        const isUnread = !notification.is_read;

                                                        // Determine dynamic icon, title, and color scheme based on notification.type
                                                        let IconComponent = Info;
                                                        let iconBgColor = "bg-amber-50 text-amber-600 border-amber-100";
                                                        let typeLabel = "Info";

                                                        if (notification.type === 'offer_update') {
                                                            IconComponent = Tag;
                                                            iconBgColor = "bg-orange-50 text-orange-600 border-orange-100";
                                                            typeLabel = "Bargain offer";
                                                        } else if (notification.type === 'order_shipped') {
                                                            IconComponent = Truck;
                                                            iconBgColor = "bg-blue-50 text-blue-600 border-blue-100";
                                                            typeLabel = "Shipped";
                                                        } else if (notification.type === 'order_delivered') {
                                                            IconComponent = CheckCircle2;
                                                            iconBgColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                                            typeLabel = "Delivered";
                                                        } else if (notification.type === 'order_cancelled') {
                                                            IconComponent = XCircle;
                                                            iconBgColor = "bg-rose-50 text-rose-600 border-rose-100";
                                                            typeLabel = "Cancelled";
                                                        } else if (notification.type === 'return_update') {
                                                            IconComponent = RefreshCw;
                                                            iconBgColor = "bg-purple-50 text-purple-600 border-purple-100";
                                                            typeLabel = "Return request";
                                                        } else if (notification.type === 'order_update') {
                                                            IconComponent = ShoppingBag;
                                                            iconBgColor = "bg-orange-50 text-orange-600 border-orange-100";
                                                            typeLabel = "Order update";
                                                        }

                                                        return (
                                                            <div
                                                                key={notification.notification_id}
                                                                className={`p-3 rounded-xl border transition-all duration-200 relative group flex gap-3 text-left ${isUnread
                                                                        ? 'bg-orange-50/40 hover:bg-orange-50/70 border-orange-100/70 border-l-[3.5px] border-l-orange-500 shadow-sm'
                                                                        : 'bg-white hover:bg-neutral-50/50 border-neutral-100 border-l-[3.5px] border-l-neutral-200 shadow-none'
                                                                    }`}
                                                            >
                                                                {/* Left side: Icon */}
                                                                <div className="flex-shrink-0">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${iconBgColor}`}>
                                                                        <IconComponent size={13} strokeWidth={2} />
                                                                    </div>
                                                                </div>

                                                                {/* Right side: Message & Actions */}
                                                                <div className="flex-grow space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`text-[8.5px] uppercase tracking-wider font-extrabold ${isUnread ? 'text-orange-600' : 'text-neutral-400'}`}>
                                                                            {typeLabel}
                                                                        </span>
                                                                        {isUnread && (
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                                        )}
                                                                    </div>
                                                                    <p className={`text-[12px] leading-relaxed transition-colors duration-200 ${isUnread ? 'font-bold text-neutral-900' : 'text-neutral-500 font-medium'}`}>
                                                                        {notification.message}
                                                                    </p>
                                                                    <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100/80 mt-1.5">
                                                                        <span className="text-[8.5px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                                                            <Clock size={9} className="text-neutral-400" />
                                                                            {new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                            {isUnread && (
                                                                                <button
                                                                                    onClick={() => handleMarkAsRead(notification.notification_id)}
                                                                                    className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer hover:underline"
                                                                                >
                                                                                    Mark Read
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleDelete(notification.notification_id)}
                                                                                className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer hover:underline"
                                                                            >
                                                                                Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="py-12 text-center space-y-3">
                                                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto border border-orange-100/60 shadow-sm">
                                                            <Bell size={20} strokeWidth={1.5} className="text-orange-500" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-800">{t("all_caught_up")}</p>
                                                            <p className="text-[9.5px] text-neutral-400 font-semibold uppercase tracking-wide">{t("no_updates")}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="p-3 bg-neutral-50/50 border-t border-orange-100/50 text-center">
                                                <button
                                                    onClick={() => { setNotificationsOpen(false); navigate('/profile'); }}
                                                    className="w-full py-2 rounded-lg border border-orange-200 bg-white hover:bg-orange-50/50 text-[10px] font-extrabold uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-all shadow-sm cursor-pointer active:scale-98"
                                                >
                                                    {t("view_all_notifications")}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Shopping History */}
                        <div className="relative hidden sm:flex items-center">
                            <button
                                onClick={() => setShoppingHistoryOpen(!shoppingHistoryOpen)}
                                className="w-9 h-9 rounded-full flex items-center justify-center border border-transparent hover:border-orange-100/80 hover:bg-white text-orange-955 hover:text-orange-600 hover:scale-105 hover:shadow-[0_4px_12px_rgba(249,115,22,0.06)] active:scale-95 transition-all duration-300 relative p-0 cursor-pointer"
                                title="Shopping History"
                            >
                                <History size={20} strokeWidth={1.5} />
                            </button>

                            <AnimatePresence>
                                {shoppingHistoryOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute top-[calc(100%+12px)] right-0 w-[280px] bg-white border border-orange-200 rounded-2xl shadow-[0_20px_50px_rgba(249,115,22,0.15)] z-[150] overflow-hidden"
                                    >
                                        <div className="px-5 py-4 border-b border-orange-100/60 bg-gradient-to-br from-white to-orange-50/30 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <History size={12} strokeWidth={2.5} />
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-955">Shopping History</h3>
                                            </div>
                                            {searchHistory.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSearchHistory([]);
                                                        localStorage.removeItem('shopping_history');
                                                    }}
                                                    className="text-[9px] uppercase tracking-wider font-bold text-orange-400 hover:text-orange-600 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                                            {searchHistory.length > 0 ? (
                                                <div className="flex flex-col">
                                                    {searchHistory.map((query, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSearchQuery(query);
                                                                setShoppingHistoryOpen(false);
                                                                navigate(`/?search=${encodeURIComponent(query)}&category=all`);
                                                            }}
                                                            className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50/50 border-b border-orange-50/40 last:border-0 transition-colors text-left"
                                                        >
                                                            <Search size={14} className="text-orange-400" />
                                                            <span className="text-xs font-semibold text-orange-900 truncate">{query}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-10 text-center space-y-3">
                                                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto border border-orange-100/60 shadow-sm">
                                                        <History size={16} strokeWidth={1.5} className="text-orange-400" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-900">No History Yet</p>
                                                        <p className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide">Your recent searches will appear here.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Wishlist */}
                        <button
                            onClick={(e) => { e.preventDefault(); setWishlistDrawerOpen(true); }}
                            className="w-9 h-9 rounded-full flex items-center justify-center border border-transparent hover:border-orange-100/80 hover:bg-white text-orange-955 hover:text-orange-600 hover:scale-105 hover:shadow-[0_4px_12px_rgba(249,115,22,0.06)] active:scale-95 transition-all duration-300 flex relative p-0 hover-heart-beat cursor-pointer"
                        >
                            <Heart size={20} strokeWidth={1.5} />
                            {wishlist.length > 0 && (
                                <span className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse shadow-[0_2px_4px_rgba(234,88,12,0.25)]">
                                    {wishlist.length}
                                </span>
                            )}
                        </button>

                        {/* Cart */}
                        <button
                            onClick={(e) => { e.preventDefault(); setCartDrawerOpen(true); }}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-orange-50/30 hover:bg-gradient-to-r hover:from-white hover:to-orange-50/30 border border-orange-100/40 hover:border-orange-400 hover:shadow-[0_8px_24px_rgba(249,115,22,0.16)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group relative cursor-pointer"
                        >
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orange-100/60 text-orange-600 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(249,115,22,0.35)]" style={{ backgroundColor: 'rgba(255, 237, 213, 0.6)' }}>
                                <ShoppingCart size={16} strokeWidth={2} className="transition-all duration-300 group-hover:scale-115 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-[0_2px_5px_rgba(234,88,12,0.3)] animate-bounce-subtle group-hover:scale-110 transition-transform">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden lg:inline text-[11px] font-black uppercase tracking-wider text-orange-955 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all duration-300">{t("cart")}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar Row (visible on md:hidden) */}
                <form onSubmit={handleSearchSubmit} className="md:hidden px-4 py-3 border-b border-orange-100/40 flex items-center gap-2 bg-orange-50/5">
                    <div className="flex items-center w-full rounded-md border border-orange-200 bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(249,115,22,0.02)] focus-within:ring-2 focus-within:ring-orange-500/15 focus-within:border-orange-500 transition-all duration-300">
                        <Search size={15} className="text-orange-500 mr-2 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                            placeholder="Search products, brands and more..."
                            className="bg-transparent text-xs font-semibold w-full focus:outline-none py-0.5 text-orange-955 placeholder-orange-300"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-orange-50 transition-colors">
                                <X size={13} className="text-orange-400" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Search Autocomplete Suggestions Popup Redesigned and Moved inside Central Search Bar */}

                {/* Row 2: Sub-navigation & Departments */}
                <div className="w-full bg-orange-50/15 border-b border-orange-100/40 py-3 px-4 md:px-8 flex items-center justify-between text-[11.5px] md:text-[13px] font-black uppercase tracking-wider text-orange-955 relative z-10">

                    <div ref={subnavRef} className="flex items-center gap-6 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth select-none flex-grow">
                        <button
                            onClick={() => setAllMenuOpen(true)}
                            className="group flex items-center gap-1.5 cursor-pointer px-3.5 py-1 rounded-full bg-orange-50 hover:bg-orange-600 text-orange-955 hover:text-white border border-orange-100 hover:border-orange-600 hover:shadow-[0_3px_10px_rgba(249,115,22,0.25)] font-extrabold transition-all duration-300 active:scale-95 flex-shrink-0"
                        >
                            <Menu size={11} strokeWidth={2.5} className="text-orange-500 group-hover:text-white transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                            <span className="transition-colors duration-300">{t("all")}</span>
                        </button>
                        <button
                            onClick={() => handleDealClick('sale')}
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider ${activeDeal === 'sale'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_4px_12px_rgba(225,29,72,0.12)]'
                                    : 'text-rose-600 border-transparent bg-transparent hover:bg-rose-50/60 hover:text-rose-700 hover:border-rose-100 hover:shadow-[0_3px_10px_rgba(225,29,72,0.05)]'
                                }`}
                        >
                            {t("sale")}
                        </button>
                        <button
                            onClick={() => handleDealClick('top deals')}
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider ${activeDeal === 'top deals'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-[0_4px_12px_rgba(249,115,22,0.12)]'
                                    : 'text-orange-600 border-transparent bg-transparent hover:bg-orange-50/80 hover:text-orange-700 hover:border-orange-200/50 hover:shadow-[0_3px_10px_rgba(249,115,22,0.08)]'
                                }`}
                        >
                            {t("wow_deals")}
                        </button>



                        <button
                            onClick={() => handleDealClick('click of the week')}
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider ${activeDeal === 'click of the week'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-[0_4px_12px_rgba(249,115,22,0.12)]'
                                    : 'text-orange-955 border-transparent bg-transparent hover:bg-orange-50/60 hover:text-orange-600 hover:border-orange-200/45 hover:shadow-[0_3px_10px_rgba(249,115,22,0.05)]'
                                }`}
                        >
                            Click of the week
                        </button>
                        <button
                            onClick={() => handleDealClick('new arrivals')}
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider ${activeDeal === 'new arrivals'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-[0_4px_12px_rgba(249,115,22,0.12)]'
                                    : 'text-orange-955 border-transparent bg-transparent hover:bg-orange-50/60 hover:text-orange-600 hover:border-orange-200/45 hover:shadow-[0_3px_10px_rgba(249,115,22,0.05)]'
                                }`}
                        >
                            {t("whats_new")}
                        </button>
                        <button
                            onClick={() => handleDealClick('best sellers')}
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider ${activeDeal === 'best sellers'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-[0_4px_12px_rgba(249,115,22,0.12)]'
                                    : 'text-orange-955 border-transparent bg-transparent hover:bg-orange-50/60 hover:text-orange-600 hover:border-orange-200/45 hover:shadow-[0_3px_10px_rgba(249,115,22,0.05)]'
                                }`}
                        >
                            {t("best_sellers")}
                        </button>

                        <Link
                            to="/deals"
                            className="px-4 py-2 rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.4)]"
                        >
                            GMD Deals
                        </Link>
                        <a 
                            href={user ? `http://localhost:5174/?sso_user=${encodeURIComponent(JSON.stringify({ full_name: user.full_name || user.name || user.store_name, role: user.role, email: user.email, id: user.customer_id || user.seller_id || user.admin_id }))}` : "http://localhost:5174/"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)]"
                        >
                            Movie Tickets
                        </a>

                        <div className="w-[1px] h-4 bg-orange-200 self-center flex-shrink-0 mx-1" />

                        {[
                            { key: 'beauty', label: t('beauty'), slug: 'beauty' },
                            { key: 'books', label: t('books'), slug: 'books' },
                            { key: 'clothing', label: 'Clothing', slug: 'clothing' },
                            { key: 'electronics', label: t('electronics'), slug: 'electronics' },
                            { key: 'fashion', label: t('fashion'), slug: 'fashion' },
                            { key: 'gifts', label: 'Gifts', slug: 'gifts' },
                            { key: 'healthy-foods', label: 'Healthy Foods', slug: 'healthy-foods' },
                            { key: 'home-living', label: t('home_living'), slug: 'home-living' },
                            { key: 'kids', label: 'Kids', slug: 'kids' },
                            { key: 'mens', label: 'Mens', slug: 'mens' },
                            { key: 'pooja-items', label: 'Pooja Items', slug: 'pooja-items' },
                            { key: 'sports-fitness', label: t('sports_fitness'), slug: 'sports-fitness' },
                            { key: 'toys', label: 'Toys', slug: 'toys' },
                            { key: 'women', label: 'Women', slug: 'women' },
                        ].map(cat => (
                            <div
                                key={cat.key}
                                className="relative flex-shrink-0"
                                ref={el => { catAnchorRefs.current[cat.key] = el; }}
                                onMouseEnter={() => {
                                    clearTimeout(catHoverTimer.current);
                                    const el = catAnchorRefs.current[cat.key];
                                    if (el) {
                                        const rect = el.getBoundingClientRect();
                                        setCatDropdownPos({
                                            top: rect.bottom + 6 + window.scrollY,
                                            left: rect.left + rect.width / 2 + window.scrollX,
                                        });
                                    }
                                    setHoveredCat(cat.key);
                                }}
                                onMouseLeave={() => {
                                    catHoverTimer.current = setTimeout(() => setHoveredCat(null), 120);
                                }}
                            >
                                <Link
                                    to={`/collection/${cat.slug}`}
                                    className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider flex items-center gap-1 ${activeCategory === cat.key
                                            ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-[0_4px_12px_rgba(249,115,22,0.12)]'
                                            : 'text-orange-955 border-transparent bg-transparent hover:bg-orange-50/60 hover:text-orange-600 hover:border-orange-200/45 hover:shadow-[0_3px_10px_rgba(249,115,22,0.05)]'
                                        }`}
                                >
                                    {cat.label}
                                    <ChevronDown size={9} className={`text-orange-400 transition-transform duration-200 ${hoveredCat === cat.key ? 'rotate-180' : ''}`} />
                                </Link>
                            </div>
                        ))}

                        {/* Category subcategory dropdown — rendered in a portal to escape overflow-x-auto */}
                        {hoveredCat && categorySubcategories[hoveredCat] && createPortal(
                            <div
                                style={{ position: 'absolute', top: catDropdownPos.top, left: catDropdownPos.left, transform: 'translateX(-50%)', zIndex: 9999, width: 208 }}
                                onMouseEnter={() => clearTimeout(catHoverTimer.current)}
                                onMouseLeave={() => { catHoverTimer.current = setTimeout(() => setHoveredCat(null), 120); }}
                            >
                                <div className="bg-white border border-orange-100 shadow-[0_12px_40px_rgba(249,115,22,0.18)] rounded-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-4 py-2 border-b border-orange-50/80 mb-1">
                                        <p className="text-[8px] text-orange-400 uppercase tracking-[0.25em] font-black">
                                            {[
                                                { key: 'electronics', label: t('electronics') },
                                                { key: 'fashion', label: t('fashion') },
                                                { key: 'home-living', label: t('home_living') },
                                                { key: 'books', label: t('books') },
                                                { key: 'beauty', label: t('beauty') },
                                                { key: 'sports-fitness', label: t('sports_fitness') },
                                                { key: 'clothing', label: 'Clothing' },
                                                { key: 'mens', label: 'Mens' },
                                                { key: 'women', label: 'Women' },
                                                { key: 'kids', label: 'Kids' },
                                                { key: 'pooja-items', label: 'Pooja Items' },
                                                { key: 'toys', label: 'Toys' },
                                                { key: 'gifts', label: 'Gifts' },
                                            ].find(c => c.key === hoveredCat)?.label}
                                        </p>
                                    </div>
                                    <div className="px-1.5 space-y-0.5">
                                        {categorySubcategories[hoveredCat].map(sub => (
                                            <Link
                                                key={sub.slug}
                                                to={`/collection/${sub.slug}`}
                                                onClick={() => setHoveredCat(null)}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50/70 transition-all duration-150 group/subitem"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-orange-300 group-hover/subitem:bg-orange-500 transition-colors flex-shrink-0" />
                                                <span className="text-[11px] font-bold text-orange-900 group-hover/subitem:text-orange-600 uppercase tracking-wide transition-colors">{sub.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 mt-1 border-t border-orange-50/80">
                                        <Link
                                            to={`/collection/${hoveredCat}`}
                                            onClick={() => setHoveredCat(null)}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-700 transition-colors"
                                        >
                                            View All <ChevronRight size={9} />
                                        </Link>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>

                    {/* Flea Market Dropdown — moved to the right */}
                    <div
                        ref={fleaDropdownRef}
                        className="relative flex-shrink-0 ml-4 hidden md:block"
                        onMouseEnter={() => setShowFleaDropdown(true)}
                        onMouseLeave={() => setShowFleaDropdown(false)}
                    >
                        <button
                            className={`px-4 py-2 border rounded-full transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex-shrink-0 font-extrabold text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${location.pathname.startsWith('/flea-market')
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-[0_4px_15px_rgba(245,158,11,0.3)]'
                                    : 'bg-amber-500/10 text-amber-800 border-amber-300/45 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:border-transparent hover:shadow-[0_4px_15px_rgba(245,158,11,0.2)]'
                                }`}
                        >
                            <Globe size={11} strokeWidth={2.5} className="mr-0.5 opacity-80" />
                            Flea Market
                            <ChevronDown size={9} className={`transition-transform duration-200 opacity-70 ${showFleaDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showFleaDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white border border-amber-100 shadow-[0_16px_48px_rgba(245,158,11,0.2)] rounded-2xl py-3 z-[200] overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="px-4 py-2 border-b border-amber-50 mb-1">
                                        <p className="text-[8px] text-amber-600 uppercase tracking-[0.3em] font-black">Import / Export Exchange</p>
                                    </div>

                                    {/* Commodity Categories */}
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
                                        {FLEA_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.slug}
                                                type="button"
                                                onClick={() => handleFleaCategoryClick(cat.slug)}
                                                className="w-full text-left px-3.5 py-2 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50/20 rounded-xl transition-all flex items-center gap-2.5 group/cat cursor-pointer border border-transparent hover:border-amber-100/40"
                                            >
                                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 group-hover/cat:text-amber-700">{cat.label}</span>
                                                <ChevronRight size={10} className="ml-auto text-amber-300 group-hover/cat:text-amber-600 transition-colors" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Divider + Membership link */}
                                    <div className="mt-2 mx-3 pt-2 border-t border-amber-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowFleaDropdown(false);
                                                navigate('/membership');
                                            }}
                                            className="w-full text-left px-3.5 py-2 hover:bg-amber-50 rounded-xl transition-all flex items-center gap-2.5 group/mem cursor-pointer"
                                        >
                                            <Crown size={12} className="text-amber-500 group-hover/mem:text-amber-600" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-gray-900">GoMo Membership</p>
                                                <p className="text-[8px] text-gray-400 font-semibold tracking-wide">Upgrade for B2B Access</p>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden md:flex items-center gap-3.5 flex-shrink-0 ml-4">
                        {isHome ? (
                            <button
                                onClick={scrollToGrid}
                                className="px-5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full transition-all duration-300 text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-[0_2px_8px_rgba(249,115,22,0.15)] hover:shadow-orange-glow active:scale-95"
                            >
                                {t("explore_products")}
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="px-4 py-1.5 bg-white text-orange-955 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all duration-300 rounded-full text-[9px] font-black tracking-widest cursor-pointer active:scale-95 shadow-sm"
                                >
                                    {t("back")}
                                </button>
                                <Link
                                    to="/"
                                    className="px-4 py-1.5 bg-white text-orange-955 border border-orange-100 hover:bg-orange-600 hover:text-white transition-all duration-300 rounded-full text-[9px] font-black tracking-widest active:scale-95 shadow-sm"
                                >
                                    {t("home_menu")}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {mobileMenuOpen && createPortal(
                <>
                    {/* Backdrop Overlay */}
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] cursor-pointer md:hidden"
                    />

                    {/* Slide-out Panel Container */}
                    <div className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-white h-full shadow-2xl flex flex-col z-[160] overflow-hidden md:hidden animate-in slide-in-from-left duration-300">
                        {/* Drawer Header */}
                        <div className="bg-gradient-to-br from-orange-950 to-orange-900 text-white px-5 py-5 flex items-center justify-between border-b border-orange-900/20 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shadow-inner">
                                    <Menu size={16} strokeWidth={2} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-100">Menu</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable Drawer Content */}
                        <div className="flex-1 overflow-y-auto py-5 px-5 space-y-5 divide-y divide-orange-100/60 text-left custom-scrollbar">
                            {/* Navigation section */}
                            <div className="flex flex-col gap-1 pb-4">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold transition-all flex items-center justify-between rounded-xl ${isHome ? 'text-orange-600 bg-orange-50/50' : 'text-orange-900/80'}`}
                                >
                                    <span>Home</span>
                                    <ChevronRight size={14} className="text-orange-300" />
                                </Link>
                            </div>

                            {/* Categories Section */}
                            <div className="space-y-2 pt-4 pb-4">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5 px-3 mb-2">
                                    Categories
                                </h4>
                                <div className="flex flex-col gap-1">
                                    {[
                                        { key: 'beauty', label: 'Beauty & Grooming' },
                                        { key: 'books', label: 'Books & Stationery' },
                                        { key: 'clothing', label: 'Clothing' },
                                        { key: 'electronics', label: 'Electronics' },
                                        { key: 'fashion', label: 'Fashion' },
                                        { key: 'gifts', label: 'Gifts' },
                                        { key: 'healthy-foods', label: 'Healthy Foods' },
                                        { key: 'home-living', label: 'Home & Living' },
                                        { key: 'kids', label: 'Kids' },
                                        { key: 'mens', label: 'Mens' },
                                        { key: 'pooja-items', label: 'Pooja Items' },
                                        { key: 'sports-fitness', label: 'Sports & Fitness' },
                                        { key: 'toys', label: 'Toys' },
                                        { key: 'women', label: 'Women' },
                                    ].map(dept => (
                                        <div key={dept.key} className="flex flex-col">
                                            <button
                                                onClick={() => setExpandedMobileDept(expandedMobileDept === dept.key ? null : dept.key)}
                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                            >
                                                <span>{dept.label}</span>
                                                <ChevronDown size={14} className={`text-orange-300 transition-transform ${expandedMobileDept === dept.key ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {expandedMobileDept === dept.key && categorySubcategories[dept.key] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="flex flex-col pl-4 overflow-hidden"
                                                    >
                                                        {categorySubcategories[dept.key].map(sub => (
                                                            <Link
                                                                key={sub.slug}
                                                                to={`/collection/${sub.slug}`}
                                                                onClick={() => setMobileMenuOpen(false)}
                                                                className="py-1.5 px-3 text-[11px] font-semibold text-orange-900/60 hover:text-orange-600 hover:pl-4 transition-all duration-300"
                                                            >
                                                                {sub.label}
                                                            </Link>
                                                        ))}
                                                        <Link
                                                            to={`/collection/${dept.key}`}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="py-1.5 px-3 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:pl-4 transition-all duration-300"
                                                        >
                                                            View All {dept.label}
                                                        </Link>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Storefront section */}
                            <div className="space-y-2 pt-4 pb-4">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5 px-3 mb-2">
                                    Explore Store
                                </h4>
                                <div className="flex flex-col gap-1">
                                    <Link
                                        to="/flea-market"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 transition-all flex items-center justify-between rounded-xl group"
                                    >
                                        <span>Flea Market</span>
                                        <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                    <button
                                        onClick={() => { scrollToFeatured(); setMobileMenuOpen(false); }}
                                        className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 transition-all flex items-center justify-between rounded-xl group cursor-pointer"
                                    >
                                        <span>Featured Deals</span>
                                        <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                    </button>
                                    <button
                                        onClick={() => { scrollToGrid(); setMobileMenuOpen(false); }}
                                        className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 transition-all flex items-center justify-between rounded-xl group cursor-pointer"
                                    >
                                        <span>Explore All Products</span>
                                        <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                            </div>

                            {/* Account and Dashboard */}
                            <div className="space-y-2 pt-4">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5 px-3 mb-2">
                                    Account
                                </h4>
                                <div className="flex flex-col gap-1">
                                    {user && (user.role === 'admin' || user.role === 'super_admin') && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-red-600 transition-all flex items-center justify-between rounded-xl group"
                                        >
                                            <span className="flex items-center gap-2"><ShieldCheck size={14} /> Admin Dashboard</span>
                                            <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    )}
                                    {(!user || (user.role !== 'admin' && user.role !== 'super_admin')) && (
                                        <Link
                                            to="/my-orders"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 transition-all flex items-center justify-between rounded-xl group"
                                        >
                                            <span className="flex items-center gap-2"><User size={14} /> Returns & Orders</span>
                                            <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    )}
                                    <Link
                                        to="/wishlist"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 transition-all flex items-center justify-between rounded-xl group"
                                    >
                                        <span className="flex items-center gap-2"><Heart size={14} /> Wishlist</span>
                                        <ChevronRight size={14} className="text-orange-300 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>

                            {/* Country Selector Section */}
                            <div className="space-y-3 pt-4 pb-4 border-t border-orange-100/60">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5 px-3 mb-2">
                                    {t("shipping_country")}
                                </h4>
                                <div className="px-3">
                                    <div className="relative">
                                        <select
                                            value={selectedCountry.name}
                                            onChange={(e) => {
                                                changeCountry(e.target.value);
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full bg-orange-50/50 border border-orange-200 text-orange-955 text-xs font-bold py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer appearance-none uppercase tracking-wider"
                                        >
                                            {countriesList.map(country => (
                                                <option key={country.name} value={country.name}>
                                                    {country.flag} {country.name} ({country.symbol} {country.currency})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-600">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Language Selector Section */}
                            <div className="space-y-3 pt-4 pb-4 border-t border-orange-100/60">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5 px-3 mb-2">
                                    {t("interface_language")}
                                </h4>
                                <div className="px-3">
                                    <div className="relative">
                                        <select
                                            value={language}
                                            onChange={(e) => {
                                                changeLanguage(e.target.value);
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full bg-orange-50/50 border border-orange-200 text-orange-955 text-xs font-bold py-2.5 px-3.5 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer appearance-none uppercase tracking-wider"
                                        >
                                            {languagesList.map(lang => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.nativeName}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-600">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Amazon-Style Left-Sliding Drawer Menu */}
            {createPortal(
                <AnimatePresence>
                    {allMenuOpen && (
                        <>
                            {/* Backdrop Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setAllMenuOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] cursor-pointer"
                            />

                            {/* Slide-out Panel Container */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
                                className="fixed top-0 left-0 bottom-0 w-[300px] sm:w-[365px] bg-white h-full shadow-2xl flex flex-col z-[160] overflow-hidden"
                            >
                                {/* Drawer Header */}
                                <div className="bg-gradient-to-br from-orange-950 to-orange-900 text-white px-6 py-6 flex items-center gap-4 border-b border-orange-900/20 relative">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shadow-inner">
                                        <User size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-orange-200 uppercase tracking-widest font-bold">Welcome</span>
                                        <h3 className="text-sm font-bold tracking-wide">
                                            {user ? `Hello, ${user.full_name || user.name || user.store_name || 'Partner'}` : 'Hello, Sign In'}
                                        </h3>
                                    </div>

                                    {/* Floating Close Button inside Header */}
                                    <button
                                        onClick={() => setAllMenuOpen(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
                                        title="Close Menu"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Floating Close Button outside drawer (for that authentic Amazon feel on larger screens) */}
                                <button
                                    onClick={() => setAllMenuOpen(false)}
                                    className="hidden sm:block absolute top-4 left-[380px] bg-black/40 hover:bg-black/60 text-white p-2 rounded-full border border-white/10 transition-all duration-200 hover:scale-105 z-[170] cursor-pointer"
                                    title="Close Menu"
                                >
                                    <X size={22} />
                                </button>

                                {/* Scrollable Drawer Content */}
                                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6 divide-y divide-orange-100/60 text-left custom-scrollbar">

                                    {/* Section 1: Trending Collections */}
                                    <div className="space-y-3 pb-5">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5">
                                            Trending
                                        </h4>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                to="/flea-market"
                                                onClick={() => setAllMenuOpen(false)}
                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                            >
                                                <span>Flea Market</span>
                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                            </Link>
                                            <button
                                                onClick={() => handleDealClick('best sellers')}
                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl cursor-pointer"
                                            >
                                                <span>Best Sellers</span>
                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                            <button
                                                onClick={() => handleDealClick('new arrivals')}
                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl cursor-pointer"
                                            >
                                                <span>New Arrivals</span>
                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                            <button
                                                onClick={() => handleDealClick('top deals')}
                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl cursor-pointer"
                                            >
                                                <span>Super Deals</span>
                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section 2: Shop By Department */}
                                    <div className="space-y-3 pt-5 pb-5">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5">
                                            Departments
                                        </h4>
                                        <div className="flex flex-col gap-1">
                                            {[
                                                { key: 'beauty', label: 'Beauty' },
                                                { key: 'books', label: 'Books' },
                                                { key: 'clothing', label: 'Clothing' },
                                                { key: 'electronics', label: 'Electronics' },
                                                { key: 'fashion', label: 'Fashion' },
                                                { key: 'gifts', label: 'Gifts' },
                                                { key: 'healthy-foods', label: 'Healthy Foods' },
                                                { key: 'home-living', label: 'Home & Living' },
                                                { key: 'kids', label: 'Kids' },
                                                { key: 'mens', label: 'Mens' },
                                                { key: 'pooja-items', label: 'Pooja Items' },
                                                { key: 'sports-fitness', label: 'Sports & Fitness' },
                                                { key: 'toys', label: 'Toys' },
                                                { key: 'women', label: 'Women' },
                                            ].map(dept => (
                                                <div key={dept.key} className="flex flex-col">
                                                    <button
                                                        onClick={() => setExpandedDept(expandedDept === dept.key ? null : dept.key)}
                                                        className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                                    >
                                                        <span>{dept.label}</span>
                                                        <ChevronDown size={14} className={`text-orange-300 transition-transform ${expandedDept === dept.key ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {expandedDept === dept.key && categorySubcategories[dept.key] && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="flex flex-col pl-4 overflow-hidden"
                                                            >
                                                                {categorySubcategories[dept.key].map(sub => (
                                                                    <Link
                                                                        key={sub.slug}
                                                                        to={`/collection/${sub.slug}`}
                                                                        onClick={() => setAllMenuOpen(false)}
                                                                        className="py-1.5 px-3 text-[11px] font-semibold text-orange-900/60 hover:text-orange-600 hover:pl-4 transition-all duration-300"
                                                                    >
                                                                        {sub.label}
                                                                    </Link>
                                                                ))}
                                                                <Link
                                                                    to={`/collection/${dept.key}`}
                                                                    onClick={() => setAllMenuOpen(false)}
                                                                    className="py-1.5 px-3 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:pl-4 transition-all duration-300"
                                                                >
                                                                    View All {dept.label}
                                                                </Link>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: Account & Support */}
                                    <div className="space-y-3 pt-5">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-955 flex items-center gap-1.5">
                                            Account & Settings
                                        </h4>
                                        <div className="flex flex-col gap-1">
                                            {!user ? (
                                                <>
                                                    <Link
                                                        to="/login"
                                                        onClick={() => setAllMenuOpen(false)}
                                                        className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                                    >
                                                        <span>Customer Sign In</span>
                                                        <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                    <Link
                                                        to="/seller-login"
                                                        onClick={() => setAllMenuOpen(false)}
                                                        className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                                    >
                                                        <span>Seller Portal</span>
                                                        <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                    <Link
                                                        to="/admin-login"
                                                        onClick={() => setAllMenuOpen(false)}
                                                        className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl text-red-600"
                                                    >
                                                        <span>Admin Dashboard</span>
                                                        <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    {(user.role === 'admin' || user.role === 'super_admin') && (
                                                        <Link
                                                            to="/admin"
                                                            onClick={() => setAllMenuOpen(false)}
                                                            className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-955 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl bg-orange-50/20"
                                                        >
                                                            <span className="text-red-700 font-extrabold">Admin Dashboard</span>
                                                            <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                        </Link>
                                                    )}
                                                    {user.role !== 'admin' && user.role !== 'super_admin' && (
                                                        <>
                                                            <Link
                                                                to="/profile"
                                                                onClick={() => setAllMenuOpen(false)}
                                                                className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                                            >
                                                                <span>My Profile</span>
                                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                            </Link>
                                                            <Link
                                                                to="/my-orders"
                                                                onClick={() => setAllMenuOpen(false)}
                                                                className="py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl"
                                                            >
                                                                <span>My Orders</span>
                                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                            </Link>
                                                            <button
                                                                onClick={() => { setAllMenuOpen(false); setNotificationsOpen(true); }}
                                                                className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-orange-900/80 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl cursor-pointer"
                                                            >
                                                                <span>Notifications</span>
                                                                <ChevronRight size={14} className="text-orange-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => { setAllMenuOpen(false); handleLogout(); }}
                                                        className="w-full text-left py-2 px-3 hover:bg-orange-50 hover:text-red-500 text-xs font-bold text-red-500 hover:pl-4 transition-all duration-300 flex items-center justify-between group rounded-xl border-t border-orange-100/50 mt-2 cursor-pointer"
                                                    >
                                                        <span>Logout</span>
                                                        <ChevronRight size={14} className="text-red-300 group-hover:text-red-550 group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {createPortal(
                <CartDrawer />,
                document.body
            )}
            {createPortal(
                <WishlistDrawer />,
                document.body
            )}

        </>
    );
};

export default NavMain;