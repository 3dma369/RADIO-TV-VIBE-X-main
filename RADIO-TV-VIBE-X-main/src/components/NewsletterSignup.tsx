/**
 * NewsletterSignup — VIBE-X (stub)
 * Inline newsletter signup form (used inside RadioView).
 */
import React, { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Stay in the loop</h3>
      {done ? (
        <p className="text-[#00ff88] text-xs">✓ Subscribed</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs"
          />
          <button type="submit" className="px-3 py-2 bg-[#00ff88] text-black font-bold rounded-lg text-xs">Join</button>
        </form>
      )}
    </div>
  );
}