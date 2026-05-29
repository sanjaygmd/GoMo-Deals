import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Handshake, 
  Search, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Coins, 
  DollarSign, 
  Percent, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X
} from "lucide-react";
import * as offerService from "../../services/offerService";
import { useAuth } from "../../context/AuthContext.jsx";

const SellerOffers = ({ onOfferUpdate }) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Counter modal states
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await offerService.getSellerOffers();
      if (res.success && res.offers) {
        // Map backend snake_case keys to client-side camelCase properties
        const mapped = res.offers.map(o => ({
          id: o.offer_id,
          productId: o.product_id,
          productName: o.product_name,
          productThumbnail: o.product_thumbnail,
          originalPrice: o.list_price,
          bargainedPrice: o.offered_price,
          customerName: o.customer_name,
          customerEmail: o.customer_email || "customer@gomo.deals",
          status: o.status,
          sellerCounterPrice: o.seller_counter_price
        }));
        setOffers(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch seller offer requests:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleAction = async (offerId, action, price = null) => {
    setSubmittingResponse(true);
    setErrorMsg("");
    try {
      const res = await offerService.respondToOffer(offerId, action, price);
      if (res.success) {
        setSelectedOffer(null);
        setCounterPrice("");
        await fetchOffers(); // reload offers
        if (onOfferUpdate) onOfferUpdate();
      } else {
        setErrorMsg(res.error || `Failed to perform action: ${action}`);
      }
    } catch (err) {
      setErrorMsg("Connection error while submitting seller response.");
      console.error(err);
    }
    setSubmittingResponse(false);
  };

  const statusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-amber-600 border-amber-200 bg-amber-50/50";
      case "accepted":
        return "text-emerald-600 border-emerald-200 bg-emerald-50/50";
      case "rejected":
        return "text-rose-600 border-rose-200 bg-rose-50/50";
      case "countered":
        return "text-blue-600 border-blue-200 bg-blue-50/50";
      case "expired":
        return "text-orange-955/65 border-orange-200/50 bg-orange-50/30";
      default:
        return "text-orange-500 border-orange-100 bg-orange-50/50";
    }
  };

  // Filter and search logic
  const filteredOffers = offers.filter(offer => {
    const productName = offer.productName || "";
    const customerName = offer.customerName || "";
    const customerEmail = offer.customerEmail || "";
    const status = offer.status || "";

    const matchesSearch = 
      productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || status.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  // Offer stats calculation
  const totalProposals = offers.length;
  const pendingProposals = offers.filter(o => o.status?.toLowerCase() === 'pending').length;
  const acceptedProposals = offers.filter(o => o.status?.toLowerCase() === 'accepted').length;
  const activeBargainRevenue = offers
    .filter(o => o.status?.toLowerCase() === 'accepted')
    .reduce((sum, o) => sum + Number(o.bargainedPrice || 0), 0);

  const tabs = [
    { id: "all", label: "All Requests", icon: Handshake },
    { id: "pending", label: "Pending Review", icon: Clock },
    { id: "countered", label: "Countered", icon: RotateCcw },
    { id: "accepted", label: "Accepted Deals", icon: CheckCircle2 },
    { id: "rejected", label: "Declined", icon: XCircle }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-950 rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold">Retrieving buyer bargains...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header (Search & Title) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <h2 className="text-lg font-bold text-orange-950 flex items-center gap-2">
          <Handshake size={18} className="text-orange-600" />
          Manage Offers
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 group-focus-within:text-orange-950 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY PRODUCT OR CUSTOMER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-2.5 bg-orange-50 border border-orange-100 text-[10px] uppercase tracking-widest outline-none focus:border-orange-955 focus:bg-white transition-all w-72 shadow-sm rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      <AnimatePresence>
        {errorMsg && !selectedOffer && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-between shadow-sm rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} />
              <p className="text-[10px] uppercase tracking-wider font-bold">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-600">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-orange-100/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-3 transition-all relative ${
              activeTab === tab.id 
                ? "text-orange-955" 
                : "text-orange-400 hover:text-orange-600"
            }`}
          >
            <tab.icon size={13} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} className={activeTab === tab.id ? "text-orange-600" : "text-orange-400"} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-black">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="offer-tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-950" />
            )}
          </button>
        ))}
      </div>

      {/* Offers Table */}
      <div className="bg-white border border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-orange-50/80 text-[9px] text-orange-500 uppercase tracking-[0.4em] font-black border-b border-orange-100">
                <th className="px-8 py-6 font-black">Customer Details</th>
                <th className="px-8 py-6 font-black">Product Details</th>
                <th className="px-8 py-6 text-center font-black">Original Price</th>
                <th className="px-8 py-6 text-center font-black">Offered Bargain</th>
                <th className="px-8 py-6 text-center font-black">Negotiation Status</th>
                <th className="px-8 py-6 text-center font-black">Action Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              <AnimatePresence mode="popLayout">
                {filteredOffers.length > 0 ? filteredOffers.map((offer, idx) => {
                  const discountPct = Math.round(((Number(offer.originalPrice) - Number(offer.bargainedPrice)) / Number(offer.originalPrice)) * 100);
                  
                  return (
                    <motion.tr
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group hover:bg-orange-50/30 transition-colors"
                    >
                      {/* Customer */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider">{offer.customerName}</span>
                          <span className="text-[9px] text-orange-400 font-medium lowercase tracking-normal mt-0.5">{offer.customerEmail}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-orange-50 border border-orange-100 rounded overflow-hidden flex-shrink-0">
                            <img src={offer.productThumbnail} alt={offer.productName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col max-w-[220px]">
                            <span className="text-[11px] font-extrabold text-orange-955 truncate leading-tight uppercase tracking-wider">{offer.productName}</span>
                            <span className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mt-1">ID: {(offer.productId || "").slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Original Price */}
                      <td className="px-8 py-6 text-center">
                        <span className="text-[12px] text-orange-900 font-semibold line-through opacity-55">₹{Number(offer.originalPrice).toLocaleString()}</span>
                      </td>

                      {/* Offered Bargain */}
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-orange-950 tracking-tight">₹{Number(offer.bargainedPrice).toLocaleString()}</span>
                          <span className="text-[8px] font-black bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded mt-1.5 uppercase tracking-widest flex items-center gap-1">
                            <TrendingDown size={9} />
                            <span>Save {discountPct}%</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-block px-4 py-1 text-[8px] font-black uppercase tracking-[0.25em] border rounded-full ${statusStyle(offer.status)}`}>
                          {offer.status}
                        </span>
                        {offer.status.toLowerCase() === 'countered' && offer.sellerCounterPrice && (
                          <div className="text-[8px] uppercase tracking-wider text-orange-500 font-bold mt-1.5">
                            Counter: ₹{Number(offer.sellerCounterPrice).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-center">
                        {(offer.status.toLowerCase() === 'pending' || offer.status.toLowerCase() === 'countered') ? (
                          <div className="flex items-center justify-center gap-2">
                            {/* Accept Button */}
                            <button
                              onClick={() => handleAction(offer.id, "Accept")}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                              title="Accept offer price and generate secure checkout token"
                            >
                              Accept
                            </button>
                            
                            {/* Counter Option */}
                            <button
                              onClick={() => {
                                setSelectedOffer(offer);
                                setCounterPrice(Math.round(Number(offer.bargainedPrice) * 1.1)); // Recommend +10% of offer
                                setErrorMsg("");
                              }}
                              className="px-3 py-2 bg-orange-50 hover:bg-orange-950 hover:text-white border border-orange-200 text-orange-900 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer active:scale-95"
                              title="Propose a custom counter offer price"
                            >
                              Counter
                            </button>

                            {/* Decline Button */}
                            <button
                              onClick={() => handleAction(offer.id, "Reject")}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 hover:text-white text-rose-600 text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer active:scale-95"
                              title="Reject price proposal"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-orange-950/40">Closed</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-32 text-center text-[10px] uppercase tracking-[0.6em] text-orange-400">
                      No matching bargaining offers found
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* COUNTER OFFER GLASSMORPHIC SLIDER MODAL */}
      <AnimatePresence>
        {selectedOffer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-md w-full border border-orange-100 shadow-[0_25px_60px_rgba(23,10,2,0.18)] p-8 relative space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <RotateCcw className="text-orange-500 animate-spin-slow" size={14} />
                  <h3 className="text-sm uppercase tracking-[0.25em] font-black text-orange-955">Propose Counter Offer</h3>
                </div>
                <button 
                  onClick={() => setSelectedOffer(null)} 
                  className="text-orange-400 hover:text-orange-900 transition-colors font-bold text-xs"
                >
                  Close
                </button>
              </div>

              {/* Product Card Inside Modal */}
              <div className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100/50 rounded-xl">
                <img src={selectedOffer.productThumbnail} alt={selectedOffer.productName} className="w-14 h-16 object-cover rounded border border-orange-100 bg-white" />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[11px] font-black uppercase text-orange-955 truncate tracking-wider">{selectedOffer.productName}</span>
                  <span className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-widest">
                    Buyer Offer: ₹{Number(selectedOffer.bargainedPrice).toLocaleString()}
                  </span>
                  <span className="text-[8px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">
                    Retail Price: ₹{Number(selectedOffer.originalPrice).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-[0.3em] font-black text-orange-900 block text-left">Propose Counter Offer Amount (₹)</label>
                <div className="flex items-center bg-orange-50 border border-orange-100 p-1 pl-4 transition-all focus-within:bg-white focus-within:border-orange-500">
                  <span className="text-xs font-bold text-orange-500 mr-1.5">₹</span>
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-black text-orange-955 focus:ring-0"
                    placeholder="Enter price..."
                    disabled={submittingResponse}
                  />
                </div>
                
                {/* Visual guidelines */}
                <div className="text-[9px] uppercase tracking-wider text-orange-500 bg-amber-50/40 border border-amber-200/55 p-3 leading-relaxed text-left">
                  ⚠️ Note: Counter offers will be proposed directly back to the customer's dashboard. Customer must accept or counter again to finalize the discount token.
                </div>

                {errorMsg && (
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest text-left">{errorMsg}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-orange-100">
                <button
                  onClick={() => handleAction(selectedOffer.id, "Counter", Number(counterPrice))}
                  disabled={submittingResponse || !counterPrice || Number(counterPrice) <= Number(selectedOffer.bargainedPrice) || Number(counterPrice) >= Number(selectedOffer.originalPrice)}
                  className={`flex-grow py-3 text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                    (!counterPrice || Number(counterPrice) <= Number(selectedOffer.bargainedPrice) || Number(counterPrice) >= Number(selectedOffer.originalPrice))
                      ? 'bg-orange-50 text-orange-200 border border-orange-100 cursor-not-allowed'
                      : 'bg-orange-950 hover:bg-orange-900 text-white cursor-pointer shadow-lg'
                  }`}
                >
                  {submittingResponse ? "Submitting Counter..." : "Submit Counter Offer"}
                  <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="px-6 py-3 border border-orange-200 hover:bg-orange-50 text-orange-950 text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer"
                  disabled={submittingResponse}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerOffers;
