import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, 
  MoreHorizontal, 
  User, 
  Clock, 
  CheckCheck,
  Phone,
  Video,
  Info,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Tag,
  HelpCircle,
  PhoneOff,
  MicOff,
  VideoOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const SellerMessages = () => {
  const { user } = useAuth();
  const sellerId = user?.seller_id || user?.id || "general_seller";

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const chatEndRef = useRef(null);

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

  const loadConversations = () => {
    try {
      const list = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("gomo_chats_")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            if (String(data.sellerId) === String(sellerId)) {
              list.push(data);
            }
          }
        }
      }

      // Seed if zero total chats
      if (list.length === 0) {
        // Seed default chats into localStorage
        const wrightKey = `gomo_chats_alex_123_${sellerId}`;
        const devKey = `gomo_chats_sanjay_456_${sellerId}`;
        
        const wrightChat = {
          customerId: "alex_123",
          customerName: "Alexander Wright",
          sellerId: sellerId,
          sellerName: "Your Boutique",
          productId: "prod_dummy_1",
          productName: "Signature Wooden Chair",
          productThumbnail: "https://via.placeholder.com/150?text=Chair",
          messages: [
            { sender: "customer", text: "Hi, I'm interested in the signature wooden chair from your summer collection. Is it currently in stock for immediate dispatch?", timestamp: Date.now() - 3600000 },
            { sender: "seller", text: "Absolutely. We have exactly 5 units left in our premium inventory. Would you like me to reserve one for you?", timestamp: Date.now() - 3400000 },
            { sender: "customer", text: "That sounds perfect. Also, is the same model available in a deep navy blue finish?", timestamp: Date.now() - 3200000 }
          ],
          lastUpdated: Date.now() - 3200000,
          unreadBySeller: true,
          unreadByCustomer: false
        };
        localStorage.setItem(wrightKey, JSON.stringify(wrightChat));

        const devChat = {
          customerId: "sanjay_456",
          customerName: "Sanjay Dev",
          sellerId: sellerId,
          sellerName: "Your Boutique",
          productId: "prod_dummy_2",
          productName: "Tuscan Ceramic Vase",
          productThumbnail: "https://via.placeholder.com/150?text=Vase",
          messages: [
            { sender: "customer", text: "I've received the package, thank you! The craftsmanship is absolutely gorgeous.", timestamp: Date.now() - 7200000 }
          ],
          lastUpdated: Date.now() - 7200000,
          unreadBySeller: false,
          unreadByCustomer: false
        };
        localStorage.setItem(devKey, JSON.stringify(devChat));

        list.push(wrightChat, devChat);
      }

      // Sort by lastUpdated descending
      list.sort((a, b) => b.lastUpdated - a.lastUpdated);
      setConversations(list);
    } catch (e) {
      console.error("Error loading chat conversations:", e);
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Listen for tab sync events
    window.addEventListener("storage", loadConversations);
    window.addEventListener("gomo_chat_update", loadConversations);
    
    return () => {
      window.removeEventListener("storage", loadConversations);
      window.removeEventListener("gomo_chat_update", loadConversations);
    };
  }, [sellerId]);

  // Set default selected conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
    } else if (selectedConv) {
      // Keep selected conversation in sync with newly loaded data
      const updated = conversations.find(c => c.customerId === selectedConv.customerId);
      if (updated) {
        setSelectedConv(updated);
      }
    }
  }, [conversations]);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;
    
    const newMsg = {
      sender: "seller",
      text: messageText.trim(),
      timestamp: Date.now()
    };
    
    const updatedConv = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMsg],
      lastUpdated: Date.now(),
      unreadBySeller: false,
      unreadByCustomer: true
    };
    
    const storageKey = `gomo_chats_${selectedConv.customerId}_${selectedConv.sellerId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedConv));
    
    setMessageText("");
    loadConversations();
    
    // Dispatch custom tab update event
    window.dispatchEvent(new Event("gomo_chat_update"));
  };

  const filteredConversations = conversations.filter(conv => 
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-fadeIn h-[calc(100vh-140px)] flex flex-col font-sans">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-orange-100/60 flex-shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-650">
              <MessageSquare size={10} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.35em] text-orange-600 font-extrabold">Boutique Correspondences</span>
          </div>
          <h1 className="text-3xl font-serif text-orange-955 font-normal tracking-tight">
            Client <span className="italic font-light text-orange-600">Message Lounge</span>
          </h1>
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-semibold">
            Negotiate bargains, custom requests, and express arrangements.
          </p>
        </div>
        
        {/* Dynamic status pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Boutique Online & Active</span>
        </div>
      </div>

      {/* ── Main Message Workspace Card ── */}
      <div className="flex-grow flex bg-white border border-orange-100 rounded-3xl shadow-[0_15px_40px_rgba(234,88,12,0.02)] overflow-hidden min-h-0">
        
        {/* ── Left Sidebar (Conversations List) ── */}
        <div className="w-80 md:w-96 border-r border-orange-100 flex flex-col bg-orange-50/10 flex-shrink-0">
          
          {/* Sidebar Pill Search */}
          <div className="p-5 border-b border-orange-50 bg-white">
            <div className="relative group">
              <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-955 transition-colors" />
              <input 
                type="text" 
                placeholder="Find client or collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-orange-50/40 border border-orange-100 rounded-full text-[10px] uppercase tracking-widest outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner placeholder-orange-300 font-semibold"
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {filteredConversations.map((conv) => {
              const lastMsgObj = conv.messages[conv.messages.length - 1];
              const lastMsgText = lastMsgObj ? lastMsgObj.text : "No messages yet";
              const lastMsgTime = lastMsgObj 
                ? new Date(lastMsgObj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : "Just now";
              const unread = conv.unreadBySeller;
              const isSelected = selectedConv?.customerId === conv.customerId;

              return (
                <motion.div 
                  key={conv.customerId}
                  whileHover={{ x: 2 }}
                  onClick={() => {
                    setSelectedConv(conv);
                    if (conv.unreadBySeller) {
                      const updated = { ...conv, unreadBySeller: false };
                      localStorage.setItem(`gomo_chats_${conv.customerId}_${conv.sellerId}`, JSON.stringify(updated));
                      window.dispatchEvent(new Event("gomo_chat_update"));
                      loadConversations();
                    }
                  }}
                  className={`mx-3 my-1.5 p-4 rounded-2xl flex items-center gap-4.5 cursor-pointer transition-all relative border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-orange-50/40 via-amber-50/15 to-white border-orange-200/60 shadow-[0_8px_20px_rgba(234,88,12,0.03)] z-10' 
                      : 'border-transparent hover:bg-white hover:border-orange-100/40 hover:shadow-sm'
                  }`}
                >
                  {/* Initials Avatar inside premium status ring */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-900 to-orange-955 flex items-center justify-center font-serif italic text-white text-base shadow-md transition-transform duration-300 ${isSelected ? 'scale-105' : ''}`}>
                      {conv.customerName.charAt(0)}
                    </div>
                    {unread && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-600 border border-white text-[8px] font-black text-white items-center justify-center">!</span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-[10.5px] font-extrabold text-orange-955 uppercase tracking-widest truncate">{conv.customerName}</h4>
                      <span className="text-[7.5px] text-orange-400 font-extrabold uppercase tracking-widest shrink-0">{lastMsgTime}</span>
                    </div>
                    <p className={`text-[9.5px] truncate font-medium ${unread ? 'text-orange-955 font-bold' : 'text-orange-500/80'}`}>
                      {lastMsgText}
                    </p>
                    {conv.productName && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[7px] font-black uppercase tracking-wider text-orange-400/80 border border-orange-100 bg-orange-50/30 px-2 py-0.5 rounded-md">
                        {conv.productName}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <motion.div layoutId="active-chat-indicator" className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}
            
            {filteredConversations.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <HelpCircle size={20} className="mx-auto text-orange-200 animate-pulse" />
                <p className="text-orange-400 text-[9px] uppercase tracking-widest font-black">No correspondances found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Conversation Details Area ── */}
        <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {selectedConv ? (
            <>
              {/* Direct Communication Bridge: Voice & Video Call Overlay */}
              {callState !== 'idle' && (
                <div className="absolute inset-0 z-50 bg-[#2b170e]/97 backdrop-blur-md text-white flex flex-col justify-between p-8">
                  {/* Caller Identity */}
                  <div className="text-center mt-12">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-white/20 shadow-xl animate-pulse">
                      {callType === 'video' ? '📹' : '📞'}
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest leading-none mb-2">{selectedConv.customerName}</h4>
                    <p className="text-[10px] text-orange-200 uppercase tracking-widest font-bold">
                      {callState === 'connecting' && 'Connecting Securely...'}
                      {callState === 'ringing' && 'Ringing...'}
                      {callState === 'connected' && `Connected (${formatCallTime(callSeconds)})`}
                      {callState === 'ended' && 'Call Secured & Session Logged'}
                    </p>
                  </div>

                  {/* Simulated Webcam Feeds (if Video) */}
                  {callType === 'video' && callState === 'connected' && (
                    <div className="flex-grow my-6 relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center shadow-inner max-w-xl mx-auto w-full h-[220px]">
                      {/* Remote client stream */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl mb-2 border border-white/20">
                          👤
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-amber-400">{selectedConv.customerName}</span>
                        <span className="text-[7px] text-white/50 uppercase tracking-wider font-semibold mt-1">Client Connection Verified</span>
                      </div>

                      {/* Local seller webcam picture-in-picture */}
                      <div className="absolute bottom-3 right-3 w-20 h-28 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden flex flex-col items-center justify-center p-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base mb-1">
                          👑
                        </div>
                        <span className="text-[7px] text-white/80 uppercase font-black tracking-widest truncate max-w-full">Boutique</span>
                        <span className="text-[5px] text-emerald-400 uppercase font-bold tracking-wider mt-0.5">Seller HD</span>
                      </div>
                    </div>
                  )}

                  {/* Simulated Pulsating Voice Spectrum (if Voice) */}
                  {callType === 'voice' && callState === 'connected' && (
                    <div className="flex-grow flex items-center justify-center my-6">
                      <div className="flex items-end gap-1.5 h-16">
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                          <div 
                            key={idx} 
                            className="w-1 bg-amber-400 rounded-full animate-bounce"
                            style={{ 
                              height: `${val * 12}px`,
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
                        <div className="absolute w-24 h-24 rounded-full border border-white/20 animate-ping" />
                        <div className="absolute w-36 h-36 rounded-full border border-white/10 animate-ping [animation-delay:0.5s]" />
                        <span className="text-xl">🔒</span>
                      </div>
                    </div>
                  )}

                  {/* Call End Placeholder */}
                  {callState === 'ended' && (
                    <div className="flex-grow flex items-center justify-center text-center px-6">
                      <p className="text-xs font-serif italic text-orange-200 leading-relaxed max-w-md">
                        "Concierge line secured. Negotiation audio logs and transcripts have been generated and synced with client token."
                      </p>
                    </div>
                  )}

                  {/* Control Action Buttons */}
                  <div className="flex justify-center gap-6 mb-8">
                    {callState === 'connected' && (
                      <>
                        <button className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 active:scale-95">
                          <MicOff size={16} />
                        </button>
                        <button className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 active:scale-95">
                          <VideoOff size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={endSimulatedCall}
                      className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-950/30"
                    >
                      <PhoneOff size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Premium Concierge Active Chat Header */}
              <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/10 flex-shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-900 flex items-center justify-center font-serif italic text-white text-lg shadow animate-fadeIn">
                    {selectedConv.customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-orange-955 uppercase tracking-[0.2em]">{selectedConv.customerName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       <div className="flex items-center gap-1">
                         <span className="relative flex h-1.5 w-1.5">
                           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                         </span>
                         <span className="text-[7.5px] text-orange-400 font-black uppercase tracking-[0.1em]">Negotiating Client</span>
                       </div>
                       <span className="text-orange-200">|</span>
                       <div className="flex items-center gap-1.5">
                         <span className="text-[7.5px] font-bold text-orange-600 uppercase tracking-widest bg-orange-100/50 px-2 py-1 rounded">
                           Direct Calls Disabled
                         </span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Highly styled Contextual micro product card */}
                {selectedConv.productName && (
                  <div className="flex items-center gap-3 border border-amber-200/60 bg-gradient-to-r from-amber-50/40 to-white px-3.5 py-1.5 rounded-2xl shadow-sm max-w-xs md:max-w-md">
                    <img src={selectedConv.productThumbnail} alt="" className="w-9 h-9 object-cover rounded-xl border border-amber-100 bg-white flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-[7px] text-amber-600 uppercase tracking-widest font-black leading-none mb-0.5 flex items-center gap-1">
                        <ShoppingBag size={7} />
                        <span>Bargain Item</span>
                      </p>
                      <p className="text-[9.5px] font-black text-orange-955 uppercase tracking-wide truncate max-w-[140px] leading-tight">{selectedConv.productName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Scrolling Messages Lounge */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-orange-50/15 space-y-6 no-scrollbar">
                {selectedConv.messages.map((msg, idx) => {
                  const isSeller = msg.sender === "seller";
                  const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={idx} className={`flex ${isSeller ? "justify-end" : "justify-start"}`}>
                      <div className={`space-y-1.5 max-w-[70%] ${isSeller ? "text-right" : "text-left"}`}>
                        
                        {/* Premium custom message bubble */}
                        <div className={`px-5 py-3.5 shadow-sm leading-relaxed text-[11px] font-semibold border ${
                          isSeller 
                            ? "bg-orange-955 text-white border-orange-955 rounded-[20px] rounded-tr-none" 
                            : "bg-white text-orange-900 border-orange-100 rounded-[20px] rounded-tl-none shadow-[0_4px_12px_rgba(234,88,12,0.015)]"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        
                        {/* Status bar (Timestamp & Read Indicator) */}
                        <div className={`flex items-center gap-1.5 text-[7px] text-orange-400 font-extrabold uppercase tracking-wider px-2 ${
                          isSeller ? "justify-end" : "justify-start"
                        }`}>
                          <span>{formattedTime}</span>
                          {isSeller && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCheck size={9} />
                                <span>Delivered</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Premium Pill input Area - Disabled */}
              <div className="p-6 border-t border-orange-100 bg-orange-50 flex-shrink-0 text-center">
                <p className="text-xs font-bold text-orange-800 bg-orange-100/50 py-3 rounded-xl border border-orange-200">
                  ⚠️ Direct chat and calls are disabled. Please use the Scheduled Video Conference system to communicate with buyers.
                </p>
              </div>
            </>
          ) : (
            // Exquisite welcome empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-orange-50/5">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 0.5 }}
                 className="space-y-6 max-w-sm"
               >
                 <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg relative">
                    <span className="text-3xl">👑</span>
                    <Sparkles className="absolute -top-1.5 -right-1.5 w-5 h-5 text-orange-400 animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-serif text-orange-955 font-normal tracking-tight">Luxury Negotiation Lobby</h3>
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-black leading-relaxed">Select a conversation thread to engage client negotiations, propose pricing adjustments, and confirm customized boutique purchases.</p>
                 </div>
               </motion.div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SellerMessages;
