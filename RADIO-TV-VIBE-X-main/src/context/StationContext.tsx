import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Product, DJ, ScheduleEntry, StreamSource, Track, ChatMessage } from '../types';
import { rtdb, presenceRef, onlineCountRef, onDisconnect, onValue, set, remove, get } from '../firebaseConfig';
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
  donorTier: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
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
  activeMood: 'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | null;
  setActiveMood: (mood: 'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | null) => void;
  moodedPlaylist: Track[];

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
}

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_DJS: DJ[] = [];
const INITIAL_SCHEDULE: ScheduleEntry[] = [];
const INITIAL_PLAYLIST: Track[] = [
  {
    id: '1',
    title: 'MASSIVE',
    artist: 'Unknown',
    audioUrl: '/music_mp3/MASSIVE.mp3',
    image: '',
    duration: '3:20',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '2',
    title: 'Jungliss',
    artist: 'Unknown',
    audioUrl: '/music_mp3/Jungliss.mp3',
    image: '',
    duration: '3:30',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '3',
    title: 'JOY -404-',
    artist: 'Unknown',
    audioUrl: '/music_mp3/JOY%20-404-.mp3',
    image: '',
    duration: '4:00',
    genre: 'UK Drill',
    mood: 'chilling',
  },
  {
    id: '4',
    title: 'Basstripper - In The City',
    artist: 'Basstripper',
    audioUrl: '/music_mp3/Basstripper%20-%20In%20The%20City.mp3',
    image: '',
    duration: '3:45',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '5',
    title: 'Dillinja - Mystery - Deep Love',
    artist: 'Dillinja',
    audioUrl: '/music_mp3/Dillinja%20-%20Mystery%20-%20Deep%20Love.mp3',
    image: '',
    duration: '4:15',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '6',
    title: 'M-Beat feat. Nazlyn - Sweet Love',
    artist: 'M-Beat feat. Nazlyn',
    audioUrl: '/music_mp3/M-Beat%20feat.%20Nazlyn%20-%20Sweet%20Love.mp3',
    image: '',
    duration: '4:00',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '7',
    title: 'Whiney - Back In Action -feat. Slay-',
    artist: 'Whiney feat. Slay',
    audioUrl: '/music_mp3/Whiney%20-%20Back%20In%20Action%20-feat.%20Slay-.mp3',
    image: '',
    duration: '3:30',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '8',
    title: 'DJ Aphrodite - Stalker -Original Mix-',
    artist: 'DJ Aphrodite',
    audioUrl: '/music_mp3/DJ%20Aphrodite%20-%20Stalker%20-Original%20Mix-.mp3',
    image: '',
    duration: '5:00',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '9',
    title: 'P Money x Whiney - Sorry I-m Not Sorry',
    artist: 'P Money x Whiney',
    audioUrl: '/music_mp3/P%20Money%20x%20Whiney%20-%20Sorry%20I-m%20Not%20Sorry.mp3',
    image: '',
    duration: '3:45',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '10',
    title: 'Degs - Levitate Your Mind -feat. Unglued-',
    artist: 'Degs feat. Unglued',
    audioUrl: '/music_mp3/Degs%20-%20Levitate%20Your%20Mind%20-feat.%20Unglued-.mp3',
    image: '',
    duration: '4:30',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '11',
    title: 'DJ Aphrodite - Rinsing Quince -Slider Mix-',
    artist: 'DJ Aphrodite',
    audioUrl: '/music_mp3/DJ%20Aphrodite%20-%20Rinsing%20Quince%20-Slider%20Mix-.mp3',
    image: '',
    duration: '4:45',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '12',
    title: 'Mark Ruff Ryder feat MC Kie MC Sparks - Joy',
    artist: 'Mark Ruff Ryder feat MC Kie MC Sparks',
    audioUrl: '/music_mp3/Mark%20Ruff%20Ryder%20feat%20MC%20Kie%20MC%20Sparks%20-%20Joy.mp3',
    image: '',
    duration: '4:00',
    genre: 'UK Drill',
    mood: 'chilling',
  },
  {
    id: '13',
    title: 'Cyantific - Dont Follow -feat. Diane Charlemagne',
    artist: 'Cyantific feat. Diane Charlemagne',
    audioUrl: '/music_mp3/Cyantific%20-%20Dont%20Follow%20-feat.%20Diane%20Charlemagne.mp3',
    image: '',
    duration: '4:15',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '14',
    title: 'Tion Wayne - IFTK -Feat. La Roux- -Vibe Chemistry',
    artist: 'Tion Wayne feat. La Roux',
    audioUrl: '/music_mp3/Tion%20Wayne%20-%20IFTK%20-Feat.%20La%20Roux-%20-Vibe%20Chemistry.mp3',
    image: '',
    duration: '3:30',
    genre: 'UK Drill',
    mood: 'chilling',
  },
  {
    id: '15',
    title: 'Ray Keith - Renegade vs Limb By Limb -Aries Remix-',
    artist: 'Ray Keith',
    audioUrl: '/music_mp3/Ray%20Keith%20-%20Renegade%20vs%20Limb%20By%20Limb%20-Aries%20Remix-.mp3',
    image: '',
    duration: '4:00',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '16',
    title: 'Shy FX - Badboy Business -ft. Kate Stewart - Mr. Williamz-',
    artist: 'Shy FX feat. Kate Stewart & Mr. Williamz',
    audioUrl: '/music_mp3/Shy%20FX%20-%20Badboy%20Business%20-ft.%20Kate%20Stewart%20-%20Mr.%20Williamz-.mp3',
    image: '',
    duration: '4:15',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '17',
    title: 'Zed Bias - Pick Up The Pieces -ft. Boudah- -Skeptical Remix-',
    artist: 'Zed Bias feat. Boudah',
    audioUrl: '/music_mp3/Zed%20Bias%20-%20Pick%20Up%20The%20Pieces%20-ft.%20Boudah-%20-Skeptical%20Remix-.mp3',
    image: '',
    duration: '4:00',
    genre: 'Jungle',
    mood: 'chilling',
  },
  {
    id: '18',
    title: 'NuTone - One Day At A Time -feat. Lalin St. Juste-',
    artist: 'NuTone feat. Lalin St. Juste',
    audioUrl: '/music_mp3/NuTone%20-%20One%20Day%20At%20A%20Time%20-feat.%20Lalin%20St.%20Juste-%20Official%20Video.mp3',
    image: '',
    duration: '4:30',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '19',
    title: 'London Elektricity - Tenderless -feat. Emer Dineen- -Whiney Remix-',
    artist: 'London Elektricity feat. Emer Dineen',
    audioUrl: '/music_mp3/London%20Elektricity%20-%20Tenderless%20-feat.%20Emer%20Dineen-%20-Whiney%20Remix-.mp3',
    image: '',
    duration: '4:00',
    genre: 'Liquid DnB',
    mood: 'chilling',
  },
  {
    id: '20',
    title: 'UK Apache with Shy FX - Original Nuttah 25 -Chase - Status Remix ft. Irah-',
    artist: 'UK Apache with Shy FX',
    audioUrl: '/music_mp3/UK%20Apache%20with%20Shy%20FX%20-%20Original%20Nuttah%2025%20-Chase%20-%20Status%20Remix%20ft.%20Irah-.mp3',
    image: '',
    duration: '4:30',
    genre: 'Jungle',
    mood: 'chilling',
  },
];

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [djs, setDjs] = useState<DJ[]>(INITIAL_DJS);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(INITIAL_SCHEDULE);
  const [streamSource, setStreamSource] = useState<StreamSource>({ id: '1', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lines-moving-in-the-dark-31422-large.mp3', type: 'video', isActive: true });
  const [playlist, setPlaylist] = useState<Track[]>(INITIAL_PLAYLIST);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User States
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [donorTierState, setDonorTierState] = useState<string | null>(null);

  // Global Player States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(80);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Mood-based playback
  const [activeMood, setActiveMood] = useState<'relax' | 'working' | 'exercise' | 'home' | 'chilling' | 'getting-ready' | null>(null);

  // DJ Shuffle mode
  const [shuffleMode, setShuffleMode] = useState(false);
  const recentTracks = useRef<string[]>([]); // last 3 played to avoid repeat

  // Computed mooded playlist
  const moodedPlaylist = activeMood ? playlist.filter(t => t.mood === activeMood) : playlist;

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
    if (playlist.length === 0) return;
    if (!shuffleMode) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      return;
    }
    // DJ shuffle: pick random track, avoid last 3 played
    const pool = playlist.map((_, i) => i).filter(i => !recentTracks.current.includes(playlist[i]?.id));
    const targetPool = pool.length > 0 ? pool : playlist.map((_, i) => i);
    const nextIdx = targetPool[Math.floor(Math.random() * targetPool.length)];
    const nextId = playlist[nextIdx]?.id;
    recentTracks.current = [...recentTracks.current.filter(id => id !== nextId), nextId].slice(-3);
    setCurrentTrackIndex(nextIdx);
  };

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

  const connectWallet = () => {
    const userInput = prompt("Enter your Web3 Wallet Address or Vibe-X Supporter ID to connect:");
    if (userInput && userInput.trim().length > 5) {
      setWalletAddress(userInput.trim());
      localStorage.setItem('vibe_x_wallet', userInput.trim());
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setDonorTierState(null);
    localStorage.removeItem('vibe_x_wallet');
    localStorage.removeItem('vibe_x_tier');
  };

  const setDonorTier = (tier: string) => {
    setDonorTierState(tier);
    localStorage.setItem('vibe_x_tier', tier);
  };

  // Load data from Backend (API fallback → static JSON → Firestore → INITIAL)
  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, djRes, schedRes, streamRes, playRes, walletRes] = await Promise.all([
          fetch('/api/products').then(res => res.json()).catch(() => []),
          fetch('/api/djs').then(res => res.json()).catch(() => []),
          fetch('/api/schedule').then(res => res.json()).catch(() => []),
          fetch('/api/stream').then(res => res.json()).catch(() => null),
          fetch('/api/playlist').then(res => res.json()).catch(() => []),
          fetch('/api/wallets').then(res => res.json()).catch(() => []),
        ]);

        if (prodRes && prodRes.length > 0) {
          setProducts(prodRes);
        } else {
          try {
            const staticProdRes = await fetch('/products.json');
            if (staticProdRes.ok) {
              const staticProds = await staticProdRes.json();
              if (staticProds.length > 0) setProducts(staticProds);
            }
          } catch {}
        }
        if (djRes && djRes.length > 0) setDjs(djRes);
        if (schedRes && schedRes.length > 0) setSchedule(schedRes);
        if (streamRes) setStreamSource(streamRes);

        if (playRes && playRes.length > 0) {
          setPlaylist(playRes);
        } else {
          // Fall back to static /playlist.json (hosted on Firebase)
          try {
            const staticRes = await fetch('/playlist.json');
            if (staticRes.ok) {
              const staticData = await staticRes.json();
              if (staticData.length > 0) {
                console.log('[VIBE-X] Loaded', staticData.length, 'tracks from static playlist.json');
                setPlaylist(staticData);
                if (walletRes && walletRes.length > 0) setWallets(walletRes);
                setIsLoading(false);
                return;
              }
            }
          } catch {}

          // Fall back to Firestore
          try {
            const q = query(collection(db, 'vibe_x_playlist'), orderBy('id'));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const fsTracks = snap.docs.map(d => d.data());
              console.log('[VIBE-X] Loaded', fsTracks.length, 'tracks from Firestore');
              setPlaylist(fsTracks);
            }
          } catch (fsErr) {
            console.warn('[VIBE-X] Firestore fallback failed:', fsErr);
          }
        }

        if (walletRes && walletRes.length > 0) setWallets(walletRes);
      } catch (error) {
        console.error('Failed to load station data from backend:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Update functions that also sync to backend
  const handleUpdateProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProducts)
      });
    } catch (e) { console.error('Failed to sync products', e); }
  };

  const handleUpdateDjs = async (newDjs: DJ[]) => {
    setDjs(newDjs);
    try {
      await fetch('/api/djs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDjs)
      });
    } catch (e) { console.error('Failed to sync DJs', e); }
  };

  const handleUpdateSchedule = async (newSchedule: ScheduleEntry[]) => {
    setSchedule(newSchedule);
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });
    } catch (e) { console.error('Failed to sync Schedule', e); }
  };

  const handleUpdateStreamSource = async (newSource: StreamSource) => {
    setStreamSource(newSource);
    try {
      await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      });
    } catch (e) { console.error('Failed to sync Stream', e); }
  };

  const handleUpdatePlaylist = async (newPlaylist: Track[]) => {
    setPlaylist(newPlaylist);
    try {
      await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlaylist)
      });
    } catch (e) { console.error('Failed to sync Playlist', e); }
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
      donorTier: donorTierState,
      connectWallet,
      disconnectWallet,
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
      shuffleMode,
      toggleShuffle,
      isLive,
      setIsLive,
      autoStreamMode,
      setAutoStreamMode,
      currentStreamUrl,
      listenerCount,
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