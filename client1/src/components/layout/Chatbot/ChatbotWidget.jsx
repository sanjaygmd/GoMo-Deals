import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, Send, Trash2, X, Sparkles, Bot, User, Clock, ArrowUp
} from 'lucide-react';
import { sendChatbotMessage } from '../../../services/chatbotService';
import { useAuth } from '../../../context/AuthContext';

const ChatbotWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedReplies, setSuggestedReplies] = useState([
        "🔥 Show hot deals",
        "📦 Track my order",
        "💬 Return & Refund policy",
        "👗 Explore fashion deals"
    ]);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isSellerChatActive, setIsSellerChatActive] = useState(false);

    // Listen for custom seller chat active status to hide AI chatbot overlap
    useEffect(() => {
        const handleChatStatus = (e) => {
            const active = e.detail.isOpen;
            setIsSellerChatActive(active);
            if (active) {
                setIsOpen(false); // Close AI Chatbot if it's open
            }
        };

        window.addEventListener("gomo_chat_status", handleChatStatus);
        
        // Initial check in case it's already open on mount
        const activeChatDiv = document.getElementById("gomo-boutique-chat-modal");
        if (activeChatDiv) {
            setIsSellerChatActive(true);
            setIsOpen(false);
        }

        return () => {
            window.removeEventListener("gomo_chat_status", handleChatStatus);
        };
    }, []);

    // Scroll to top window listener
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const messagesEndRef = useRef(null);

    // Load message history from local storage when component mounts or user changes
    useEffect(() => {
        if (user?.id) {
            const chatKey = `gomo_chat_history_${user.id}`;
            const cachedMessages = localStorage.getItem(chatKey);
            if (cachedMessages) {
                setMessages(JSON.parse(cachedMessages));
            } else {
                // Initial welcoming message
                const welcomeMsg = {
                    role: 'model',
                    text: "Hi there! 👋 I'm **GoMo Deals Assistant**, your smart personal shopping partner. I can help you find hot discount deals, search items in Electronics, Fashion, or Home & Living, track active orders, or explain our shipping and return policies. How can I help you save today?",
                    timestamp: new Date().toISOString()
                };
                setMessages([welcomeMsg]);
                localStorage.setItem(chatKey, JSON.stringify([welcomeMsg]));
            }
        } else {
            // Guest user: start with a clean welcoming message on mount/refresh (never saved to localStorage)
            const welcomeMsg = {
                role: 'model',
                text: "Hi there! 👋 I'm **GoMo Deals Assistant**, your smart personal shopping partner. I can help you find hot discount deals, search items in Electronics, Fashion, or Home & Living, track active orders, or explain our shipping and return policies. How can I help you save today?",
                timestamp: new Date().toISOString()
            };
            setMessages([welcomeMsg]);
        }
    }, [user]);

    // Auto-scroll messages container to bottom on new messages or loading state
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, isOpen]);

    // Save messages to local storage whenever they change, keeping only the last 20 messages to prevent unbounded growth
    const saveMessages = (newMessages) => {
        const cappedMessages = newMessages.slice(-20);
        setMessages(cappedMessages);
        
        if (user?.id) {
            const chatKey = `gomo_chat_history_${user.id}`;
            localStorage.setItem(chatKey, JSON.stringify(cappedMessages));
        }
    };

    const handleSendMessage = async (textToSend) => {
        const query = textToSend || inputValue.trim();
        if (!query) return;

        // Add user message to state
        const userMsg = {
            role: 'user',
            text: query,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...messages, userMsg];
        saveMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            // Map history format: { role: 'user' | 'model', content: string }
            const historyForAPI = updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.text
            }));

            const response = await sendChatbotMessage(query, historyForAPI);

            if (response && response.success) {
                const botMsg = {
                    role: 'model',
                    text: response.reply,
                    timestamp: new Date().toISOString()
                };
                saveMessages([...updatedMessages, botMsg]);
                
                // Update dynamic quick suggested replies
                if (response.suggestedReplies && response.suggestedReplies.length > 0) {
                    setSuggestedReplies(response.suggestedReplies);
                } else {
                    setSuggestedReplies(["🔥 More hot deals", "📦 Track Order", "🔙 Main Menu"]);
                }
            }
        } catch (error) {
            console.error("Chatbot response error:", error);
            const errorMsg = {
                role: 'model',
                text: "I'm having a little connection issue. Please make sure your server is running or try again in a few seconds!",
                timestamp: new Date().toISOString()
            };
            saveMessages([...updatedMessages, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        const welcomeMsg = {
            role: 'model',
            text: "Welcome back! How can I help you find the best deals today? 🔥",
            timestamp: new Date().toISOString()
        };
        saveMessages([welcomeMsg]);
        setSuggestedReplies([
            "🔥 Show hot deals",
            "📦 Track my order",
            "💬 Return & Refund policy",
            "👗 Explore fashion deals"
        ]);
    };

    // Helper to format timestamps nicely
    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    // Helper to render markdown bolding/emojis nicely in messages
    const renderMessageText = (text) => {
        if (!text) return '';
        // Replace simple **text** with bold tags
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-extrabold text-orange-950">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (isSellerChatActive) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[999] font-sans flex flex-col gap-4 items-end">
            {/* A. SCROLL TO TOP BUTTON */}
            <AnimatePresence>
                {showScrollTop && !isOpen && (
                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-12 h-12 bg-orange-950 border border-orange-500/20 text-orange-400 hover:border-orange-500 hover:bg-orange-900 hover:text-white shadow-lg cursor-pointer focus:outline-none rounded-full transition-all duration-300"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* B. FLOATING CHAT WIDGET TRIGGER */}
                {!isOpen && (
                    <div className="relative flex items-center justify-end">
                        <motion.button
                            onClick={() => setIsOpen(true)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                y: [0, -6, 0],
                                scale: 1,
                                opacity: 1
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                                y: {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                opacity: {
                                    duration: 0.3
                                }
                            }}
                            className="relative flex items-center justify-center w-14 h-14 bg-orange-950 border border-orange-500/40 text-white hover:bg-orange-900 hover:border-orange-500 rounded-full shadow-[0_8px_30px_rgba(67,23,5,0.3)] cursor-pointer focus:outline-none z-10 overflow-hidden transition-all duration-300"
                            aria-label="Open GoMo Deals AI Assistant"
                        >
                            {/* Ambient gradient shine */}
                            <motion.div
                                animate={{
                                    x: ['-200%', '200%']
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/35 to-transparent w-full h-full -skew-x-[25deg] pointer-events-none z-[1]"
                            />

                            <MessageSquare className="w-6 h-6 text-orange-400 relative z-[2] animate-pulse" />
                            {/* Live Active status dot */}
                            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-500 border-2 border-orange-950 rounded-full z-[2]"></span>
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* 2. CHAT PANEL WINDOW */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{ duration: 0.28, cubicBezier: [0.34, 1.56, 0.64, 1] }}
                        style={{ transformOrigin: "bottom right" }}
                        className="flex flex-col w-[385px] h-[600px] bg-white/98 backdrop-blur-xl border border-orange-100 rounded-3xl shadow-[0_20px_50px_rgba(31,15,7,0.15)] overflow-hidden"
                    >
                        
                        {/* A. CONCIERGE HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 bg-orange-950 border-b border-orange-900/10 text-white shadow-md">
                            <div className="flex items-center space-x-3">
                                {/* Elegant Espresso Bot Avatar */}
                                <div className="relative w-10 h-10 rounded-full bg-orange-900 border border-orange-500/30 flex items-center justify-center shadow-inner">
                                    <Bot className="w-5 h-5 text-orange-400" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-orange-950 rounded-full"></span>
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-serif italic text-sm tracking-wide text-white font-bold flex items-center gap-1.5">
                                        GoMo Deals Assistant
                                    </h3>
                                    <span className="text-[7.5px] uppercase tracking-[0.25em] text-orange-400/90 font-black flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        ONLINE ASSISTANCE
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                                {/* Clear History Button */}
                                <motion.button 
                                    onClick={handleClearChat}
                                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(249,115,22,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-full transition-colors duration-150 focus:outline-none cursor-pointer text-orange-200 hover:text-white"
                                    title="Clear Conversation"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                                {/* Close Panel Button */}
                                <motion.button
                                    onClick={() => setIsOpen(false)}
                                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(249,115,22,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-full transition-colors duration-150 focus:outline-none cursor-pointer text-orange-200 hover:text-white"
                                    title="Close Chat"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>

                        {/* B. MESSAGE CONTAINER */}
                        <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#ffffff] to-[#faf8f6] no-scrollbar">
                            {/* Empty Welcome Card */}
                            {messages.length === 0 && (
                                <div className="py-16 text-center flex flex-col items-center justify-center px-4">
                                    <div className="w-14 h-14 bg-white border border-orange-100 rounded-2xl flex items-center justify-center text-orange-950 shadow-sm mb-5">
                                        <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                                    </div>
                                    <h4 className="font-serif italic text-lg text-orange-955 mb-2">
                                        Smart Shopping Assistant
                                    </h4>
                                    <p className="text-[9px] text-orange-955/70 leading-relaxed font-sans max-w-[240px] uppercase tracking-[0.15em] font-extrabold">
                                        How can I help you find the best deals and track your orders today?
                                    </p>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`px-4.5 py-3 text-[12px] leading-relaxed whitespace-pre-wrap break-words transition-all shadow-[0_2px_10px_rgba(31,15,7,0.02)] ${
                                                    msg.role === 'user'
                                                        ? 'bg-orange-55 text-orange-950 border border-orange-100 rounded-2xl rounded-tr-none'
                                                        : 'bg-white text-orange-950 border border-orange-100 rounded-2xl rounded-tl-none border-l-4 border-l-orange-500 shadow-sm'
                                                }`}
                                            >
                                                {renderMessageText(msg.text)}
                                            </div>
                                            <span className="text-[8px] text-orange-950/40 mt-1.5 px-2 flex items-center gap-1 font-bold tracking-widest uppercase">
                                                <Clock className="w-2.5 h-2.5 text-orange-950/30" />
                                                <span>{formatTime(msg.timestamp)}</span>
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Animated Loading/Typing Bubble */}
                            {isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="flex flex-col items-start max-w-[80%]">
                                        <div className="px-4.5 py-2.5 bg-white text-orange-400 border border-orange-100 rounded-2xl rounded-tl-none border-l-4 border-l-orange-500 flex items-center space-x-1 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-orange-950 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-orange-950/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-orange-950/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* C. FOOTER WITH SUGGESTED REPLIES & INPUT */}
                        <div className="p-4 border-t border-orange-100/30 bg-[#faf8f5]/60">
                            
                            {/* Interactive Suggestion Chips */}
                            {suggestedReplies.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3.5 max-h-[85px] overflow-y-auto no-scrollbar">
                                    {suggestedReplies.map((reply, index) => (
                                        <motion.button
                                            key={index}
                                            onClick={() => handleSendMessage(reply.replace(/^[🎁📦💬🔍🔙🔥👗]\s*/, ""))}
                                            whileHover={{ scale: 1.03, backgroundColor: '#1f0f07', color: '#ffffff', borderColor: '#1f0f07' }}
                                            whileTap={{ scale: 0.97 }}
                                            className="px-3.5 py-2 text-[8px] uppercase tracking-widest font-black text-orange-950 bg-white border border-orange-200 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 focus:outline-none shadow-sm"
                                            disabled={isLoading}
                                        >
                                            <span>{reply}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Input Box */}
                            <div className="flex items-center bg-white border border-orange-200 focus-within:border-orange-500 p-1 pl-4.5 transition-all duration-300 rounded-full shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Ask GoMo Assistant..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="flex-grow bg-transparent border-none text-[12px] text-orange-955 focus:outline-none focus:ring-0 placeholder-orange-955/40 py-2.5"
                                    disabled={isLoading}
                                />
                                <motion.button
                                    onClick={() => handleSendMessage()}
                                    disabled={isLoading || !inputValue.trim()}
                                    whileHover={inputValue.trim() && !isLoading ? { scale: 1.03 } : {}}
                                    whileTap={inputValue.trim() && !isLoading ? { scale: 0.97 } : {}}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border ${
                                        inputValue.trim() && !isLoading
                                            ? 'bg-orange-600 text-white border-orange-600 cursor-pointer shadow-md'
                                            : 'bg-orange-50 text-orange-200 border-orange-100 cursor-not-allowed'
                                    }`}
                                    aria-label="Send Message"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </motion.button>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatbotWidget;
