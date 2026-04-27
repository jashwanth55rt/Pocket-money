import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../firebase';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
       toast.error("Please fill in all fields.");
       return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
          toast.error("Please enter a name.");
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        toast.success("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Successfully logged in!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F1F5] overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1a8c3c] to-[#30D158] pt-[50px] pb-[70px] px-6 flex flex-col items-center justify-center gap-3.5 flex-shrink-0 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-white/10 rounded-full blur-2xl block" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full blur-xl block" />

        <div className="w-[60px] h-[60px] rounded-[18px] bg-white/25 backdrop-blur-[10px] flex items-center justify-center text-[26px] font-extrabold text-white border-2 border-white/30 z-10 transition-all duration-300">
          P
        </div>
        <h1 className="text-[24px] font-extrabold text-white z-10">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="text-[13px] text-white/75 z-10">{isSignUp ? 'Join Pocket Money today!' : 'Earn real money, daily!'}</p>
      </div>

      <div className="bg-white rounded-t-[28px] flex-1 -mt-[20px] p-6 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex flex-col pt-[30px]">
        
        <div className="flex bg-gray-100 p-1 rounded-[16px] mb-6 relative">
           <motion.div 
             className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[12px] shadow-sm z-0"
             animate={{ left: isSignUp ? 'calc(50%)' : '4px' }}
             transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
           />
           <button 
             onClick={() => setIsSignUp(false)} 
             className={`flex-1 py-2.5 text-[14px] font-extrabold z-10 transition-colors ${!isSignUp ? 'text-gray-900' : 'text-gray-500'}`}
           >
             Sign In
           </button>
           <button 
             onClick={() => setIsSignUp(true)} 
             className={`flex-1 py-2.5 text-[14px] font-extrabold z-10 transition-colors ${isSignUp ? 'text-gray-900' : 'text-gray-500'}`}
           >
             Sign Up
           </button>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-6">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-[16px] font-medium text-[15px] outline-none focus:border-[#30D158] focus:bg-white transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-[16px] font-medium text-[15px] outline-none focus:border-[#30D158] focus:bg-white transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-[16px] font-medium text-[15px] outline-none focus:border-[#30D158] focus:bg-white transition-colors"
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#1a8c3c] to-[#30D158] text-white py-4 rounded-[16px] font-extrabold text-[15px] shadow-[0_4px_16px_rgba(48,209,88,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-6">
           <div className="h-px bg-gray-200 flex-1" />
           <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
           <div className="h-px bg-gray-200 flex-1" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-900 py-3.5 px-6 rounded-[16px] font-bold text-[15px] hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] shadow-sm mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-auto text-xs text-gray-400 text-center pb-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
