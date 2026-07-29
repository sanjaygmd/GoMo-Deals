import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ArrowLeft, Star, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Maximize2, X, Loader2, Tag, Send, MessageSquare, Phone, Video, PhoneOff, MicOff, VideoOff, Wand2 } from 'lucide-react';
import * as productService from '../../services/productService';
import * as offerService from '../../services/offerService';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/common/ProductCard';
import ReviewSection from '../../components/common/ReviewSection';
import ProductQA from '../../components/common/ProductQA';

import ScheduleModal from '../../components/common/ScheduleModal';
import VirtualTryOnModal from '../../components/common/VirtualTryOnModal';
import { useToast } from '../../context/ToastContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);

  const isFleaMarketItem = useMemo(() => {
    if (!product) return false;
    const cat = (product.category_name || '').toLowerCase();
    const tags = (product.tags || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    
    const fleaKeywords = ['dal', 'paruppu', 'rice', 'wheat', 'maize', 'groundnut', 'sesame', 'black-pepper', 'turmeric', 'coriander', 'cumin', 'sugar', 'flea'];
    
    return String(product.product_id).startsWith('fm') || 
           fleaKeywords.some(keyword => cat.includes(keyword) || tags.includes(keyword) || name.includes(keyword));
  }, [product]);
  const [recommended, setRecommended] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Update initial quantity for Flea Market items
  useEffect(() => {
    if (isFleaMarketItem) {
      setQuantity(10);
    } else {
      setQuantity(1);
    }
  }, [isFleaMarketItem, product?.product_id]);
  const [activeImage, setActiveImage] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isVirtualTryOnOpen, setIsVirtualTryOnOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isClothing = useMemo(() => {
    if (!product) return false;
    const cat = (product.category_name || '').toLowerCase();
    const tags = (product.tags || '').toLowerCase();
    const clothingKeywords = ['dress', 'clothing', 'saree', 'chudithar', 'kurtis', 'fashion', 'women', 'mens', 'kids', 'apparel', 'wear', 'top', 'shirt', 'pant', 'jacket', 'shoe', 'accessory'];
    return clothingKeywords.some(keyword => cat.includes(keyword) || tags.includes(keyword));
  }, [product]);

  // Bargaining system states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [sliderValue, setSliderValue] = useState(85);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [activeAcceptedOffer, setActiveAcceptedOffer] = useState(null);

  // Direct negotiation chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");

  // Direct simulated call bridge states
  const [callState, setCallState] = useState('idle'); // idle, connecting, ringing, connected, ended
  const [callType, setCallType] = useState('video');  // voice, video
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerSimulatedCall = (type) => {
    setCallType(type);
    setCallState('connecting');
    
    // Connect -> Ringing after 1.5s
    setTimeout(() => {
      setCallState('ringing');
      
      // Ringing -> Connected after 2.5s
      setTimeout(() => {
        setCallState('connected');
      }, 2500);
    }, 1500);
  };

  const endSimulatedCall = () => {
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
    }, 1500);
  };

  // Notify chatbot widget of open/close state of seller chat
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("gomo_chat_status", { detail: { isOpen: isChatOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("gomo_chat_status", { detail: { isOpen: false } }));
    };
  }, [isChatOpen]);

  const { addToCart, toggleWishlist, isInWishlist, isInCart, removeFromCart, formatPrice, convertPrice, selectedCountry, t, translateRecipient, translateOccasion } = useShop();
  const { user } = useAuth();

  const activeStock = useMemo(() => {
    if (!product) return 0;
    const stock = selectedVariant !== null ? selectedVariant.stock_quantity : product.stock_quantity;
    return stock !== undefined && stock !== null ? stock : 0;
  }, [product, selectedVariant]);

  const isMarketProduct = useMemo(() => {
    if (!product) return false;
    const cat = (product.category_name || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const tags = (product.tags || '').toLowerCase();
    
    return cat.includes('grocery') || 
           cat.includes('groceries') || 
           cat.includes('staple') || 
           cat.includes('grain') || 
           cat.includes('lentil') ||
           cat.includes('rice') ||
           cat.includes('dal') ||
           tags.includes('grocery') || 
           tags.includes('flea market') || 
           tags.includes('rice') || 
           tags.includes('dal') ||
           name.includes('rice') || 
           name.includes('dal') || 
           name.includes('atta') || 
           name.includes('wheat') ||
           tags.includes('market');
  }, [product]);



  useEffect(() => {
    if (activeStock > 0) {
      if (quantity > activeStock) {
        setQuantity(activeStock);
      } else if (quantity < 1) {
        setQuantity(1);
      }
    } else {
      setQuantity(1);
    }
  }, [activeStock, quantity]);

  useEffect(() => {
    const fetchFullProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(id);
        if (res.success) {
          setProduct(res.data);
          setActiveImage(0);
          
          // Default to Classic Edition (null) so the main product is shown by default
          setSelectedVariant(null);

          // Fetch recommendations
          const allRes = await productService.getProducts();
          if (allRes.success) {
            const fleaKeywords = ['dal', 'paruppu', 'rice', 'wheat', 'maize', 'groundnut', 'sesame', 'black-pepper', 'turmeric', 'coriander', 'cumin', 'sugar', 'flea', 'daily-essentials-groceries'];
            const checkIsFleaMarket = (p) => {
              const pCat = (p.category_name || '').toLowerCase();
              const pTags = (p.tags || '').toLowerCase();
              const pName = (p.name || '').toLowerCase();
              return String(p.product_id).startsWith('fm') || fleaKeywords.some(keyword => pCat.includes(keyword) || pTags.includes(keyword) || pName.includes(keyword));
            };
            const currentIsFlea = checkIsFleaMarket(res.data);

            const others = allRes.data.filter(p => {
              if (p.product_id === res.data.product_id) return false;
              // If current product is not flea market, exclude flea market products from recommendations
              if (!currentIsFlea && checkIsFleaMarket(p)) return false;
              return (p.recipient === res.data.recipient || p.occasion === res.data.occasion);
            }).slice(0, 4);
            setRecommended(others);
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchFullProduct();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  // Fetch active accepted bargain for this product if logged in
  useEffect(() => {
    const fetchActiveBargain = async () => {
      if (user && product) {
        try {
          const res = await offerService.getCustomerOffers();
          if (res.success && res.offers) {
            const found = res.offers.find(o => 
              o.product_id === product.product_id && 
              o.status === 'Accepted' && 
              (!o.expires_at || new Date(o.expires_at) > new Date())
            );
            if (found) {
              setActiveAcceptedOffer(found);
            }
          }
        } catch (err) {
          console.error("Error fetching customer active bargains:", err);
        }
      }
    };
    fetchActiveBargain();
  }, [user, product]);

  const sellerId = product?.seller_id || "general_seller";
  const customerId = user?.customer_id || user?.id || "";
  const customerName = user?.full_name || user?.name || "Customer";

  useEffect(() => {
    if (!isChatOpen || !customerId || !sellerId) return;

    const loadChat = () => {
      const storageKey = `gomo_chats_${customerId}_${sellerId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setChatMessages(parsed.messages || []);
      } else {
        // Seed first welcome message
        const welcomeMsg = {
          sender: "seller",
          text: `Hi ${customerName}! Thank you for your interest in ${product.name}. I'm the store representative for ${product.brand || "our boutique"}. How can I help you negotiate or customize your purchase today?`,
          timestamp: Date.now()
        };
        const newChat = {
          customerId,
          customerName,
          sellerId,
          sellerName: product.brand || "Seller Representative",
          productId: product.product_id,
          productName: product.name,
          productThumbnail: product.thumbnail || product.pi_images?.[0]?.image_url || '/fallback-product.png',
          messages: [welcomeMsg],
          lastUpdated: Date.now(),
          unreadBySeller: false,
          unreadByCustomer: false
        };
        localStorage.setItem(storageKey, JSON.stringify(newChat));
        setChatMessages([welcomeMsg]);
        window.dispatchEvent(new Event("gomo_chat_update"));
      }
    };

    loadChat();

    // Mark messages as read by customer when chat is open
    const markAsRead = () => {
      const storageKey = `gomo_chats_${customerId}_${sellerId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.unreadByCustomer) {
          parsed.unreadByCustomer = false;
          localStorage.setItem(storageKey, JSON.stringify(parsed));
          window.dispatchEvent(new Event("gomo_chat_update"));
        }
      }
    };
    markAsRead();

    window.addEventListener("storage", loadChat);
    window.addEventListener("gomo_chat_update", loadChat);

    return () => {
      window.removeEventListener("storage", loadChat);
      window.removeEventListener("gomo_chat_update", loadChat);
    };
  }, [isChatOpen, customerId, sellerId, product]);

  const handleSendChatMessage = () => {
    if (!typedMessage.trim() || !customerId || !sellerId) return;

    const userMsgText = typedMessage.trim();
    const newMsg = {
      sender: "customer",
      text: userMsgText,
      timestamp: Date.now()
    };

    const storageKey = `gomo_chats_${customerId}_${sellerId}`;
    const raw = localStorage.getItem(storageKey);
    let chatData = null;

    if (raw) {
      chatData = JSON.parse(raw);
      chatData.messages.push(newMsg);
      chatData.lastUpdated = Date.now();
      chatData.unreadBySeller = true;
      chatData.unreadByCustomer = false;
    } else {
      chatData = {
        customerId,
        customerName,
        sellerId,
        sellerName: product.brand || "Seller Representative",
        productId: product.product_id,
        productName: product.name,
        productThumbnail: product.thumbnail || product.pi_images?.[0]?.image_url || '/fallback-product.png',
        messages: [newMsg],
        lastUpdated: Date.now(),
        unreadBySeller: true,
        unreadByCustomer: false
      };
    }

    localStorage.setItem(storageKey, JSON.stringify(chatData));
    setChatMessages(chatData.messages);
    setTypedMessage("");
    window.dispatchEvent(new Event("gomo_chat_update"));

    // Simulate AI Seller reply after 1.5 seconds
    setTimeout(() => {
      const currentRaw = localStorage.getItem(storageKey);
      if (currentRaw) {
        const currentChat = JSON.parse(currentRaw);
        const lastMsg = currentChat.messages[currentChat.messages.length - 1];
        
        // Only reply if the last message is still the customer's message (i.e. seller hasn't replied yet)
        if (lastMsg && lastMsg.sender === "customer") {
          let replyText = "";
          const lowercaseMsg = userMsgText.toLowerCase();

          if (lowercaseMsg.includes("discount") || lowercaseMsg.includes("price") || lowercaseMsg.includes("cheaper") || lowercaseMsg.includes("offer") || lowercaseMsg.includes("cost")) {
            replyText = `We put extreme care into our ${product.brand || "boutique"} collections, but I'd love to help a premium client! Since you're a valued member, I can authorize a special checkout concession at 10% off. Let me know if you would like me to set up that deal for you!`;
          } else if (lowercaseMsg.includes("shipping") || lowercaseMsg.includes("delivery") || lowercaseMsg.includes("arrive") || lowercaseMsg.includes("days")) {
            replyText = `Good news! We ship all our premium items via express logistics. For our gold and platinum club members, shipping is entirely complimentary and usually takes 2-3 business days.`;
          } else if (lowercaseMsg.includes("size") || lowercaseMsg.includes("fit") || lowercaseMsg.includes("color") || lowercaseMsg.includes("custom")) {
            replyText = `Yes, we do specialize in custom modifications for our signature items! If you have specific dimensions or sizing needs, just specify them here and we'll have our design studio tailor it to your preferences.`;
          } else {
            replyText = `Thank you for details! I am checking with our boutique curator to see how we can best accommodate your request. In the meantime, let me know if you have any other questions about ${product.name}!`;
          }

          const sellerMsg = {
            sender: "seller",
            text: replyText,
            timestamp: Date.now()
          };

          currentChat.messages.push(sellerMsg);
          currentChat.lastUpdated = Date.now();
          currentChat.unreadByCustomer = true;
          currentChat.unreadBySeller = false;

          localStorage.setItem(storageKey, JSON.stringify(currentChat));
          setChatMessages(currentChat.messages);
          window.dispatchEvent(new Event("gomo_chat_update"));
        }
      }
    }, 1500);
  };

  // Separate base images and variant images
  const baseImages = useMemo(() => {
    if (!product) return [];
    return product.pi_images?.filter(img => !img.variant_id).map(img => img.image_url) || [product.thumbnail];
  }, [product]);

  const variantImagesMap = useMemo(() => {
    if (!product) return {};
    const map = {};
    product.pi_images?.forEach(img => {
      if (img.variant_id) {
        if (!map[img.variant_id]) map[img.variant_id] = [];
        map[img.variant_id].push(img.image_url);
      }
    });
    return map;
  }, [product]);

  // Current gallery based on selection
  const currentGallery = useMemo(() => {
    if (!product) return [];
    if (selectedVariant && variantImagesMap[selectedVariant.variant_id]) {
      return variantImagesMap[selectedVariant.variant_id];
    }
    return baseImages;
  }, [product, selectedVariant, baseImages, variantImagesMap]);

  // Update active image if the gallery changes
  useEffect(() => {
    setActiveImage(0);
  }, [currentGallery]);

  if (loading) {
    return (
      <div className="pt-16 pb-20 flex flex-col items-center justify-center min-h-screen text-orange-300">
        <Loader2 className="animate-spin mb-4" size={40} strokeWidth={1} />
        <p className="text-[11px] uppercase tracking-[0.5em] font-bold">Loading product details...</p>
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.price;

  return (
    <div className="pt-8 pb-20 bg-[#fdfbf9] min-h-screen">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-12">
        {/* Boutique Breadcrumb Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-orange-100/30 pb-3 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-orange-600 font-extrabold hover:text-orange-955 transition-colors group w-fit"
          >
            <ArrowLeft size={11} className="group-hover:-translate-x-1 transition-transform" /> {t("back")}
          </button>
          
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-orange-400 font-bold">
            <Link to="/" className="hover:text-orange-955 transition-colors">{t("home_menu")}</Link>
            <span>/</span>
            <span className="hover:text-orange-950 transition-colors cursor-pointer">{translateRecipient(product.recipient) || t("collection")}</span>
            <span>/</span>
            <span className="text-orange-950 font-black">{t(product.name)}</span>
          </div>
        </div>

        {/* Asymmetrical Studio Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24 items-start">
          
          {/* Left Column: Sticky Studio Gallery */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-6 order-1">
            <div className="flex flex-col gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative h-[260px] sm:h-[350px] lg:h-[380px] bg-white border border-orange-100/40 p-3 shadow-md shadow-orange-950/2 rounded-none group/main cursor-zoom-in max-w-xl mx-auto w-full flex items-center justify-center overflow-hidden"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage + (selectedVariant?.variant_id || 'base')}
                      src={currentGallery[activeImage]}
                      alt={t(product.name)}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover/main:scale-103"
                    />
                  </AnimatePresence>

                  <div className="absolute top-4 right-4 opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 z-10">
                    <div className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-none flex items-center justify-center text-orange-950 shadow-md border border-orange-100/30">
                      <Maximize2 size={15} strokeWidth={2} />
                    </div>
                  </div>
                </motion.div>
            </div>

            {currentGallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none max-w-xl mx-auto w-full justify-center">
                {currentGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveImage(idx)}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-none border transition-all duration-300 bg-white p-1.5 ${
                      activeImage === idx 
                        ? 'border-orange-950 scale-102 opacity-100 shadow-sm' 
                        : 'border-orange-100 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${t(product.name)} ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Details */}
          <div className="flex flex-col order-2">
            <div className="pb-4">
              
              {/* Brand and Tagline */}
              <div className="flex items-center gap-2 mb-4">
                {product.brand && (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-extrabold">
                    {t(product.brand)}
                  </span>
                )}
                {product.brand && <span className="text-orange-200">•</span>}
                <span className="text-[10px] uppercase tracking-[0.3em] text-orange-955 font-bold">
                  {translateRecipient(product.recipient)} {t("selection")}
                </span>
              </div>

              {/* Editorial Title */}
              <h1 className="text-3xl sm:text-4.5xl font-bold text-orange-955 mb-6 tracking-wide leading-tight">
                {selectedVariant ? `${t(product.name)} (${t(selectedVariant.variant_value)})` : t(product.name)}
              </h1>

              {/* Pricing Display */}
              <div className="flex items-baseline gap-4 mb-6 border-b border-orange-100/30 pb-6">
                <span className="text-3xl sm:text-4xl font-extrabold text-orange-600 tracking-tight font-sans">
                  {formatPrice(currentPrice)}
                  {isMarketProduct && <span className="text-sm font-medium text-orange-500/80 ml-1">/ KG</span>}
                </span>
                {product.mrp && Number(product.mrp) > Number(currentPrice) && (
                  <>
                    <span className="text-lg line-through text-orange-300 font-light ml-2">
                      {formatPrice(product.mrp)}
                      {isMarketProduct && <span className="text-xs font-normal text-orange-300/80">/ KG</span>}
                    </span>
                    <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-[9px] uppercase tracking-widest font-black rounded-none shadow-sm ml-2">
                      {t("save_percent", { percent: Math.round(((product.mrp - currentPrice) / product.mrp) * 100) })}
                    </span>
                  </>
                )}
              </div>

              {/* Certified Review Star Rating */}
              <div className="flex items-center gap-2 text-orange-500 mb-8 bg-[#faf8f5] border border-orange-100/40 p-4 max-w-md">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      fill={i < Math.round(product.rating || 0) ? "currentColor" : "none"} 
                      className={i < Math.round(product.rating || 0) ? "text-orange-500" : "text-orange-200"}
                    />
                  ))}
                </div>
                {product.reviews_count > 0 ? (
                  <span className="text-[9px] text-orange-955 font-extrabold tracking-[0.15em] uppercase ml-2">
                    ({product.rating} • {product.reviews_count} {product.reviews_count === 1 ? t("review") : t("reviews")})
                  </span>
                ) : (
                  <span className="text-[9px] text-orange-955 font-extrabold tracking-[0.15em] uppercase ml-2">{t("highly_rated_product")}</span>
                )}
              </div>

              {/* Product Short Description */}
              <p className="text-orange-900 text-[13px] font-medium leading-relaxed max-w-xl mb-10">
                {t(product.description)}
              </p>

              {/* Product Option Selection (Sharp Square Swatches) */}
              {!isFleaMarketItem && (
                <div className="pt-8 mb-8 border-t border-orange-100/30">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-orange-955 font-extrabold">
                      Select Option
                    </span>
                    <span className="text-[10px] text-orange-500 uppercase tracking-widest font-extrabold">
                      {selectedVariant ? selectedVariant.variant_value : 'Classic'}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {/* Classic Option */}
                    <button
                      onClick={() => setSelectedVariant(null)}
                      className={`w-auto h-11  border transition-all duration-300 rounded-none px-2 p-1 flex items-center justify-center ${
                        !selectedVariant 
                          ? 'border-orange-950 scale-102 bg-orange-950 text-white shadow-sm' 
                          : 'border-orange-100 bg-white text-orange-950 hover:border-orange-950 hover:bg-orange-50/50'
                      }`}
                      title="Classic Edition"
                    >
                      <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold">Classic</span>
                    </button>

                    {product.variants?.map((variant) => {
                      return (
                        <button
                          key={variant.variant_id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`w-11 h-11 border transition-all duration-300 rounded-none px-2 p-1 flex items-center justify-center ${
                            selectedVariant?.variant_id === variant.variant_id 
                              ? 'border-orange-950 scale-102 bg-orange-950 text-white shadow-sm' 
                              : 'border-orange-100 bg-white text-orange-950 hover:border-orange-950 hover:bg-orange-50/50'
                          }`}
                          title={variant.variant_value}
                        >
                          <span className="text-[9px] uppercase tracking-[0.1em] font-extrabold">{variant.variant_value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Action Panel */}
              <div className="space-y-6 mb-8 pt-8 border-t border-orange-100/30">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-5">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-orange-955 font-extrabold">{t("qty")}</span>
                    <div className="flex items-center border border-orange-200 bg-white rounded-none overflow-hidden h-11">
                      <button
                        onClick={() => setQuantity(prev => Math.max(isFleaMarketItem ? 10 : 1, prev - (isFleaMarketItem ? 10 : 1)))}
                        disabled={activeStock <= 0 || quantity <= (isFleaMarketItem ? 10 : 1)}
                        className="px-4 h-full hover:bg-orange-50 transition-colors border-r border-orange-100 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="px-5 text-xs font-semibold w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(prev => Math.min(activeStock, prev + (isFleaMarketItem ? 10 : 1)))}
                        disabled={activeStock <= 0 || quantity >= activeStock}
                        className="px-4 h-full hover:bg-orange-50 transition-colors border-l border-orange-100 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    {activeStock !== undefined && (
                      <span className={`text-[10px] uppercase tracking-widest font-black ml-3 ${
                        activeStock > 0 ? 'text-orange-600' : 'text-rose-500'
                      }`}>
                        {activeStock > 0 ? (isFleaMarketItem ? `${activeStock} kg available` : `${t("in_stock")} (${activeStock})`) : t("out_of_stock")}
                      </span>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {!isFleaMarketItem && (
                      <button 
                        disabled={activeStock <= 0 && !isInCart(product.product_id, selectedVariant?.variant_value || null)}
                        onClick={() => {
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          const variantVal = selectedVariant?.variant_value || null;
                          if (isInCart(product.product_id, variantVal)) {
                            removeFromCart(product.product_id, variantVal);
                          } else {
                            addToCart(product, quantity, variantVal);
                          }
                        }}
                        className={`flex-1 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border ${
                          activeStock <= 0 && !isInCart(product.product_id, selectedVariant?.variant_value || null)
                            ? 'bg-orange-50 text-orange-300 border-orange-100 cursor-not-allowed'
                            : isInCart(product.product_id, selectedVariant?.variant_value || null)
                              ? 'bg-orange-100 text-orange-900 border-orange-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100'
                              : 'bg-transparent text-orange-955 border-orange-955 hover:bg-orange-955 hover:text-white'
                        }`}
                      >
                        <ShoppingBag size={14} /> 
                        {activeStock <= 0 && !isInCart(product.product_id, selectedVariant?.variant_value || null)
                          ? t("out_of_stock")
                          : isInCart(product.product_id, selectedVariant?.variant_value || null) 
                            ? t("remove_from_cart") 
                            : t("add_to_cart")}
                      </button>
                    )}
                    
                    {!isFleaMarketItem && (
                      <>
                        <button 
                          disabled={activeStock <= 0}
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                              return;
                            }
                            const variantVal = selectedVariant?.variant_value || null;
                            const buyNowProduct = {
                              ...product,
                              quantity,
                              selectedColor: variantVal,
                              price: selectedVariant?.price || product.price,
                              variant_id: selectedVariant?.variant_id || null,
                              image: Array.isArray(product.images)
                                ? product.images[0]
                                : (typeof product.images === 'string' && product.images.startsWith('['))
                                  ? JSON.parse(product.images)[0]
                                  : product.images || product.thumbnail || null
                            };
                            navigate('/checkout', { state: { buyNowProduct } });
                          }}
                          className={`flex-1 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none shadow-xl ${
                            activeStock <= 0
                              ? 'bg-orange-200 text-orange-400 cursor-not-allowed shadow-none'
                              : 'bg-orange-955 text-white hover:bg-orange-600 shadow-orange-950/10'
                          }`}
                        >
                          {activeStock <= 0 ? t("out_of_stock") : t("buy_now")}
                        </button>

                        <button 
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                              return;
                            }
                            toggleWishlist(product);
                          }}
                          className={`w-14 h-14 border transition-all duration-300 flex items-center justify-center rounded-none bg-white ${
                            isInWishlist(product.product_id) 
                              ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm' 
                              : 'border-orange-200 text-orange-950 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500'
                          }`}
                        >
                          <Heart 
                            size={16} 
                            className={isInWishlist(product.product_id) ? 'fill-current scale-105' : ''} 
                          />
                        </button>
                      </>
                    )}
                  </div>

                  {isClothing && (
                    <button
                      onClick={() => setIsVirtualTryOnOpen(true)}
                      className={`w-full mt-3 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border border-orange-400 text-orange-600 bg-orange-50/40 hover:bg-orange-600 hover:text-white hover:border-orange-600`}
                    >
                      <Wand2 size={16} />
                      Virtual Try-On
                    </button>
                  )}

                  {/* "Make an Offer" & "Chat with Seller" restricted strictly to daily essentials / market items */}
                  {isMarketProduct && !isFleaMarketItem && (
                    <>
                      {activeAcceptedOffer ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-50 border border-emerald-200 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
                        >
                          <div className="text-left">
                            <span className="text-[9px] uppercase tracking-widest text-emerald-800 font-extrabold block mb-1 font-sans">{t("offer_accepted")}</span>
                            <p className="text-emerald-955 font-bold text-xs font-sans">
                              {t("offer_accepted_desc", { price: formatPrice(activeAcceptedOffer.offered_price) })}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/checkout?offerToken=${activeAcceptedOffer.offer_token}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-black py-2.5 px-5 rounded-none shadow-md transition-colors shrink-0 font-sans"
                          >
                            {t("checkout_bargain_price")}
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          disabled={activeStock <= 0}
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                              return;
                            }

                            // Check if customer is on a free plan
                            const membership = user?.membership || 'free';
                            if (membership === 'free') {
                              toast({
                                title: "Premium Feature Required",
                                description: "Bargaining in the Flea Market is a premium benefit. Please upgrade your plan to Silver, Gold, or Platinum to place offers!",
                                variant: "destructive"
                              });
                              navigate('/membership');
                              return;
                            }

                            setIsOfferModalOpen(true);
                            setOfferedPrice(Math.round(currentPrice * 0.85).toString());
                            setSliderValue(85);
                            setOfferSuccess(false);
                            setOfferError('');
                          }}
                          className={`w-full mt-4 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border font-sans ${
                            activeStock <= 0
                              ? 'border-orange-100 bg-orange-50 text-orange-300 cursor-not-allowed'
                              : 'border-orange-500 text-orange-600 bg-orange-50/40 hover:bg-orange-955 hover:text-white hover:border-orange-955'
                          }`}
                        >
                          <Tag size={13} />
                          {t("make_an_offer")}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          const membership = user?.membership || 'free';
                          if (membership !== 'gold' && membership !== 'platinum') {
                            toast({
                              title: "👑 Gold/Platinum Exclusive",
                              description: "Direct negotiation chat with the seller is exclusive to Gold and Platinum tiers. Upgrade your plan to start chatting!",
                              variant: "destructive"
                            });
                            navigate('/membership');
                            return;
                          }
                          setIsChatOpen(true);
                        }}
                        className="w-full mt-3 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border border-orange-955 text-orange-955 bg-transparent hover:bg-orange-955 hover:text-white"
                      >
                        <MessageSquare size={13} />
                        <span>Chat with Seller</span>
                      </button>
                    </>
                  )}
                  
                  {isFleaMarketItem && (
                    <>
                      {activeAcceptedOffer ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-50 border border-emerald-200 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
                        >
                          <div className="text-left">
                            <span className="text-[9px] uppercase tracking-widest text-emerald-800 font-extrabold block mb-1 font-sans">Recorded Deal</span>
                            <p className="text-emerald-955 font-bold text-xs font-sans">
                              Mediated at {formatPrice(activeAcceptedOffer.offered_price)}/kg for {activeAcceptedOffer.agreed_quantity} kg
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/checkout?offerToken=${activeAcceptedOffer.offer_token}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-black py-2.5 px-5 rounded-none shadow-md transition-colors shrink-0 font-sans"
                          >
                            Checkout Deal
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) {
                              navigate('/login');
                              return;
                            }
                            const membership = user?.membership || 'free';
                            if (membership === 'free') {
                              toast({
                                title: "Premium Feature Required",
                                description: "Video scheduling is a premium benefit. Please upgrade your plan to schedule a video conference!",
                                variant: "destructive"
                              });
                              navigate('/membership');
                              return;
                            }
                            setIsScheduleModalOpen(true);
                          }}
                          className="w-full mt-3 h-14 text-[11px] uppercase tracking-[0.3em] font-extrabold transition-all duration-300 flex items-center justify-center gap-3 rounded-none border border-emerald-600 text-emerald-700 bg-transparent hover:bg-emerald-600 hover:text-white"
                        >
                          <Video size={13} />
                          <span>Schedule Video Conference</span>
                        </button>
                      )}
                    </>
                  )}

                {/* Inline Premium Trust Hairline Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-orange-100/30 my-8">
                  <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-orange-955" />
                      <span className="text-[9px] uppercase tracking-widest text-orange-955 font-black">{t("free_delivery")}</span>
                    </div>
                    <p className="text-[8px] text-orange-400 uppercase tracking-widest">{t("delivery_desc")}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left border-t sm:border-t-0 sm:border-l border-orange-100/20 pt-4 sm:pt-0 sm:pl-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-orange-955" />
                      <span className="text-[9px] uppercase tracking-widest text-orange-955 font-black">{t("secure_payment")}</span>
                    </div>
                    <p className="text-[8px] text-orange-400 uppercase tracking-widest">{t("payment_desc")}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left border-t sm:border-t-0 sm:border-l border-orange-100/20 pt-4 sm:pt-0 sm:pl-6">
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-orange-955" />
                      <span className="text-[9px] uppercase tracking-widest text-orange-955 font-black">{t("boutique_return")}</span>
                    </div>
                    <p className="text-[8px] text-orange-400 uppercase tracking-widest">{t("return_desc")}</p>
                  </div>
                </div>
              </div>

              {/* Specifications Accordion Panel */}
              <div className="border-t border-orange-100/30 pt-6 mt-8">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.25em] font-extrabold text-orange-955 mb-6"
                >
                  {t("product_specifications")}
                  {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-y-3.5 pb-6">

                        <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                           <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("collection")}</span>
                           <span className="text-[9.5px] text-orange-955 uppercase tracking-widest font-bold">{t(product.category_name) || t("boutique_selection")}</span>
                        </div>
                        {product.brand && (
                          <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                             <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("boutique")}</span>
                             <span className="text-[9.5px] text-orange-955 font-bold uppercase tracking-widest">{t(product.brand)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                           <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("net_weight")}</span>
                           <span className="text-[9.5px] text-orange-955 font-bold uppercase tracking-widest">{selectedVariant?.weight || product.weight || '—'} KG</span>
                        </div>
                        {(product.length || product.breadth || product.height) && (
                          <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                             <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("dimensions")}</span>
                             <span className="text-[9.5px] text-orange-955 font-bold uppercase tracking-widest">{product.length} × {product.breadth} × {product.height} cm</span>
                          </div>
                        )}
                        {product.recipient && (
                          <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                             <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("best_for")}</span>
                             <span className="text-[9.5px] text-orange-955 font-bold uppercase tracking-widest">{translateRecipient(product.recipient)}</span>
                          </div>
                        )}
                        {product.occasion && (
                          <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                             <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("occasion")}</span>
                             <span className="text-[9.5px] text-orange-955 font-bold uppercase tracking-widest">{translateOccasion(product.occasion)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-b border-orange-100/10 pb-2">
                           <span className="text-[9.5px] text-orange-500 uppercase tracking-widest font-semibold">{t("availability")}</span>
                           <span className={`text-[9.5px] font-black uppercase tracking-widest ${
                             (product.stock_quantity || 0) > 0 ? 'text-orange-600' : 'text-rose-500'
                           }`}>
                             {(product.stock_quantity || 0) > 0 ? t("in_stock") : t("out_of_stock")}
                           </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
 

        <ProductQA productId={id} />
        <ReviewSection productId={id} selectedVariant={selectedVariant} />

        {!isFleaMarketItem && (
          <section className="mt-40 pt-24 border-t border-orange-100">
            <div className="flex flex-col items-center text-center mb-20">
              <span className="text-[11px] uppercase tracking-[0.5em] text-orange-400 block mb-4">{t("recommended_for_you")}</span>
              <h2 className="text-4xl font-bold text-orange-900">{t("you_may_also_like")}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {recommended.map((item) => (
                <ProductCard key={item.product_id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-24"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-8 right-8 text-orange-900 hover:rotate-90 transition-transform duration-300"
            >
              <X size={32} strokeWidth={1.5} />
            </button>

            <motion.div
              className="relative w-full h-full max-w-6xl flex flex-col gap-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <img
                  src={currentGallery[activeImage]}
                  alt={t(product.name)}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
              </div>

              <div className="flex justify-center gap-4 shrink-0">
                {currentGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 sm:w-24 sm:h-24 overflow-hidden rounded-sm border-2 transition-all duration-300 ${activeImage === idx ? 'border-orange-900 scale-105' : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`${t(product.name)} thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Bargaining Modal */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-orange-955/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white border border-orange-100/40 w-full max-w-lg p-6 sm:p-8 rounded-none shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="absolute top-6 right-6 text-orange-955/40 hover:text-orange-955 transition-colors"
              >
                <X size={20} />
              </button>

              {!offerSuccess ? (
                <div>
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-extrabold block mb-2 font-sans">Flex Market Bargain</span>
                    <h3 className="text-2xl font-bold text-orange-955">{t("make_reasonable_offer")}</h3>
                    <p className="text-orange-955/60 text-[11px] font-medium mt-1 uppercase tracking-wider font-sans">
                      Item: {t(product.name)}
                    </p>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="grid grid-cols-2 gap-4 bg-[#faf8f5] border border-orange-100/40 p-4 mb-6">
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-orange-400 font-bold block mb-1 font-sans">{t("retail_price")}</span>
                      <span className="text-lg font-bold text-orange-955 font-sans">{formatPrice(currentPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-orange-500 font-bold block mb-1 font-sans">{t("min_acceptable")}</span>
                      <span className="text-lg font-bold text-orange-500 font-sans">{formatPrice(currentPrice * 0.5)}</span>
                    </div>
                  </div>

                  {/* Propose Your Offer Slider */}
                  <div className="mb-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[9px] uppercase tracking-widest text-orange-955 font-extrabold font-sans">{t("adjust_your_offer")}</span>
                      <span className="text-2xl font-extrabold text-orange-600 font-sans">
                        {formatPrice(offeredPrice)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={sliderValue}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSliderValue(val);
                        setOfferedPrice(Math.round((currentPrice * val) / 100).toString());
                      }}
                      className="w-full h-1 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-600 mb-4"
                    />

                    {/* Quick percentage suggestions */}
                    <div className="flex justify-between gap-2">
                      {[60, 70, 80, 90].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => {
                            setSliderValue(pct);
                            setOfferedPrice(Math.round((currentPrice * pct) / 100).toString());
                          }}
                          className={`flex-1 py-1.5 border text-[9px] uppercase tracking-widest font-black transition-all font-sans ${
                            sliderValue === pct 
                              ? 'bg-orange-955 text-white border-orange-955'
                              : 'bg-white text-orange-955 border-orange-100 hover:border-orange-955'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Cash Input */}
                  <div className="mb-6">
                    <label className="text-[9px] uppercase tracking-widest text-orange-955 font-extrabold block mb-2 font-sans">
                      {t("or_type_custom_amount", { symbol: selectedCountry.symbol })}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 font-medium text-xs font-sans">{selectedCountry.symbol}</span>
                      <input
                        type="number"
                        value={offeredPrice ? Math.round(Number(offeredPrice) * selectedCountry.rate) : ''}
                        onChange={(e) => {
                          const inputVal = e.target.value;
                          if (!inputVal) {
                            setOfferedPrice('');
                            return;
                          }
                          const parsedLocal = parseFloat(inputVal);
                          if (!isNaN(parsedLocal) && parsedLocal > 0) {
                            const parsedBase = parsedLocal / selectedCountry.rate;
                            setOfferedPrice(parsedBase.toString());
                            const pct = Math.round((parsedBase / currentPrice) * 100);
                            setSliderValue(Math.min(100, Math.max(50, pct)));
                          } else {
                            setOfferedPrice('');
                          }
                        }}
                        className="w-full h-11 border border-orange-200 pl-8 pr-4 text-xs font-semibold focus:outline-none focus:border-orange-500 rounded-none bg-white font-sans"
                        placeholder={t("enter_offer_price")}
                      />
                    </div>
                    {offerError && (
                      <p className="text-[10px] text-rose-500 uppercase tracking-wider font-extrabold mt-2 font-sans">
                        {offerError}
                      </p>
                    )}
                  </div>

                  {/* Saving Metric Badge */}
                  {parseFloat(offeredPrice) < currentPrice && parseFloat(offeredPrice) >= currentPrice * 0.5 && (
                    <div className="mb-8 bg-orange-50 border border-orange-200/50 p-3 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest text-orange-700 font-extrabold font-sans">{t("dynamic_savings")}:</span>
                      <span className="text-xs font-extrabold text-orange-955 font-sans">
                        {t("save")} {formatPrice(currentPrice - parseFloat(offeredPrice))} ({Math.round(100 - (parseFloat(offeredPrice) / currentPrice) * 100)}%)
                      </span>
                    </div>
                  )}

                  {/* Disclaimer / Info */}
                  <p className="text-[9px] leading-relaxed text-orange-400 uppercase tracking-widest mb-6 font-sans">
                    ⚠️ Proposing unrealistic offers may lead to automatic rejection. Accepted offers generate a secure single-use checkout link valid for exactly 24 hours.
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOfferModalOpen(false)}
                      className="flex-1 h-12 border border-orange-200 hover:border-orange-955 hover:bg-orange-50 text-[10px] uppercase tracking-widest font-black transition-colors rounded-none font-sans"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      disabled={submittingOffer}
                      onClick={async () => {
                        const parsedPrice = parseFloat(offeredPrice);
                        if (isNaN(parsedPrice) || parsedPrice <= 0) {
                          setOfferError("Please enter a valid amount.");
                          return;
                        }
                        if (parsedPrice < currentPrice * 0.5) {
                          setOfferError(`Offer must be at least 50% of listing price (${formatPrice(currentPrice * 0.5)}).`);
                          return;
                        }
                        if (parsedPrice > currentPrice) {
                          setOfferError("Offer cannot exceed original retail price.");
                          return;
                        }

                        setSubmittingOffer(true);
                        setOfferError('');
                        try {
                          const res = await offerService.createOffer(product.product_id, parsedPrice);
                          if (res.success) {
                            setOfferSuccess(true);
                            // Refresh active offer state
                            setActiveAcceptedOffer(null);
                          } else {
                            setOfferError(res.error || "Failed to submit offer. Please try again.");
                          }
                        } catch (err) {
                          setOfferError("Connection error. Please try again.");
                        } finally {
                          setSubmittingOffer(false);
                        }
                      }}
                      className="flex-1 h-12 bg-orange-955 hover:bg-orange-700 text-white text-[10px] uppercase tracking-widest font-black transition-colors rounded-none flex items-center justify-center gap-2 font-sans"
                    >
                      {submittingOffer ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> {t("submitting")}
                        </>
                      ) : (
                        t("submit_proposal")
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 flex items-center justify-center rounded-none mx-auto mb-6 text-emerald-600">
                    <Tag size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-orange-955 mb-2">{t("offer_sent")}</h3>
                  <p className="text-orange-955/60 text-xs font-semibold max-w-sm mx-auto mb-8 leading-relaxed font-sans">
                    Your dynamic bargain proposal of <span className="text-orange-600 font-extrabold">{formatPrice(offeredPrice)}</span> has been securely submitted! We will notify you once the store responds. You can track this bargain under your profile panel.
                  </p>
                  <button
                    onClick={() => {
                      setIsOfferModalOpen(false);
                      setOfferSuccess(false);
                    }}
                    className="w-full h-12 bg-orange-955 hover:bg-orange-700 text-white text-[10px] uppercase tracking-widest font-black transition-colors rounded-none font-sans"
                  >
                    {t("done")}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Boutique Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            id="gomo-boutique-chat-modal"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-24 z-[100] w-80 sm:w-96 h-[450px] bg-white border border-orange-100 shadow-2xl flex flex-col rounded-2xl overflow-hidden"
          >
            {/* Direct Communication Bridge: Voice & Video Call Overlay */}
            {callState !== 'idle' && (
              <div className="absolute inset-0 z-50 bg-[#2b170e]/95 backdrop-blur-md text-white flex flex-col justify-between p-6">
                {/* Caller Identity */}
                <div className="text-center mt-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-2xl mx-auto mb-4 border-2 border-white/20 shadow-xl animate-pulse">
                    {callType === 'video' ? '📹' : '📞'}
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest leading-none mb-2">{product.brand || "Boutique Rep"}</h4>
                  <p className="text-[8px] text-orange-200 uppercase tracking-widest font-bold">
                    {callState === 'connecting' && 'Connecting Securely...'}
                    {callState === 'ringing' && 'Ringing...'}
                    {callState === 'connected' && `Connected (${formatCallTime(callSeconds)})`}
                    {callState === 'ended' && 'Call Secured & Session Logged'}
                  </p>
                </div>

                {/* Simulated Webcam Feeds (if Video) */}
                {callType === 'video' && callState === 'connected' && (
                  <div className="flex-grow my-4 relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Remote boutique stream */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg mb-2 border border-white/20">
                        🌾
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-black text-amber-400">Live Grains Vault Feed</span>
                      <span className="text-[6px] text-white/50 uppercase tracking-wider font-semibold mt-1">Authenticity verified</span>
                    </div>

                    {/* Local client webcam picture-in-picture */}
                    <div className="absolute bottom-2 right-2 w-14 h-20 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden flex flex-col items-center justify-center p-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs mb-1">
                        👤
                      </div>
                      <span className="text-[5px] text-white/80 uppercase font-black tracking-widest truncate max-w-full">{customerName.split(' ')[0]}</span>
                      <span className="text-[4px] text-emerald-400 uppercase font-bold tracking-wider mt-0.5">HD Camera</span>
                    </div>
                  </div>
                )}

                {/* Simulated Pulsating Voice Spectrum (if Voice) */}
                {callType === 'voice' && callState === 'connected' && (
                  <div className="flex-grow flex items-center justify-center my-4">
                    <div className="flex items-end gap-1 h-12">
                      {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((val, idx) => (
                        <div 
                          key={idx} 
                          className="w-1 bg-amber-400 rounded-full animate-bounce"
                          style={{ 
                            height: `${val * 8}px`,
                            animationDelay: `${idx * 0.08}s`,
                            animationDuration: '0.8s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Dialing ringing visual effect */}
                {(callState === 'connecting' || callState === 'ringing') && (
                  <div className="flex-grow flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-16 h-16 rounded-full border border-white/20 animate-ping" />
                      <div className="absolute w-24 h-24 rounded-full border border-white/10 animate-ping [animation-delay:0.5s]" />
                      <span className="text-lg">🔒</span>
                    </div>
                  </div>
                )}

                {/* Call End Placeholder */}
                {callState === 'ended' && (
                  <div className="flex-grow flex items-center justify-center text-center px-4">
                    <p className="text-[10px] font-medium text-orange-200 leading-relaxed">
                      "Thank you for negotiating with the boutique. High fidelity call audit log is synced with checkout token."
                    </p>
                  </div>
                )}

                {/* Control Action Buttons */}
                <div className="flex justify-center gap-4 mb-4">
                  {callState === 'connected' && (
                    <>
                      <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 active:scale-95">
                        <MicOff size={14} />
                      </button>
                      <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 active:scale-95">
                        <VideoOff size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={endSimulatedCall}
                    className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-950/30"
                  >
                    <PhoneOff size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-4 py-3 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm shrink-0">
                  👑
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-black uppercase tracking-widest leading-none truncate max-w-[140px]">{product.brand || "Boutique Representative"}</h4>
                  <span className="text-[8px] text-white/80 uppercase tracking-wider font-semibold">Gold/Platinum Negotiator</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => triggerSimulatedCall('voice')}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all active:scale-95"
                  title="Voice Call"
                >
                  <Phone size={13} />
                </button>
                <button 
                  onClick={() => triggerSimulatedCall('video')}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all active:scale-95"
                  title="Video Call"
                >
                  <Video size={13} />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Product Summary banner inside chat */}
            <div className="bg-orange-50/50 border-b border-orange-100/50 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
              <img src={product.thumbnail} alt={product.name} className="w-8 h-8 object-cover rounded border border-orange-100 bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-[9.5px] font-black text-orange-955 uppercase truncate leading-none mb-0.5">{product.name}</p>
                <p className="text-[9px] text-orange-600 font-extrabold leading-none">{formatPrice(currentPrice)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto bg-orange-50/15 space-y-3.5 no-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isCustomer = msg.sender === "customer";
                return (
                  <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-[10.5px] leading-relaxed shadow-sm font-semibold ${
                      isCustomer 
                        ? 'bg-orange-600 text-white rounded-tr-none' 
                        : 'bg-white text-orange-900 border border-orange-100/50 rounded-tl-none'
                    }`}>
                      {msg.text}
                      <span className={`block text-[6.5px] uppercase tracking-wider mt-1 text-right font-black ${
                        isCustomer ? 'text-white/60' : 'text-orange-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-orange-50 bg-white flex-shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                className="flex items-center gap-2"
              >
                <input 
                  type="text" 
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Ask for custom deal, sizing, shipping..."
                  className="flex-1 bg-orange-50 border border-orange-100 text-[10px] uppercase tracking-wider outline-none px-4 py-2.5 focus:border-orange-500 focus:bg-white transition-all shadow-sm rounded-lg"
                />
                <button 
                  type="submit"
                  className="w-10 h-10 bg-orange-955 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-md active:scale-95 flex-shrink-0"
                >
                  <Send size={12} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScheduleModalOpen && (
          <ScheduleModal 
            product={product} 
            onClose={() => setIsScheduleModalOpen(false)} 
            onSuccess={() => setIsScheduleModalOpen(false)} 
          />
        )}
      </AnimatePresence>

      <VirtualTryOnModal 
        isOpen={isVirtualTryOnOpen} 
        onClose={() => setIsVirtualTryOnOpen(false)} 
        product={product} 
        initialImage={currentGallery?.[0]} 
      />
    </div>
  );
};

export default ProductDetails;


