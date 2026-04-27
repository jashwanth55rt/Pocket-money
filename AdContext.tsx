import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AdContextType {
  showAd: (onComplete: () => void) => void;
}

const AdContext = createContext<AdContextType | null>(null);

export function AdProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [callback, setCallback] = useState<(() => void) | null>(null);

  const showAd = (onComplete: () => void) => {
    setCallback(() => onComplete);
    setTimeLeft(5);
    setIsOpen(true);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (callback) callback();
  };

  return (
    <AdContext.Provider value={{ showAd }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ad-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="absolute top-6 right-6 bg-white/20 text-white px-4 py-1.5 font-semibold text-[11px] rounded-full uppercase tracking-wider">Ad Simulation</div>
            <div className="bg-white rounded-[32px] p-8 flex flex-col items-center shadow-2xl max-w-[320px] w-full relative overflow-hidden">
              <div className="w-[120px] h-[120px] bg-gradient-to-br from-blue-100 to-blue-50 rounded-[24px] mb-6 flex items-center justify-center text-[48px] shadow-sm border border-gray-100">
                📺
              </div>
              <h3 className="text-[20px] font-extrabold mb-2 text-gray-900 text-center">Reward unlocking...</h3>
              <p className="text-center text-[14px] font-semibold text-gray-500 mb-8 leading-relaxed">Please wait while we prepare your reward. Thanks for your support!</p>

              {timeLeft > 0 ? (
                <div className="relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-gray-100" strokeWidth="6" fill="none" />
                    <motion.circle 
                      cx="32" cy="32" r="28" 
                      className="stroke-[#30D158]" 
                      strokeWidth="6" 
                      fill="none" 
                      strokeDasharray="176"
                      animate={{ strokeDashoffset: [176, 0] }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[18px] font-extrabold text-gray-900">{timeLeft}</span>
                  </div>
                </div>
              ) : (
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose} 
                  className="w-full py-4 bg-[#30D158] text-white font-extrabold rounded-[20px] shadow-[0_4px_16px_rgba(48,209,88,0.3)] transition-transform"
                >
                  Collect Reward 🎁
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdContext.Provider>
  );
}

export const useAd = () => {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error('useAd must be used inside AdProvider');
  return ctx;
};
