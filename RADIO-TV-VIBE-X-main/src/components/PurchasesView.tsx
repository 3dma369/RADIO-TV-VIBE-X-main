import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Download, Clock, ChevronRight, ShoppingBag, Loader2, X, Eye, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders, Order, getValidDownloadLinks } from '../services/orderService';
import DownloadManager from './DownloadManager';
import { cn } from '../utils';

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  delivered: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  refunded: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};

export default function PurchasesView() {
  const { currentUser, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDownloadManager, setShowDownloadManager] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, isAuthenticated]);

  const loadOrders = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userOrders = await getUserOrders(currentUser.uid);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasDigitalItems = (order: Order): boolean => {
    return order.items?.some(item => item.isDigital);
  };

  const getValidLinks = (order: Order) => {
    return getValidDownloadLinks(order);
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    if (hasDigitalItems(order) && getValidLinks(order).length > 0) {
      setShowDownloadManager(true);
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setShowDownloadManager(false);
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center py-20"
      >
        <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign In to View Purchases</h2>
        <p className="text-white/40">Please log in to see your order history and downloads.</p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-neon-green" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-6 pb-20"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h2 className="text-5xl font-bold tracking-tighter mb-4 neon-text uppercase">My Purchases</h2>
          <p className="text-white/50">View your order history and download digital purchases.</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
            <p className="text-white/40 mb-6">You haven't made any purchases yet.</p>
            <a 
              href="/shop" 
              className="inline-flex items-center gap-2 bg-neon-green text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Shop
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const digitalLinks = getValidLinks(order);
              const hasDigital = hasDigitalItems(order);
              
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border border-white/10 hover:border-neon-green/30 transition-colors cursor-pointer"
                  onClick={() => openOrderDetail(order)}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Icon */}
                    <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-neon-green" />
                    </div>

                    {/* Order Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm">Order #{order.id.slice(0, 8)}</h3>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                          STATUS_COLORS[order.status]
                        )}>
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/30 mb-3">
                        {formatDate(order.createdAt)} • {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>

                      {/* Items Preview */}
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40 flex-shrink-0">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Digital Download Badge */}
                      {hasDigital && digitalLinks.length > 0 && (
                        <div className="flex items-center gap-2 text-neon-green text-xs">
                          <Download className="w-3 h-3" />
                          {digitalLinks.length} download{digitalLinks.length !== 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>

                    {/* Total & Arrow */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xl font-bold tracking-tight neon-text">
                        ${order.total?.toFixed(2) || '0.00'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOrderDetail}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg max-h-[80vh] overflow-y-auto glass rounded-[40px] p-8 z-[110] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tighter uppercase">Order Details</h3>
                  <p className="text-white/50 text-sm">#{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <button 
                  onClick={closeOrderDetail}
                  className="p-2 hover:text-neon-green transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-8">
                <span className={cn(
                  "text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border",
                  STATUS_COLORS[selectedOrder.status]
                )}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-8">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-neon-green">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t border-white/10 pt-4 mb-8 space-y-2">
                <div className="flex justify-between text-sm text-white/50">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-neon-green">
                    <span>Discount ({selectedOrder.discountPercent}%)</span>
                    <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/5">
                  <span>Total</span>
                  <span className="neon-text">${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Shipping Address</h4>
                  <div className="bg-white/5 rounded-xl p-4 text-sm">
                    <p className="font-bold">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-white/60">{selectedOrder.shippingAddress.addressLine1}</p>
                    {selectedOrder.shippingAddress.addressLine2 && (
                      <p className="text-white/60">{selectedOrder.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-white/60">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="text-white/60">{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Tracking Number */}
              {selectedOrder.trackingNumber && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Tracking</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm font-mono">{selectedOrder.trackingNumber}</p>
                  </div>
                </div>
              )}

              {/* Download Section */}
              {showDownloadManager && selectedOrder.downloadLinks?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    Digital Downloads
                  </h4>
                  <DownloadManager 
                    orderId={selectedOrder.id}
                    downloadLinks={selectedOrder.downloadLinks}
                    onRegenerate={loadOrders}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}