import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, X, ArrowRight, Tag } from 'lucide-react';
import { cn } from '../utils';
import { Product, CartItem } from '../types';

import { useStation } from '../context/StationContext';

export default function ShopView() {
  const { products, donorTier } = useStation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Product['category']>('all');

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
                  <button className="w-full bg-neon-green text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,0,0.2)] mt-4">
                    CHECKOUT NOW
                    <ArrowRight className="w-4 h-4" />
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
