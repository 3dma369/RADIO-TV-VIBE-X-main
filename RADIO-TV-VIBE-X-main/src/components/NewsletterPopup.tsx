/**
 * NewsletterPopup — VIBE-X
 * Stub: in-app newsletter signup popup. Triggers after delay or scroll.
 */
import React, { useState, useEffect } from 'react';

interface Props {
  source: string;
  trigger?: 'time' | 'scroll' | 'manual';
  delayMs?: number;
}

export default function NewsletterPopup({ source, trigger = 'time', delayMs = 30000 }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    if (trigger === 'time') {
      const t = setTimeout(() => setOpen(true), delayMs);
      return () => clearTimeout(t);
    }
    if (trigger === 'scroll') {
      const onScroll = () => {
        if (window.scrollY > 400) setOpen(true);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
  }, [trigger, delayMs, dismissed]);

  if (!open || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 glass rounded-2xl p-4 max-w-sm border border-[#00ff88]/30 shadow-2xl">
      <button
        onClick={() => { setOpen(false); setDismissed(true); }}
        className="absolute top-2 right-2 text-white/40 hover:text-white"
        aria-label="Dismiss"
      >×</button>
      <h3 className="text-sm font-bold uppercase tracking-widest text-[#00ff88] mb-2">Stay in the loop</h3>
      <p className="text-white/60 text-xs mb-3">Show announcements, new DJ schedules, exclusive mixes.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          setDismissed(true);
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          required
          placeholder="you@email.com"
          className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs"
        />
        <button type="submit" className="px-3 py-2 bg-[#00ff88] text-black font-bold rounded-lg text-xs">
          Join
        </button>
      </form>
      <p className="text-white/30 text-[10px] mt-2">Source: {source} · Unsubscribe anytime</p>
    </div>
  );
}