import React from 'react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPen, Receipt, Bell, Share2, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  const handleCopyCode = () => {
    const code = userProfile?.referralCode || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success('📋 Code copied!');
    } else {
      toast.error('Copy not supported on this browser');
    }
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
      handleCopyCode();
    }
  };

  const initial = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-2 pb-5">
        <div className="w-[88px] h-[88px] rounded-full bg-[#30D158] flex items-center justify-center text-[36px] font-extrabold text-white border-4 border-[#30D158]/20 shadow-sm mb-[14px]">
          {initial}
        </div>
        <h2 className="text-[20px] font-extrabold text-gray-900 mb-1">{userProfile?.name || 'User'}</h2>
        <p className="text-[14px] text-gray-500">{userProfile?.email || 'No email'}</p>
      </div>

      {/* Referral Box */}
      <div className="bg-gradient-to-br from-[#f0fff4] to-[#E6FFF0] border-1.5 border-[#30D158]/20 rounded-[24px] p-5 text-center shadow-sm">
        <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Your Referral Code</div>
        <div className="text-[28px] font-extrabold text-[#30D158] tracking-widest mb-3.5 select-all">
          {userProfile?.referralCode || '------'}
        </div>
        <motion.button 
          whileTap={{ scale: 0.96 }}
          onClick={handleCopyCode}
          className="bg-[#30D158] text-white font-bold text-[14px] px-6 py-2.5 rounded-[16px] shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
        >
          📋 Copy Code
        </motion.button>
      </div>

      {/* Profile Menu */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <MenuItem 
          icon={<UserPen className="w-5 h-5 text-[#3B82F6]" />} 
          bg="bg-[#3B82F6]/10" 
          title="Edit Profile" 
          sub="Update your name" 
          onClick={() => toast('Profile editing coming soon')} 
        />
        <MenuItem 
          icon={<Receipt className="w-5 h-5 text-[#F59E0B]" />} 
          bg="bg-[#F59E0B]/10" 
          title="Transaction History" 
          sub="View all withdrawals" 
          onClick={() => toast('Transaction history coming soon')} 
        />
        <MenuItem 
          icon={<Bell className="w-5 h-5 text-[#30D158]" />} 
          bg="bg-[#30D158]/10" 
          title="Notifications" 
          sub="View announcements" 
          onClick={() => toast('Notifications coming soon')} 
        />
        <MenuItem 
          icon={<Share2 className="w-5 h-5 text-[#A855F7]" />} 
          bg="bg-[#A855F7]/10" 
          title="Share & Earn" 
          sub="Refer friends for coins" 
          onClick={handleShare} 
        />
        <div className="border-t border-gray-50">
          <MenuItem 
            icon={<LogOut className="w-5 h-5 text-[#EF4444]" />} 
            bg="bg-[#EF4444]/10" 
            title="Sign Out" 
            sub="See you soon!" 
            onClick={handleLogout} 
            hideBorder 
          />
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, bg, title, sub, onClick, hideBorder = false }: any) {
  return (
    <motion.div 
      whileTap={{ backgroundColor: '#f9fafb' }}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!hideBorder ? 'border-b border-gray-50' : ''}`}
    >
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-bold text-gray-900 leading-tight mb-[2px]">{title}</div>
        <div className="text-[12px] text-gray-500">{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </motion.div>
  );
}
