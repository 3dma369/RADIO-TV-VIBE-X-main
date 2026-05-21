import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isDigital?: boolean;
  filePath?: string;
  downloadUrl?: string;
  fileType?: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface DownloadLink {
  productId: string;
  productName: string;
  downloadUrl: string;
  fileType: string;
  expiresAt: Timestamp;
  isExpired: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress?: ShippingAddress;
  stripePaymentIntentId?: string;
  stripePaymentStatus?: string;
  downloadLinks: DownloadLink[];
  trackingNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const ORDERS_COLLECTION = 'orders';

/**
 * Create a new order in Firestore
 */
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating order:', error);
    throw new Error(error.message || 'Failed to create order');
  }
};

/**
 * Get a single order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting order:', error);
    throw new Error(error.message || 'Failed to get order');
  }
};

/**
 * Get all orders for a specific user
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    
    return orders;
  } catch (error: any) {
    console.error('Error getting user orders:', error);
    throw new Error(error.message || 'Failed to get orders');
  }
};

/**
 * Get all orders (for admin)
 */
export const getAllOrders = async (limit: number = 100): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      // Note: Firestore limits queries - in production, use cursor pagination
    );
    
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    
    // Apply limit manually since Firestore doesn't support limit on ordered queries without composite index
    return orders.slice(0, limit);
  } catch (error: any) {
    console.error('Error getting all orders:', error);
    throw new Error(error.message || 'Failed to get orders');
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
  trackingNumber?: string
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    throw new Error(error.message || 'Failed to update order');
  }
};

/**
 * Add download link to an order (for digital products)
 */
export const addDownloadLink = async (
  orderId: string,
  downloadLink: DownloadLink
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const order = await getOrder(orderId);
    
    if (!order) throw new Error('Order not found');
    
    const existingLinks = order.downloadLinks || [];
    const updatedLinks = [...existingLinks, downloadLink];
    
    await updateDoc(docRef, {
      downloadLinks: updatedLinks,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error adding download link:', error);
    throw new Error(error.message || 'Failed to add download link');
  }
};

/**
 * Regenerate download link for a digital product
 */
export const regenerateDownloadLink = async (
  orderId: string,
  productId: string,
  newUrl: string,
  expirationDays: number = 7
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const order = await getOrder(orderId);
    
    if (!order) throw new Error('Order not found');
    
    const existingLinks = order.downloadLinks || [];
    const linkIndex = existingLinks.findIndex(link => link.productId === productId);
    
    if (linkIndex === -1) throw new Error('Download link not found');
    
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(
      new Date(now.toDate().getTime() + expirationDays * 24 * 60 * 60 * 1000)
    );
    
    existingLinks[linkIndex] = {
      ...existingLinks[linkIndex],
      downloadUrl: newUrl,
      expiresAt,
      isExpired: false,
    };
    
    await updateDoc(docRef, {
      downloadLinks: existingLinks,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error regenerating download link:', error);
    throw new Error(error.message || 'Failed to regenerate download link');
  }
};

/**
 * Check if download link is expired
 */
export const isDownloadExpired = (link: DownloadLink): boolean => {
  if (link.isExpired) return true;
  return link.expiresAt?.toMillis() < Date.now();
};

/**
 * Get valid download links (not expired)
 */
export const getValidDownloadLinks = (order: Order): DownloadLink[] => {
  return (order.downloadLinks || []).filter(link => !isDownloadExpired(link));
};

/**
 * Mark order as paid (called after successful Stripe payment)
 */
export const markOrderAsPaid = async (
  orderId: string,
  stripePaymentIntentId: string,
  stripePaymentStatus: string
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      stripePaymentIntentId,
      stripePaymentStatus,
      status: 'processing',
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error marking order as paid:', error);
    throw new Error(error.message || 'Failed to update payment status');
  }
};