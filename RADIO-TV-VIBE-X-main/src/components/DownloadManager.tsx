import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Clock, RefreshCw, FileAudio, FileArchive, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { regenerateDownloadLink } from '../services/orderService';
import { cn } from '../utils';

interface DownloadLinkItem {
  productId: string;
  productName: string;
  downloadUrl: string;
  fileType: string;
  expiresAt: Timestamp;
  isExpired: boolean;
}

interface DownloadManagerProps {
  orderId: string;
  downloadLinks: DownloadLinkItem[];
  onRegenerate?: () => void;
}

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('mp3') || type.includes('wav') || type.includes('flac') || type.includes('audio')) {
    return FileAudio;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz')) {
    return FileArchive;
  }
  return FileText;
};

export default function DownloadManager({ orderId, downloadLinks, onRegenerate }: DownloadManagerProps) {
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isExpired = (link: DownloadLinkItem): boolean => {
    if (link.isExpired) return true;
    return link.expiresAt?.toMillis() ? link.expiresAt.toMillis() < Date.now() : false;
  };

  const getTimeRemaining = (link: DownloadLinkItem): string => {
    if (isExpired(link)) return 'Expired';
    
    const now = Date.now();
    const expiresAt = link.expiresAt?.toDate?.()?.getTime() || Date.now();
    const remaining = expiresAt - now;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const handleDownload = async (link: DownloadLinkItem) => {
    if (isExpired(link)) return;
    
    setDownloadingId(link.productId);
    setError(null);
    
    try {
      // Create a temporary anchor element for download
      const a = document.createElement('a');
      a.href = link.downloadUrl;
      a.download = `${link.productName}.${link.fileType}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError('Download failed. Try regenerating the link.');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const handleRegenerate = async (link: DownloadLinkItem) => {
    setRegeneratingId(link.productId);
    setError(null);
    
    try {
      // For now, we'll simulate regeneration by refreshing the page
      // In a real implementation, this would call the backend to generate a new signed URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would call:
      // await regenerateDownloadLink(orderId, link.productId, newUrl, 7);
      
      onRegenerate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate link');
    } finally {
      setRegeneratingId(null);
    }
  };

  if (!downloadLinks || downloadLinks.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No download links available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-500 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {downloadLinks.map((link) => {
        const expired = isExpired(link);
        const FileIcon = getFileIcon(link.fileType);
        const timeRemaining = getTimeRemaining(link);
        
        return (
          <motion.div
            key={link.productId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "glass rounded-2xl p-4 border transition-colors",
              expired ? "border-white/5 opacity-60" : "border-neon-green/20"
            )}
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                expired ? "bg-white/5" : "bg-neon-green/10"
              )}>
                <FileIcon className={cn(
                  "w-6 h-6",
                  expired ? "text-white/30" : "text-neon-green"
                )} />
              </div>

              {/* File Info */}
              <div className="flex-grow min-w-0">
                <h4 className={cn(
                  "font-bold text-sm truncate",
                  expired ? "text-white/40" : "text-white"
                )}>
                  {link.productName}
                </h4>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">
                  {link.fileType} • {expired ? 'EXPIRED' : 'ACTIVE'}
                </p>
                
                {/* Time Remaining */}
                <div className="flex items-center gap-1 mt-2">
                  <Clock className={cn(
                    "w-3 h-3",
                    expired ? "text-red-500" : "text-white/30"
                  )} />
                  <span className={cn(
                    "text-xs font-mono",
                    expired ? "text-red-500" : "text-white/40"
                  )}>
                    {timeRemaining}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                {expired ? (
                  <button
                    onClick={() => handleRegenerate(link)}
                    disabled={regeneratingId === link.productId}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      "bg-white/5 hover:bg-white/10 text-white/60",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Regenerate Link"
                  >
                    {regeneratingId === link.productId ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownload(link)}
                    disabled={downloadingId === link.productId}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      "bg-neon-green hover:bg-neon-green/80 text-black",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Download"
                  >
                    {downloadingId === link.productId ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Expiration Warning */}
            {!expired && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] text-white/20">
                  Link expires in {timeRemaining}. Click regenerate to get a new 7-day link.
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}