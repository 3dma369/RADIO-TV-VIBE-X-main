export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'apparel' | 'accessories' | 'digital';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  videoUrl?: string; // Combined file (legacy)
  audioUrl?: string; // Separate audio
  visualUrl?: string; // Separate visual
}

export interface DJ {
  id: string;
  name: string;
  bio: string;
  image: string;
  specialty: string;
  socials: {
    twitter?: string;
    instagram?: string;
    soundcloud?: string;
  };
}

export interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  djId: string;
  showName: string;
}

export interface StreamSource {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'stream';
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  color: string;
  timestamp: number;
}
