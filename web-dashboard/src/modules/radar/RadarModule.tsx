import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, ChevronRight, AlertTriangle, Cpu, CheckCircle2, X,
  Navigation, Clock, User, ZoomIn, ZoomOut, RotateCcw, Radio, MapIcon, Loader,
  Plus, Trash2, Edit3, Save, Phone, Star, Fuel, Gauge, Route, MapPin,
  Layers, BarChart3, Search, Filter, ArrowUpRight, Bell, Settings,
  Play, Pause, UserPlus, Truck, Wifi, WifiOff, Circle, CircleDot,
  RefreshCw, Download, Share2, Maximize2, Minimize2
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { RadarApiService } from './api';
import type { VehiclePosition, RadarRoute, FleetSummary, VehicleDetail, RouteStop } from './types';

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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=maps,marker,geometry,drawing,places&v=weekly&loading=async&callback=initRadarMap`;
    (window as any).initRadarMap = () => {
      delete (window as any).initRadarMap;
      resolve();
    };
    s.onerror = () => reject(new Error('Google Maps yüklenemedi'));
    document.head.appendChild(s);
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'ON_ROUTE': return 'emerald';
    case 'WARNING': return 'amber';
    case 'STANDBY': case 'IDLE': return 'slate';
    case 'BREAK': return 'yellow';
    case 'OFFLINE': return 'red';
    default: return 'slate';
  }
}

function createVehicleIcon(status: string, isSelected = false): HTMLDivElement {
  const el = document.createElement('div');
  const colors: Record<string, string> = {
    ON_ROUTE: 'from-emerald-500 to-teal-600 shadow-emerald-500/60',
    WARNING: 'from-amber-500 to-orange-600 shadow-amber-500/60',
    STANDBY: 'from-slate-500 to-slate-600 shadow-slate-500/30',
    IDLE: 'from-slate-400 to-slate-500 shadow-slate-400/30',
    BREAK: 'from-yellow-500 to-amber-600 shadow-yellow-500/60',
    OFFLINE: 'from-red-500 to-rose-600 shadow-red-500/30',
  };
  const c = colors[status] || colors.ON_ROUTE;
  const pulse = status === 'WARNING' ? 'animate-pulse' : '';
  const size = isSelected ? 'w-10 h-10' : 'w-8 h-8';
  const shadow = isSelected ? 'shadow-[0_0_20px_rgba(52,211,153,0.8)]' : '';
  el.innerHTML = `<div class="${size} bg-gradient-to-br ${c} rounded-full border-2 border-white ${shadow} ${pulse} flex items-center justify-center transition-all duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg></div>`;
  return el;
}

function createStopIcon(type: 'PASSED' | 'CURRENT' | 'PENDING'): HTMLDivElement {
  const el = document.createElement('div');
  const colors = { PASSED: 'bg-emerald-500 border-emerald-400', CURRENT: 'bg-blue-500 border-blue-400 animate-pulse', PENDING: 'bg-slate-600 border-slate-500' };
  el.innerHTML = `<div class="w-4 h-4 ${colors[type]} rounded-full border-2 shadow-lg"></div>`;
  return el;
}

