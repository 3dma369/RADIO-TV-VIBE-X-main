import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, User } from 'lucide-react';
import { cn } from '../utils';
import { ScheduleEntry, DJ } from '../types';

import { useStation } from '../context/StationContext';

export default function ScheduleView() {
  const { schedule, djs } = useStation();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 pb-20"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold tracking-tighter mb-4 neon-text uppercase">Broadcast Schedule</h2>
          <p className="text-white/50">Never miss a beat. Check out our weekly lineup of live streams and guest sets.</p>
        </div>

        <div className="space-y-12">
          {days.map((day) => {
            const dayShows = schedule.filter(s => s.day === day);
            if (dayShows.length === 0) return null;

            return (
              <div key={day} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-2xl font-bold text-neon-green uppercase tracking-widest">{day}</h3>
                  <div className="h-px flex-grow bg-white/10" />
                </div>
                
                <div className="grid gap-4">
                  {dayShows.map((show) => {
                    const dj = djs.find(d => d.id === show.djId);
                    return (
                      <div key={show.id} className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neon-green/30 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-xl overflow-hidden glass flex-shrink-0">
                            <img src={dj?.image} alt={dj?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold group-hover:text-neon-green transition-colors">{show.showName}</h4>
                            <p className="text-white/50 text-sm flex items-center gap-2">
                              <User className="w-3 h-3" /> {dj?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/70 font-mono text-sm">
                          <Clock className="w-4 h-4 text-neon-green" />
                          {show.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
