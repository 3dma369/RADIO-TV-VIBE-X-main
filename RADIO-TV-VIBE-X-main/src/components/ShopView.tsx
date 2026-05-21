// @ts-ignore
import confetti from 'canvas-confetti';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, X, ArrowRight, Tag, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { cn } from '../utils';
import { Product, CartItem } from '../types';

import { useStation } from '../context/StationContext';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function ShopView() {
  const { products, donorTier, setDonorTier } = useStation();
  const { currentUser, isAuthenticated, isDonor, signInWithGoogle } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Product['category']>('all');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const discountPercent = donorTier === 'Legend' ? 25 : donorTier === 'Vibe Master' ? 10 : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsCheckoutModalOpen(true);
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock purchase success
    setDonorTier(donorTier || 'Supporter');
    setIsProcessing(false);
    setOrderComplete(true);
    
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00FF00', '#FF00FF', '#00FFFF']
    });

    setTimeout(() => {
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCart([]);
      setOrderComplete(false);
    }, 2000);
  };

  const handleCloseCheckout = () => {
    if (!isProcessing) {
      setIsCheckoutModalOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-6 pb-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-5xl font-bold tracking-tighter mb-4 neon-text uppercase">Merch Store</h2>
            <p className="text-white/50 max-w-md">Support the station and look fresh. Limited drops and digital assets for the community.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {['all', 'apparel', 'accessories', 'digital'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold border transition-all uppercase tracking-widest",
                  filter === cat 
                    ? "bg-neon-green border-neon-green text-black" 
                    : "border-white/10 hover:border-neon-green/50 text-white/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {donorTier && (
          <div className="mb-8 glass rounded-2xl p-4 border-neon-green/20 flex items-center justify-between text-neon-green">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-widest">{donorTier} Member Perk Active</p>
            </div>
            <p className="text-sm font-mono font-bold">-{discountPercent}% STOREWIDE DISCOUNT</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              className="glass rounded-3xl overflow-hidden group"
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-neon-green border border-neon-green/30">
                    ${product.price}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{product.category}</span>
                </div>
                <h3 className="text-xl font-bold mb-6 group-hover:text-neon-green transition-colors">{product.name}</h3>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-white/5 border border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  ADD TO CART
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-[70] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tighter uppercase">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:text-neon-green transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                        <p className="text-neon-green font-bold text-xs mb-3">${item.price}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 glass rounded-md hover:text-neon-green"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-mono font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 glass rounded-md hover:text-neon-green"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-lg font-bold tracking-tighter text-white/50">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-neon-green">
                      <span className="font-bold uppercase tracking-widest text-[10px]">Member Discount ({discountPercent}%)</span>
                      <span className="text-lg font-bold tracking-tighter">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Total</span>
                    <span className="text-3xl font-bold tracking-tighter neon-text">${total.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-neon-green text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,0,0.2)] mt-4"
                  >
                    CHECKOUT NOW
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCheckout}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit glass rounded-[40px] p-8 z-[110] shadow-2xl"
            >
              {orderComplete ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-neon-green" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tighter uppercase">Order Complete!</h3>
                  <p className="text-white/50">Your account has been activated. Welcome to VIBE-X!</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tighter uppercase">Sign In to Checkout</h3>
                      <p className="text-white/50 text-sm mt-1">Create your account to complete your purchase</p>
                    </div>
                    <button onClick={handleCloseCheckout} className="p-2 hover:text-neon-green transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <GoogleIcon />
                        CONTINUE WITH GOOGLE
                      </>
                    )}
                  </button>
                  
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/30 leading-relaxed">
                      Your order: <span className="text-white/60 font-bold">{cart.length} item{cart.length !== 1 ? 's' : ''}</span> totaling <span className="text-neon-green font-bold">${total.toFixed(2)}</span>
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-center text-white/20 font-mono">
                    Account created automatically on sign-in. No password needed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tighter uppercase">Confirm Purchase</h3>
                      <p className="text-white/50 text-sm mt-1">Total: <span className="text-neon-green font-bold">${total.toFixed(2)}</span></p>
                    </div>
                    <button onClick={handleCloseCheckout} className="p-2 hover:text-neon-green transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <p className="text-sm font-bold">{item.name}</p>
                          <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-neon-green">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-neon-green bg-neon-green/10 rounded-xl p-3">
                      <span className="text-sm font-bold uppercase tracking-widest">Member Discount ({discountPercent}%)</span>
                      <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-5 h-5 text-white/30" />
                      <div>
                        <p className="text-xs font-bold">Connected as: {currentUser?.email}</p>
                        <p className="text-[10px] text-white/30">Payment processed securely</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleConfirmPurchase}
                    disabled={isProcessing}
                    className="w-full bg-neon-green text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>
                    ) : (
                      <>COMPLETE PURCHASE - ${total.toFixed(2)}</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// @ts-ignore
import confetti from 'canvas-confetti';