/**
 * AdminDashboard — VIBE-X (stub)
 * Empire-wide admin dashboard. Original deleted; stub keeps build working.
 */
import React from 'react';

interface Props {
  config: any;
  currentUser: any;
  db: any;
}

export function AdminDashboard({ config, currentUser, db }: Props) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold text-white mb-2">{config?.appName || 'Admin'}</h3>
      <p className="text-white/40 text-sm">Admin dashboard temporarily unavailable.</p>
      <p className="text-white/30 text-xs mt-2">User: {currentUser?.fullName || 'anonymous'}</p>
    </div>
  );
}