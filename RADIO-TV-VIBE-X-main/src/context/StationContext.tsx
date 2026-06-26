import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { Product, DJ, ScheduleEntry, StreamSource, Track, ChatMessage, VisualAsset, VisualGroup } from '../types';
import { rtdb, presenceRef, onlineCountRef, onDisconnect, onValue, set, remove, get, auth } from '../firebaseConfig';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs } from '../firebaseConfig';

interface StationContextType {
  products: Product[];
  djs: DJ[];
  schedule: ScheduleEntry[];
  streamSource: StreamSource;
  playlist: Track[];
  isLoading: boolean;
  updateProducts: (products: Product[]) => void;
  updateDJs: (djs: DJ[]) => void;
  updateSchedule: (schedule: ScheduleEntry[]) => void;
  updateStreamSource: (source: StreamSource) => void;
  updatePlaylist: (playlist: Track[]) => void;
  walletAddress: string | null;
  walletNetwork: string | null;
  walletBalance: string | null;
  walletConnecting: boolean;
  walletError: string | null;
  donorTier: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendNativeDonation: (toAddress: string, amountEth: string) => Promise<string>;
  setDonorTier: (tier: string) => void;
  wallets: any[];
  updateWallets: (wallets: any[]) => void;

  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTrackIndex: number;
  volume: number;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  votes: Record<string, number>;
  upvoteTrack: (trackId: string) => void;
  downvoteTrack: (trackId: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: string, user: string, color: string, avatar?: string) => void;

