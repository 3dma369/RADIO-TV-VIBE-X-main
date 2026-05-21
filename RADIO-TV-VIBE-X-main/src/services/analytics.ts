/**
 * VIBE-X Analytics Service
 * Wraps Google Analytics 4 (GA4) for tracking page views, events, and user engagement.
 * GA4 property ID: G-W5YZ2YJWT1
 */

type EventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function gtag(command: string, ...args: unknown[]) {
  if (typeof window.gtag === 'function') {
    window.gtag(command, ...args);
  } else {
    console.warn('[Analytics] gtag not available:', command, args);
  }
}

// Track a page view (called on route changes)
export function trackPageView(path: string, title?: string) {
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

// Track a custom event
export function trackEvent(name: string, params?: EventParams) {
  gtag('event', name, params);
}

// Track user engagement
export function trackEngagement(metric: string, value: number) {
  gtag('event', 'user_engagement', {
    engagement_metric: metric,
    value,
  });
}

// Track music playback
export function trackPlay(trackTitle: string, artist: string, genre?: string) {
  trackEvent('play_track', {
    track_title: trackTitle,
    artist,
    genre: genre || 'unknown',
  });
}

// Track donation/support
export function trackDonation(tier: string, amount: number) {
  trackEvent('donation', {
    tier_name: tier,
    donation_amount: amount,
    currency: 'USD',
  });
}

// Track product purchase
export function trackPurchase(orderId: string, total: number, itemCount: number) {
  gtag('event', 'purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'USD',
    items_count: itemCount,
  });
}

// Track store view / product browse
export function trackStoreView() {
  trackEvent('view_store');
}

// Track product view
export function trackProductView(productName: string, price: number, category: string) {
  trackEvent('view_product', {
    product_name: productName,
    price,
    product_category: category,
  });
}

// Track add to cart
export function trackAddToCart(productName: string, price: number) {
  trackEvent('add_to_cart', {
    product_name: productName,
    price,
    currency: 'USD',
  });
}

// Track chat message sent
export function trackChatMessage() {
  trackEvent('send_message', {
    platform: 'web',
  });
}

// Track live stream view
export function trackLiveStreamView(source: string) {
  trackEvent('watch_live', {
    stream_source: source,
  });
}

// Track user sign-in (new or returning)
export function trackSignIn(method: 'google' | 'email') {
  trackEvent('sign_in', {
    method,
  });
}

// Track new user registration
export function trackSignUp(method: 'google' | 'email') {
  trackEvent('sign_up', {
    method,
  });
}

// Set user properties (requires authenticated user)
export function setUserProperties(properties: Record<string, string>) {
  gtag('event', 'set_user_properties', properties);
}
