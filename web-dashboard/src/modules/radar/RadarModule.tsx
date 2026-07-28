import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, ChevronRight, AlertTriangle, Cpu, CheckCircle2, X,
  Navigation, Clock, User, ZoomIn, ZoomOut, RotateCcw, Radio, MapIcon, Loader
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { RadarApiService } from './api';
import type { VehiclePosition, RadarRoute } from './types';

interface RadarModuleProps {
  routes: RadarRoute[];
  onOptimizationComplete?: (result: any) => void;
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const id = 'radar-google-maps';
    if (document.getElementById(id)) {
      const check = () => window.google?.maps ? resolve() : setTimeout(check, 100);
      check(); return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=maps,marker&v=beta&loading=async&callback=initRadarMap`;
    (window as any).initRadarMap = () => {
      delete (window as any).initRadarMap;
      resolve();
    };
    s.onerror = () => reject(new Error('Google Maps yüklenemedi'));
    document.head.appendChild(s);
  });
}

const LATS = [41.0921, 41.0988, 41.0860, 41.0890, 41.0950, 41.0781, 41.1040, 41.0905];
const LNGS = [29.0945, 29.1012, 29.0830, 29.0650, 29.1020, 29.0730, 29.0880, 29.0920];

function createBusIcon(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `<div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.6)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg></div>`;
  return el;
}

function createWarningIcon(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `<div class="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14"/></svg></div>`;
  return el;
}

function createStandbyIcon(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `<div class="w-7 h-7 bg-slate-600 rounded-full border-2 border-slate-400 flex items-center justify-center opacity-70"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg></div>`;
  return el;
}

export const RadarModule: React.FC<RadarModuleProps> = ({ routes: externalRoutes, onOptimizationComplete }) => {
  const { isMobile, isTablet } = useWindowSize();
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'ACTIVE'>('ALL');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RadarRoute | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (!GOOGLE_API_KEY) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    loadGoogleMaps().then(() => setMapsReady(true)).catch((e) => setMapsError(e.message));
  }, []);

  useEffect(() => {
    const fetchPositions = () => {
      RadarApiService.getVehiclePositions('t-1001').then((data) => {
        if (data && data.length > 0) {
          const withCoords = data.map((v, i) => ({
            ...v,
            lat: v.lat || LATS[i % LATS.length],
            lng: v.lng || LNGS[i % LNGS.length],
          }));
          setVehiclePositions(withCoords);
        }
      });
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !window.google?.maps) return;
    if (mapInitialized.current) return;
    mapInitialized.current = true;
    const gm = window.google.maps;
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 41.092, lng: 29.088 },
      zoom: 13,
      mapId: GOOGLE_MAP_ID || undefined,
      mapTypeId: 'roadmap',
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      backgroundColor: '#0f172a',
    };
    if (!GOOGLE_MAP_ID) {
      mapOptions.styles = [
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
    mapInstance.current = new gm.Map(mapRef.current, mapOptions);

    routeLineRef.current = new gm.Polyline({
      path: [
        { lat: 41.0921, lng: 29.0945 },
        { lat: 41.0988, lng: 29.1012 },
        { lat: 41.0860, lng: 29.0830 },
        { lat: 41.0781, lng: 29.0730 },
      ],
      strokeColor: '#3b82f6',
      strokeWeight: 3,
      strokeOpacity: 0.6,
      map: mapInstance.current,
    });
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || !window.google?.maps || !mapInstance.current) return;
    const gm = window.google.maps;
    const { AdvancedMarkerElement } = gm.marker;
    const currentVehicleIds = new Set(vehiclePositions.map((v) => v.id));
    markersRef.current.forEach((m, id) => {
      if (!currentVehicleIds.has(id)) { m.map = null; markersRef.current.delete(id); }
    });
    vehiclePositions.forEach((v) => {
      let marker = markersRef.current.get(v.id);
      if (!marker) {
        const content = v.status === 'WARNING' ? createWarningIcon() : v.status === 'STANDBY' ? createStandbyIcon() : createBusIcon();
        marker = new AdvancedMarkerElement({
          position: { lat: v.lat, lng: v.lng },
          map: mapInstance.current!,
          content,
          title: v.plate,
        });
        marker.addListener('gmp-click', () => setSelectedVehicle(v));
        markersRef.current.set(v.id, marker);
      } else {
        marker.position = { lat: v.lat, lng: v.lng };
      }
    });
  }, [mapsReady, vehiclePositions]);

  const handleMapZoomIn = () => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) + 1);
  const handleMapZoomOut = () => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) - 1);
  const handleMapReset = () => mapInstance.current?.setZoom(13);

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

      <section className={`flex-1 glass-panel relative overflow-hidden flex flex-col ${isCompact ? 'min-h-[350px]' : 'min-h-[450px]'}`}>
        <div className="z-20 flex items-center justify-between bg-slate-950/80 p-1.5 sm:p-3 rounded-xl m-2 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
            <span className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-wider">GPS Radar</span>
            {!mapsReady && !mapsError && <Loader className="w-3 h-3 text-blue-400 animate-spin ml-2" />}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={handleMapZoomIn} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomIn className="w-3 h-3" /></button>
            <button onClick={handleMapZoomOut} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomOut className="w-3 h-3" /></button>
            <button onClick={handleMapReset} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </div>

        <div className="flex-1 relative m-2 mt-0 rounded-xl overflow-hidden">
          {mapsError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center space-y-2">
                <MapIcon className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-[11px] text-slate-500">{mapsError}</p>
              </div>
            </div>
          ) : !mapsReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                <p className="text-[10px] text-slate-500">Google Maps yükleniyor...</p>
              </div>
            </div>
          ) : null}
          <div ref={mapRef} className="absolute inset-0" />
        </div>

        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              className="absolute top-16 left-3 z-30 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xl max-w-[180px] sm:max-w-xs text-[9px] sm:text-xs space-y-1 sm:space-y-2 backdrop-blur-md"
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

        <div className="z-20 text-[7px] sm:text-[9px] text-slate-400 bg-slate-950/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-800 inline-block self-start ml-2 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          {vehiclePositions.filter((v) => v.status === 'ON_ROUTE').length}/{vehiclePositions.length} araç aktif
        </div>
      </section>

      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
