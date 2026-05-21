import React, { useState, useEffect, useRef } from 'react';
import { useStation } from '../context/StationContext';

const VISUAL_SLIDESHOW_INTERVAL = 8000; // 8 seconds per visual

// VIBE-X visual assets (imgur hosted for CORS)
const VISUAL_ASSETS = [
  'https://i.imgur.com/21wmrMJ.jpeg',   // VIBE-X logo dark
  'https://i.imgur.com/l18E1pH.jpeg',   // VIBE-X ident neon
  'https://i.imgur.com/BcWxTc5.jpeg',   // VIBE-X brand poster
];

export default function VisualSlideshow() {
  const { isPlaying, currentTrackIndex, isLive, streamSource } = useStation();
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackIndexRef = useRef(currentTrackIndex);

  useEffect(() => {
    trackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Rotate slideshow visuals every interval
  useEffect(() => {
    if (!isPlaying || isLive) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setCurrentVisualIndex(0);

    intervalRef.current = setInterval(() => {
      setCurrentVisualIndex(prev => (prev + 1) % VISUAL_ASSETS.length);
    }, VISUAL_SLIDESHOW_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isLive]);

  // When track changes, reset visual index
  useEffect(() => {
    if (!isLive && isPlaying) {
      setCurrentVisualIndex(prev => (prev + 1) % VISUAL_ASSETS.length);
    }
  }, [currentTrackIndex]);

  if (!isPlaying || isLive) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <img
        src={VISUAL_ASSETS[currentVisualIndex]}
        className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
        alt="VIBE-X visual"
        crossOrigin="anonymous"
      />
    </div>
  );
}