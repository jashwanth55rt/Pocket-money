import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAd } from '../context/AdContext';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, updateDoc, increment, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const DAILY_BONUS_REWARDS = [5, 10, 20, 30, 50, 75, 100];

export default function Home() {
  const { userProfile, refreshProfile } = useAuth();
  const { showAd } = useAd();
  const navigate = useNavigate();
  const [resetTimer, setResetTimer] = useState("24:00:00");
  const [stats, setStats] = useState({ tasks: 0, referrals: 0 });

  // Daily Bonus Logic
  const now = new Date();
  const lastClaimed = userProfile?.lastDailyBonusClaimedAt ? new Date(userProfile.lastDailyBonusClaimedAt) : null;
  
  let canClaim = true;
  if (lastClaimed) {
    const isSameDay = lastClaimed.getFullYear() === now.getFullYear() &&
                      lastClaimed.getMonth() === now.getMonth() &&
                      lastClaimed.getDate() === now.getDate();
    if (isSameDay) {
      canClaim = false;
    }
  }

  const currentDailyDay = userProfile?.dailyBonusDay || 1;

  const handleClaimDailyBonus = async () => {
    if (!canClaim || !userProfile?.id) return;
    
    // We get the index 0-6 from currentDailyDay (1-7)
    const rewardIndex = (currentDailyDay - 1) % 7;
    const reward = DAILY_BONUS_REWARDS[rewardIndex];

    try {
      const nextDay = currentDailyDay + 1;
      const nextDayWrapped = nextDay > 7 ? 1 : nextDay; // Loop back to 1 after 7

      await updateDoc(doc(db, "users", userProfile.id), {
         coins: increment(reward),
         dailyBonusDay: nextDayWrapped,
         lastDailyBonusClaimedAt: now.toISOString()
      });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`🎉 Daily bonus claimed! You got ${reward} coins!`);
      refreshProfile();
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim daily bonus");
    }
  };

  useEffect(() => {
    // Timer logic
    const tick = () => {
      const nowTime = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - nowTime.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setResetTimer(`${h}:${m}:${s}`);
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load some mock stats for now
    if (userProfile) {
       setStats({
          tasks: userProfile.tasksCompleted || 0,
          referrals: userProfile.referrals || 0
       });
    }
  }, [userProfile]);

  const handleEarnTicket = () => {
    showAd(async () => {
      if (userProfile?.id) {
        try {
          await updateDoc(doc(db, "users", userProfile.id), {
            tickets: increment(1)
          });
          toast.success('🎫 You earned 1 ticket!');
          await refreshProfile();
        } catch (e) {
          console.error(e);
          toast.error('Failed to earn ticket');
        }
      }
    });
  };

  const handleShare = async () => {
    const code = userProfile?.referralCode || '';
    const text = `Join Pocket Money and earn real money! Use my referral code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Pocket Money', text });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast('Share link copied!');
    }
  };

  const rate = 1000;
  const balance = ((userProfile?.coins || 0) / rate).toFixed(2);

  const featuredGames = [
    {name: 'Bubble Shooter', emoji: '🫧'},
    {name: '2048', emoji: '🔢'},
    {name: 'Pac-Man', emoji: '👾'}
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a8c3c] to-[#30D158] rounded-[26px] p-7 text-white relative overflow-hidden"
      >
        <div className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full bg-white/10" />
        <div className="absolute -bottom-[50px] left-[10px] w-[160px] h-[160px] rounded-full bg-white/5" />
        
        <div className="relative z-10">
          <div className="text-[13px] font-semibold opacity-80 mb-2">Your Balance</div>
          <div className="text-[42px] font-extrabold leading-none mb-4">₹{balance}</div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-[13px] font-semibold">
            🪙 <span>{(userProfile?.coins || 0).toLocaleString()} coins</span>
          </div>

          <div className="absolute top-0 right-0 text-right">
            <div className="text-[10px] opacity-70 mb-1">Daily reset</div>
            <div className="text-base font-bold">{resetTimer}</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm">
          <div className="text-[22px] font-extrabold text-gray-900">{userProfile?.tickets || 0}</div>
          <div className="text-[11px] font-semibold text-gray-500 mt-1">🎫 Tickets</div>
        </div>
        <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm">
          <div className="text-[22px] font-extrabold text-gray-900">{stats.tasks}</div>
          <div className="text-[11px] font-semibold text-gray-500 mt-1">✅ Tasks</div>
        </div>
        <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm">
           <div className="text-[22px] font-extrabold text-gray-900">{stats.referrals}</div>
           <div className="text-[11px] font-semibold text-gray-500 mt-1">👥 Refs</div>
        </div>
      </div>

      {/* Daily Bonus Section */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 pb-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-extrabold text-gray-900">Daily Reward</h3>
          {!canClaim && <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">Next in {resetTimer}</span>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2 snap-x scrollbar-hide">
           {DAILY_BONUS_REWARDS.map((reward, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < currentDailyDay || (dayNum === currentDailyDay && !canClaim);
              const isCurrent = dayNum === currentDailyDay && canClaim;

              return (
                 <div key={i} className={`shrink-0 snap-center w-[72px] rounded-[16px] p-2.5 flex flex-col items-center border-[2px] transition-all relative ${isCurrent ? 'border-[#30D158] bg-[#E6FFF0] shadow-sm transform scale-105 z-10' : isPast ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-gray-100 bg-white'}`}>
                   {isPast && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-[14px]">
                        <div className="w-8 h-8 rounded-full bg-[#30D158] text-white flex items-center justify-center text-sm shadow-sm">✓</div>
                      </div>
                   )}
                   <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Day {dayNum}</span>
                   <span className="text-[22px] mb-1.5 opacity-90">{dayNum === 7 ? '🔥' : '🪙'}</span>
                   <span className={`text-[13px] font-extrabold ${isCurrent ? 'text-[#30D158]' : isPast ? 'text-gray-400' : 'text-gray-900'}`}>{reward}</span>
                 </div>
              )
           })}
        </div>
        <motion.button
           whileTap={canClaim ? { scale: 0.96 } : {}}
           disabled={!canClaim}
           onClick={handleClaimDailyBonus}
           className={`mt-2 w-full py-3.5 rounded-[16px] font-extrabold text-[15px] transition-all shadow-sm ${canClaim ? 'bg-[#30D158] text-white hover:shadow-md hover:bg-[#28b84d]' : 'bg-gray-100 text-gray-400'}`}
        >
           {canClaim ? 'Claim Reward' : 'Come back tomorrow'}
        </motion.button>
      </div>

      {/* Earn Ticket Banner */}
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={handleEarnTicket}
        className="bg-gradient-to-br from-[#d4780a] to-[#F59E0B] rounded-[26px] p-5 flex items-center justify-between cursor-pointer shadow-[0_6px_20px_rgba(245,158,11,0.25)]"
      >
        <div>
          <h3 className="text-base font-bold text-white">🎫 Earn Free Ticket</h3>
          <p className="text-xs text-white/80 mt-1">Watch a short ad → get 1 spin ticket</p>
        </div>
        <div className="text-3xl text-white">▶️</div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/tasks')} className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl mb-2">
            📋
          </div>
          <div className="text-sm font-bold text-gray-900">Daily Tasks</div>
          <div className="text-xs text-gray-500 mt-0.5">Complete & earn coins</div>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/games')} className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl mb-2">
            🎮
          </div>
          <div className="text-sm font-bold text-gray-900">Play Games</div>
          <div className="text-xs text-gray-500 mt-0.5">Fun & rewarding</div>
        </motion.div>

        <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/spin')} className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-xl mb-2">
            🎰
          </div>
          <div className="text-sm font-bold text-gray-900">Lucky Spin</div>
          <div className="text-xs text-gray-500 mt-0.5">Win up to 50 coins</div>
        </motion.div>

        <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate('/scratch')} className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center text-xl mb-2">
            ✨
          </div>
          <div className="text-sm font-bold text-gray-900">Scratch Card</div>
          <div className="text-xs text-gray-500 mt-0.5">Win 10-80 coins</div>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.97 }} onClick={handleShare} className="bg-white col-span-2 rounded-[20px] p-4 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#30D158]/10 text-[#30D158] flex items-center justify-center text-xl shrink-0">
            🔗
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Refer Friends</div>
            <div className="text-xs text-gray-500 mt-0.5">Earn bonus coins</div>
          </div>
        </motion.div>
      </div>

      {/* Featured Games */}
      <div>
        <div className="flex justify-between items-center mb-3.5 px-1">
           <div className="text-[17px] font-extrabold text-gray-900">Featured Games</div>
           <button onClick={() => navigate('/games')} className="text-[13px] font-bold text-[#30D158] hover:text-[#28b84d]">See all →</button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
           {featuredGames.map((g, i) => (
             <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={() => navigate('/games')} className="bg-white rounded-[20px] aspect-square flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                 <div className="text-[28px]">{g.emoji}</div>
                 <div className="text-[10px] font-extrabold text-gray-500 text-center px-1 uppercase tracking-tight">{g.name}</div>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
