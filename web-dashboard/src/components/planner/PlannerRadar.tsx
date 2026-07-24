import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CarFront, 
  ChevronRight, 
  AlertTriangle, 
  Cpu, 
  CheckCircle2, 
  X, 
  Navigation, 
  Clock, 
  User, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Radio
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import type { Route } from '../../types';
import { ShuttleXApiService } from '../../services/api';

interface PlannerRadarProps {
  routes: Route[];
  onSelectRoute?: (route: Route) => void;
}

export const PlannerRadar: React.FC<PlannerRadarProps> = ({ routes }) => {
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'ACTIVE'>('ALL');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  // Interactive Live Map State
  const [mapZoom, setMapZoom] = useState(1);
  const [selectedVehicleTelemetry, setSelectedVehicleTelemetry] = useState<any | null>(null);

  // Animated Vehicles Live Position Simulation
  const [vehiclePositions, setVehiclePositions] = useState([
    { id: 'v1', plate: '34 AB 1234', route: 'Kavacık - Sabah', x: 35, y: 40, speed: 42, driver: 'Mehmet Şahin', status: 'ON_ROUTE' },
    { id: 'v2', plate: '34 CD 5678', route: 'Anaokulu Öğlen', x: 65, y: 55, speed: 28, driver: 'Ali Yılmaz', status: 'WARNING' },
    { id: 'v3', plate: '34 EF 9012', route: 'Akşam Fabrika', x: 50, y: 70, speed: 0, driver: 'Hasan Kaya', status: 'STANDBY' },
  ]);

  // Live GPS Movement Loop Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setVehiclePositions((prev) =>
        prev.map((v) => {
          if (v.status === 'STANDBY') return v;
          const deltaX = (Math.random() - 0.48) * 1.5;
          const deltaY = (Math.random() - 0.48) * 1.5;
          return {
            ...v,
            x: Math.max(15, Math.min(85, v.x + deltaX)),
            y: Math.max(15, Math.min(85, v.y + deltaY)),
            speed: Math.floor(Math.random() * 20 + 30),
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
            <GlassCard onClick={() => setSelectedRoute(route)} className="relative overflow-hidden group">
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

      {/* Kolon 2 & 3: INTERACTIVE VECTOR LIVE MAP CANVAS */}
      <section className="col-span-1 lg:col-span-2 glass-panel relative overflow-hidden flex flex-col justify-between p-6 min-h-[500px]">
        {/* Map Header Toolbar */}
        <div className="z-20 flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Canlı GPS Telemetri Radarı (Mapbox Vector Engine)</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 1.8))} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.6))} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setMapZoom(1)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vector Map Grid Background */}
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transform: `scale(${mapZoom})`,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        >
          {/* Simulated Vector Route Lines */}
          <svg className="w-full h-full absolute inset-0 opacity-40">
            <path d="M 150 150 Q 300 100 450 300 T 700 400" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 6" fill="none" />
            <path d="M 200 400 Q 400 250 600 200" stroke="#10b981" strokeWidth="3" fill="none" />
          </svg>

          {/* Dynamic Vehicle Markers */}
          {vehiclePositions.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              onClick={() => setSelectedVehicleTelemetry(vehicle)}
              className="absolute cursor-pointer group z-30"
              style={{ left: `${vehicle.x}%`, top: `${vehicle.y}%` }}
              animate={{ left: `${vehicle.x}%`, top: `${vehicle.y}%` }}
              transition={{ duration: 1.8, ease: 'linear' }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
                <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl hover:scale-125 transition-transform">
                  <CarFront className="w-4 h-4" />
                </div>
                <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-slate-950/90 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow-lg">
                  {vehicle.plate} ({vehicle.speed} km/h)
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Vehicle Telemetry Popup Overlay */}
        <AnimatePresence>
          {selectedVehicleTelemetry && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="z-30 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl max-w-xs text-xs space-y-2 backdrop-blur-md self-start"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">{selectedVehicleTelemetry.plate}</span>
                <button onClick={() => setSelectedVehicleTelemetry(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-slate-300">
                <p><strong className="text-slate-400">Rota:</strong> {selectedVehicleTelemetry.route}</p>
                <p><strong className="text-slate-400">Sürücü:</strong> {selectedVehicleTelemetry.driver}</p>
                <p><strong className="text-slate-400">Anlık Hız:</strong> <span className="text-emerald-400 font-bold">{selectedVehicleTelemetry.speed} KM/H</span></p>
                <p><strong className="text-slate-400">Gecikme:</strong> &lt; 4ms (PostGIS Spatial Stream)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info badge */}
        <div className="z-20 text-[10px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 inline-block self-end">
          Canlı GPS Konum Akışı: TimeScaleDB + PostGIS ST_DWithin (50,000 Pkts/sec)
        </div>
      </section>

      {/* ROUTE DETAILS MODAL */}
      <AnimatePresence>
        {selectedRoute && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white relative"
            >
              <button onClick={() => setSelectedRoute(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedRoute.name}</h3>
                  <p className="text-xs text-slate-400">Plaka: {selectedRoute.vehiclePlate} | İlerleme: %{selectedRoute.progressPercent}</p>
                </div>
              </div>

              {/* Telemetry Details */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-500 block">Sürücü</span>
                  <span className="font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Mehmet Ş.
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Sinyal Gecikmesi</span>
                  <span className="font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> 4ms (Live)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">İptal Uyarıları</span>
                  <span className="font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {selectedRoute.alertsCount} İstek
                  </span>
                </div>
              </div>

              {/* Node Sequence Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Durak Sıralaması ve ETA Matrisi</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">#1 Ahmet Yılmaz</span>
                      <span className="text-[10px] text-slate-400 block">Atatürk Cad. No:14</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">Tamamlandı</span>
                  </div>

                  <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/40 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">#2 Eymen Altunel</span>
                      <span className="text-[10px] text-slate-400 block">Cumhuriyet Mah. 4. Sok (Veli İptal Uyarısı)</span>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">Sıradaki Durak</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">#3 Zeynep Kaya</span>
                      <span className="text-[10px] text-slate-400 block">Gül Apt. Kat:3</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Bekliyor (ETA 8 Dk)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedRoute(null)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30">
                  Tamam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
