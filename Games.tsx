import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAd } from '../context/AdContext';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Game {
  name: string;
  url: string;
  emoji: string;
  reward: number;
  durationRequired: number;
}

const GAMES: Game[] = [
  {name: 'Bubble Shooter', url: 'https://bubble-shooter.co/index.php', emoji: '🫧', reward: 10, durationRequired: 30},
  {name: '2048', url: 'https://play2048.co/', emoji: '🔢', reward: 15, durationRequired: 45},
  {name: 'Pac-Man', url: 'https://www.crazygames.com/game/pacman', emoji: '👾', reward: 20, durationRequired: 60},
  {name: 'Snake', url: 'https://playsnake.org/', emoji: '🐍', reward: 10, durationRequired: 30},
  {name: 'Tetris', url: 'https://jstris.jezevec10.com/', emoji: '🟦', reward: 15, durationRequired: 45},
  {name: 'Solitaire', url: 'https://www.solitr.com/klondike', emoji: '🃏', reward: 20, durationRequired: 60},
  {name: 'Minesweeper', url: 'https://minesweeperonline.com/', emoji: '💣', reward: 20, durationRequired: 60},
  {name: 'Chess', url: 'https://lichess.org/', emoji: '♟️', reward: 25, durationRequired: 90},
  {name: 'Checkers', url: 'https://www.247checkers.com/', emoji: '⚫', reward: 15, durationRequired: 45},
  {name: 'Yetisensation', url: 'https://gemioli.com/yetisensation/html5/gemioli/', emoji: '❄️', reward: 20, durationRequired: 60},
  {name: 'Slinguin', url: 'https://gemioli.com/slinguin/html5/gemioli/', emoji: '🐧', reward: 15, durationRequired: 45},
  {name: 'The Saloon', url: 'https://gemioli.com/thesaloon/html5/gemioli/', emoji: '🎪', reward: 20, durationRequired: 60},
  {name: 'Pirate Ship', url: 'https://gemioli.com/thepirateship/', emoji: '🏴‍☠️', reward: 25, durationRequired: 90},
];

export default function Games() {
  const { userProfile, refreshProfile } = useAuth();
  const { showAd } = useAd();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [playTime, setPlayTime] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const handleGameClick = (game: Game) => {
    showAd(() => {
      setSelectedGame(game);
    });
  };

  useEffect(() => {
    let interval: number;
    if (selectedGame && !rewardClaimed) {
      interval = window.setInterval(() => {
        setPlayTime(prev => {
          const next = prev + 1;
          if (next >= selectedGame.durationRequired) {
            claimReward(selectedGame);
          }
          return next;
        });
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [selectedGame, rewardClaimed]);

  const claimReward = async (game: Game) => {
    if (!userProfile || rewardClaimed) return;
    setRewardClaimed(true);
    
    try {
      await updateDoc(doc(db, "users", userProfile.id), {
        coins: increment(game.reward)
      });
      await refreshProfile();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`🎉 You earned ${game.reward} coins for playing ${game.name}!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim reward");
    }
  };

  const closeGame = () => {
    if (selectedGame && !rewardClaimed && playTime > 0) {
       toast.error(`You left early! Play for ${selectedGame.durationRequired - playTime} more seconds next time to earn coins.`);
    }
    setSelectedGame(null);
    setPlayTime(0);
    setRewardClaimed(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[20px] font-extrabold text-gray-900 mb-1">Play Games</h2>
      
      <div className="grid grid-cols-3 gap-3">
        {GAMES.map((game, i) => (
          <motion.div 
            key={i}
            whileTap={{ scale: 0.95 }} 
            onClick={() => handleGameClick(game)} 
            className="bg-white rounded-[20px] aspect-square flex flex-col items-center justify-center gap-1.5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              🪙 {game.reward}
            </div>
            <div className="text-[34px] leading-none mb-1 mt-3">{game.emoji}</div>
            <div className="text-[10px] font-semibold text-gray-500 text-center px-1 leading-tight">{game.name}</div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedGame && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <div className="bg-[#111] px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white font-bold text-[15px]">
                <span className="text-xl">{selectedGame.emoji}</span>
                <span className="truncate max-w-[120px]">{selectedGame.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                {!rewardClaimed ? (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1.5 border border-gray-700">
                    <div className="w-4 h-4 rounded-full border-2 border-[#30D158] border-r-transparent animate-spin" />
                    <span className="text-[#30D158] font-mono text-[12px] font-bold">
                      {selectedGame.durationRequired - playTime}s
                    </span>
                    <span className="text-gray-400 text-[10px] ml-1 uppercase tracking-wider">for {selectedGame.reward}🪙</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#30D158]/20 text-[#30D158] rounded-full px-3 py-1.5 border border-[#30D158]/30 font-bold text-[12px]">
                    <Coins className="w-4 h-4" />
                    +{selectedGame.reward} Earned
                  </div>
                )}

                <button 
                  onClick={closeGame} 
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe 
              src={selectedGame.url} 
              className="flex-1 w-full h-full border-none bg-white rounded-t-xl"
              allowFullScreen
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
