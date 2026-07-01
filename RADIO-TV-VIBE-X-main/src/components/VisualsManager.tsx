/**
 * VisualsManager — VIBE-X
 * Visuals tab = the file storage manager (visuals, logos, thumbnails, ads, banners, music).
 * Source code moved here from the Storage tab — storage is now outsourced to Firebase Storage.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Image as ImageIcon,
  Image,
  Film,
  FileAudio,
  Loader2,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '../utils';
import {
  uploadToStorage,
  deleteFromStorage,
  listFolder,
  sanitizePathSegment
} from '../firebaseConfig';

export default function VisualsManager() {
  const [activeFolder, setActiveFolder] = useState<string>('visuals');
  const [files, setFiles] = useState<{name: string; url: string; size: string; fullPath: string; updated: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number; total: number; pct: number; name: string} | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const STORAGE_FOLDERS = [
    { id: 'music', label: 'Music', icon: FileAudio, accept: 'audio/*,video/*,.mp3,.wav,.aac,.flac,.m4a', extensions: '.mp3, .wav, .aac, .mp4' },
    { id: 'visuals', label: 'Visuals', icon: Film, accept: 'video/*', extensions: '.mp4, .webm, .mov' },
    { id: 'logos', label: 'Logos', icon: ImageIcon, accept: 'image/png,image/jpeg,image/svg+xml,image/webp', extensions: '.png, .jpg, .svg, .webp' },
    { id: 'thumbnails', label: 'Thumbnails', icon: Image, accept: 'image/png,image/jpeg,image/webp', extensions: '.png, .jpg, .webp' },
    { id: 'ads', label: 'Ads', icon: Film, accept: 'video/*', extensions: '.mp4, .webm' },
    { id: 'banners', label: 'Banners', icon: Image, accept: 'image/png,image/jpeg,image/webp', extensions: '.png, .jpg, .webp' },
  ];

  const folder = STORAGE_FOLDERS.find(f => f.id === activeFolder)!;

  const refresh = async () => {
    setLoading(true);
    try {
      const items = await listFolder(`${activeFolder}/`);
      setFiles(items.map(item => ({
        name: item.name,
        url: item.url,
        size: item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        fullPath: item.fullPath,
        updated: item.updated,
      })));
      setMessage(null);
    } catch (err: any) {
      setFiles([]);
      setMessage({ type: 'error', text: `Could not list /${activeFolder}/: ${err?.message || 'auth required'}` });
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [activeFolder]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setUploading(true);
    setMessage(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const safeName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${activeFolder}/${safeName}-${Date.now()}.${ext}`;
        setUploadProgress({ current: i + 1, total: uploadedFiles.length, pct: 0, name: file.name });
        try {
          await uploadToStorage(path, file, (pct) => {
            setUploadProgress({ current: i + 1, total: uploadedFiles.length, pct, name: file.name });
          });
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error(`Upload ${file.name} failed:`, err);
        }
      }
      if (failCount === 0) {
        setMessage({ type: 'success', text: `${successCount} file(s) uploaded to /${activeFolder}/` });
      } else if (successCount === 0) {
        setMessage({ type: 'error', text: `All ${failCount} upload(s) failed — check Firebase Storage rules and your auth` });
      } else {
        setMessage({ type: 'error', text: `${successCount} uploaded, ${failCount} failed` });
      }
      await refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Upload failed' });
    }
    setUploading(false);
    setUploadProgress(null);
    (e.target as HTMLInputElement).value = '';
  }

  async function handleDelete(file: { fullPath: string; name: string }) {
    if (!confirm(`Delete ${file.name}? This cannot be undone.`)) return;
    setDeletingPath(file.fullPath);
    try {
      await deleteFromStorage(file.fullPath);
      setMessage({ type: 'success', text: `Deleted ${file.name}` });
      await refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Delete failed: ${err?.message || 'permission denied'}` });
    }
    setDeletingPath(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => setMessage({ type: 'success', text: 'URL copied to clipboard' }),
      () => setMessage({ type: 'error', text: 'Copy failed — select & copy manually' })
    );
  }

  const Icon = folder.icon;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Storage Manager</h3>
        <label className={cn("flex items-center gap-2 px-4 py-2 bg-neon-green text-black rounded-xl text-sm font-bold transition-colors",
          uploading ? "opacity-50 cursor-wait" : "cursor-pointer hover:bg-neon-green/90"
        )}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload File'}
          <input
            type="file"
            multiple
            accept={folder.accept}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && uploadProgress && (
        <div className="glass rounded-xl p-4 mb-4 border border-neon-green/30">
          <div className="flex items-center gap-3 text-neon-green mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-bold">
              Uploading {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.name}
            </span>
            <span className="ml-auto text-xs font-mono">{uploadProgress.pct}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-neon-green h-full transition-all duration-200"
              style={{ width: `${uploadProgress.pct}%` }}
            />
          </div>
        </div>
      )}
      {message && (
        <div className={cn("glass rounded-xl p-4 mb-4 border",
          message.type === 'success' ? 'border-neon-green/30 text-neon-green' : 'border-red-500/30 text-red-400'
        )}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {STORAGE_FOLDERS.map(f => {
          const FIcon = f.icon;
          return (
            <button key={f.id} onClick={() => setActiveFolder(f.id)}
              className={cn("glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:border-neon-green/30",
                activeFolder === f.id ? "border-neon-green bg-neon-green/10" : "border-white/10")}>
              <FIcon className={cn("w-5 h-5", activeFolder === f.id ? "text-neon-green" : "text-white/40")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                activeFolder === f.id ? "text-neon-green" : "text-white/60")}>{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-neon-green" />
            <h4 className="text-lg font-bold">/{activeFolder}/</h4>
            <span className="text-xs text-white/40 font-mono">{folder.extensions}</span>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4 text-white/60", loading && "animate-spin")} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No files in /{activeFolder}/</p>
            <p className="text-xs mt-1">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.fullPath} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-white/40 font-mono">{file.size} · {new Date(file.updated).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyUrl(file.url)} title="Copy URL"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-white/60" />
                  </button>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" title="Open in new tab"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </a>
                  <button onClick={() => handleDelete(file)} disabled={deletingPath === file.fullPath}
                    title="Delete"
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 className={cn("w-4 h-4 text-red-400", deletingPath === file.fullPath && "animate-spin")} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
