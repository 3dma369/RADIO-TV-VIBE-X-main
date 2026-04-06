import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ShoppingBag, Heart, Menu, X, Play, Pause, SkipForward, Volume2, ExternalLink, Github, Twitter, Instagram } from 'lucide-react';
import { cn } from './utils';

// Components
import RadioView from './components/RadioView';
import ShopView from './components/ShopView';
import DonateView from './components/DonateView';
import ScheduleView from './components/ScheduleView';
import DJsView from './components/DJsView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StationProvider } from './context/StationContext';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerified } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isVerified) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <StationProvider>
        <GlobalAudioPlayer />
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-20">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<RadioView />} />
                  <Route path="/shop" element={<ShopView />} />
                  <Route path="/donate" element={<DonateView />} />
                  <Route path="/schedule" element={<ScheduleView />} />
                  <Route path="/djs" element={<DJsView />} />
                  <Route path="/login" element={<LoginView />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminView />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </Router>
      </StationProvider>
    </AuthProvider>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-6 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neon-green">
            <Radio className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tighter">VIBE-X</span>
          </div>
          <p className="text-white/50 text-sm">
            The pulse of the underground. Streaming Jungle, DnB, and House 24/7.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-widest text-xs text-white/40">Station</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-neon-green transition-colors">Live Stream</Link></li>
            <li><Link to="/schedule" className="hover:text-neon-green transition-colors">Schedule</Link></li>
            <li><Link to="/djs" className="hover:text-neon-green transition-colors">DJs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-widest text-xs text-white/40">Community</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-neon-green transition-colors">Merch Store</Link></li>
            <li><Link to="/donate" className="hover:text-neon-green transition-colors">Support Us</Link></li>
            <li><Link to="/admin" className="hover:text-neon-green transition-colors">Admin Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase tracking-widest text-xs text-white/40">Follow</h4>
          <div className="flex gap-4">
            <a href="#" className="p-2 glass rounded-full hover:text-neon-green transition-all"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="p-2 glass rounded-full hover:text-neon-green transition-all"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="p-2 glass rounded-full hover:text-neon-green transition-all"><Github className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-white/30 text-xs">
        © {new Date().getFullYear()} VIBE-X RADIO. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}
