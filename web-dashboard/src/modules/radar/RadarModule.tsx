import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, ChevronRight, AlertTriangle, Cpu, CheckCircle2, X,
  Navigation, Clock, User, ZoomIn, ZoomOut, RotateCcw, Radio
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { RadarApiService } from './api';
import type { VehiclePosition, RadarRoute } from './types';

interface RadarModuleProps {
  routes: RadarRoute[];
  onOptimizationComplete?: (result: any) => void;
}

export const RadarModule: React.FC<RadarModuleProps> = ({ routes: externalRoutes, onOptimizationComplete }) => {
  const { isMobile, isTablet } = useWindowSize();
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'ACTIVE'>('ALL');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RadarRoute | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);

  useEffect(() => {
    RadarApiService.getVehiclePositions('t-1001').then(setVehiclePositions);
    const interval = setInterval(() => {
      setVehiclePositions((prev) =>
        prev.map((v) => {
          if (v.status === 'STANDBY') return v;
          return {
            ...v,
            x: Math.max(15, Math.min(85, v.x + (Math.random() - 0.48) * 1.5)),
            y: Math.max(15, Math.min(85, v.y + (Math.random() - 0.48) * 1.5)),
            speed: Math.floor(Math.random() * 20 + 30),
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = (externalRoutes || []).filter((r) => {
    if (filter === 'ALERTS') return r.alertsCount > 0;
    if (filter === 'ACTIVE') return r.status === 'ACTIVE';
    return true;
  });

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    try {
      const res = await RadarApiService.runOptimization('t-1001', ['v-1', 'v-2'], ['n-1', 'n-2', 'n-3']);
      const msg = `AI VRPTW Optimizasyon Başarılı! (${res.solver_execution_time_ms}ms, %${res.fuel_saved_percent} Tasarruf)`;
      setOptimizationResult(msg);
      onOptimizationComplete?.(res);
    } finally {
      setIsOptimizing(false);
    }
  };

  const isCompact = isMobile || isTablet;

  return (
    <div className={`flex ${isCompact ? 'flex-col' : 'flex-row'} gap-3 sm:gap-4 lg:gap-6 h-full`}>
      <section className={`${isCompact ? 'w-full' : 'w-80 lg:w-96'} space-y-3 ${isCompact ? '' : 'flex-shrink-0'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base lg:text-xl font-display font-semibold text-white">Rota Bağlantıları</h2>
          <div className="flex gap-1 bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-bold">
            <button onClick={() => setFilter('ALL')} className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Tümü</button>
            <button onClick={() => setFilter('ALERTS')} className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-colors ${filter === 'ALERTS' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Uyarılar</button>
          </div>
        </div>

        <button onClick={handleOptimize} disabled={isOptimizing} className="w-full py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/40 hover:border-blue-500 text-blue-300 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-2 transition-all">
          <Cpu className={`w-3 h-3 sm:w-4 sm:h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Hesaplanıyor...' : 'AI Optimize Et'}</span>
        </button>

        {optimizationResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 sm:p-3 rounded-xl text-[9px] sm:text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{optimizationResult}</span>
          </div>
        )}

        <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 scroll-smooth-mobile">
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">Rota bulunamadı</div>
          ) : filteredRoutes.map((route, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className="p-2.5 sm:p-3 bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 rounded-xl cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-100 group-hover:text-blue-400 transition-colors truncate pr-2">{route.name}</h3>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[9px] sm:text-xs text-gray-400">
                <CarFront className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                <span>{route.vehiclePlate}</span>
                {route.alertsCount > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>{route.alertsCount}</span>
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${route.progressPercent}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={`flex-1 glass-panel relative overflow-hidden flex flex-col justify-between p-2 sm:p-4 lg:p-6 ${isCompact ? 'min-h-[350px]' : 'min-h-[400px]'}`}>
        <div className="z-20 flex items-center justify-between bg-slate-950/80 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
            <span className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-wider">GPS Radar</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setMapZoom((p) => Math.min(p + 0.2, 1.8))} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomIn className="w-3 h-3" /></button>
            <button onClick={() => setMapZoom((p) => Math.max(p - 0.2, 0.6))} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomOut className="w-3 h-3" /></button>
            <button onClick={() => setMapZoom(1)} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transform: `scale(${mapZoom})`,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.12) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        >
          <svg className="w-full h-full absolute inset-0 opacity-30">
            <path d="M 100 100 Q 250 80 400 250 T 650 350" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
            <path d="M 150 350 Q 350 200 550 150" stroke="#10b981" strokeWidth="2.5" fill="none" />
          </svg>
          {vehiclePositions.map((v) => (
            <motion.div
              key={v.id}
              onClick={() => setSelectedVehicle(v)}
              className="absolute cursor-pointer group z-30"
              style={{ left: `${v.x}%`, top: `${v.y}%` }}
              animate={{ left: `${v.x}%`, top: `${v.y}%` }}
              transition={{ duration: 1.8, ease: 'linear' }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-blue-500/30 animate-ping" />
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl hover:scale-125 transition-transform">
                  <CarFront className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 bg-slate-950/90 text-[7px] sm:text-[9px] font-bold text-white px-1 sm:px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow-lg">
                  {v.plate} ({v.speed} km/h)
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              className="z-30 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xl max-w-[180px] sm:max-w-xs text-[9px] sm:text-xs space-y-1 sm:space-y-2 backdrop-blur-md self-start"
            >
              <div className="flex justify-between items-center pb-1 sm:pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs sm:text-sm">{selectedVehicle.plate}</span>
                <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
              </div>
              <div className="space-y-0.5 sm:space-y-1 text-slate-300">
                <p><strong className="text-slate-400">Rota:</strong> {selectedVehicle.route}</p>
                <p><strong className="text-slate-400">Sürücü:</strong> {selectedVehicle.driver}</p>
                <p><strong className="text-slate-400">Hız:</strong> <span className="text-emerald-400 font-bold">{selectedVehicle.speed} km/h</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="z-20 text-[7px] sm:text-[9px] text-slate-400 bg-slate-950/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-slate-800 inline-block self-end">
          Live GPS • {vehiclePositions.filter((v) => v.status === 'ON_ROUTE').length} aktif
        </div>
      </section>

      <AnimatePresence>
        {selectedRoute && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 text-white relative"
            >
              <button onClick={() => setSelectedRoute(null)} className="absolute top-3 sm:top-5 right-3 sm:right-5 text-slate-400 hover:text-white"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400"><Navigation className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-lg truncate">{selectedRoute.name}</h3>
                  <p className="text-[9px] sm:text-xs text-slate-400">{selectedRoute.vehiclePlate} • %{selectedRoute.progressPercent}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 sm:p-4 rounded-xl border border-slate-800 text-center text-[9px] sm:text-xs">
                <div><span className="text-slate-500 block">Sürücü</span><span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5"><User className="w-3 h-3 text-blue-400" /> Mehmet Ş.</span></div>
                <div><span className="text-slate-500 block">Gecikme</span><span className="font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> 4ms</span></div>
                <div><span className="text-slate-500 block">Uyarı</span><span className="font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" /> {selectedRoute.alertsCount}</span></div>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => setSelectedRoute(null)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-[9px] sm:text-xs font-bold text-white shadow-lg shadow-blue-600/30">Kapat</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
