import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAd } from '../context/AdContext';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const SPIN_REWARDS = [0, 2, 5, 7, 10, 15, 20, 50];
const SPIN_COLORS = ['#EF4444', '#F59E0B', '#30D158', '#3B82F6', '#A855F7', '#EC4899', '#06B6D4', '#EAB308'];

export default function SpinWheel() {
  const { userProfile, refreshProfile } = useAuth();
  const { showAd } = useAd();
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState('');
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);

  const handleSpinClick = () => {
    if (spinning || !userProfile) return;
    const tickets = userProfile.tickets || 0;
    
    if (tickets < 1) {
       toast.error('You need at least 1 ticket to spin!');
       return;
    }
    
    showAd(() => {
      handleSpin(tickets);
    });
  };

  const handleSpin = async (tickets: number) => {
    setSpinning(true);
    setSpinResult('');

    // Deduct ticket visually
    await updateDoc(doc(db, "users", userProfile.id), {
       tickets: Math.max(0, tickets - 1)
    });
    await refreshProfile();

    const idx = Math.floor(Math.random() * SPIN_REWARDS.length);
    const reward = SPIN_REWARDS[idx];
    const n = SPIN_REWARDS.length;
    const arc = 360 / n;
    
    // We want the selected slice to stop exactly at the top (which is 0 degrees or -90 depending on layout).
    // Our top pointer points to the top. The slice indices go clockwise.
    // If the wheel is at 0 rotation, slice 0 is roughly at the top right to bottom right if drawn naturally.
    // Let's just calculate: we need index N to be at the top.
    // Top is 270 degrees.
    const targetRotation = currentRotation + 360 * 5 + (360 - (idx * arc)) - (arc / 2);

    await controls.start({
      rotate: targetRotation,
      transition: { 
        duration: 4, 
        ease: [0.2, 0.8, 0.2, 1], // Custom bouncy ease out
      }
    });

    setCurrentRotation(targetRotation % 360);
    setSpinning(false);

    if (reward > 0) {
       confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
       setSpinResult(`🎉 You won +${reward} coins!`);
       updateDoc(doc(db, "users", userProfile.id), {
           coins: (userProfile.coins || 0) + reward
       }).then(refreshProfile);
    } else {
       setSpinResult('😢 Better luck next time!');
    }
  };

  return (
    <div className="flex flex-col items-center py-2 relative overflow-hidden">
      <h2 className="text-[17px] font-extrabold text-gray-900 mb-6 text-center w-full">Lucky Spin 🎰</h2>
      
      <div className="bg-[#E6FFF0] text-[#30D158] border border-[#30D158]/20 rounded-full px-5 py-2 font-bold text-[14px] mb-10 shadow-sm">
        🎫 {(userProfile?.tickets || 0)} Tickets Available
      </div>

      <div className="relative mb-8 w-[280px] h-[280px]">
        {/* Outer Glow & Shadow */}
        <div className="absolute inset-0 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] bg-white/50" />
        
        {/* Pointer */}
        <div className="absolute -top-[24px] left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
           <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 48L0 0H40L20 48Z" fill="#111118"/>
           </svg>
        </div>
        
        {/* Wheel Container */}
        <div className="absolute inset-[10px] rounded-full overflow-hidden border-4 border-white shadow-inner bg-gray-100 z-10 box-border">
          <motion.div 
            animate={controls}
            className="w-full h-full relative rounded-full"
            style={{ transformOrigin: 'center center' }}
          >
            {SPIN_REWARDS.map((reward, i) => {
              const rotateAngle = (360 / SPIN_REWARDS.length) * i;
              const skewY = 90 - (360 / SPIN_REWARDS.length);
              
              return (
                <div 
                  key={i}
                  className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
                  style={{
                    background: SPIN_COLORS[i],
                    transform: `rotate(${rotateAngle}deg) skewY(-${skewY}deg)`,
                    borderLeft: '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <div 
                    className="absolute top-1/2 left-1/2 flex items-center justify-center text-white font-extrabold text-[16px]"
                    style={{
                      transform: `skewY(${skewY}deg) rotate(${(360 / SPIN_REWARDS.length) / 2}deg) translate(35px, -35px) rotate(45deg)`,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {reward === 0 ? '😢' : `+${reward}`}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center justify-center text-[28px] z-20 border-4 border-gray-100">
          🎰
        </div>
      </div>

      <motion.button 
        disabled={spinning || (userProfile?.tickets || 0) < 1}
        onClick={handleSpinClick}
        whileTap={{ scale: 0.96 }}
        className="mt-4 bg-gradient-to-br from-[#1a8c3c] to-[#30D158] text-white font-extrabold text-[16px] px-10 py-4.5 rounded-[30px] shadow-[0_6px_20px_rgba(48,209,88,0.3)] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none min-w-[220px]"
      >
        {spinning ? 'SPINNING...' : 'SPIN — 1 Ticket'}
      </motion.button>
      
      <AnimatePresence>
        {spinResult && !spinning && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 text-[16px] font-extrabold text-center px-6 py-3 rounded-full ${spinResult.includes('won') ? 'bg-[#30D158]/10 text-[#25A244]' : 'bg-gray-100 text-gray-500'}`}
          >
            {spinResult}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
