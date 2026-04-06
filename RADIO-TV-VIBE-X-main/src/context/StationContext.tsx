import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, DJ, ScheduleEntry, StreamSource, Track, ChatMessage } from '../types';

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
  addChatMessage: (msg: string, user: string, color: string) => void;
}

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_DJS: DJ[] = [];
const INITIAL_SCHEDULE: ScheduleEntry[] = [];
const INITIAL_PLAYLIST: Track[] = [];

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [djs, setDjs] = useState<DJ[]>(INITIAL_DJS);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(INITIAL_SCHEDULE);
  const [streamSource, setStreamSource] = useState<StreamSource>({ id: '1', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lines-moving-in-the-dark-31422-large.mp4', type: 'video', isActive: true });
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: "TechnoPanda", message: "That drop was insane! 🔥", color: "text-neon-blue", timestamp: Date.now() - 50000 },
    { id: '2', user: "JungleQueen", message: "Big ups from London 🇬🇧", color: "text-neon-pink", timestamp: Date.now() - 40000 },
    { id: '3', user: "BassHead", message: "Track ID please??", color: "text-neon-green", timestamp: Date.now() - 30000 },
    { id: '4', user: "VibeMaster", message: "Lounge vibes are perfect for tonight.", color: "text-white/70", timestamp: Date.now() - 20000 },
    { id: '5', user: "DnB_Lover", message: "DnB all day every day!", color: "text-neon-blue", timestamp: Date.now() - 10000 },
  ]);

  const nextTrack = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const upvoteTrack = (trackId: string) => {
    setVotes(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 }));
  };

  const downvoteTrack = (trackId: string) => {
    setVotes(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) - 1 }));
  };

  const addChatMessage = (message: string, user: string, color: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user,
      message,
      color,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
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

  // Load data from Backend
  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, djRes, schedRes, streamRes, playRes, walletRes] = await Promise.all([
          fetch('/api/products').then(res => res.json()),
          fetch('/api/djs').then(res => res.json()),
          fetch('/api/schedule').then(res => res.json()),
          fetch('/api/stream').then(res => res.json()),
          fetch('/api/playlist').then(res => res.json()),
          fetch('/api/wallets').then(res => res.json()),
        ]);

        if (prodRes && prodRes.length > 0) setProducts(prodRes);
        if (djRes && djRes.length > 0) setDjs(djRes);
        if (schedRes && schedRes.length > 0) setSchedule(schedRes);
        if (streamRes) setStreamSource(streamRes);
        if (playRes && playRes.length > 0) setPlaylist(playRes);
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
