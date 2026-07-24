import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, AlertTriangle, CheckCircle2, Signal, Wifi, BatteryCharging } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  text: string;
  time: string;
  type: 'alert' | 'success';
}

interface TopBarProps {
  isMobile: boolean;
  notifications: Notification[];
  onRoleChange?: (role: 'planner' | 'driver' | 'parent') => void;
  activeRole?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ isMobile, notifications, onRoleChange, activeRole }) => {
  const [time, setTime] = useState(new Date());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isMobile) {
    return (
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">{timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{dateStr}</span>
            <div className="flex items-center gap-1 text-slate-500">
              <Wifi className="w-3 h-3" />
              <Signal className="w-3 h-3" />
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-20 glass-panel mb-4 flex items-center justify-between px-8 relative">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">{timeStr}</span>
          <span className="text-xs text-slate-500">• {dateStr}</span>
        </div>

        {onRoleChange && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button onClick={() => onRoleChange('planner')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeRole === 'planner' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Planlayıcı
            </button>
            <button onClick={() => onRoleChange('driver')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeRole === 'driver' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Şoför
            </button>
            <button onClick={() => onRoleChange('parent')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeRole === 'parent' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Veli
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-[10px] text-gray-300 font-medium px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800">
          Sistem: <span className="text-emerald-400 ml-1">Kusursuz</span>
        </div>

        <div className="relative">
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <BellRing className="w-4 h-4 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#151f32]" />
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Bildirimler</h4>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {n.type === 'alert' ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{n.text}</p>
                      <span className="text-[8px] text-slate-600 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
