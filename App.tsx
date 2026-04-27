import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import SpinWheel from './pages/SpinWheel';
import Tasks from './pages/Tasks';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Games from './pages/Games';
import ScratchCard from './pages/ScratchCard';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminRedirect />} />
      
      <Route path="/" element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      }>
        <Route index element={<Home />} />
        <Route path="spin" element={<SpinWheel />} />
        <Route path="scratch" element={<ScratchCard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="profile" element={<Profile />} />
        <Route path="games" element={<Games />} />
      </Route>
    </Routes>
  );
}

function AdminRedirect() {
  React.useEffect(() => {
    window.location.href = "/admin.html";
  }, []);

  return <div className="p-8 text-center text-white">Loading admin panel...</div>;
}
