import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAd } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function ScratchCard() {
  const { userProfile, refreshProfile } = useAuth();
  const { showAd } = useAd();
  const [isScratched, setIsScratched] = useState(false);
  const [reward, setReward] = useState(0);

  // Check scratches today
  const now = new Date();
  const lastScratchDate = userProfile?.lastScratchAt ? new Date(userProfile.lastScratchAt) : null;
  let isSameDay = false;
  if (lastScratchDate) {
     isSameDay = lastScratchDate.getFullYear() === now.getFullYear() &&
                 lastScratchDate.getMonth() === now.getMonth() &&
                 lastScratchDate.getDate() === now.getDate();
  }

  const scratchesToday = isSameDay ? (userProfile?.scratchesToday || 0) : 0;
  const MAX_SCRATCHES = 10;
  const scratchesLeft = Math.max(0, MAX_SCRATCHES - scratchesToday);

  const handleScratch = async () => {
     if (isScratched) return;
     if (scratchesLeft <= 0) {
        toast.error("You've reached your daily limit of 10 scratches!");
        return;
     }

     showAd(async () => {
       const winAmount = Math.floor(Math.random() * (80 - 10 + 1)) + 10;
       setReward(winAmount);
       setIsScratched(true);
  
       if (userProfile?.id) {
         try {
           await updateDoc(doc(db, "users", userProfile.id), {
               coins: increment(winAmount),
               scratchesToday: scratchesToday + 1,
               lastScratchAt: now.toISOString()
           });
         } catch (e) {
           console.error('Failed to update scratch card progress', e);
         }
       }
  
       setTimeout(() => {
           confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
           toast.success(`You scratched to win ${winAmount} coins!`);
           refreshProfile();
       }, 800);
     });
  };

  const handleReset = () => {
     setIsScratched(false);
     setReward(0);
  };

  return (
    <div className="flex flex-col items-center py-2 relative overflow-hidden space-y-6">
      <h2 className="text-[17px] font-extrabold text-gray-900 mb-2 text-center w-full">Scratch & Win 🎫</h2>
      
      <div className="bg-[#E6FFF0] text-[#30D158] border border-[#30D158]/20 rounded-full px-5 py-2 font-bold text-[14px] mb-2 shadow-sm">
        {scratchesLeft} / {MAX_SCRATCHES} Scratches Left
      </div>

      <p className="text-gray-500 text-sm text-center mb-4">Scratch the card below to reveal a prize between 10 and 80 coins!</p>

      <div className="relative w-full max-w-[300px] aspect-square mx-auto bg-white rounded-[30px] overflow-hidden shadow-md border-2 border-gray-100 flex items-center justify-center">
        <AnimatePresence>
          {!isScratched && (
            <motion.div
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-gradient-to-br from-[#d4780a] to-[#F59E0B] z-10 flex flex-col items-center justify-center cursor-pointer"
              onClick={handleScratch}
            >
               <div className="text-white font-extrabold text-[24px] mb-2">Tap to Scratch!</div>
               <div className="text-white/80 text-[14px] font-semibold">Reveal your prize</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-center p-6">
          <div className="text-[64px] mb-4 leading-none">🎉</div>
          <div className="text-[#F59E0B] font-extrabold text-[36px] leading-tight">+{reward}</div>
          <div className="text-gray-500 font-bold text-[16px]">Coins Won</div>
        </div>
      </div>

      {isScratched && scratchesLeft > 1 && (
         <motion.button
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           onClick={handleReset}
           className="bg-gray-900 text-white font-bold py-3.5 px-8 rounded-full hover:bg-gray-800 transition-colors shadow-sm mt-4 active:scale-95"
         >
           Scratch Another
         </motion.button>
      )}
    </div>
  );
}
