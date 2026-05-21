import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Search, ChevronDown, ChevronUp, X, CheckCircle, Truck, Clock, AlertCircle, Loader2, Eye } from 'lucide-react';
import { getAllOrders, getOrder, updateOrderStatus, Order } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';

const STATUS_OPTIONS: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_ICONS: Record<Order['status'], typeof CheckCircle> = {
  pending: Clock,
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
  refunded: AlertCircle,
};

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  delivered: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  refunded: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};

export default function AdminOrderManager() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const allOrders = await getAllOrders(100);
      setOrders(allOrders);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) ||
      order.userEmail?.toLowerCase().includes(searchLower) ||
      order.items?.some(item => item.name.toLowerCase().includes(searchLower));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;
    
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTrackingNumber = async (orderId: string) => {
    const trackingNumber = prompt('Enter tracking number (or leave empty to clear):');
    
    if (trackingNumber === null) return; // User cancelled
    
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, orders.find(o => o.id === orderId)?.status || 'processing', trackingNumber || undefined);
      await loadOrders();
    } catch (error) {
      console.error('Error updating tracking number:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-white/40">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Admin access required</p>
      </div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
            <Package className="w-6 h-6 text-neon-green" />
            Order Manager
          </h3>
          <p className="text-white/50 text-sm mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, email, or product..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-neon-green transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors appearance-none cursor-pointer min-w-[150px]"
        >
          <option value="all" className="bg-dark-bg">All Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status} className="bg-dark-bg">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status];
            const isExpanded = expandedOrder === order.id;
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Icon */}
                    <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-neon-green" />
                    </div>

                    {/* Order Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm">#{order.id.slice(0, 8)}</h4>
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1",
                          STATUS_COLORS[order.status]
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {order.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/30 mb-1">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-white/50 truncate">{order.userEmail}</p>
                    </div>

                    {/* Total & Expand */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xl font-bold tracking-tight neon-text">
                        ${order.total?.toFixed(2) || '0.00'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white/30" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        {/* Order Items */}
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Items</h5>
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <p className="text-sm font-bold truncate">{item.name}</p>
                                  <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-neon-green">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white/5 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">Subtotal</span>
                            <span>${order.subtotal?.toFixed(2)}</span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-neon-green">
                              <span>Discount ({order.discountPercent}%)</span>
                              <span>-${order.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/5">
                            <span>Total</span>
                            <span className="neon-text">${order.total?.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Shipping Address</h5>
                            <div className="bg-white/5 rounded-xl p-4">
                              <p className="font-bold">{order.shippingAddress.fullName}</p>
                              <p className="text-sm text-white/60">{order.shippingAddress.addressLine1}</p>
                              {order.shippingAddress.addressLine2 && (
                                <p className="text-sm text-white/60">{order.shippingAddress.addressLine2}</p>
                              )}
                              <p className="text-sm text-white/60">
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                              </p>
                              <p className="text-sm text-white/60">{order.shippingAddress.country}</p>
                              <p className="text-sm text-white/40 mt-2">{order.shippingAddress.phone}</p>
                            </div>
                          </div>
                        )}

                        {/* Tracking Number */}
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Tracking</h5>
                          <div className="flex items-center gap-3">
                            <div className="flex-grow bg-white/5 rounded-xl px-4 py-3 font-mono text-sm">
                              {order.trackingNumber || <span className="text-white/30">Not added</span>}
                            </div>
                            <button
                              onClick={() => handleTrackingNumber(order.id)}
                              disabled={isUpdating}
                              className="bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                            >
                              {order.trackingNumber ? 'Update' : 'Add'}
                            </button>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, e.target.value as Order['status']);
                              }}
                              disabled={isUpdating}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neon-green transition-colors appearance-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status} className="bg-dark-bg">
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Stripe Info */}
                          {order.stripePaymentIntentId && (
                            <div className="text-xs text-white/30">
                              Stripe: <span className="font-mono">{order.stripePaymentIntentId.slice(0, 20)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}