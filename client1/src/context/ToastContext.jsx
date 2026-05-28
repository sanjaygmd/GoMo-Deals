import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl border flex items-start gap-4 backdrop-blur-xl transition-all duration-300 ${
                t.variant === 'destructive' 
                  ? 'bg-zinc-950/95 border-red-500/30 text-zinc-100 shadow-[0_8px_32px_rgba(239,68,68,0.18)]' 
                  : 'bg-zinc-950/95 border-orange-500/30 text-zinc-100 shadow-[0_8px_32px_rgba(249,115,22,0.18)]'
              }`}
            >
              <div className="mt-0.5">
                {t.variant === 'destructive' ? (
                  <AlertCircle size={18} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                ) : (
                  <CheckCircle size={18} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
              </div>
              <div className="flex-1">
                {t.title && <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-zinc-200 mb-1">{t.title}</h4>}
                {t.description && <p className="text-xs text-zinc-400 font-medium leading-relaxed">{t.description}</p>}
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors mt-0.5"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if provider is missing
    return {
      toast: ({ title, description }) => console.log('Toast (no provider):', title, description)
    };
  }
  return context;
};
