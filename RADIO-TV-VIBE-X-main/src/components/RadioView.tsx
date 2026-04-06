import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Volume2, Users, MessageSquare, Share2, Disc, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../utils';

import { useStation } from '../context/StationContext';

export default function RadioView() {
  const { 
    playlist, isPlaying, setIsPlaying, currentTrackIndex, 
    volume, setVolume, nextTrack, votes, upvoteTrack, downvoteTrack,
    chatMessages, addChatMessage
  } = useStation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [chatInput, setChatInput] = useState("");
  
  const currentTrack = playlist[currentTrackIndex] || {
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

  useEffect(() => {
    const playMedia = async () => {
      if (videoRef.current) {
        if (isPlaying) await videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
    };
    playMedia();
  }, [isPlaying, currentTrackIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 pb-20"
    >
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
            
            {/* Overlay Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-neon-green text-black text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
                      Live Now
                    </span>
                    <span className="text-white/50 text-xs font-mono uppercase tracking-widest">
                      {currentTrack.genre}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2 neon-text">
                    {currentTrack.title}
                  </h1>
                  <p className="text-xl text-white/70 font-medium">
                    {currentTrack.artist}
                  </p>
                </div>
                
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Listeners</p>
                    <div className="flex items-center gap-2 text-neon-green">
                      <Users className="w-4 h-4" />
                      <span className="font-mono font-bold">1,248</span>
                    </div>
                  </div>
                </div>
              </div>
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
                  <ChatMessage user={msg.user} message={msg.message} color={msg.color} />
                </div>
              ))}
            </div>
            <form className="mt-4 relative" onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                addChatMessage(chatInput.trim(), "You", "text-neon-green");
                setChatInput("");
              }
            }}>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message the DJ..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
              />
            </form>
          </div>

          {/* Up Next */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-bold uppercase tracking-widest text-xs text-white/50 mb-6">Up Next</h3>
            <div className="space-y-4">
              {playlist.map((track, idx) => (
                <div 
                  key={track.id} 
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl transition-all group",
                    idx === currentTrackIndex ? "bg-neon-green/10 border border-neon-green/20" : "hover:bg-white/5"
                  )}
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    {isImageUrl(track.visualUrl || track.videoUrl) ? (
                      <img 
                        src={track.visualUrl || track.videoUrl} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        referrerPolicy="no-referrer" 
                      />
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
                    <h4 className={cn("font-bold text-sm truncate", idx === currentTrackIndex ? "text-neon-green" : "text-white")}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate">{track.artist}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); upvoteTrack(track.id); }} className="hover:text-neon-green text-white/50 p-1">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); downvoteTrack(track.id); }} className="hover:text-neon-pink text-white/50 p-1">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                    {votes[track.id] !== undefined && votes[track.id] !== 0 && (
                      <span className={cn(
                        "text-[10px] font-mono min-w-[20px] text-center",
                        votes[track.id] > 0 ? "text-neon-green" : "text-neon-pink"
                      )}>
                        {votes[track.id] > 0 ? `+${votes[track.id]}` : votes[track.id]}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-white/30">{track.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function ChatMessage({ user, message, color }: { user: string, message: string, color: string }) {
  return (
    <div className="text-sm">
      <span className={cn("font-bold mr-2", color)}>{user}:</span>
      <span className="text-white/80">{message}</span>
    </div>
  );
}
