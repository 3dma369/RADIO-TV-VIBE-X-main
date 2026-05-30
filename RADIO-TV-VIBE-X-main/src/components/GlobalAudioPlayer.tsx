import React, { useEffect, useRef } from 'react';
import { useStation } from '../context/StationContext';
import { startSession, tickSession, endSession, logPageView } from '../services/metricsService';

export default function GlobalAudioPlayer() {
  const { playlist, currentTrackIndex, isPlaying, volume, nextTrack } = useStation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStarted = useRef(false);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track page view on mount
  useEffect(() => {
    logPageView(window.location.pathname);
  }, []);

  // Start session when audio plays
  useEffect(() => {
    if (isPlaying && !sessionStarted.current) {
      startSession();
      sessionStarted.current = true;
      tickInterval.current = setInterval(() => tickSession(), 60 * 1000);
    }
    if (!isPlaying && sessionStarted.current) {
      endSession();
      sessionStarted.current = false;
      if (tickInterval.current) {
        clearInterval(tickInterval.current);
        tickInterval.current = null;
      }
    }
    return () => {
      if (sessionStarted.current) {
        endSession();
        sessionStarted.current = false;
      }
      if (tickInterval.current) {
        clearInterval(tickInterval.current);
        tickInterval.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const currentTrack = playlist[currentTrackIndex] || null;

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, currentTrack]);

  if (!currentTrack) return null;

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext)) || url.startsWith('data:image/') || url.includes('picsum.photos');
  };

  let src = currentTrack.audioUrl;
  if (!src && currentTrack.videoUrl && !isImageUrl(currentTrack.videoUrl)) {
    src = currentTrack.videoUrl;
  }
  if (!src && currentTrack.visualUrl && !isImageUrl(currentTrack.visualUrl)) {
    src = currentTrack.visualUrl;
  }

  if (!src) return null;

  return (
    <audio
      ref={audioRef}
      src={src}
      onEnded={nextTrack}
    />
  );
}