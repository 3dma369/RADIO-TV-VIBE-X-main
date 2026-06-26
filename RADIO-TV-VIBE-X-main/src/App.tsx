import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Radio, ShoppingBag, Heart, Menu, X, Play, Pause, SkipForward, Volume2, ExternalLink, Github, Twitter, Instagram } from 'lucide-react';
import { cn } from './utils';

// Components
import RadioView from './components/RadioView';
import TVView from './components/TVView';
import ShopView from './components/ShopView';
import DonateView from './components/DonateView';
import ScheduleView from './components/ScheduleView';
import DJsView from './components/DJsView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';
import PurchasesView from './components/PurchasesView';
import ProfileView from './components/ProfileView';
import Navbar from './components/Navbar';
import ConsentPortal from './components/ConsentPortal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StationProvider } from './context/StationContext';
import { ProfileProvider } from './context/ProfileContext';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import NewsletterPopup from './components/NewsletterPopup';
import { Navigate } from 'react-router-dom';
import { trackPageView, trackEngagement } from './services/analytics';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Tracks page views on route change + engagement heartbeats
function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);  // null = first run, must record initial path

  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      trackPageView(location.pathname, document.title);
    }
  }, [location]);

  // Send engagement heartbeat every 30s while app is open
  useEffect(() => {
    const interval = setInterval(() => {
      trackEngagement('active_session', Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <StationProvider>
        <ProfileProvider>
          <GlobalAudioPlayer />
          <Router>
            <AnalyticsTracker />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow pt-20">
                <Routes>
                  <Route path="/" element={<RadioView />} />
                  <Route path="/tv" element={<TVView />} />
                  <Route path="/shop" element={<ShopView />} />
                  <Route path="/donate" element={<DonateView />} />
                  <Route path="/schedule" element={<ScheduleView />} />
                  <Route path="/djs" element={<DJsView />} />
                  <Route path="/login" element={<LoginView />} />
                  <Route path="/consent" element={<ConsentPortal />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminView />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/purchases" element={<PurchasesView />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfileView />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
              {/* Email capture popup — appears 30s after first visit (or on exit-intent) */}
              <NewsletterPopup source="vibe_x_main" trigger="time" delayMs={30000} />
            </div>
          </Router>
        </ProfileProvider>
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