import React from 'react';
import { motion } from 'motion/react';
import { Twitter, Instagram, Music } from 'lucide-react';
import { DJ } from '../types';

import { useStation } from '../context/StationContext';

export default function DJsView() {
  const { djs } = useStation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 pb-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold tracking-tighter mb-4 neon-text uppercase">Our Residents</h2>
          <p className="text-white/50 max-w-2xl mx-auto">Meet the artists behind the sound. A collective of visionaries dedicated to the underground.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {djs.map((dj) => (
            <div key={dj.id} className="glass rounded-[40px] overflow-hidden group hover:border-neon-green/30 transition-all">
              <div className="aspect-[4/5] overflow-hidden relative">
                <img 
                  src={dj.image} 
                  alt={dj.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-green mb-2 block">{dj.specialty}</span>
                  <h3 className="text-3xl font-bold tracking-tighter text-white">{dj.name}</h3>
                </div>
              </div>
              <div className="p-8">
                <p className="text-white/60 text-sm leading-relaxed mb-8">{dj.bio}</p>
                <div className="flex gap-4">
                  {dj.socials.twitter && (
                    <a href="#" className="p-3 glass rounded-xl hover:text-neon-green transition-all"><Twitter className="w-5 h-5" /></a>
                  )}
                  {dj.socials.instagram && (
                    <a href="#" className="p-3 glass rounded-xl hover:text-neon-green transition-all"><Instagram className="w-5 h-5" /></a>
                  )}
                  {dj.socials.soundcloud && (
                    <a href="#" className="p-3 glass rounded-xl hover:text-neon-green transition-all"><Music className="w-5 h-5" /></a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
