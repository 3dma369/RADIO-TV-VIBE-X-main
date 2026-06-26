export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Firebase Storage path for the image (e.g. "vibe_x_products/prod_001/12345-foo.jpg"). Optional. */
  imagePath?: string;
  category: 'apparel' | 'accessories' | 'digital' | 'music' | 'swag' | 'vinyl' | 'ticket';
  // For digital/music products
  downloadUrl?: string;
  fileType?: string; // 'mp3', 'wav', 'flac', 'zip'
  // For physical products
  shippingRequired?: boolean;
  stock?: number;
  // Promotions + metadata
  discountPercent?: number;   // 0-100, applied to price at display time
  rating?: number;            // 0-5 stars (admin-set average)
  info?: string;              // free-form info/marketing blurb
}

export const calcDiscountedPrice = (price: number, pct?: number): number => {
  if (!pct || pct <= 0) return price;
  return Math.max(0, +(price * (1 - pct / 100)).toFixed(2));
};

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
  bpm?: number;
  key?: string;
  energy?: number;
  videoUrl?: string;
  audioUrl?: string;
  visualUrl?: string;
  // Cover art shown in player (alias for albumArt — both accepted)
  image?: string;
  // For music store - purchasable tracks
  price?: number;
  isAvailable?: boolean;
  downloadUrl?: string;
  fileType?: string;
  albumArt?: string;
  // Mood/Activity tag for mood-based playback
  mood?: 'jungle-dnb' | 'house' | 'trance' | 'alternative' | 'jazz' | 'blues' | 'mc-theme' | 'eighties-nineties-2000s' | 'chill';
}

export interface DJ {
  id: string;
  name: string;
  bio: string;
  image: string;
  /** Firebase Storage path for the photo. Optional. */
  imagePath?: string;
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

// Visual asset — plays on top of audio. Used for logos, banners, video loops, thumbnails.
export interface VisualAsset {
  id: string;
  name: string;
  type: 'logo' | 'banner' | 'thumbnail' | 'video-loop' | 'overlay' | 'background' | 'commercial' | 'slideshow' | 'text';
  url: string;             // Storage or external URL
  thumbnailUrl?: string;   // Preview thumbnail
  duration?: number;       // seconds to display (for image assets)
  // Display props
  opacity?: number;        // 0-1, default 0.8
  position?: 'top' | 'bottom' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'corner' | 'fullscreen';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  // ── Layer system ──
  // Which z-stack layer this visual occupies. Layers are rendered
  // simultaneously, so you can stack a background + watermark + promo.
  //   'background' — full-canvas layer (video-loops, background images)
  //   'watermark'  — small persistent layer (logo, brand mark) in a corner
  //   'promo'      — larger timed layer (banner, sponsor, announcement)
  //   'overlay'    — small transient layer (notification, alert, ticker)
  // Defaults to 'background' for video-loop/bg, 'watermark' for logo,
  // 'promo' for banner, 'overlay' for overlay/thumbnail.
  layer?: 'background' | 'watermark' | 'promo' | 'overlay' | 'slideshow';
  // Behavior
  playWithAudio?: boolean; // play simultaneously with track
  loop?: boolean;          // loop continuously
  fadeIn?: boolean;        // fade in over 500ms
  fadeOut?: boolean;       // fade out when changing
  // ── Audio behavior ──
  // muteVideo: video element's audio is always muted (default true).
  // Only unmuted when this visual is being played as a Commercial (audio mode 'replace').
  muteVideo?: boolean;
  // audioMode: how this visual interacts with the music playlist
  //   'none'   — visual only, never produces sound. Default.
  //   'duck'   — plays visual audio at low volume UNDER the music (rarely used).
  //   'replace'— when active, this visual REPLACES the music audio (music videos, commercials).
  audioMode?: 'none' | 'duck' | 'replace';
  // ── Promo-specific fields (layer='promo' or type='banner') ──
  ctaUrl?: string;            // clickable URL on the banner (e.g. sponsor site)
  ctaLabel?: string;          // button text inside the banner
  // Schedule (optional) — show banner only between start/end times
  scheduleStart?: number;     // epoch ms
  scheduleEnd?: number;       // epoch ms
  dismissible?: boolean;      // user can close it
  // Organization
  groupId?: string;        // optional: play with other assets in same group
  tags?: string[];         // for filtering
  // For commercials: scheduling
  commercialEveryNTracks?: number; // auto-play every N tracks (0 = manual only)
  isCommercial?: boolean;  // shortcut marker — type==='commercial' OR isCommercial===true
  // Quick on/off switch — admin can hide a visual without deleting it.
  // Undefined is treated as enabled (legacy docs stay on).
  enabled?: boolean;
  // ── TEXT OVERLAY (type === 'text') ─────────────────────────────────────
  // Renders live text on a canvas — no image upload needed.
  // Works on any layer (usually 'overlay' or 'promo').
  text?: {
    content: string;              // the text to render (supports \n for line breaks)
    fontFamily?: 'sans' | 'serif' | 'mono' | 'display' | 'script';
    fontSize?: number;            // px (default 32)
    fontWeight?: 'normal' | 'bold' | 'black';
    color?: string;               // hex e.g. '#FFFFFF'
    backgroundColor?: string;     // hex e.g. '#000000'
    backgroundOpacity?: number;   // 0-1 (default 0.5)
    padding?: number;             // px around text inside its bg box (default 12)
    borderRadius?: number;        // px (default 8)
    align?: 'left' | 'center' | 'right';
    animation?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'typewriter' | 'pulse';
    rotation?: number;            // -180 to 180 degrees
    maxWidth?: number;            // px, text wraps if exceeded (default 600)
  };
  createdAt: number;
  updatedAt: number;
}

// Visual group — a named collection of assets that play together
// (e.g. "Morning Show Intro" = logo + lower-third + background)
export interface VisualGroup {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];      // ordered list of VisualAsset ids
  // When to play
  triggerType: 'manual' | 'on-track-change' | 'interval' | 'live-show';
  intervalSeconds?: number;  // for triggerType=interval
  // State
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
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