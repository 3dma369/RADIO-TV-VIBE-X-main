/**
 * serverConfig.ts — VIBE-X
 *
 * Fetches track catalogs from the Mac server (`localhost:344` or Tailscale
 * Funnel) and Windows Server 2 (Tailscale proxy → Windows:344).
 * Probes real MP3 durations via hidden `<audio preload="metadata">`.
 */

import { Track } from '../types';

// ─── Server endpoints ──────────────────────────────────────────────────────
const MAC_LOCAL = 'http://localhost:344';
const MAC_FUNNEL = 'https://333es-mac-mini.tail2d0ad9.ts.net/music';
const WIN_FUNNEL = 'https://333es-mac-mini.tail2d0ad9.ts.net/win';

function getBase(serverId: 'mac' | 'win'): string {
  if (serverId === 'win') return WIN_FUNNEL;
  return typeof window !== 'undefined' ? MAC_FUNNEL : MAC_LOCAL;
}

// ─── File listing API ──────────────────────────────────────────────────────
export interface ServerFile {
  name: string;
  type: 'file' | 'folder';
  ext: string;
  size: number;
  mtime: number;
  url: string | null;
}

export interface ServerListResponse {
  path: string;
  count: number;
  items: ServerFile[];
}

export async function fetchServerFolder(serverId: 'mac' | 'win', folder: string): Promise<ServerFile[]> {
  try {
    const base = getBase(serverId);
    const url = `${base}/__list/${encodeURIComponent(folder)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const data: ServerListResponse = await res.json();
    // Filter to audio files only (.mp3, .m4a, .wav, .aac, .ogg, .flac)
    const audioExts = ['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.flac'];
    return (data.items || []).filter(
      (f) => f.type === 'file' && audioExts.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
  } catch (e) {
    console.error(`[serverConfig] fetchServerFolder(${serverId}, ${folder}) failed:`, e);
    return [];
  }
}

export async function fetchServerCatalog(serverId: 'mac' | 'win'): Promise<ServerFile[]> {
  try {
    const base = getBase(serverId);
    const url = `${base}/__list/`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const data: ServerListResponse = await res.json();
    // Recursive fetch across all folders
    const folders = (data.items || []).filter((f) => f.type === 'folder');
    const results: ServerFile[] = [];
    for (const folder of folders) {
      const files = await fetchServerFolder(serverId, folder.name);
      results.push(...files);
    }
    return results;
  } catch (e) {
    console.error(`[serverConfig] fetchServerCatalog(${serverId}) failed:`, e);
    return [];
  }
}

// ─── File → Track mapping ──────────────────────────────────────────────────
export function serverFileToTrack(file: ServerFile, index: number): Partial<Track> & { serverFile: true; relativePath: string; serverId: 'mac' | 'win' } {
  // Parse "Artist - Title" from filename, strip leading BPM/key markers like "10A-87-"
  let name = file.name.replace(/\.(mp3|m4a|wav|aac|ogg|flac)$/i, '');
  name = name.replace(/^\d+[AB]-\d+-/, ''); // remove "10A-87-" style prefix
  name = name.replace(/%20/g, ' ');
  name = decodeURIComponent(name);

  let artist = '';
  let title = name;
  if (name.includes(' - ')) {
    const [a, ...rest] = name.split(' - ');
    artist = a.trim();
    title = rest.join(' - ').trim();
  }

  const base = getBase(file.url?.includes('win') ? 'win' : 'mac');
  const relPath = file.url || `/${file.name}`;

  return {
    id: `srv-${relPath}`,
    title: title || file.name,
    artist: artist || '', // empty so RadioView can hide "Local Server"
    duration: '0:00',
    genre: 'Local',
    audioUrl: relPath.startsWith('http') ? relPath : `${base}${relPath.startsWith('/') ? '' : '/'}${relPath}`,
    serverFile: true,
    serverId: file.url?.includes('win') ? 'win' : 'mac',
    relativePath: relPath,
    votes: 0,
  };
}

// ─── Subscriptions (catalog updates) ───────────────────────────────────────
type CatalogListener = (files: ServerFile[]) => void;
const catalogListeners = new Set<CatalogListener>();

export function subscribe(listener: CatalogListener): () => void {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}

function notifyCatalog(files: ServerFile[]): void {
  catalogListeners.forEach((cb) => {
    try { cb(files); } catch (e) { console.error('[serverConfig] listener error:', e); }
  });
}

// ─── Duration probing ──────────────────────────────────────────────────────
const durationCache = new Map<string, number>();
const inflightProbes = new Map<string, Promise<void>>();

export async function probeServerFileDurations(tracks: any[]): Promise<void> {
  const promises = tracks
    .filter((t) => t?.audioUrl && !durationCache.has(t.audioUrl))
    .map((t) => probeOne(t.audioUrl));
  await Promise.allSettled(promises);
}

function probeOne(url: string): Promise<void> {
  if (inflightProbes.has(url)) return inflightProbes.get(url)!;
  const p = new Promise<void>((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = url;
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoad);
      audio.removeEventListener('error', onError);
      inflightProbes.delete(url);
      resolve();
    };
    const onLoad = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        durationCache.set(url, audio.duration);
      }
      cleanup();
    };
    const onError = () => cleanup();
    audio.addEventListener('loadedmetadata', onLoad);
    audio.addEventListener('error', onError);
    // Timeout after 8s
    setTimeout(cleanup, 8000);
  });
  inflightProbes.set(url, p);
  return p;
}

export function getCachedDuration(url: string): string | null {
  const sec = durationCache.get(url);
  if (!sec || !isFinite(sec)) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function clearDurationCache(): void {
  durationCache.clear();
}