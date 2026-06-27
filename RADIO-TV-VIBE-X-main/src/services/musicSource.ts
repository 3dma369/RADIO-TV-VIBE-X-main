/**
 * musicSource.ts — VIBE-X
 *
 * Resolves playable audio URLs for tracks. Routes Mac server, Windows Server 2,
 * and Tailscale Funnel through a single proxy-aware resolver.
 */

import { Track } from '../types';

// ─── Server health / status ────────────────────────────────────────────────
export type MusicServerHealth = {
  server: 'mac' | 'win' | 'unknown';
  ok: boolean;
  folderCount?: number;
  message?: string;
  latencyMs?: number;
};

let lastHealth: MusicServerHealth | null = null;

export async function musicServerHealthCheck(): Promise<MusicServerHealth> {
  const start = Date.now();
  try {
    const res = await fetch('https://333es-mac-mini.tail2d0ad9.ts.net/music/__list/', { method: 'GET' });
    if (!res.ok) {
      lastHealth = { server: 'mac', ok: false, message: `HTTP ${res.status}` };
      return lastHealth;
    }
    const data = await res.json();
    lastHealth = {
      server: 'mac',
      ok: true,
      folderCount: (data.items || []).filter((i: any) => i.type === 'folder').length,
      latencyMs: Date.now() - start,
    };
    return lastHealth;
  } catch (e: any) {
    lastHealth = { server: 'unknown', ok: false, message: String(e?.message || e) };
    return lastHealth;
  }
}

export function getLastMusicHealth(): MusicServerHealth | null {
  return lastHealth;
}

// ─── URL resolution ────────────────────────────────────────────────────────
const MAC_BASE_LOCAL = 'http://localhost:344';
const MAC_BASE_FUNNEL = 'https://333es-mac-mini.tail2d0ad9.ts.net/music';
const WIN_BASE_FUNNEL = 'https://333es-mac-mini.tail2d0ad9.ts.net/win';

function getMacBase(): string {
  // Prefer Funnel (works from phone), fall back to local
  return typeof window !== 'undefined' ? MAC_BASE_FUNNEL : MAC_BASE_LOCAL;
}

function getWinBase(): string {
  return WIN_BASE_FUNNEL;
}

const urlCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL_MS = 60_000;

export interface ResolvedAudio {
  audioUrl: string;
  videoUrl?: string | null;
  source: 'mac' | 'win' | 'firestore' | 'youtube' | 'unknown';
  cached: boolean;
}

/**
 * Resolves the playable audio URL for a track. Caches per track ID for 60s.
 * Tries in order: serverFile audioUrl → serverFile path via Mac/Win servers
 * → Firestore audioUrl → YouTube videoId → empty.
 */
export async function resolveAudioUrlCached(track: Track): Promise<ResolvedAudio> {
  if (!track) {
    return { audioUrl: '', source: 'unknown', cached: false };
  }
  const cacheKey = track.id || track.audioUrl || track.title;
  const now = Date.now();
  const cached = urlCache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return { audioUrl: cached.url, source: track.serverFile ? (track as any).serverId || 'mac' : 'firestore', cached: true };
  }

  const result = await resolveAudioUrl(track);
  if (result.audioUrl) {
    urlCache.set(cacheKey, { url: result.audioUrl, ts: now });
  }
  return result;
}

export async function resolveAudioUrl(track: Track): Promise<ResolvedAudio> {
  if (!track) return { audioUrl: '', source: 'unknown', cached: false };

  // 1. Direct audioUrl already set (Firestore track or pre-resolved)
  if (track.audioUrl && /^https?:\/\//.test(track.audioUrl)) {
    return {
      audioUrl: track.audioUrl,
      videoUrl: track.videoUrl,
      source: track.serverFile ? (track as any).serverId || 'mac' : 'firestore',
      cached: false,
    };
  }

  // 2. Server file: relative URL on a server folder
  if ((track as any).serverFile && (track as any).relativePath) {
    const serverId = (track as any).serverId || 'mac';
    const base = serverId === 'win' ? getWinBase() : getMacBase();
    const rel = (track as any).relativePath;
    const fullUrl = rel.startsWith('http') ? rel : `${base}${rel.startsWith('/') ? '' : '/'}${rel}`;
    return { audioUrl: fullUrl, videoUrl: track.videoUrl, source: serverId as any, cached: false };
  }

  // 3. YouTube videoId
  if (track.videoId) {
    // Direct audio extraction requires a backend; for now mark as missing
    return { audioUrl: '', videoUrl: `https://www.youtube.com/embed/${track.videoId}`, source: 'youtube', cached: false };
  }

  return { audioUrl: '', source: 'unknown', cached: false };
}

export function clearMusicCache(): void {
  urlCache.clear();
}

// ─── Internal: validate Mac/Win server endpoints ────────────────────────────
export function pickHttpsHost(): 'mac' | 'win' {
  return 'mac';
}