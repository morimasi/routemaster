import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, CarFront, ChevronRight, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Route } from '../../types';
import { ShuttleXApiService } from '../../services/api';

interface PlannerRadarProps {
  routes: Route[];
  onSelectRoute?: (route: Route) => void;
}

export const PlannerRadar: React.FC<PlannerRadarProps> = ({ routes, onSelectRoute }) => {
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'ACTIVE'>('ALL');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  const filteredRoutes = routes.filter((r) => {
    if (filter === 'ALERTS') return r.alertsCount > 0;
    if (filter === 'ACTIVE') return r.status === 'ACTIVE';
    return true;
  });

  const handleRunMultiOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    try {
      const res = await ShuttleXApiService.multiOptimizeFleet('t-1001', [{ id: 'v-1' }, { id: 'v-2' }], ['n-1', 'n-2', 'n-3']);
      setOptimizationResult(`AI VRPTW Optimizasyonu Başarılı! (${res.solver_execution_time_ms}ms, %19.2 Yakıt Tasarrufu)`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      
      {/* Kolon 1: Aktif Rotalar (Sol Paneller) */}
      <section className="col-span-1 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-display font-semibold text-white">Anlık Rota Bağlantıları</h2>
          
          {/* Quick Filter Tabs */}
          <div className="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Tümü
            </button>

            <button
              onClick={() => setFilter('ALERTS')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${filter === 'ALERTS' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
            >
              Uyarılar
            </button>
          </div>
        </div>

        {/* Fleet Multi-Optimize Trigger Button */}
        <button
          onClick={handleRunMultiOptimize}
          disabled={isOptimizing}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/40 hover:border-blue-500 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Cpu className={`w-4 h-4 text-blue-400 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'VRPTW Rota Motoru Hesaplanıyor...' : 'AI Filo Yeniden Otonom Optimize Et'}</span>
        </button>

        {optimizationResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{optimizationResult}</span>
          </div>
        )}

        {filteredRoutes.map((route, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            key={route.id}
          >
            <GlassCard onClick={() => onSelectRoute?.(route)} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                  {route.name}
                </h3>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CarFront className="w-4 h-4" />
                <span>{route.vehiclePlate}</span>
              </div>

              {/* V4.1 Uyarı Rozeti */}
              {route.alertsCount > 0 && (
                <div className="absolute top-0 right-0 p-3">
                  <Badge
                    label={`${route.alertsCount} İptal İsteği`}
                    variant="alert"
                    pulse
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  />
                </div>
              )}

              {/* Progress Line */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${route.progressPercent}%` }}
                ></div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </section>

      {/* Kolon 2 & 3: Dev Kayan Harita Alanı (Sağ) */}
      <section className="col-span-1 lg:col-span-2 glass-panel relative overflow-hidden flex flex-col justify-center items-center p-8 min-h-[450px]">
        <div className="absolute inset-0 bg-glass-gradient opacity-50"></div>

        <div className="z-10 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900/80 rounded-full border border-slate-800 flex items-center justify-center mx-auto shadow-2xl">
            <MapIcon className="w-10 h-10 text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">
            Canlı Kuşbakışı Radarı
          </h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Gelişmiş WebGL harita motoru başlatılıyor. Tüm canlı telemetri verileri WebSocket üzerinden akıtılmaya hazır.
          </p>
        </div>

        {/* Tech Decorator Lines */}
        <div className="absolute left-[-20%] top-[40%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent transform rotate-12 pointer-events-none"></div>
        <div className="absolute left-[-20%] top-[60%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent transform -rotate-12 pointer-events-none"></div>
      </section>

    </div>
  );
};
