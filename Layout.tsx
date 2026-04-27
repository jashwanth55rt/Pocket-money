import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Gamepad2, ListTodo, Wallet, LogOut, Settings, ShieldAlert, User, Bell } from 'lucide-react';
import { logOut } from '../firebase';

export default function Layout() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate("/");
  };

  if (!user || (userProfile && userProfile.banned)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F1F5] text-gray-900">
        {userProfile?.banned ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-red-500 shadow-xl flex flex-col items-center">
             <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
             <h2 className="text-2xl font-bold mb-2 text-gray-900">Account Suspended</h2>
             <p className="text-gray-500">Your account has been banned by the administrator.</p>
             <button onClick={handleLogout} className="mt-6 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Logout</button>
          </div>
        ) : <Outlet />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F0F1F5] text-[#111118]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 flex justify-between items-center z-10 shrink-0 sticky top-0 px-5" style={{ height: '60px' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#30D158] flex items-center justify-center font-extrabold text-white text-lg">
            P
          </div>
          <h1 className="font-extrabold text-lg">Pocket Money</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center relative hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
          </button>
          
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-[#30D158] flex items-center justify-center font-bold text-white shadow-sm">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-[80px]">
        <div className="max-w-[500px] mx-auto p-5 w-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 z-20" style={{ height: '80px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <ul className="flex justify-around items-stretch h-full px-2">
          <NavItem to="/" icon={<Home strokeWidth={2.5} />} label="Home" />
          <NavItem to="/tasks" icon={<ListTodo strokeWidth={2.5} />} label="Tasks" />
          <NavItem to="/games" icon={<Gamepad2 strokeWidth={2.5} />} label="Games" />
          <NavItem to="/spin" icon={<div className="font-bold text-lg">🎰</div>} label="Spin" isReactIcon={false} />
          <NavItem to="/wallet" icon={<Wallet strokeWidth={2.5} />} label="Wallet" />
          <NavItem to="/profile" icon={<User strokeWidth={2.5} />} label="Profile" />
        </ul>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, isReactIcon = true }: { to: string, icon: React.ReactNode, label: string, isReactIcon?: boolean }) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center justify-start pt-3.5 h-full transition-colors gap-1 ${
            isActive ? "text-[#30D158]" : "text-gray-400 hover:text-gray-600"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`transition-transform duration-200 ${isActive ? '-translate-y-0.5' : ''} ${isReactIcon ? '[&>svg]:w-[22px] [&>svg]:h-[22px]' : ''}`}>
              {icon}
            </div>
            <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? "text-[#30D158]" : "text-gray-400"}`}>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}