export const RadarModule: React.FC<RadarModuleProps> = ({ routes: externalRoutes, onOptimizationComplete }) => {
  const { isMobile, isTablet } = useWindowSize();
  const isCompact = isMobile || isTablet;

  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [radarRoutes, setRadarRoutes] = useState<RadarRoute[]>(externalRoutes || []);
  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RadarRoute | null>(null);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<RadarRoute | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<RadarRoute | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('MORNING');
  const [editVehicleId, setEditVehicleId] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteType, setNewRouteType] = useState('MORNING');
  const [newRouteVehicleId, setNewRouteVehicleId] = useState('');
  const [showRouteStops, setShowRouteStops] = useState(false);
  const [selectedRouteStops, setSelectedRouteStops] = useState<RouteStop[]>([]);
  const [selectedVehDetail, setSelectedVehDetail] = useState<VehicleDetail | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const stopMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const routePathRef = useRef<google.maps.Polyline | null>(null);
  const mapInitialized = useRef(false);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!GOOGLE_API_KEY) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    loadGoogleMaps().then(() => setMapsReady(true)).catch((e) => setMapsError(e.message));
  }, []);

  useEffect(() => {
    setRadarRoutes(externalRoutes || []);
  }, [externalRoutes]);

  useEffect(() => {
    const fetchPositions = () => {
      RadarApiService.getVehiclePositions('t-1001').then((data) => {
        if (data && data.length > 0) setVehiclePositions(data);
      });
    };
    const fetchRoutes = () => {
      RadarApiService.getRadarRoutes('t-1001').then((data) => {
        if (data && data.length > 0) setRadarRoutes(data);
      });
    };
    const fetchSummary = () => {
      RadarApiService.getFleetSummary('t-1001').then(setFleetSummary);
    };
    fetchPositions(); fetchRoutes(); fetchSummary();
    const posInterval = setInterval(fetchPositions, 3000);
    const routeInterval = setInterval(fetchRoutes, 10000);
    const summaryInterval = setInterval(fetchSummary, 15000);
    return () => { clearInterval(posInterval); clearInterval(routeInterval); clearInterval(summaryInterval); };
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !window.google?.maps) return;
    if (mapInitialized.current) return;
    mapInitialized.current = true;
    const gm = window.google.maps;
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 41.092, lng: 29.088 },
      zoom: 13,
      mapId: GOOGLE_MAP_ID || 'DEMO_MAP_ID',
      mapTypeId: 'roadmap',
      renderingType: gm.RenderingType.RASTER,
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
    infoWindowRef.current = new gm.InfoWindow({ pixelOffset: new gm.Size(0, -30) });
  }, [mapsReady]);

  const routeLineRefCurrent = useRef<google.maps.Polyline | null>(null);
  const stopMarkersRefCurrent = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  const updateRouteOnMap = useCallback((route: RadarRoute | null) => {
    if (!mapsReady || !window.google?.maps || !mapInstance.current) return;
    const gm = window.google.maps;
    if (routeLineRefCurrent.current) { routeLineRefCurrent.current.setMap(null); routeLineRefCurrent.current = null; }
    stopMarkersRefCurrent.current.forEach((m) => { m.map = null; });
    stopMarkersRefCurrent.current.clear();

    if (!route || !route.nodes?.length) return;

    const path = route.nodes
      .filter(n => n.lat && n.lng)
      .map(n => ({ lat: n.lat!, lng: n.lng! }));

    if (path.length > 1) {
      routeLineRefCurrent.current = new gm.Polyline({
        path,
        strokeColor: route.status === 'WARNING' ? '#f59e0b' : '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        map: mapInstance.current,
      });
    }

    route.nodes.forEach(n => {
      if (!n.lat || !n.lng) return;
      const marker = new gm.marker.AdvancedMarkerElement({
        position: { lat: n.lat, lng: n.lng },
        map: mapInstance.current!,
        content: createStopIcon(n.status),
        title: `${n.seq}. ${n.studentName}`,
      });
      marker.addListener('gmp-click', () => {
        if (infoWindowRef.current && mapInstance.current) {
          infoWindowRef.current.setContent(
            `<div style="background:#0f172a;color:white;padding:12px;border-radius:12px;font-family:sans-serif;font-size:12px;max-width:220px">
              <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${n.seq}. ${n.studentName}</div>
              <div style="color:#94a3b8">${n.stopName}</div>
              ${n.address ? `<div style="color:#64748b;font-size:11px">${n.address}</div>` : ''}
              <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
                <span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;background:${n.status === 'CURRENT' ? '#3b82f6' : n.status === 'PASSED' ? '#10b981' : '#334155'};color:white">${n.status === 'CURRENT' ? 'GÜNCEL' : n.status === 'PASSED' ? 'GEÇİLDİ' : 'BEKLİYOR'}</span>
                ${n.eta ? `<span style="color:#94a3b8;font-size:11px">ETA: ${n.eta}</span>` : ''}
              </div>
            </div>`
          );
          infoWindowRef.current.open(mapInstance.current!);
        }
      });
      stopMarkersRefCurrent.current.set(n.id, marker);
    });

    if (path.length > 0) {
      mapInstance.current.panTo(path[0]);
      mapInstance.current.setZoom(14);
    }
  }, [mapsReady]);

  useEffect(() => {
    updateRouteOnMap(selectedRouteDetail);
  }, [selectedRouteDetail, mapsReady]);

  const focusVehicle = useCallback((v: VehiclePosition) => {
    setSelectedVehicle(v);
    if (mapInstance.current) {
      mapInstance.current.panTo({ lat: v.lat, lng: v.lng });
      mapInstance.current.setZoom(16);
    }
    RadarApiService.getRouteDetail(radarRoutes.find(r => r.vehiclePlate === v.plate)?.id || '').then(detail => {
      if (detail) { setSelectedRouteDetail(detail); setShowRouteStops(true); }
    });
    RadarApiService.getVehicleDetail(v.id).then(d => setSelectedVehDetail(d));
  }, [radarRoutes]);

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
      const isSelected = selectedVehicle?.id === v.id;
      if (!marker) {
        marker = new AdvancedMarkerElement({
          position: { lat: v.lat, lng: v.lng },
          map: mapInstance.current!,
          content: createVehicleIcon(v.status, isSelected),
          title: v.plate,
        });
        marker.addListener('gmp-click', () => focusVehicle(v));
        markersRef.current.set(v.id, marker);
      } else {
        marker.position = { lat: v.lat, lng: v.lng };
        if (marker.content) {
          (marker.content as HTMLElement).innerHTML = createVehicleIcon(v.status, isSelected).innerHTML;
        }
      }
    });
  }, [mapsReady, vehiclePositions, selectedVehicle, focusVehicle]);

  const filteredVehicles = vehiclePositions.filter(v => {
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (searchQuery && !v.plate.toLowerCase().includes(searchQuery.toLowerCase()) && !v.driver.toLowerCase().includes(searchQuery.toLowerCase()) && !v.route.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = fleetSummary || { totalVehicles: vehiclePositions.length, activeVehicles: vehiclePositions.filter(v => v.status === 'ON_ROUTE').length, warningVehicles: vehiclePositions.filter(v => v.status === 'WARNING').length, standbyVehicles: vehiclePositions.filter(v => v.status === 'STANDBY' || v.status === 'IDLE').length, offlineVehicles: vehiclePositions.filter(v => v.status === 'OFFLINE').length, totalDrivers: 0, activeDrivers: 0, totalRoutes: radarRoutes.length };

  const statuses = ['ALL', 'ON_ROUTE', 'WARNING', 'STANDBY', 'IDLE', 'BREAK', 'OFFLINE'];

  const handleCreateRoute = async () => {
    if (!newRouteName.trim()) return;
    const res = await RadarApiService.createRoute({ name: newRouteName, type: newRouteType, vehicleId: newRouteVehicleId || undefined });
    if (res.status === 'CREATED') {
      setShowCreateModal(false);
      setNewRouteName(''); setNewRouteType('MORNING'); setNewRouteVehicleId('');
      setTimeout(() => RadarApiService.getRadarRoutes('t-1001').then(setRadarRoutes), 500);
    }
  };

  const handleEditRoute = async () => {
    if (!editingRoute || !editName.trim()) return;
    const res = await RadarApiService.updateRoute(editingRoute.id, { name: editName } as any);
    if (res.status === 'UPDATED') {
      setShowEditModal(false);
      setEditingRoute(null);
      setTimeout(() => RadarApiService.getRadarRoutes('t-1001').then(setRadarRoutes), 500);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Bu rotayı silmek istediğinize emin misiniz?')) return;
    await RadarApiService.deleteRoute(routeId);
    setRadarRoutes(prev => prev.filter(r => r.id !== routeId));
    setSelectedRoute(null);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    try {
      const vehicleIds = vehiclePositions.filter(v => v.status === 'ON_ROUTE' || v.status === 'WARNING').map(v => v.id);
      const res = await RadarApiService.runOptimization('t-1001', vehicleIds.length ? vehicleIds : ['v1', 'v2'], []);
      const msg = `AI VRPTW Optimizasyon Başarılı! (${res.solver_execution_time_ms}ms, %${res.fuel_saved_percent} Tasarruf, ${res.total_distance_reduced_km}km azaltma)`;
      setOptimizationResult(msg);
      onOptimizationComplete?.(res);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleMapZoomIn = () => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) + 1);
  const handleMapZoomOut = () => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 13) - 1);

  const openEditRoute = (route: RadarRoute) => {
    setEditingRoute(route);
    setEditName(route.name);
    setEditType(route.type || 'MORNING');
    setEditVehicleId(route.vehicleId || '');
    setShowEditModal(true);
  };

  return (
    <div className={`flex ${isCompact ? 'flex-col' : 'flex-row'} gap-3 sm:gap-4 lg:gap-6 h-full`}>
      {/* Left Panel - Route List & Controls */}
      <section className={`${isCompact ? 'w-full' : 'w-96 xl:w-[28rem]'} space-y-3 ${isCompact ? '' : 'flex-shrink-0 overflow-y-auto max-h-full pr-1'}`}>
        {/* Fleet Status Bar */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { label: 'Aktif', count: stats.activeVehicles, color: 'emerald', icon: <CarFront className="w-3 h-3" /> },
            { label: 'Uyarı', count: stats.warningVehicles, color: 'amber', icon: <AlertTriangle className="w-3 h-3" /> },
            { label: 'Bekleme', count: stats.standbyVehicles, color: 'slate', icon: <Circle className="w-3 h-3" /> },
            { label: 'Toplam', count: stats.totalVehicles, color: 'blue', icon: <Truck className="w-3 h-3" /> },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-3 text-center">
              <div className={`text-${s.color}-400 text-xs sm:text-sm font-bold`}>{s.count}</div>
              <div className="flex items-center justify-center gap-1 text-[8px] sm:text-[10px] text-slate-500 mt-0.5">
                {s.icon}<span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Plaka, sürücü, rota ara..." className="w-full bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] sm:text-xs text-white pl-7 pr-2 py-1.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
          </div>
          <button onClick={() => setShowOptimizeModal(true)} className="p-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/40 rounded-lg text-blue-400 hover:text-blue-300">
            <Cpu className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="p-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-emerald-400 hover:text-emerald-300">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`whitespace-nowrap px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all flex-shrink-0 ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'}`}>
              {s === 'ALL' ? 'Tümü' : s === 'ON_ROUTE' ? 'Aktif' : s === 'WARNING' ? 'Uyarı' : s === 'STANDBY' ? 'Bekleme' : s === 'IDLE' ? 'Boşta' : s === 'BREAK' ? 'Mola' : 'Çevrimdışı'}
            </button>
          ))}
        </div>

        {/* Optimization Result */}
        {optimizationResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 sm:p-3 rounded-xl text-[9px] sm:text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{optimizationResult}</span>
            <button onClick={() => setOptimizationResult(null)} className="ml-auto text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Vehicle List */}
        <div className="space-y-1.5 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-0.5 scroll-smooth-mobile">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Araç bulunamadı</div>
          ) : filteredVehicles.map((v, i) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              key={v.id}
              onClick={() => {
                setSelectedVehicle(v);
                focusVehicle(v);
              }}
              className={`p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all group border ${selectedVehicle?.id === v.id ? 'bg-blue-900/30 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/30'}`}
            >
              <div className="flex items-start gap-2.5">
                {/* Status indicator */}
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-${statusColor(v.status)}-500 ${v.status === 'WARNING' ? 'animate-pulse' : ''}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">{v.plate}</h3>
                    {v.status === 'ON_ROUTE' && <span className="text-[8px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5"><span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />HAREKET HALİNDE</span>}
                    {v.status === 'WARNING' && <span className="text-[8px] sm:text-[10px] text-amber-400 font-semibold">UYARI</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] sm:text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{v.driver}</span>
                    <span className="flex items-center gap-1"><Navigation className="w-2.5 h-2.5" />{v.speed} km/h</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] sm:text-[10px] text-slate-500 mt-0.5">
                    <span className="truncate max-w-[120px]">{v.route}</span>
                    {v.driverRating && <span className="flex items-center gap-0.5"><Star className="w-2 h-2 text-amber-400" />{v.driverRating}</span>}
                  </div>
                </div>
                <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${selectedVehicle?.id === v.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Route List */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Route className="w-3 h-3" /> Rota Bağlantıları</h3>
            <span className="text-[8px] sm:text-[10px] text-slate-500">{radarRoutes.length} rota</span>
          </div>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-0.5">
            {radarRoutes.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-[10px]">Rota bulunamadı</div>
            ) : radarRoutes.map((route, i) => (
              <motion.div
                initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                key={route.id}
                className="p-2 sm:p-2.5 bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 rounded-xl cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2" onClick={() => {
                  setSelectedRoute(route.id === selectedRoute?.id ? null : route);
                  RadarApiService.getRouteDetail(route.id).then(d => { setSelectedRouteDetail(d || route); if (d) setShowRouteStops(true); });
                }}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${route.status === 'ACTIVE' ? 'bg-emerald-500' : route.status === 'WARNING' ? 'bg-amber-500' : route.status === 'SCHEDULED' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-semibold text-white truncate">{route.name}</span>
                      <span className={`text-[7px] sm:text-[9px] font-bold px-1 py-0.5 rounded ${route.status === 'ACTIVE' ? 'bg-emerald-900/40 text-emerald-400' : route.status === 'WARNING' ? 'bg-amber-900/40 text-amber-400' : route.status === 'SCHEDULED' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-900/40 text-slate-400'}`}>
                        {route.status === 'ACTIVE' ? 'AKTİF' : route.status === 'WARNING' ? 'UYARI' : route.status === 'SCHEDULED' ? 'PLANLI' : 'TAMAM'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5"><CarFront className="w-2 h-2" />{route.vehiclePlate}</span>
                      <span>%{route.progressPercent}</span>
                      {route.alertsCount > 0 && <span className="text-amber-400 flex items-center gap-0.5"><AlertTriangle className="w-2 h-2" />{route.alertsCount}</span>}
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${route.status === 'WARNING' ? 'bg-amber-500' : route.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${route.progressPercent}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEditRoute(route); }} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRoute(route.id); }} className="p-1 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className={`flex-1 glass-panel relative overflow-hidden flex flex-col ${isCompact ? 'min-h-[400px]' : 'min-h-[500px]'} ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
        {/* Map Controls */}
        <div className="z-20 flex items-center justify-between bg-slate-950/80 p-1.5 sm:p-2.5 rounded-xl m-1.5 sm:m-2 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
            <span className="text-[9px] sm:text-xs font-bold text-white uppercase tracking-wider">GPS Radar</span>
            {!mapsReady && !mapsError && <Loader className="w-3 h-3 text-blue-400 animate-spin ml-1" />}
            <div className="hidden sm:flex items-center gap-1 ml-2 text-[8px] text-slate-500">
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{stats.activeVehicles} aktif</span>
              <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{stats.warningVehicles} uyarı</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300">
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            <button onClick={handleMapZoomIn} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomIn className="w-3 h-3" /></button>
            <button onClick={handleMapZoomOut} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><ZoomOut className="w-3 h-3" /></button>
            <button onClick={() => mapInstance.current?.setZoom(13)} className="p-1 sm:p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300"><RotateCcw className="w-3 h-3" /></button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative m-1.5 sm:m-2 mt-0 rounded-xl overflow-hidden">
          {mapsError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center space-y-2"><MapIcon className="w-8 h-8 text-slate-700 mx-auto" /><p className="text-[11px] text-slate-500">{mapsError}</p></div>
            </div>
          ) : !mapsReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-2"><Loader className="w-5 h-5 text-blue-400 animate-spin" /><p className="text-[10px] text-slate-500">Google Maps yükleniyor...</p></div>
            </div>
          ) : null}
          <div ref={mapRef} className="absolute inset-0" />

          {/* Vehicle Detail Panel */}
          <AnimatePresence>
            {selectedVehicle && (
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="absolute top-2 left-2 z-30 w-64 sm:w-72 bg-slate-900/95 border border-slate-800 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden"
              >
                {/* Header */}
                <div className="p-2.5 sm:p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${statusColor(selectedVehicle.status)}-500 ${selectedVehicle.status === 'WARNING' ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-white text-xs sm:text-sm">{selectedVehicle.plate}</span>
                    <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-${statusColor(selectedVehicle.status)}-900/40 text-${statusColor(selectedVehicle.status)}-400`}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <button onClick={() => { setSelectedVehicle(null); setSelectedRouteDetail(null); setShowRouteStops(false); }} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                </div>

                {/* Vehicle Info */}
                <div className="p-2.5 sm:p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] sm:text-[11px]">
                    {selectedVehicle.model && <div className="bg-slate-950 p-1.5 rounded-lg"><span className="text-slate-500 block">Model</span><span className="text-white font-medium">{selectedVehicle.brand} {selectedVehicle.model}</span></div>}
                    <div className="bg-slate-950 p-1.5 rounded-lg"><span className="text-slate-500 block">Sürücü</span><span className="text-white font-medium flex items-center gap-1">{selectedVehicle.driver}{selectedVehicle.driverRating ? <span className="text-amber-400 flex items-center gap-0.5"><Star className="w-2 h-2" />{selectedVehicle.driverRating}</span> : null}</span></div>
                    <div className="bg-slate-950 p-1.5 rounded-lg"><span className="text-slate-500 block">Hız</span><span className="text-emerald-400 font-bold flex items-center gap-1"><Gauge className="w-3 h-3" />{selectedVehicle.speed} km/h</span></div>
                    <div className="bg-slate-950 p-1.5 rounded-lg"><span className="text-slate-500 block">Rota</span><span className="text-white font-medium truncate">{selectedVehicle.route}</span></div>
                    {selectedVehicle.driverPhone && <div className="bg-slate-950 p-1.5 rounded-lg col-span-2"><span className="text-slate-500 block">İletişim</span><span className="text-blue-400 font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{selectedVehicle.driverPhone}</span></div>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 pt-1">
                    <button onClick={() => mapInstance.current?.panTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng })} className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-300 text-[9px] sm:text-[10px] font-bold hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1">
                      <Navigation className="w-3 h-3" /> Takip Et
                    </button>
                    {selectedVehDetail?.driver && (
                      <button className="py-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-[9px] sm:text-[10px] font-bold hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-1 px-2">
                        <Phone className="w-3 h-3" /> Ara
                      </button>
                    )}
                  </div>

                  {/* Route Stops */}
                  {showRouteStops && selectedRouteDetail?.nodes && selectedRouteDetail.nodes.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Durak Listesi</span>
                        <span className="text-[8px] text-slate-500">{selectedRouteDetail.nodes.filter(n => n.status === 'PASSED').length}/{selectedRouteDetail.nodes.length}</span>
                      </div>
                      <div className="max-h-[150px] overflow-y-auto space-y-0.5">
                        {selectedRouteDetail.nodes.map((node, idx) => (
                          <div key={node.id} className={`flex items-center gap-2 p-1.5 rounded-lg text-[8px] sm:text-[10px] ${node.status === 'CURRENT' ? 'bg-blue-900/30 border border-blue-500/30' : node.status === 'PASSED' ? 'bg-emerald-900/20' : 'bg-transparent'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[7px] font-bold ${node.status === 'PASSED' ? 'bg-emerald-500/30 text-emerald-400' : node.status === 'CURRENT' ? 'bg-blue-500/30 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                              {node.seq}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white truncate font-medium">{node.studentName}</div>
                              <div className="text-slate-500 truncate">{node.stopName}</div>
                            </div>
                            {node.eta && <span className="text-slate-400 flex-shrink-0">{node.eta}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend / Bottom Stats */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 text-[7px] sm:text-[9px] text-slate-400 bg-slate-950/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-800 backdrop-blur-sm">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Aktif ({stats.activeVehicles})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Uyarı ({stats.warningVehicles})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />Bekleme ({stats.standbyVehicles})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Çevrimdışı ({stats.offlineVehicles})</span>
          </div>
        </div>
      </section>

      {/* Create Route Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400" /> Yeni Rota</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="text-[11px] text-slate-400 block mb-1">Rota Adı</label><input value={newRouteName} onChange={e => setNewRouteName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="Örn: Akşam Servisi - Kavacık" /></div>
                <div><label className="text-[11px] text-slate-400 block mb-1">Sefer Tipi</label><select value={newRouteType} onChange={e => setNewRouteType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="MORNING">Sabah</option><option value="AFTERNOON">Öğlen</option><option value="EVENING">Akşam</option><option value="EXTRA">Ek Sefer</option>
                </select></div>
                <div><label className="text-[11px] text-slate-400 block mb-1">Araç Plakası (opsiyonel)</label>
                  <select value={newRouteVehicleId} onChange={e => setNewRouteVehicleId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seçilmedi</option>
                    {vehiclePositions.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.driver}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm">İptal</button>
                <button onClick={handleCreateRoute} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">Oluştur</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Route Modal */}
      <AnimatePresence>
        {showEditModal && editingRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-400" /> Rotayı Düzenle</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="text-[11px] text-slate-400 block mb-1">Rota Adı</label><input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                <div><label className="text-[11px] text-slate-400 block mb-1">Sefer Tipi</label><select value={editType} onChange={e => setEditType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="MORNING">Sabah</option><option value="AFTERNOON">Öğlen</option><option value="EVENING">Akşam</option><option value="EXTRA">Ek Sefer</option>
                </select></div>
                <div><label className="text-[11px] text-slate-400 block mb-1">Araç</label>
                  <select value={editVehicleId} onChange={e => setEditVehicleId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">Seçilmedi</option>
                    {vehiclePositions.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.driver}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm">İptal</button>
                <button onClick={handleEditRoute} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">Kaydet</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Optimize Modal */}
      <AnimatePresence>
        {showOptimizeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-purple-400" /> AI VRPTW Optimizasyon</h3>
                <button onClick={() => setShowOptimizeModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="font-bold text-white mb-2">Optimizasyon Detayları</p>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {stats.activeVehicles} aktif araç optimize edilecek</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {radarRoutes.length} rota yeniden planlanacak</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> VRPTW algoritması ile %19'a varan yakıt tasarrufu</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gerçek zamanlı trafik verisi dahil</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowOptimizeModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm">İptal</button>
                <button onClick={() => { setShowOptimizeModal(false); handleOptimize(); }} disabled={isOptimizing} className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center gap-2">
                  {isOptimizing ? <><Loader className="w-4 h-4 animate-spin" /> Hesaplanıyor...</> : <><Cpu className="w-4 h-4" /> Optimize Et</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
