import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Volume2, Users, MessageSquare, Share2, Disc, ThumbsUp, ThumbsDown, X, Zap, Coffee, Dumbbell, Home, Glasses, Clock, Radio, Wifi, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils';
import TheWindow from './TheWindow';
import NewsletterSignup from './NewsletterSignup';

import { useStation } from '../context/StationContext';
import { useAuth } from '../context/AuthContext';
import { probeServerFileDurations, getCachedDuration } from '../services/serverConfig';

const MOODS = [
  // ── Working first: real folders with actual content ────────────────
  { id: 'jungle-dnb',  label: 'Jungle-DnB', icon: Disc, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', activeColor: 'bg-blue-500', description: 'Mac server · jungle-dnb/' },
  { id: 'house',       label: 'House',      icon: Disc, color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30', activeColor: 'bg-yellow-500', description: 'Server 2 · HOUSE/' },
  { id: 'lounge',      label: 'Lounge',     icon: Disc, color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30', activeColor: 'bg-amber-500', description: 'Server 2 · LOUNGE/' },
  { id: 'eighties-nineties-2000s', label: '80 / 90 / 2000', icon: Disc, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30', activeColor: 'bg-pink-500', description: 'Server 2 · 80\'s90\'s 2000/' },
  { id: 'chill',       label: 'Chill',       icon: Disc, color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30', activeColor: 'bg-sky-500', description: 'Server 2 · chill/' },
  // ── Mac-fallback last: no dedicated Server 2 folder, falls back to Mac all/ ──
  { id: 'trance',      label: 'Trance',     icon: Disc, color: 'from-red-500/20 to-pink-500/20 border-red-500/30', activeColor: 'bg-red-500', description: 'Mac server · trance/' },
  { id: 'alternative', label: 'Alternative', icon: Disc, color: 'from-green-500/20 to-emerald-500/20 border-green-500/30', activeColor: 'bg-green-500', description: 'Mac server · all/' },
  { id: 'jazz',        label: 'Jazz',       icon: Disc, color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30', activeColor: 'bg-purple-500', description: 'Mac server · lounge/' },
  { id: 'blues',       label: 'Blues',      icon: Disc, color: 'from-neon-green/20 to-neon-blue/20 border-neon-green/30', activeColor: 'bg-neon-green', description: 'Mac server · all/' },
  { id: 'mc-theme',    label: 'M&C Theme',  icon: Disc, color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30', activeColor: 'bg-orange-500', description: 'Movie & cartoon theme songs' },
] as const;

type MoodId = typeof MOODS[number]['id'];

function LiveStreamPlayer() {
  const { streamSource, isLive, setIsLive } = useStation();
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    if (streamSource.youtubeVideoId) {
      setYoutubeVideoId(streamSource.youtubeVideoId);
      setEmbedUrl(`https://www.youtube.com/embed/${streamSource.youtubeVideoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${streamSource.youtubeVideoId}`);
    }
  }, [streamSource.youtubeVideoId]);

  if (!isLive) return null;

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden glass group flex items-center justify-center bg-black">
      {embedUrl ? (
        <iframe
          className="w-full h-full"
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : streamSource.url ? (
        <video
          src={streamSource.url}
          className="w-full h-full object-cover opacity-80"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-white/40">
          <Radio className="w-16 h-16 animate-pulse" />
          <p className="text-sm font-mono uppercase tracking-widest">Waiting for live signal...</p>
        </div>
      )}

      {/* Live badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-white text-[10px] font-bold uppercase tracking-widest">🔴 LIVE</span>
      </div>

      {/* YouTube link badge */}
      {youtubeVideoId && (
        <a
          href={`https://youtu.be/${youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
        >
          Watch on YouTube ↗
        </a>
      )}

      {/* Turn off live */}
      <button
        onClick={() => setIsLive(false)}
        className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-white/60 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all flex items-center gap-1.5"
      >
        <X className="w-3 h-3" /> Back to Playlist
      </button>
    </div>
  );
}

function MoodSelector() {
  const { activeMood, setActiveMood, playlist } = useStation();
  const [showInfo, setShowInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const activeMoodData = MOODS.find(m => m.id === activeMood);
  const moodTrackCount = activeMood ? playlist.filter(t => t.mood === activeMood).length : 0;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold uppercase tracking-widest text-xs text-white/50">Play by Mood</h3>
          {activeMoodData && (
            <p className="text-[10px] text-white/30 mt-0.5">{activeMoodData.description} — {moodTrackCount} tracks</p>
          )}
        </div>
        </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll moods left"
            className="absolute left-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-black/80 via-black/40 to-transparent hover:from-black/90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll moods right"
            className="absolute right-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-black/80 via-black/40 to-transparent hover:from-black/90 transition-all animate-pulse"
          >
            <ChevronRight className="w-5 h-5 text-white/80" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth vibe-mood-scroll"
        >
        {MOODS.map((mood) => {
          const isActive = activeMood === mood.id;
          const trackCount = playlist.filter(t => t.mood === mood.id).length;
          return (
            <button
              key={mood.id}
              onClick={() => {
                setActiveMood(isActive ? null : mood.id);
                setShowInfo(true);
                setTimeout(() => setShowInfo(false), 2000);
              }}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 shrink-0 w-[110px] snap-start",
                isActive ? `${mood.color} border-current bg-white/5 shadow-lg` : "bg-white/5 border-white/10 hover:border-white/30"
              )}
            >
              <mood.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/50")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-white" : "text-white/50")}>{mood.label}</span>
              {trackCount > 0 && <span className={cn("text-[8px] font-mono", isActive ? "text-white/60" : "text-white/30")}>{trackCount}</span>}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default function RadioView() {
  const { 
    playlist, isPlaying, setIsPlaying, currentTrackIndex, 
    volume, setVolume, nextTrack, votes, upvoteTrack, downvoteTrack, shuffleMode, toggleShuffle,
    chatMessages, addChatMessage,
    activeMood, moodedPlaylist,
    isLive, setIsLive, streamSource,
    listenerCount
  } = useStation();
  const { currentUser, isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [chatInput, setChatInput] = useState("");
  const [, setDurationTick] = useState(0);  // forces re-render when duration cache updates

  // Probe real durations for server-file tracks so Up Next shows "3:42" not "0:00"
  useEffect(() => {
    const serverTracks = playlist.filter(t => (t as any).serverFile);
    if (serverTracks.length === 0) return;
    let cancelled = false;
    probeServerFileDurations(serverTracks).then(() => {
      if (!cancelled) setDurationTick(n => n + 1);
    });
    return () => { cancelled = true; };
  }, [playlist.length]);

  // If live mode, show live stream player instead
  if (isLive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="px-6 pb-20 space-y-6"
      >
        <LiveStreamPlayer />
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="font-bold uppercase tracking-widest text-sm">LIVE STREAM</span>
                <span className="text-white/40 text-xs">from {streamSource.platform || 'YouTube'}</span>
              </div>
              <button
                onClick={() => setIsLive(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" /> End Stream
              </button>
            </div>
          </div>
        </div>
        <LiveChat />
      </motion.div>
    );
  }

  // Use mooded playlist when mood is active, otherwise use full playlist
  const displayPlaylist = activeMood ? moodedPlaylist : playlist;
  const displayTrackIndex = activeMood ? currentTrackIndex : currentTrackIndex;
  
  const currentTrack = displayPlaylist[displayTrackIndex] || {
    id: 'offline',
    title: 'STATION OFFLINE',
    artist: 'VIBE-X',
    duration: '0:00',
    genre: 'Offline',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lines-moving-in-the-dark-31422-large.mp4'
  };

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext));
    const isDataImage = url.startsWith('data:image/');
    const isPicsum = url.includes('picsum.photos');
    return hasImageExtension || isDataImage || isPicsum;
  };

  // Reset track index when switching between mood and full playlist
  useEffect(() => {
    if (!activeMood && currentTrackIndex >= playlist.length) {
      //保持在有效范围
    }
  }, [activeMood, playlist.length, currentTrackIndex]);

  useEffect(() => {
    const playMedia = async () => {
      if (videoRef.current) {
        if (isPlaying) await videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
    };
    playMedia();
  }, [isPlaying, displayTrackIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 pb-20 space-y-6"
    >
      {/* Mood Selector — under player area */}
      <MoodSelector />

      {/* Live Stream Control Bar */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full transition-colors",
              isLive ? "bg-red-600 animate-pulse" : "bg-white/20"
            )} />
            <span className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isLive ? "text-red-500" : "text-white/40"
            )}>
              {isLive ? '🔴 LIVE ON ' + (streamSource.platform?.toUpperCase() || 'STREAM') : 'AUTO-PILOT PLAYLIST'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              !isLive ? (
                <button
                  onClick={() => setIsLive(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                >
                  <Radio className="w-4 h-4" /> Go Live
                </button>
              ) : (
                <button
                  onClick={() => setIsLive(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <X className="w-4 h-4" /> End Live
                </button>
              )
            )}
            <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest hidden md:block">
              {isAdmin ? 'OBS → YouTube → VIBE-X' : 'OBS → YouTube → VIBE-X'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden glass group flex items-center justify-center">
            {(currentTrack.visualUrl || currentTrack.videoUrl) ? (
              isImageUrl(currentTrack.visualUrl || currentTrack.videoUrl) ? (
                <img
                  src={currentTrack.visualUrl || currentTrack.videoUrl}
                  className="w-full h-full object-cover opacity-60"
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentTrack.visualUrl || currentTrack.videoUrl}
                  className="w-full h-full object-cover opacity-60"
                  playsInline
                  autoPlay
                  muted={true}
                  loop={true}
                />
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neon-green/10 to-neon-blue/10">
                <Disc className="w-32 h-32 text-white/10 animate-spin-slow" />
              </div>
            )}

            {/* Overlay Info - REMOVED: track info moved to Info Bar */}
            <div className="absolute inset-0 pointer-events-none">
              <TheWindow fallback="all" />
            </div>

            {/* Play/Pause Large Overlay (Mobile) */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
            >
              <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-neon-green scale-90 group-hover:scale-100 transition-transform">
                {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
              </div>
            </button>
          </div>

          {/* Track Info Bar */}
          <div className="glass rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-neon-green font-bold text-lg tracking-tight">{currentTrack.title}</span>
              </div>
              {currentTrack.artist && currentTrack.artist !== 'Local Server' && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm font-medium">{currentTrack.artist}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentTrack.energy && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-green" />
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={cn("w-1.5 h-4 rounded-full", i <= (currentTrack.energy || 3) ? "bg-neon-green" : "bg-white/20")} />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/30 font-mono uppercase">STYLE</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-neon-green" />
                  <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  <div className="w-3 h-3 rounded-sm bg-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-neon-green text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={nextTrack}
                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:text-neon-green transition-colors"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
              <button 
                onClick={toggleShuffle}
                className={cn(
                  "w-10 h-10 rounded-full glass flex items-center justify-center transition-all",
                  shuffleMode ? "text-neon-green bg-neon-green/10 border border-neon-green/30" : "hover:text-neon-green"
                )}
                title="DJ Shuffle Mode"
              >
                <Shuffle className="w-4 h-4 fill-current" />
              </button>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-white/50" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-24 accent-neon-green h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-3 glass rounded-xl hover:text-neon-green transition-all"><Share2 className="w-5 h-5" /></button>
              <button className="p-3 glass rounded-xl hover:text-neon-green transition-all"><MessageSquare className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Chat / Community */}
          <div className="glass rounded-3xl p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-white/50">Live Chat</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-neon-green">ACTIVE</span>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id}>
                  <ChatMessage user={msg.user} message={msg.message} color={msg.color} avatar={msg.avatar} />
                </div>
              ))}
            </div>
            <form className="mt-4 relative" onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                addChatMessage(chatInput.trim(), currentUser.displayName || currentUser.email || 'Listener', "text-neon-green", currentUser.photoURL || undefined);
                setChatInput("");
              }
            }}>
              {!currentUser ? (
                <div className="text-center text-white/40 text-xs py-2">
                  Sign in to join the chat 💬
                </div>
              ) : (
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message the DJ..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
                />
              )}
            </form>
          </div>

          {/* Up Next — only prev / current / next (3 tracks max) */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-white/50">Up Next</h3>
            </div>
            <div className="space-y-4">
              {displayPlaylist.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <p className="text-xs uppercase tracking-widest">No tracks available</p>
                  <p className="text-[10px] mt-1">Admin can tag tracks in the dashboard</p>
                </div>
              ) : (() => {
                const prevIdx = currentTrackIndex > 0 ? currentTrackIndex - 1 : null;
                const nextIdx = currentTrackIndex < displayPlaylist.length - 1 ? currentTrackIndex + 1 : null;
                const visibleTracks: { track: typeof displayPlaylist[0]; idx: number; label: string }[] = [];
                if (prevIdx !== null) visibleTracks.push({ track: displayPlaylist[prevIdx], idx: prevIdx, label: 'PREVIOUS' });
                visibleTracks.push({ track: displayPlaylist[currentTrackIndex], idx: currentTrackIndex, label: 'NOW PLAYING' });
                if (nextIdx !== null) visibleTracks.push({ track: displayPlaylist[nextIdx], idx: nextIdx, label: 'UP NEXT' });
                return visibleTracks.map(({ track, idx, label }) => (
                  <div
                    key={track.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl transition-all",
                      idx === currentTrackIndex ? "bg-neon-green/10 border border-neon-green/30" : "opacity-40 hover:opacity-100"
                    )}
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {isImageUrl(track.visualUrl || track.videoUrl) ? (
                        <img src={track.visualUrl || track.videoUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <video src={track.visualUrl || track.videoUrl} className="w-full h-full object-cover" muted />
                      )}
                      {idx === currentTrackIndex && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Disc className="w-6 h-6 text-neon-green animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                          idx === currentTrackIndex ? "bg-neon-green/20 text-neon-green" : "bg-white/10 text-white/40"
                        )}>
                          {label}
                        </span>
                        {track.mood && (
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                            MOODS.find(m => m.id === track.mood)?.color.split('from-')[1]?.split('/')[0] || 'bg-white/10',
                            "text-white"
                          )}>
                            {MOODS.find(m => m.id === track.mood)?.label}
                          </span>
                        )}
                      </div>
                      <h4 className={cn("font-bold text-sm truncate", idx === currentTrackIndex ? "text-neon-green" : "text-white")}>
                        {track.title}
                      </h4>
                      {track.artist && track.artist !== 'Local Server' && (
                        <p className="text-xs text-white/50 truncate">{track.artist}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-white/30">{(track.audioUrl && getCachedDuration(track.audioUrl)) || track.duration}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* Newsletter — full-width OUTSIDE the 3-col grid so it doesn't get squeezed to 1/3 width on lg screens */}
      <div className="max-w-7xl mx-auto mt-12 px-2">
        <NewsletterSignup source="radio_view" variant="banner" />
      </div>

    </motion.div>
  );
}

function ChatMessage({ user, message, color, avatar }: { user: string, message: string, color: string, avatar?: string }) {
  return (
    <div className="text-sm flex items-start gap-2">
      {avatar && <img src={avatar} alt="" className="w-6 h-6 rounded-full mt-0.5 flex-shrink-0" />}
      <span className={cn("font-bold mr-2", color)}>{user}:</span>
      <span className="text-white/80 break-words">{message}</span>
    </div>
  );
}