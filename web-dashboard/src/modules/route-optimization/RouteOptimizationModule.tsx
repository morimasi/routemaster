import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Route, Fuel, Clock, CheckCircle, XCircle, Zap, Activity,
  Truck, RefreshCw, BarChart3, List, Layers
} from 'lucide-react';
import { RouteOptimizationApiService } from './api';
import type { OptimizedRoute, OptimizationRun } from './types';

const MOCK_FLEET = [
  { id: 'v1', capacity: 18 },
  { id: 'v2', capacity: 14 },
  { id: 'v3', capacity: 20 },
  { id: 'v4', capacity: 8 },
];

export const RouteOptimizationModule: React.FC = () => {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleOptimize = useCallback(async () => {
    setOptimizing(true);
    try {
      const result = await RouteOptimizationApiService.optimize('t-1001', MOCK_FLEET);
      const run: OptimizationRun = {
        id: `opt_${Date.now()}`,
        timestamp: Date.now(),
        solverTimeMs: result.solver_execution_time_ms,
        fuelSavedPercent: result.fuel_saved_percent,
        distanceReducedKm: result.total_distance_reduced_km,
        routeCount: result.optimized_routes.length,
        status: 'success',
      };
      setRuns(prev => [run, ...prev]);
      setOptimizedRoutes([
        { vehiclePlate: '34 AB 1234', vehicleId: 'v1', driverName: 'Mehmet Şahin', nodeCount: 12, totalDistanceKm: 42.5, estimatedDurationMin: 90, fuelSavedPercent: 19.2, nodes: [] },
        { vehiclePlate: '34 CD 5678', vehicleId: 'v2', driverName: 'Ali Yılmaz', nodeCount: 8, totalDistanceKm: 28.3, estimatedDurationMin: 60, fuelSavedPercent: 18.5, nodes: [] },
        { vehiclePlate: '34 EF 9012', vehicleId: 'v3', driverName: 'Hasan Kaya', nodeCount: 14, totalDistanceKm: 35.8, estimatedDurationMin: 80, fuelSavedPercent: 21.0, nodes: [] },
        { vehiclePlate: '34 GH 3456', vehicleId: 'v4', driverName: 'Burak Demir', nodeCount: 6, totalDistanceKm: 18.6, estimatedDurationMin: 40, fuelSavedPercent: 16.8, nodes: [] },
      ]);
    } finally {
      setOptimizing(false);
    }
  }, []);

  const latestRun = runs[0];

  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <Route className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Rota Optimizasyonu</h2>
            <p className="text-[9px] text-slate-500">VRPTW • AI Destekli</p>
          </div>
        </div>
        <button
          onClick={handleOptimize}
          disabled={optimizing}
          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all"
        >
          {optimizing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          {optimizing ? 'Optimize Ediliyor...' : 'AI ile Optimize Et'}
        </button>
      </div>

      {latestRun && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">Optimizasyon Tamamlandı</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Yakıt Tasarrufu', value: `%${latestRun.fuelSavedPercent}`, icon: Fuel, color: 'text-emerald-400' },
              { label: 'Mesafe Azaltma', value: `${latestRun.distanceReducedKm} km`, icon: Route, color: 'text-blue-400' },
              { label: 'Çözüm Süresi', value: `${latestRun.solverTimeMs} ms`, icon: Clock, color: 'text-purple-400' },
              { label: 'Optimize Rota', value: latestRun.routeCount, icon: Layers, color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60">
                <div className="flex items-center gap-1 text-slate-500 mb-0.5"><s.icon className="w-3 h-3" /><span className="text-[9px]">{s.label}</span></div>
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setShowDetails(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!showDetails ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <List className="w-3 h-3 inline mr-1" />Özet
        </button>
        <button onClick={() => setShowDetails(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showDetails ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <BarChart3 className="w-3 h-3 inline mr-1" />Detaylı
        </button>
      </div>

      {!showDetails ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {optimizedRoutes.map((route, i) => (
            <motion.div key={route.vehicleId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">{route.vehiclePlate}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">-%{route.fuelSavedPercent}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-400">
                <span>{route.driverName}</span>
                <span>{route.nodeCount} durak</span>
                <span>{route.totalDistanceKm} km</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${route.fuelSavedPercent * 4}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
          <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400" />Optimizasyon Geçmişi</h3>
          {runs.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">Henüz optimizasyon yapılmadı</p>
          ) : (
            <div className="space-y-1">
              {runs.map(run => (
                <div key={run.id} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {run.status === 'success'
                      ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                      : <XCircle className="w-3 h-3 text-red-400" />}
                    <div>
                      <p className="text-[10px] font-bold">%{run.fuelSavedPercent} yakıt tasarrufu</p>
                      <p className="text-[8px] text-slate-500">{new Date(run.timestamp).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400">{run.routeCount} rota</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