  // Mood-based playback
  activeMood: 'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | 'jungle-dnb' | 'house' | 'trance' | 'alternative' | 'jazz' | 'lounge' | 'blues' | 'mc-theme' | 'eighties-nineties-2000s' | 'chill' | null;
  setActiveMood: (mood: 'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | 'jungle-dnb' | 'house' | 'trance' | 'alternative' | 'jazz' | 'lounge' | 'blues' | 'mc-theme' | 'eighties-nineties-2000s' | 'chill' | null) => void;
  moodedPlaylist: Track[];
  /** When activeMood has a folder override, this is true while tracks are loading */
  moodFolderLoading: boolean;
  /** The folder override for the current active mood (if any) — for UI hints */
  activeMoodOverride: { serverId: 'mac' | 'win'; folder: string; label: string } | null;

  // DJ Shuffle mode
  shuffleMode: boolean;
  toggleShuffle: () => void;

  // Live stream state
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  autoStreamMode: boolean;
  setAutoStreamMode: (auto: boolean) => void;
  currentStreamUrl: string | null;

  // Real-time listener count (admin-only)
  listenerCount: number;

  // Visual assets (logos, banners, video loops, thumbnails) — play on top of audio
  visuals: VisualAsset[];
  visualGroups: VisualGroup[];
  activeVisualGroup: VisualGroup | null;
  setActiveVisualGroup: (group: VisualGroup | null) => void;

  // ── Commercial / Music Video override ─────────────────────────────────
  // When a commercial or music-video visual is playing, it REPLACES the audio
  // track. `commercialOverride` is the VisualAsset currently playing audio.
  // TheWindow renders this fullscreen with sound; the music <audio> is paused.
  commercialOverride: VisualAsset | null;
  setCommercialOverride: (v: VisualAsset | null) => void;
  triggerCommercial: (visualId: string) => Promise<void>;
}
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_DJS: DJ[] = [];
const INITIAL_SCHEDULE: ScheduleEntry[] = [];

// INITIAL_PLAYLIST intentionally empty — audio is sourced from the Mac music
// server (`/Users/333e/Desktop/VIBE-X/Music/`) and Server 2 (Windows) via
// `MOOD_FOLDER_OVERRIDES` below. No more dead `/music_mp3/...` URLs.
const INITIAL_PLAYLIST: Track[] = [];

// Mood → server folder mapping. ALL moods now map to a server folder so the
// user hears music the moment they click a mood. Server 2 (Windows) is the
// primary when configured (chill, 80/90/2000); Mac server is primary for the
// other moods, with `macFallback` kicking in if Server 2 returns 0.
export const MOOD_FOLDER_OVERRIDES: Record<string, { serverId: 'mac' | 'win'; folder: string; label: string; macFallback?: string }> = {
  // Base moods — Mac server folders. These are the local genres under
  // /Users/333e/Desktop/VIBE-X/Music/. dnb-jungle has 91 files; the other
  // smaller genres fall back to Mac "all/" if the named folder is empty.
  'jungle-dnb':  { serverId: 'mac', folder: 'dnb-jungle',  label: 'Jungle-DnB' },
  'house':       { serverId: 'win', folder: 'HOUSE',       label: 'House' },
  'trance':      { serverId: 'mac', folder: 'trance',      label: 'Trance',     macFallback: 'all' },
  'alternative': { serverId: 'mac', folder: 'rock-alternative', label: 'Alternative', macFallback: 'all' },
  'jazz':        { serverId: 'mac', folder: 'lounge',      label: 'Jazz',       macFallback: 'all' },
  'lounge':      { serverId: 'win', folder: 'LOUNGE',      label: 'Lounge' },
  'blues':       { serverId: 'mac', folder: 'all',         label: 'Blues' },
  'mc-theme':    { serverId: 'mac', folder: 'all',         label: 'M&C Theme' },
  // 80 / 90 / 2000 — Server 2 (Windows) "80's90's 2000" folder, 71 files
  'eighties-nineties-2000s': { serverId: 'win', folder: "80's90's 2000", label: '80 / 90 / 2000' },
  // Image — Server 2 (Windows) "chill" folder. Button label is "Image" but
  // the underlying folder is Windows's "chill/" on Server 2 (100.93.40.31:344,
  // proxied via Mac Tailscale Funnel). Mac fallback: "all/" so users still
  // hear music if Server 2 is unreachable.
  'chill': { serverId: 'win', folder: 'chill', label: 'Image', macFallback: 'all' },
};

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [djs, setDjs] = useState<DJ[]>(INITIAL_DJS);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(INITIAL_SCHEDULE);
  const [streamSource, setStreamSource] = useState<StreamSource>({ id: '1', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lines-moving-in-the-dark-31422-large.mp3', type: 'video', isActive: true });
  const [playlist, setPlaylist] = useState<Track[]>(INITIAL_PLAYLIST);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visuals, setVisuals] = useState<VisualAsset[]>([]);
  const [visualGroups, setVisualGroups] = useState<VisualGroup[]>([]);
  const [activeVisualGroup, setActiveVisualGroup] = useState<VisualGroup | null>(null);
  const [commercialOverride, setCommercialOverride] = useState<VisualAsset | null>(null);

  // Trigger a commercial by id — looks up in visuals, sets commercialOverride.
  // TheWindow watches this and renders the video fullscreen with sound.
  // The audio player (GlobalAudioPlayer) is paused while override is active.
  const triggerCommercial = async (visualId: string) => {
    const v = visuals.find((x) => x.id === visualId);
    if (!v) {
      console.warn('[Commercial] Visual not found:', visualId);
      return;
    }
    if (v.audioMode !== 'replace' && v.type !== 'commercial' && !v.isCommercial) {
      console.warn('[Commercial] Visual not configured for audio replace:', v.name);
    }
    setCommercialOverride(v);
  };

  // User States
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [donorTierState, setDonorTierState] = useState<string | null>(null);

  // Global Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(80);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Mood-based playback
  const [activeMood, setActiveMood] = useState<'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | 'jungle-dnb' | 'house' | 'trance' | 'alternative' | 'jazz' | 'lounge' | 'blues' | 'mc-theme' | 'eighties-nineties-2000s' | null>(null);

  // When the active mood has a folder override, we load tracks from that
  // server folder instead of filtering Firestore by mood. `null` means
  // "no override active, fall back to Firestore filter".
  const [moodFolderTracks, setMoodFolderTracks] = useState<Track[] | null>(null);
  const [moodFolderLoading, setMoodFolderLoading] = useState(false);

  // DJ Shuffle mode
  const [shuffleMode, setShuffleMode] = useState(true);
  const recentTracks = useRef<string[]>([]); // last 3 played to avoid repeat

  // The folder override for the active mood (if any). Drives loading + UI hints.
  const activeMoodOverride = activeMood ? (MOOD_FOLDER_OVERRIDES[activeMood] || null) : null;

  // Computed mooded playlist. When the active mood has a folder override,
// use the server-folder tracks (not Firestore). Otherwise filter Firestore.
  const moodedPlaylist = useMemo(() => {
    if (!activeMood) return playlist;
    if (moodFolderTracks !== null) return moodFolderTracks;
    return playlist.filter((t) => t.mood === activeMood);
  }, [activeMood, playlist, moodFolderTracks]);

  // When activeMood changes, fetch folder override tracks if needed AND
  // force-restart playback from index 0 so the user gets sound immediately.
  useEffect(() => {
    let cancelled = false;
    if (!activeMood) {
      setMoodFolderTracks(null);
      setMoodFolderLoading(false);
      return;
    }
    const override = MOOD_FOLDER_OVERRIDES[activeMood];
    if (!override) {
      setMoodFolderTracks(null);
      setMoodFolderLoading(false);
      // No override — moodedPlaylist will filter Firestore by mood. Reset to
      // top of that filtered list and ensure playback is unpaused so the user
      // hears something the moment they pick a mood.
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      return;
    }
    setMoodFolderLoading(true);
    (async () => {
      try {
        const { fetchServerFolder, serverFileToTrack } = await import('../services/serverConfig');
        let files = await fetchServerFolder(override.serverId, override.folder);
        let resolvedServerId = override.serverId;
        let resolvedFolder = override.folder;
        // Fallback: if primary server returned 0 tracks (offline, CORS block,
        // stale heartbeat), try the Mac server fallback folder so the user
        // still hears music immediately. This prevents the "click mood →
        // silent" failure mode.
        if (files.length === 0 && override.macFallback) {
          console.warn(`[VIBE-X] Mood ${activeMood}: ${override.serverId}/${override.folder} returned 0, trying Mac fallback ${override.macFallback}`);
          const macFiles = await fetchServerFolder('mac', override.macFallback);
          if (macFiles.length > 0) {
            files = macFiles;
            resolvedServerId = 'mac';
            resolvedFolder = override.macFallback;
            console.log(`[VIBE-X] Mood ${activeMood}: Mac fallback loaded ${macFiles.length} tracks`);
          }
        }
        if (cancelled) return;
        const tracks = files.map((f, i) => ({
          ...serverFileToTrack(f, i),
          mood: activeMood,
          genre: override.label,
        }));
        console.log(`[VIBE-X] Mood override: loaded ${tracks.length} tracks from ${resolvedServerId}/${resolvedFolder}`);
        setMoodFolderTracks(tracks as any);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      } catch (e) {
        console.error('[VIBE-X] mood folder override fetch failed:', e);
        if (!cancelled) setMoodFolderTracks([]);
      } finally {
        if (!cancelled) setMoodFolderLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeMood]);

  // Live stream state
  const [isLive, setIsLive] = useState(false);
  const [autoStreamMode, setAutoStreamMode] = useState(true); // auto-detect YouTube live
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);

  const chatInitialized = useRef(false);

  // Real-time listener presence tracking via Firebase Realtime Database
  const [listenerCount, setListenerCount] = useState(0);
  const listenerSessionId = useRef<string | null>(null);
  const registeredRef = useRef(false); // prevent double-increment

  // Register as active listener using RTDB with auto-cleanup on disconnect
  const registerListener = async () => {
    if (!listenerSessionId.current) {
      listenerSessionId.current = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    const sessionId = listenerSessionId.current;

    try {
      const myRef = presenceRef(sessionId);
      await set(myRef, {
        email: null,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      });

      // Auto-cleanup when browser tab closes or disconnects
      const disconnect = onDisconnect(myRef);
      disconnect.remove();

      // Only increment count once per session (not on every visibility change)
      if (!registeredRef.current) {
        registeredRef.current = true;
        const countRef = onlineCountRef();
        const snap = await get(countRef);
        const current = snap.val() || 0;
        await set(countRef, current + 1);
      }
    } catch (e) {
      console.error('Failed to register presence:', e);
    }
  };

  // Heartbeat to keep presence alive
  const sendListenerHeartbeat = async () => {
    if (!listenerSessionId.current) return;
    try {
      const myRef = presenceRef(listenerSessionId.current);
      await set(myRef, {
        email: null,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      });
    } catch (e) {
      // Session lost, re-register
      registeredRef.current = false;
      await registerListener();
    }
  };

  // Remove listener on disconnect
  const removeListener = async () => {
    if (!listenerSessionId.current) return;
    const sessionId = listenerSessionId.current;

    try {
      const myRef = presenceRef(sessionId);
      await remove(myRef);

      // Decrement count using get (not onValue) to avoid lingering listeners
      if (registeredRef.current) {
        registeredRef.current = false;
        const countRef = onlineCountRef();
        const snap = await get(countRef);
        const current = snap.val() || 0;
        await set(countRef, Math.max(0, current - 1));
      }
    } catch (e) {
      console.error('Failed to remove presence:', e);
    }
    listenerSessionId.current = null;
  };

  // Real-time chat listener via Firestore
  useEffect(() => {
    if (chatInitialized.current) return;
    chatInitialized.current = true;

    let unsubscribe: (() => void) | null = null;

    const subscribeToChat = () => {
      try {
        const chatRef = collection(db, 'vibe_x_chat');
        const q = query(chatRef, orderBy('timestamp', 'asc'), limit(100));

        unsubscribe = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snapshot) => {
            const isMetadataOnly = snapshot.metadata.fromCache && snapshot.docChanges().every(c => c.type === 'metadata');
            if (isMetadataOnly) {
              console.log('[Chat] Metadata-only snapshot, skipping render');
              return;
            }
            const messages = snapshot.docs.map(doc => {
              const d = doc.data();
              console.log('[Chat] Doc', doc.id, '→ user:', d.user, '| msg:', d.message?.slice(0, 20));
              return {
                id: doc.id,
                user: d.user || 'Anonymous',
                message: d.message || '',
                color: d.color || 'text-white/70',
                timestamp: d.timestamp?.toMillis() || Date.now(),
                avatar: d.avatar || undefined
              };
            });
            console.log('[Chat] Setting', messages.length, 'messages, first user:', messages[0]?.user);
            setChatMessages(messages);
          },
          (error) => {
            console.error('[Chat] Firestore listener error:', error.code, error.message);
            // Show mock messages as fallback
            setChatMessages([
              { id: '1', user: "TechnoPanda", message: "That drop was insane! 🔥", color: "text-neon-blue", timestamp: Date.now() - 50000 },
              { id: '2', user: "JungleQueen", message: "Big ups from London 🇬🇧", color: "text-neon-pink", timestamp: Date.now() - 40000 },
              { id: '3', user: "BassHead", message: "Track ID please??", color: "text-neon-green", timestamp: Date.now() - 30000 },
              { id: '4', user: "VibeMaster", message: "Lounge vibes are perfect for tonight.", color: "text-white/70", timestamp: Date.now() - 20000 },
              { id: '5', user: "DnB_Lover", message: "DnB all day every day!", color: "text-neon-blue", timestamp: Date.now() - 10000 },
            ]);
          }
        );
      } catch (error) {
        console.error('[Chat] Failed to initialize chat listener:', error);
        setChatMessages([
          { id: '1', user: "TechnoPanda", message: "That drop was insane! 🔥", color: "text-neon-blue", timestamp: Date.now() - 50000 },
          { id: '2', user: "JungleQueen", message: "Big ups from London 🇬🇧", color: "text-neon-pink", timestamp: Date.now() - 40000 },
          { id: '3', user: "BassHead", message: "Track ID please??", color: "text-neon-green", timestamp: Date.now() - 30000 },
          { id: '4', user: "VibeMaster", message: "Lounge vibes are perfect for tonight.", color: "text-white/70", timestamp: Date.now() - 20000 },
          { id: '5', user: "DnB_Lover", message: "DnB all day every day!", color: "text-neon-blue", timestamp: Date.now() - 10000 },
        ]);
      }
    };


    subscribeToChat();

    // Reconnect on network recovery
    const handleOnline = () => {
      console.log('[Chat] Network online, reinitializing Firestore listener...');
      if (unsubscribe) unsubscribe();
      chatInitialized.current = false; // reset so it re-subscribes
      subscribeToChat();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Listener presence system using Firebase Realtime Database
  useEffect(() => {
    let unsubscribeCount: (() => void) | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const initListener = async () => {
      // Register as listener (RTDB with auto-disconnect)
      await registerListener();

      // Send heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        sendListenerHeartbeat();
      }, 30000);

      // Subscribe to online count directly from RTDB
      const countRef = onlineCountRef();
      unsubscribeCount = onValue(countRef, (snapshot) => {
        setListenerCount(snapshot.val() || 0);
      });
    };

    initListener();

    // Cleanup on unmount or visibility change
    const handleUnload = () => removeListener();
    const handleVisibilityChange = () => {
      if (document.hidden) removeListener();
      else registerListener();
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      removeListener();
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (unsubscribeCount) unsubscribeCount();
    };
  }, []);

  const toggleShuffle = () => setShuffleMode(prev => !prev);

  const nextTrack = () => {
    if (moodedPlaylist.length === 0) return;
    if (!shuffleMode) {
      setCurrentTrackIndex((prev) => (prev + 1) % moodedPlaylist.length);
      return;
    }
    // DJ shuffle: pick random track, avoid last 3 played
    const pool = moodedPlaylist.map((_, i) => i).filter(i => !recentTracks.current.includes(moodedPlaylist[i]?.id));
    const targetPool = pool.length > 0 ? pool : playlist.map((_, i) => i);
    const nextIdx = targetPool[Math.floor(Math.random() * targetPool.length)];
    const nextId = playlist[nextIdx]?.id;
    recentTracks.current = [...recentTracks.current.filter(id => id !== nextId), nextId].slice(-3);
    setCurrentTrackIndex(nextIdx);
  };

  // ── Auto-commercial scheduler ────────────────────────────────────────
  // Counter increments on each track change. If it hits a multiple of any
  // commercial's commercialEveryNTracks, fire that commercial.
  // (Note: simplest implementation — fires after every Nth track; doesn't
  // weight by multiple commercials. Good enough for V1.)
  const tracksSinceLastCommercial = useRef(0);
  useEffect(() => {
    if (commercialOverride) return; // don't double-fire
    tracksSinceLastCommercial.current += 1;
    const n = tracksSinceLastCommercial.current;
    // Find all visuals with commercialEveryNTracks > 0 whose multiple matches
    const due = visuals.find((v) =>
      (v.commercialEveryNTracks ?? 0) > 0 && n % v.commercialEveryNTracks === 0
    );
    if (due) {
      console.info('[Auto-Commercial] Firing after', n, 'tracks:', due.name);
      triggerCommercial(due.id);
      tracksSinceLastCommercial.current = 0;
    }
  }, [currentTrackIndex]);
  // Note: depends on currentTrackIndex only. `visuals`/`triggerCommercial` are
  // stable refs via useCallback closures; this is intentional.

  const upvoteTrack = (trackId: string) => {
    setVotes(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 }));
  };

  const downvoteTrack = (trackId: string) => {
    setVotes(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) - 1 }));
  };

  const addChatMessage = async (message: string, user: string, color: string, avatar?: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user,
      message,
      color,
      timestamp: Date.now(),
      avatar
    };

    // Optimistically add to local state
    setChatMessages(prev => [...prev, newMessage]);

    // Sync to Firestore
    try {
      const chatRef = collection(db, 'vibe_x_chat');
      await addDoc(chatRef, {
        message,
        user,
        color,
        timestamp: serverTimestamp(),
        avatar: avatar || null
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
      // Message already in local state, good enough for now
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Web3 wallet — talks to window.ethereum (MetaMask, Rabby, Coinbase Wallet,
  // Phantom EVM mode, etc.). If no wallet is installed, falls back to the
  // manual address paste flow so the existing UI keeps working.
  // ──────────────────────────────────────────────────────────────────────────
  const NETWORK_NAMES: Record<string, string> = {
    '0x1': 'Ethereum',
    '0x89': 'Polygon',
    '0xa4b1': 'Arbitrum',
    '0x2105': 'Base',
    '0xa': 'Optimism',
    '0x38': 'BNB Smart Chain',
    '0xe708': 'Linea',
    '0x138de': 'Berachain',
  };

  const isMetaMaskAvailable = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum;
  };

  const refreshWalletInfo = async (addr: string) => {
    try {
      const eth = (window as any).ethereum;
      const chainId: string = await eth.request({ method: 'eth_chainId' });
      setWalletNetwork(NETWORK_NAMES[chainId] || `Chain ${parseInt(chainId, 16)}`);
      const balHex: string = await eth.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      const wei = BigInt(balHex);
      const ethBal = Number(wei) / 1e18;
      setWalletBalance(ethBal.toFixed(4));
    } catch (e) {
      // Non-fatal — balance display is a nice-to-have
      setWalletBalance(null);
    }
  };

  const connectWallet = async () => {
    setWalletError(null);
    // Try MetaMask / window.ethereum first
    if (isMetaMaskAvailable()) {
      setWalletConnecting(true);
      try {
        const eth = (window as any).ethereum;
        const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);
          localStorage.setItem('vibe_x_wallet', addr);
          localStorage.setItem('vibe_x_wallet_source', 'metamask');
          await refreshWalletInfo(addr);
          // Listen for account / chain changes
          if (eth.on) {
            eth.on('accountsChanged', (newAccounts: string[]) => {
              const next = newAccounts[0] || null;
              setWalletAddress(next);
              if (next) localStorage.setItem('vibe_x_wallet', next);
              else localStorage.removeItem('vibe_x_wallet');
              setWalletBalance(null);
            });
            eth.on('chainChanged', () => {
              if (walletAddress) refreshWalletInfo(walletAddress);
            });
          }
          return;
        }
      } catch (e: any) {
        if (e?.code === 4001) {
          setWalletError('Connection rejected — open MetaMask and approve the connection.');
        } else {
          setWalletError(`Wallet error: ${e?.message || 'unknown'}`);
        }
      } finally {
        setWalletConnecting(false);
      }
      return;
    }
    // No wallet installed — fall back to manual paste so the rest of the UI works
    const userInput = prompt(
      "No Web3 wallet detected in this browser.\n\n" +
      "Install MetaMask (metamask.io) and refresh, OR paste your wallet address below:"
    );
    if (userInput && userInput.trim().length > 5) {
      setWalletAddress(userInput.trim());
      localStorage.setItem('vibe_x_wallet', userInput.trim());
      localStorage.setItem('vibe_x_wallet_source', 'manual');
    }
  };

  const sendNativeDonation = async (toAddress: string, amountEth: string): Promise<string> => {
    if (!isMetaMaskAvailable()) throw new Error('No Web3 wallet available');
    if (!walletAddress) throw new Error('Connect your wallet first');
    const eth = (window as any).ethereum;
    const chainId: string = await eth.request({ method: 'eth_chainId' });
    // Only allow on EVM-compatible chains
    if (!NETWORK_NAMES[chainId]) throw new Error(`Unsupported network (chain ${parseInt(chainId, 16)}). Switch to Ethereum, Polygon, Base, Arbitrum, Optimism, BNB, Linea, or Berachain.`);
    const wei = BigInt(Math.floor(parseFloat(amountEth) * 1e18)).toString(16);
    const txHash: string = await eth.request({
      method: 'eth_sendTransaction',
      params: [{
        from: walletAddress,
        to: toAddress,
        value: '0x' + wei,
        // data field is optional — could include memo later
      }],
    });
    return txHash;
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletNetwork(null);
    setWalletBalance(null);
    setWalletError(null);
    setDonorTierState(null);
    localStorage.removeItem('vibe_x_wallet');
    localStorage.removeItem('vibe_x_wallet_source');
    localStorage.removeItem('vibe_x_tier');
  };

  // On mount, rehydrate wallet if previously connected via MetaMask
  useEffect(() => {
    const saved = localStorage.getItem('vibe_x_wallet');
    const source = localStorage.getItem('vibe_x_wallet_source');
    if (saved && source === 'metamask' && isMetaMaskAvailable()) {
      setWalletAddress(saved);
      // Try to refresh balance silently (don't trigger popup)
      (window as any).ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts && accounts[0] && accounts[0].toLowerCase() === saved.toLowerCase()) {
          refreshWalletInfo(saved);
        } else {
          // User revoked — disconnect
          disconnectWallet();
        }
      }).catch(() => { /* ignore */ });
    }
  }, []);

  const setDonorTier = (tier: string) => {
    setDonorTierState(tier);
    localStorage.setItem('vibe_x_tier', tier);
  };

  // ============================================================================
  // REALTIME DATA — single source of truth via Firestore onSnapshot.
  // Initial seed: on first load, migrate /playlist.json + /products.json into
  // Firestore so the realtime subs have data to read.
  //
  // PLAYLIST OVERRIDE: when the server-catalog override fires (setPlaylist
  // with `serverFile: true` tracks from /__list), we MUST NOT let the
  // Firestore playlist sub overwrite it. Track which mode we last applied
  // and ignore Firestore playlist updates that happen AFTER override.
  // ============================================================================
  // Ref mirror of the server-catalog-active flag so the Firestore sub's
  // closure (registered once, deps=[]) can read the latest value without
  // re-subscribing every time the flag toggles.
  const serverCatalogActiveRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Seed (idempotent — only writes if collection is empty)
      try {
        const { seedIfEmpty, subscribeProducts, subscribePlaylist, subscribeDJs, subscribeSchedule, subscribeStream, subscribeVisuals, subscribeVisualGroups } = await import('../services/dataSource');
        const seedResult = await seedIfEmpty();
        if (seedResult.seededPlaylist > 0) console.log('[VIBE-X] Seeded', seedResult.seededPlaylist, 'tracks to Firestore');
        if (seedResult.seededProducts > 0) console.log('[VIBE-X] Seeded', seedResult.seededProducts, 'products to Firestore');
        if (cancelled) return;
        // 2. Subscribe to realtime updates
        const unsubs = [
          subscribeProducts((items) => { if (!cancelled) { setProducts(items); setIsLoading(false); } }),
          subscribePlaylist((items) => {
            if (cancelled) return;
            // Don't overwrite a server-catalog playlist. Firestore is the
            // generic library; the server's /__list has the actual files.
            // setServerCatalogActive controls this gate.
            if (serverCatalogActiveRef.current) {
              console.log('[VIBE-X] Skipping Firestore playlist update (server catalog active,', items.length, 'tracks)');
              return;
            }
            setPlaylist(items);
            setIsLoading(false);
          }),
          subscribeDJs((items) => { if (!cancelled) setDjs(items); }),
          subscribeSchedule((items) => { if (!cancelled) setSchedule(items); }),
          subscribeStream((item) => { if (!cancelled && item) setStreamSource(item); }),
          subscribeVisuals((items) => { if (!cancelled) setVisuals(items); }),
          subscribeVisualGroups((items) => { if (!cancelled) setVisualGroups(items); }),
        ];
        // 3. Cleanup on unmount
        (window as any).__vibex_unsub = () => unsubs.forEach((u) => u());
      } catch (e) {
        console.error('[VIBE-X] dataSource init failed:', e);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      const u = (window as any).__vibex_unsub;
      if (u) { u(); (window as any).__vibex_unsub = null; }
    };
  }, []);

  // ============================================================================
  // SERVER CATALOG OVERRIDE — when picker is set to a specific local server
  // ('mac' or 'win'), REPLACE the Firestore catalog with the server's actual
  // files. The Firestore playlist has 77 tracks whose filenames DON'T match
  // what's on the local server (e.g. Windows has 4 MP4s with totally
  // different names). Fetching Server 2's /__list gives the real files.
  //
  // This runs on musicMode changes AND keeps `playlist` in sync.
  // ============================================================================
  useEffect(() => {
    let cancelled = false;
    let lastMode: string | null = null;
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { subscribe: subscribeConfig, fetchServerCatalog, serverFileToTrack } = await import('../services/serverConfig');

        // Immediate check — handle the case where localStorage already has
        // musicMode = 'win' or Firestore had it pre-set
        const applyForMode = async (mode: string) => {
          if (cancelled) return;
          if (mode !== 'mac' && mode !== 'win') {
            serverCatalogActiveRef.current = false;
            return;
          }
          if (mode === lastMode && serverCatalogActiveRef.current) return; // already loaded
          lastMode = mode;
          const files = await fetchServerCatalog(mode as 'mac' | 'win');
          if (cancelled) return;
          if (files.length === 0) {
            console.warn(`[VIBE-X] Server ${mode} returned 0 files`);
            serverCatalogActiveRef.current = false;
            return;
          }
          const tracks = files.map((f, i) => serverFileToTrack(f, i));
          console.log(`[VIBE-X] Loaded ${tracks.length} tracks from ${mode} server (overriding Firestore catalog)`);
          serverCatalogActiveRef.current = true;
          setPlaylist(tracks as any);
          setCurrentTrackIndex(0);
        };

        unsub = subscribeConfig((cfg) => {
          applyForMode(cfg.musicMode);
        });
      } catch (e) {
        console.error('[VIBE-X] serverConfig subscribe failed:', e);
      }
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  // ============================================================================
  // WRITES — all go through dataSource (Firestore).
  // Local state updates first for snappy UI; realtime sub will confirm.
  // ============================================================================
  const handleUpdateProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      const { saveProduct, deleteProduct } = await import('../services/dataSource');
      // Diff: upsert all, delete removed
      const existing: Set<string> = new Set(products.map((p) => p.id));
      const next: Set<string> = new Set(newProducts.map((p) => p.id));
      for (const p of newProducts) await saveProduct(p);
      for (const id of existing) if (!next.has(id)) await deleteProduct(id);
    } catch (e) { console.error('Failed to save products', e); }
  };

  const handleUpdateDjs = async (newDjs: DJ[]) => {
    setDjs(newDjs);
    try {
      const { saveDJ } = await import('../services/dataSource');
      for (const d of newDjs) await saveDJ(d);
    } catch (e) { console.error('Failed to save DJs', e); }
  };

  const handleUpdateSchedule = async (newSchedule: ScheduleEntry[]) => {
    setSchedule(newSchedule);
    try {
      const { saveSchedule } = await import('../services/dataSource');
      for (const s of newSchedule) await saveSchedule(s);
    } catch (e) { console.error('Failed to save Schedule', e); }
  };

  const handleUpdateStreamSource = async (newSource: StreamSource) => {
    setStreamSource(newSource);
    try {
      const { saveStream } = await import('../services/dataSource');
      await saveStream(newSource);
    } catch (e) { console.error('Failed to save Stream', e); }
  };

  const handleUpdatePlaylist = async (newPlaylist: Track[]) => {
    setPlaylist(newPlaylist);
    try {
      const { saveTrack, deleteTrack } = await import('../services/dataSource');
      const existing: Set<string> = new Set(playlist.map((t) => t.id));
      const next: Set<string> = new Set(newPlaylist.map((t) => t.id));
      for (const t of newPlaylist) await saveTrack(t);
      for (const id of existing) if (!next.has(id)) await deleteTrack(id);
      console.log('[VIBE-X] Playlist saved to Firestore:', newPlaylist.length, 'tracks');
    } catch (e) {
      console.error('[VIBE-X] Failed to save playlist to Firestore:', e);
    }
  };

  const handleUpdateWallets = async (newWallets: any[]) => {
    setWallets(newWallets);
    try {
      await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWallets)
      });
    } catch (e) { console.error('Failed to sync Wallets', e); }
  };

  return (
    <StationContext.Provider value={{
      products,
      djs,
      schedule,
      streamSource,
      playlist,
      isLoading,
      updateProducts: handleUpdateProducts,
      updateDJs: handleUpdateDjs,
      updateSchedule: handleUpdateSchedule,
      updateStreamSource: handleUpdateStreamSource,
      updatePlaylist: handleUpdatePlaylist,
      walletAddress,
      walletNetwork,
      walletBalance,
      walletConnecting,
      walletError,
      donorTier: donorTierState,
      connectWallet,
      disconnectWallet,
      sendNativeDonation,
      setDonorTier,
      wallets,
      updateWallets: handleUpdateWallets,
      isPlaying,
      setIsPlaying,
      currentTrackIndex,
      volume,
      setVolume,
      nextTrack,
      votes,
      upvoteTrack,
      downvoteTrack,
      chatMessages,
      addChatMessage,
      activeMood,
      setActiveMood,
      moodedPlaylist,
      moodFolderLoading,
      activeMoodOverride,
      shuffleMode,
      toggleShuffle,
      isLive,
      setIsLive,
      autoStreamMode,
      setAutoStreamMode,
      currentStreamUrl,
      listenerCount,
      visuals,
      visualGroups,
      activeVisualGroup,
      setActiveVisualGroup,
      commercialOverride,
      setCommercialOverride,
      triggerCommercial,
    }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
}