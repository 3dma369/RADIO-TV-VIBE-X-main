/**
 * Firebase CDN loader — loads Firebase modular SDK directly from CDN.
 * This bypasses Vite's minifier bundling and avoids the TDZ initialization
 * error ("Cannot access before initialization") that occurs on iOS Safari.
 *
 * Usage: import { getApps } from './firebase-cdn-loader';
 */

const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.min.js';

export async function loadFirebase() {
  if (typeof window === 'undefined') {
    // SSR — return empty stub so server-side code doesn't crash
    return {};
  }

  // Already loaded?
  if ((window as any).firebase?.apps?.length) {
    return (window as any).firebase;
  }

  // Load from CDN synchronously (Firebase modules are self-initializing)
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = FIREBASE_CDN;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Firebase from CDN'));
    document.head.appendChild(script);
  });

  return (window as any).firebase;
}

export function getFirebase() {
  return (window as any).firebase || null;
}