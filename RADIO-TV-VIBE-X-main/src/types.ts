export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'apparel' | 'accessories' | 'digital' | 'music' | 'swag' | 'vinyl';
  // For digital/music products
  downloadUrl?: string;
  fileType?: string; // 'mp3', 'wav', 'flac', 'zip'
  // For physical products
  shippingRequired?: boolean;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
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
  trackingNumber?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  videoUrl?: string;
  audioUrl?: string;
  visualUrl?: string;
  // For music store - purchasable tracks
  price?: number;
  isAvailable?: boolean;
  downloadUrl?: string;
  fileType?: string;
  albumArt?: string;
  // Mood/Activity tag for mood-based playback
  mood?: 'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready';
}

export interface DJ {
  id: string;
  name: string;
  bio: string;
  image: string;
  specialty: string;
  socials: {
    twitter?: string;
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
  };
}

export interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  djId: string;
  showName: string;
}

export interface StreamSource {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'stream';
  isActive: boolean;
  // YouTube live config
  youtubeStreamKey?: string;
  youtubeVideoId?: string; // for HLS playback
  isLive?: boolean;
  autoSwitch?: boolean; // auto-switch to live when YouTube goes live
  platform?: 'youtube' | 'rtmp' | 'hls';
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  color: string;
  timestamp: number;
  userId?: string; // Firebase UID
  avatar?: string; // Google profile picture
}

export interface UserProfile {
  id: string; // Firebase UID
  email: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: any;
  updatedAt: any;
  // Funding & Payment
  stripeCustomerId?: string;
  cryptoAddresses?: {
    ethereum?: string;
    solana?: string;
    bitcoin?: string;
  };
  defaultPaymentMethod?: 'card' | 'crypto';
  // Shipping
  shippingAddresses: ShippingAddress[];
  defaultShippingAddressId?: string;
  // Commerce
  orderHistory: string[]; // Order IDs
  donationHistory: {
    tier: string;
    amount: number;
    date: any;
    status: string;
  }[];
  // Preferences
  notifications: {
    emailNewMusic: boolean;
    emailOrders: boolean;
    emailDonations: boolean;
    pushNewMusic: boolean;
    pushOrders: boolean;
    pushLiveShows: boolean;
  };
  // Stats
  totalSpent: number;
  totalDonated: number;
}

export interface ShippingAddress {
  id: string;
  label: string; // 'Home', 'Work', etc.
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}