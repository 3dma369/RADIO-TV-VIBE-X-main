/**
 * VIBE-X Analytics Service
 * Wraps Google Analytics 4 (GA4) for tracking page views, events, and user engagement.
 * ALSO mirrors page views + engagement to Firestore so the Admin Suite metrics show real data.
 * GA4 property ID: G-W5YZ2YJWT1
 */

import { db, collection, addDoc, serverTimestamp, app } from '../firebaseConfig';

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

// ─── Firestore mirror (best-effort, never blocks UI) ───────────────────────

// Get the Firestore project ID from the Firebase app config — needed for the
// REST API fallback (so writes work even if the WebChannel connection fails).
const FIRESTORE_PROJECT = app.options.projectId || 'vibe-x-app';
const FIRESTORE_DATABASE = '(default)';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/${FIRESTORE_DATABASE}/documents`;

/**
 * Write a document to Firestore using whichever path works:
 *   1. The Firebase SDK (preferred — realtime listeners + offline cache)
 *   2. REST API fallback (if SDK import fails for any reason)
 * Errors are swallowed so analytics never break the UI.
 */
async function safeWrite(collectionName: string, payload: Record<string, any>): Promise<void> {
  // Try SDK first
  if (db) {
    try {
      await addDoc(collection(db, collectionName), { ...payload, timestamp: serverTimestamp() });
      return;
    } catch (e: any) {
      console.warn(`[Analytics] SDK write to ${collectionName} failed, trying REST:`, e?.message || e);
    }
  }
  // REST fallback — generates a doc ID server-side via POST to the collection.
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'string') fields[k] = { stringValue: v };
      else if (typeof v === 'number') fields[k] = { doubleValue: v };
      else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }
    // serverTimestamp() resolves to a real ISO timestamp on the client
    fields.timestamp = { timestampValue: new Date().toISOString() };
    await fetch(`${FIRESTORE_BASE}/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (e: any) {
    console.warn(`[Analytics] REST write to ${collectionName} also failed:`, e?.message || e);
  }
}

// Track a page view (called on route changes)
// Writes to BOTH GA4 AND Firestore `pageViews` collection.
export function trackPageView(path: string, title?: string) {
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
  safeWrite('pageViews', {
    path,
    title: title || document.title,
    userAgent: navigator.userAgent?.slice(0, 200),
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
  // sessionHistory: every active_session heartbeat becomes a session record
  if (metric === 'active_session') {
    safeWrite('sessionHistory', { durationSeconds: Math.floor(value / 1000) });
  }
}

// Track music playback
// Writes to both GA4 AND Firestore `listenerHistory` (with trackId so the Admin Suite
// can compute top tracks from real play counts).
export function trackPlay(trackTitle: string, artist: string, genre?: string, trackId?: string) {
  trackEvent('play_track', {
    track_title: trackTitle,
    artist,
    genre: genre || 'unknown',
  });
  safeWrite('listenerHistory', {
    trackId: trackId || null,
    trackTitle,
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
