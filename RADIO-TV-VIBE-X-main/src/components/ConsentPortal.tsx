/**
 * ConsentPortal — VIBE-X
 * Stub: legal consent page for FCC/CCPA compliance (GDPR-style).
 * Restored from milestone-era structure: shows policy text + accept/decline.
 */
import React from 'react';

export default function ConsentPortal() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-[#00ff88]">Listener Consent</h1>
        <p className="text-white/70">
          VIBE-X collects anonymous listening data (tracks played, duration, mood preference)
          to improve programming. We never sell your data. We never listen to your microphone.
          Sign in to opt out at any time.
        </p>
        <div className="glass rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-bold">What we collect</h2>
          <ul className="list-disc list-inside text-white/60 space-y-1 text-sm">
            <li>Anonymous session ID</li>
            <li>Track play/pause/skip events</li>
            <li>Mood selection</li>
            <li>Approximate connection timestamp</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl">Accept</button>
          <button className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl">Decline</button>
        </div>
        <p className="text-white/30 text-xs">
          Questions? Contact support@vibe-x.app
        </p>
      </div>
    </div>
  );
}