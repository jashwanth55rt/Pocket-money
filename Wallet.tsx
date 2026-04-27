import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Wallet() {
  const { userProfile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState(''); // UPI ID or Bank Details
  const [loading, setLoading] = useState(false);

  const RATE = 1000; // 1000 coins = 1 INR
  const MIN_WITHDRAW = 50; // INR

  const maxRs = ((userProfile?.coins || 0) / RATE).toFixed(2);
  const pendingRequests = 0; // In a real app we'd fetch this

  const handleWithdraw = async () => {
    if (!userProfile) return;

    const withdrawAmt = parseFloat(amount);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
       toast.error(`Please enter a valid amount`);
       return;
    }
    if (withdrawAmt < MIN_WITHDRAW) {
       toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAW}`);
       return;
    }
    if (withdrawAmt > parseFloat(maxRs)) {
       toast.error("Not enough coins");
       return;
    }
    if (!details.trim()) {
       toast.error("Please enter payment details");
       return;
    }

    setLoading(true);
    try {
      const withdrawCoins = withdrawAmt * RATE;
      
      await addDoc(collection(db, "withdrawals"), {
        userId: userProfile.id,
        userName: userProfile.name,
        amount: withdrawAmt,
        coins: withdrawCoins,
        details,
        status: "pending",
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", userProfile.id), {
         coins: increment(-withdrawCoins)
      });
      await refreshProfile();

      toast.success("Withdrawal request submitted!");
      setAmount('');
      setDetails('');
    } catch (error) {
      toast.error("Failed to submit request.");
    }
    setLoading(false);
  };

  const getAmountCoins = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return null;
    return amt * RATE;
  };

  const amountCoins = getAmountCoins();
  const hasEnough = amountCoins ? (userProfile?.coins || 0) >= amountCoins : true;

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a4fd4] to-[#3B82F6] rounded-[30px] p-7 text-white relative overflow-hidden"
      >
        <div className="absolute -top-[20px] -right-[20px] w-[100px] h-[100px] rounded-full bg-white/10" />
        
        <div className="relative z-10">
          <div className="text-[13px] opacity-80 mb-1.5">Total Balance</div>
          <div className="text-[40px] font-extrabold leading-none mb-1.5">₹{maxRs}</div>
          <div className="text-[13px] opacity-75">Available to withdraw</div>
        </div>
      </motion.div>

      {/* Info Card */}
      <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
          <span className="text-[13px] text-gray-500 font-semibold">Available Coins</span>
          <span className="text-[14px] font-extrabold text-gray-900">{(userProfile?.coins || 0).toLocaleString()} 🪙</span>
        </div>
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
          <span className="text-[13px] text-gray-500 font-semibold">Conversion Rate</span>
          <span className="text-[14px] font-extrabold text-gray-900">{RATE} coins = ₹1</span>
        </div>
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
          <span className="text-[13px] text-gray-500 font-semibold">Min Withdrawal</span>
          <span className="text-[14px] font-extrabold text-gray-900">₹{MIN_WITHDRAW}</span>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[13px] text-gray-500 font-semibold">Pending Requests</span>
          <span className="text-[14px] font-extrabold text-gray-900">{pendingRequests}</span>
        </div>
      </div>

      {/* Withdraw Box */}
      <div className="bg-white rounded-[30px] p-6 border border-gray-100 shadow-sm">
        <h3 className="text-[17px] font-extrabold text-gray-900 mb-5">💸 Withdraw Funds</h3>
        
        <input 
          type="number" 
          placeholder="Amount in ₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-[#F7F7FA] border-1.5 border-gray-100 rounded-[18px] px-4 py-3.5 focus:outline-none focus:border-[#30D158] text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 mb-3.5 transition-colors"
        />

        <div className={`text-[13px] font-semibold mb-4 p-3 rounded-[12px] ${!amountCoins ? 'bg-gray-50 text-gray-500' : hasEnough ? 'bg-[#30D158]/10 text-[#25A244]' : 'bg-red-50 text-red-500'}`}>
          {!amountCoins ? 'Enter amount to see coins required' : `Requires ${amountCoins.toLocaleString()} coins · You have ${(userProfile?.coins || 0).toLocaleString()} coins`}
        </div>

        <textarea 
          placeholder="UPI ID / Payment details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full bg-[#F7F7FA] border-1.5 border-gray-100 rounded-[18px] px-4 py-3.5 focus:outline-none focus:border-[#30D158] text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 mb-4 transition-colors min-h-[80px] resize-none"
        />

        <button 
          onClick={handleWithdraw}
          disabled={loading || !amountCoins || !hasEnough || !details.trim()}
          className="w-full bg-[#30D158] text-white font-bold py-4 rounded-[30px] shadow-[0_6px_20px_rgba(48,209,88,0.3)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
        >
          {loading ? 'Processing...' : 'Request Withdrawal'}
        </button>
      </div>

    </div>
  );
}
