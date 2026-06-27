/**
 * ImageUploadField — VIBE-X (stub)
 */
import React from 'react';

interface Props {
  onUpload?: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUploadField({ onUpload, accept = 'image/*', maxSizeMB = 10 }: Props) {
  return (
    <div className="p-4 border border-dashed border-white/20 rounded-xl text-white/40 text-xs">
      Image upload temporarily unavailable
    </div>
  );
}