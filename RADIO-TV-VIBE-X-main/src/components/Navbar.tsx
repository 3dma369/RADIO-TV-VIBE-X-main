import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ShoppingBag, Heart, Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '../utils';
import { useStation } from '../context/StationContext';


export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { walletAddress, connectWallet, disconnectWallet } = useStation();


  const navItems = [
    { name: 'Live', path: '/', icon: Radio },
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Donate', path: '/donate', icon: Heart },
    { name: 'Admin', path: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Radio className="w-8 h-8 text-neon-green group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-black" />
          </div>
          <span className="text-2xl font-bold tracking-tighter neon-text">VIBE-X</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative text-sm font-medium tracking-wide transition-colors hover:text-neon-green",
                location.pathname === item.path ? "text-neon-green" : "text-white/70"
              )}
            >
              {item.name}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-green"
                />
              )}
            </Link>
          ))}
          {walletAddress ? (
            <button 
              onClick={disconnectWallet}
              className="bg-white/10 text-white px-5 py-2 rounded-xl font-mono text-xs hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/10"
            >
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-neon-green text-black px-5 py-2 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,0,0.3)]"
            >
              CONNECT WALLET
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 glass rounded-2xl p-6 flex flex-col gap-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 text-lg font-medium",
                  location.pathname === item.path ? "text-neon-green" : "text-white/70"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <button className="bg-neon-green text-black w-full py-3 rounded-xl font-bold mt-2">
              CONNECT WALLET
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
