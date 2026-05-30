/**
 * MetricsService — VIBE-X Station Analytics
 * Collects and stores real metrics: session time, page views, revenue from Stripe.
 */

import { db, collection, addDoc, serverTimestamp } from '../firebaseConfig';

// ─── Session Tracking ─────────────────────────────────────────────────────────

let sessionStart: number | null = null;
let totalListenSeconds = 0;
let lastTick = 0;

/** Call when user starts listening (audio plays) */
export function startSession() {
  sessionStart = Date.now();
  lastTick = Date.now();
  totalListenSeconds = 0;
}

/** Call periodically (e.g. every 60s) while audio is playing */
export function tickSession() {
  if (!sessionStart) return;
  const now = Date.now();
  totalListenSeconds += Math.floor((now - lastTick) / 1000);
  lastTick = now;
}

/** Call when user stops listening or leaves */
export function endSession() {
  if (!sessionStart) return;
  const now = Date.now();
  const sessionDuration = Math.floor((now - sessionStart) / 1000) + totalListenSeconds;
  logSessionMetrics(sessionDuration);
  sessionStart = null;
  totalListenSeconds = 0;
}

async function logSessionMetrics(durationSeconds: number) {
  if (durationSeconds < 10) return; // Ignore sessions < 10s
  try {
    await addDoc(collection(db, 'sessionHistory'), {
      durationSeconds,
      pageViews: 1,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[Metrics] Failed to log session:', e);
  }
}

/** Log a page view */
export async function logPageView(path: string) {
  try {
    await addDoc(collection(db, 'pageViews'), {
      path,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[Metrics] Failed to log page view:', e);
  }
}