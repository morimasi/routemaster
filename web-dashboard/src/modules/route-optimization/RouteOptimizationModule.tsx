import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Route, Fuel, Clock, CheckCircle2, XCircle, Zap, Activity,
  Truck, RefreshCw, BarChart3, Settings, Download,
  AlertTriangle, ChevronDown,
  Navigation, User, Phone, Star,
  Minimize2, Plus,
  TrendingDown, TrendingUp, Leaf,
  GitCompareArrows, Cpu,
  AlertCircle
} from 'lucide-react';
import { RouteOptimizationApiService } from './api';
import type { OptimizedRoute, OptimizationRun, FleetVehicle, OptimizationConstraints, FleetStats } from './types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const id = 'opt-gmaps';
    if (document.getElementById(id)) { const c = () => window.google?.maps ? resolve() : setTimeout(c, 100); c(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=maps,marker,geometry&v=weekly&loading=async&callback=initOptMap`;
    (window as any).initOptMap = () => { delete (window as any).initOptMap; resolve(); };
    s.onerror = () => reject(new Error('Google Maps yüklenemedi'));
    document.head.appendChild(s);
  });
}

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];
const SCHOOL_LOC = { lat: 41.092, lng: 29.088 };
const SCHOOL_NAME = 'Kavacık Koleji';

export const RouteOptimizationModule: React.FC = () => {
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'history' | 'settings'>('optimize');
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [beforeStats, setBeforeStats] = useState<FleetStats | null>(null);
  const [afterStats, setAfterStats] = useState<FleetStats | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxStopsPerRoute: 14, maxDistancePerRouteKm: 50, maxDurationPerRouteMin: 120,
    considerTraffic: true, considerTimeWindows: true, balancedLoad: true, prioritizeDriverPreference: false,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const mapInitialized = useRef(false);
  const routeLines = useRef<google.maps.Polyline[]>([]);
  const stopMarkers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const schoolMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    RouteOptimizationApiService.getFleet('t-1001').then(data => setFleet(data.map(v => ({ ...v, selected: true }))));
    if (!GOOGLE_API_KEY) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    loadGoogleMaps().then(() => setMapsReady(true)).catch(e => setMapsError(e.message));
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInitialized.current) return;
    mapInitialized.current = true;
    const gm = window.google.maps;
    const opts: google.maps.MapOptions = {
      center: SCHOOL_LOC, zoom: 13, mapId: GOOGLE_MAP_ID || 'DEMO_MAP_ID',
      mapTypeId: 'roadmap', disableDefaultUI: true, gestureHandling: 'greedy', backgroundColor: '#0f172a',
    };
    if (!GOOGLE_MAP_ID) {
      opts.styles = [
        { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      ];
    }
    mapInstance.current = new gm.Map(mapRef.current, opts);
    infoWindow.current = new gm.InfoWindow({ pixelOffset: new gm.Size(0, -30) });

    const schoolEl = document.createElement('div');
    schoolEl.innerHTML = `<div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full border-2 border-blue-300 shadow-lg shadow-blue-600/40 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 10v6M2 10l10-7 10 7M6 6v4"/><path d="M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg></div>`;
    schoolMarker.current = new gm.marker.AdvancedMarkerElement({
      position: SCHOOL_LOC, map: mapInstance.current, content: schoolEl, title: SCHOOL_NAME,
    });
    schoolMarker.current.addListener('gmp-click', () => {
      if (infoWindow.current && mapInstance.current) {
        infoWindow.current.setContent(`<div style="background:#0f172a;color:white;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:bold">${SCHOOL_NAME}</div>`);
        infoWindow.current.open(mapInstance.current, schoolMarker.current!);
      }
    });
  }, [mapsReady]);

  const clearMapRoutes = useCallback(() => {
    routeLines.current.forEach(l => l.setMap(null));
    routeLines.current = [];
    stopMarkers.current.forEach(m => m.map = null);
    stopMarkers.current = [];
  }, []);

  const renderRoutesOnMap = useCallback((routes: OptimizedRoute[]) => {
    if (!mapsReady || !mapInstance.current || !window.google?.maps) return;
    clearMapRoutes();
    const gm = window.google.maps;
    const bounds = new gm.LatLngBounds();
    bounds.extend(SCHOOL_LOC);

    routes.forEach((route, ri) => {
      const color = ROUTE_COLORS[ri % ROUTE_COLORS.length];
      if (route.nodes.length < 2) return;
      const path = [{ lat: route.nodes[0].lat, lng: route.nodes[0].lng }];
      route.nodes.forEach(n => path.push({ lat: n.lat, lng: n.lng }));

      const line = new gm.Polyline({
        path, strokeColor: color, strokeWeight: 4, strokeOpacity: 0.8,
        map: mapInstance.current!,
        zIndex: 10 + ri,
      });
      routeLines.current.push(line);

      route.nodes.forEach((node, ni) => {
        bounds.extend({ lat: node.lat, lng: node.lng });
        const el = document.createElement('div');
        const isSelected = selectedRouteId === route.vehicleId;
        el.innerHTML = `<div class="relative ${isSelected ? 'z-10' : ''}">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg border-2" style="background:${color}20;border-color:${color};color:${color}">${ni + 1}</div>
          <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-bold whitespace-nowrap" style="color:${color}">${node.studentName.split(' ')[0]}</div>
        </div>`;
        const marker = new gm.marker.AdvancedMarkerElement({
          position: { lat: node.lat, lng: node.lng },
          map: mapInstance.current!, content: el,
          title: `${ni + 1}. ${node.studentName}`,
        });
        marker.addListener('gmp-click', () => {
          if (infoWindow.current && mapInstance.current) {
            infoWindow.current.setContent(`<div style="background:#0f172a;color:white;padding:12px;border-radius:12px;font-size:12px;max-width:200px">
              <div style="font-weight:bold;font-size:13px;margin-bottom:2px">${node.studentName}</div>
              <div style="color:#94a3b8">${node.address}</div>
              <div style="color:#64748b;font-size:10px;margin-top:4px">ETA: ${node.estimatedArrival} | ${route.vehiclePlate}</div>
            </div>`);
            infoWindow.current.open(mapInstance.current!, marker);
          }
        });
        stopMarkers.current.push(marker);
      });
    });

    if (routes.length > 0) mapInstance.current.fitBounds(bounds, 60);
  }, [mapsReady, clearMapRoutes, selectedRouteId]);

  useEffect(() => {
    if (mapsReady && optimizedRoutes.length > 0) renderRoutesOnMap(optimizedRoutes);
    else if (mapsReady && optimizedRoutes.length === 0) clearMapRoutes();
  }, [mapsReady, optimizedRoutes, renderRoutesOnMap, clearMapRoutes, selectedRouteId]);

  const handleOptimize = useCallback(async () => {
    setOptimizing(true);
    setToast(null);
    try {
      const selected = fleet.filter(v => v.selected);
      if (selected.length === 0) { setToast('Lütfen en az bir araç seçin'); setOptimizing(false); return; }
      const { result, routes, beforeStats: bs, afterStats: as_ } = await RouteOptimizationApiService.optimize(
        't-1001', selected.map(v => ({ id: v.id, capacity: v.capacity })), constraints,
      );
      const run: OptimizationRun = {
        id: `opt_${Date.now()}`,
        timestamp: Date.now(),
        solverTimeMs: result.solver_execution_time_ms,
        fuelSavedPercent: result.fuel_saved_percent,
        distanceReducedKm: result.total_distance_reduced_km,
        routeCount: result.optimized_routes.length,
        totalNodes: routes.reduce((a, r) => a + r.nodeCount, 0),
        status: 'success',
        constraints: { ...constraints },
        beforeStats: bs, afterStats: as_,
      };
      setRuns(prev => [run, ...prev]);
      setOptimizedRoutes(routes);
      setBeforeStats(bs);
      setAfterStats(as_);
      setShowComparison(true);
      setToast('Optimizasyon başarıyla tamamlandı!');
      setTimeout(() => setToast(null), 4000);
    } catch {
      setToast('Optimizasyon sırasında hata oluştu');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setOptimizing(false);
    }
  }, [fleet, constraints]);

  const totalCo2Saved = optimizedRoutes.reduce((a, r) => a + (r.co2ReducedKg || 0), 0);
  const totalDistBefore = beforeStats?.totalDistanceKm || 0;
  const totalDistAfter = afterStats?.totalDistanceKm || 0;
  const savingsPercent = totalDistBefore > 0 ? Math.round((1 - totalDistAfter / totalDistBefore) * 100) : 0;

  const toggleFleet = (id: string) => setFleet(prev => prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v));
  const selectAllFleet = () => setFleet(prev => prev.map(v => ({ ...v, selected: true })));

  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify({ runs: runs.slice(0, 5), optimizedRoutes }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `optimization_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(a.href);
  };

  if (mapsError && !mapsReady) {
    return (
      <div className="min-h-[400px] bg-slate-950 rounded-2xl flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Cpu className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-400">Google Maps API anahtarı gerekli</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 sm:gap-4 p-1 sm:p-2">
      {/* Toast */}
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border ${toast.includes('hata') ? 'bg-red-900/80 border-red-500/40 text-red-200' : 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200'}`}>
          {toast.includes('hata') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast}
        </motion.div>
      )}</AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <Route className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Rota Optimizasyon Motoru</h2>
            <p className="text-[9px] sm:text-[10px] text-slate-500">VRPTW • AI Destekli • Çok Araçlı</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setActiveTab('settings')} className={`p-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setActiveTab('history')} className={`p-2 rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setActiveTab('optimize')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'optimize' ? 'bg-purple-600 text-white' : 'bg-slate-800/60 text-slate-400'}`}>
            Optimizasyon
          </button>
        </div>
      </div>

      {activeTab === 'optimize' && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Toplam Araç', value: fleet.length, icon: Truck, color: 'text-blue-400' },
              { label: 'Optimizasyon', value: runs.length > 0 ? `${runs.length}` : '—', icon: Zap, color: 'text-purple-400' },
              { label: 'Yakıt Tasarrufu', value: runs.length > 0 ? `%${runs[0].fuelSavedPercent}` : '—', icon: Fuel, color: 'text-emerald-400' },
              { label: 'CO₂ Azaltma', value: totalCo2Saved > 0 ? `${totalCo2Saved.toFixed(1)} kg` : '—', icon: Leaf, color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <s.icon className="w-3 h-3" />
                  <span className="text-[9px] sm:text-[10px]">{s.label}</span>
                </div>
                <p className={`text-sm sm:text-base font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
            {/* Left Panel - Controls & Routes */}
            <div className="lg:w-96 xl:w-[420px] space-y-3 overflow-y-auto pr-1">
              {/* AI Optimize Button */}
              <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      AI Optimizasyon Motoru
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">VRPTW • {fleet.filter(v => v.selected).length} araç seçili</p>
                  </div>
                  <button onClick={() => setShowConfig(v => !v)} className={`p-1.5 rounded-lg transition-all ${showConfig ? 'bg-purple-600/30 text-purple-300' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={handleOptimize} disabled={optimizing || fleet.filter(v => v.selected).length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20">
                  {optimizing ? <><RefreshCw className="w-4 h-4 animate-spin" /> VRPTW Çözülüyor...</> : <><Zap className="w-4 h-4" /> AI ile Optimize Et</>}
                </button>
              </div>

              {/* Constraints Panel */}
              <AnimatePresence>{showConfig && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-3 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Settings className="w-3 h-3" /> Optimizasyon Kısıtları</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'maxStopsPerRoute' as const, label: 'Max Durak/Rota', value: constraints.maxStopsPerRoute, min: 4, max: 30, unit: '' },
                        { key: 'maxDistancePerRouteKm' as const, label: 'Max Mesafe/Rota', value: constraints.maxDistancePerRouteKm, min: 10, max: 120, unit: ' km' },
                        { key: 'maxDurationPerRouteMin' as const, label: 'Max Süre/Rota', value: constraints.maxDurationPerRouteMin, min: 30, max: 240, unit: ' dk' },
                      ].map(c => (
                        <div key={c.key}>
                          <label className="text-[8px] text-slate-500 block mb-1">{c.label}</label>
                          <div className="flex items-center gap-1.5">
                            <input type="range" min={c.min} max={c.max} value={constraints[c.key]}
                              onChange={e => setConstraints(p => ({ ...p, [c.key]: Number(e.target.value) }))}
                              className="flex-1 h-1 rounded-full appearance-none bg-slate-700 accent-purple-500" />
                            <span className="text-[10px] font-mono text-purple-400 min-w-[3rem] text-right">{constraints[c.key]}{c.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'considerTraffic' as const, label: 'Trafik Durumunu Hesaba Kat', desc: 'Gerçek zamanlı trafik verisi' },
                        { key: 'considerTimeWindows' as const, label: 'Zaman Pencerelerini Kullan', desc: 'Öğrencilerin zaman kısıtları' },
                        { key: 'balancedLoad' as const, label: 'Yük Dengeleme', desc: 'Araçlar arası eşit dağıtım' },
                        { key: 'prioritizeDriverPreference' as const, label: 'Sürücü Tercihleri', desc: 'Sürücü bölge/rota tercihleri' },
                      ].map(t => (
                        <label key={t.key} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                          <div><p className="text-[10px] font-medium text-white">{t.label}</p><p className="text-[8px] text-slate-500">{t.desc}</p></div>
                          <div onClick={() => setConstraints(p => ({ ...p, [t.key]: !p[t.key] }))}
                            className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${constraints[t.key] ? 'bg-purple-600' : 'bg-slate-700'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${constraints[t.key] ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}</AnimatePresence>

              {/* Fleet Selection */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Araç Filosu</p>
                  <button onClick={selectAllFleet} className="text-[8px] text-purple-400 hover:text-purple-300 font-bold">Tümünü Seç</button>
                </div>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                  {fleet.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => toggleFleet(v.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${v.selected ? 'bg-purple-900/20 border-purple-500/40' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${v.selected ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                        {v.selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                        style={{ background: `${ROUTE_COLORS[i % ROUTE_COLORS.length]}20`, color: ROUTE_COLORS[i % ROUTE_COLORS.length] }}>
                        <Truck className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{v.plate}</p>
                        <p className="text-[8px] text-slate-500 truncate">{v.driverName} • {v.capacity} kişi</p>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'ON_ROUTE' ? 'bg-emerald-500' : v.status === 'WARNING' ? 'bg-amber-500' : v.status === 'STANDBY' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Optimized Routes */}
              {optimizedRoutes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" /> Optimize Rotalar ({optimizedRoutes.length})
                  </p>
                  {optimizedRoutes.map((route, ri) => (
                    <motion.div key={route.vehicleId}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ri * 0.05 }}
                      className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${selectedRouteId === route.vehicleId ? 'bg-slate-900 border-purple-500/50 shadow-lg shadow-purple-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
                      onClick={() => setSelectedRouteId(selectedRouteId === route.vehicleId ? null : route.vehicleId)}>
                      <div className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                            style={{ background: `${ROUTE_COLORS[ri % ROUTE_COLORS.length]}20`, color: ROUTE_COLORS[ri % ROUTE_COLORS.length] }}>
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-white">{route.vehiclePlate}</span>
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${route.status === 'optimal' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'}`}>
                                {route.status === 'optimal' ? 'OPT' : 'UYGUN'}
                              </span>
                              <span className="text-[9px] text-emerald-400 font-bold ml-auto">-%{route.fuelSavedPercent}</span>
                            </div>
                            <p className="text-[8px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <User className="w-2.5 h-2.5" />{route.driverName}
                              <Navigation className="w-2.5 h-2.5 ml-1" />{route.totalDistanceKm} km
                              <Clock className="w-2.5 h-2.5 ml-1" />{route.estimatedDurationMin} dk
                            </p>
                          </div>
                          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${expandedRouteId === route.vehicleId ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Expandable Details */}
                        <AnimatePresence>
                          {expandedRouteId === route.vehicleId && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 pt-2 border-t border-slate-800">
                              <div className="grid grid-cols-3 gap-1.5 mb-2">
                                <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                                  <span className="text-[7px] text-slate-500 block">Durak</span>
                                  <span className="text-[10px] font-bold text-white">{route.nodeCount}</span>
                                </div>
                                <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                                  <span className="text-[7px] text-slate-500 block">Yakıt</span>
                                  <span className="text-[10px] font-bold text-emerald-400">{route.fuelSavedLiters?.toFixed(1)} L</span>
                                </div>
                                <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                                  <span className="text-[7px] text-slate-500 block">CO₂</span>
                                  <span className="text-[10px] font-bold text-emerald-400">{route.co2ReducedKg?.toFixed(1)} kg</span>
                                </div>
                              </div>
                              {route.driverPhone && (
                                <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mb-2 p-1.5 bg-slate-950/40 rounded-lg">
                                  <Phone className="w-2.5 h-2.5" />{route.driverPhone}
                                  {route.driverRating && <span className="flex items-center gap-0.5 ml-auto"><Star className="w-2 h-2 text-amber-400" />{route.driverRating}</span>}
                                </div>
                              )}
                              <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                                {route.nodes.map((node, ni) => (
                                  <div key={node.id} className="flex items-center gap-2 p-1 rounded-lg text-[8px] hover:bg-slate-800/40">
                                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold flex-shrink-0"
                                      style={{ background: `${ROUTE_COLORS[ri % ROUTE_COLORS.length]}30`, color: ROUTE_COLORS[ri % ROUTE_COLORS.length] }}>
                                      {ni + 1}
                                    </div>
                                    <span className="flex-1 text-white truncate">{node.studentName}</span>
                                    <span className="text-slate-500 flex-shrink-0">{node.estimatedArrival}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 glass-panel relative overflow-hidden rounded-xl min-h-[400px] lg:min-h-0">
              {optimizedRoutes.length === 0 && !mapsError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <div className="text-center space-y-3 max-w-xs">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto">
                      <MapIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-sm font-bold text-white">Optimizasyon Haritası</p>
                    <p className="text-[10px] text-slate-500">Araçları seçin ve AI ile optimize edin. Rotalar harita üzerinde görüntülenecek.</p>
                  </div>
                </div>
              ) : null}
              {mapsError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="text-center space-y-2"><MapIcon className="w-8 h-8 text-slate-700 mx-auto" /><p className="text-[11px] text-slate-500">{mapsError}</p></div>
                </div>
              )}
              {!mapsReady && !mapsError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="flex flex-col items-center gap-2"><Loader className="w-5 h-5 text-blue-400 animate-spin" /><p className="text-[10px] text-slate-500">Harita yükleniyor...</p></div>
                </div>
              )}
              <div ref={mapRef} className="absolute inset-0" />

              {/* Map Legend */}
              {optimizedRoutes.length > 0 && (
                <div className="absolute top-2 right-2 z-20 bg-slate-950/90 border border-slate-800 rounded-lg p-2 backdrop-blur-sm max-w-[140px]">
                  <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rota Renkleri</p>
                  <div className="space-y-0.5">
                    {optimizedRoutes.map((r, ri) => (
                      <div key={r.vehicleId} className="flex items-center gap-1.5"
                        onClick={() => setExpandedRouteId(expandedRouteId === r.vehicleId ? null : r.vehicleId)}>
                        <div className="w-2 h-2 rounded-full" style={{ background: ROUTE_COLORS[ri % ROUTE_COLORS.length] }} />
                        <span className="text-[7px] text-slate-400 truncate">{r.vehiclePlate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Controls */}
              <div className="absolute top-2 left-2 z-20 flex gap-1">
                <button onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) + 1)}
                  className="p-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-slate-400 border border-slate-800">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) - 1)}
                  className="p-1 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-slate-400 border border-slate-800">
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Panel */}
          <AnimatePresence>{showComparison && beforeStats && afterStats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-emerald-600/5 to-teal-600/5 border border-emerald-500/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GitCompareArrows className="w-4 h-4 text-emerald-400" />
                  Önce / Sonra Karşılaştırması
                </p>
                <button onClick={() => setShowComparison(false)} className="text-slate-500 hover:text-white"><XCircle className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Toplam Mesafe', before: `${totalDistBefore} km`, after: `${totalDistAfter} km`, change: -savingsPercent, unit: '%' },
                  { label: 'Toplam Süre', before: `${beforeStats.totalDurationMin} dk`, after: `${afterStats.totalDurationMin} dk`, change: -Math.round((1 - afterStats.totalDurationMin / beforeStats.totalDurationMin) * 100), unit: '%' },
                  { label: 'Yakıt Tüketimi', before: `${beforeStats.totalFuelLiters} L`, after: `${afterStats.totalFuelLiters} L`, change: -Math.round((1 - afterStats.totalFuelLiters / beforeStats.totalFuelLiters) * 100), unit: '%' },
                  { label: 'Araç Kullanımı', before: `%${beforeStats.avgVehicleUtilization}`, after: `%${afterStats.avgVehicleUtilization}`, change: afterStats.avgVehicleUtilization - beforeStats.avgVehicleUtilization, unit: ' %' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3">
                    <p className="text-[8px] sm:text-[9px] text-slate-500 mb-1">{s.label}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-400 line-through">{s.before}</span>
                      <span className="text-xs font-bold text-white">{s.after}</span>
                    </div>
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold ${s.change < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {s.change < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {Math.abs(s.change)}{s.unit}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}</AnimatePresence>

          {/* Bottom Actions */}
          {optimizedRoutes.length > 0 && (
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={() => setShowComparison(v => !v)} className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-[9px] text-slate-300 hover:text-white flex items-center gap-1">
                <GitCompareArrows className="w-3 h-3" /> Karşılaştır
              </button>
              <button onClick={exportAsJson} className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-[9px] text-slate-300 hover:text-white flex items-center gap-1">
                <Download className="w-3 h-3" /> Dışa Aktar
              </button>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" /> Optimizasyon Geçmişi
            </p>
            <span className="text-[9px] text-slate-500">{runs.length} kayıt</span>
          </div>
          {runs.length === 0 ? (
            <div className="text-center py-8">
              <Cpu className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] text-slate-500">Henüz optimizasyon yapılmadı</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {runs.map(run => (
                <motion.div key={run.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 sm:p-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      {run.status === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                      <div>
                        <p className="text-[10px] font-bold text-white">
                          %{run.fuelSavedPercent} yakıt tasarrufu • {run.distanceReducedKm} km azaltma
                        </p>
                        <p className="text-[8px] text-slate-500">
                          {new Date(run.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-slate-400">
                      <span>{run.routeCount} rota</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>{run.totalNodes} durak</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>{run.solverTimeMs} ms</span>
                    </div>
                  </div>
                  {run.errorMessage && (
                    <div className="mt-1.5 text-[8px] text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />{run.errorMessage}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-purple-400" /> Motor Ayarları
            </p>
            <div className="space-y-3">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <p className="text-[10px] font-bold text-white mb-2">VRPTW Algoritma Ayarları</p>
                <div className="space-y-2">
                  {[
                    { label: 'Maksimum Iterasyon', value: '1000', desc: 'Algoritma yakınsama sınırı' },
                    { label: 'Popülasyon Boyutu', value: '200', desc: 'Genetik algoritma popülasyonu' },
                    { label: 'Mutasyon Oranı', value: '0.15', desc: 'Genetik çeşitlilik oranı' },
                    { label: 'Zaman Aşımı (ms)', value: '5000', desc: 'Maksimum çözüm süresi' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/20">
                      <div><p className="text-[9px] text-white">{s.label}</p><p className="text-[7px] text-slate-500">{s.desc}</p></div>
                      <span className="text-[10px] font-mono text-purple-400">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <p className="text-[10px] font-bold text-white mb-2">Harita Görselleştirme</p>
                <div className="space-y-2">
                  {[
                    { label: 'Rota Çizgi Kalınlığı', value: '4 px' },
                    { label: 'Durak Marker Boyutu', value: '24 px' },
                    { label: 'Harita Padding', value: '60 px' },
                    { label: 'Animasyon Hızı', value: '500 ms' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/20">
                      <span className="text-[9px] text-white">{s.label}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function MapIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function Loader({ className }: { className?: string }) {
  return <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
