/**
 * OpsConsole — VIBE-X (stub)
 */
import React from 'react';

interface Props {
  config: any;
  db: any;
  storage: any;
}

export function OpsConsole({ config, db, storage }: Props) {
  return (
    <div className="p-4 text-white/40 text-sm">
      Ops console temporarily unavailable.
    </div>
  );
}