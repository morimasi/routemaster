import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Map as MapIcon, List, Bell, Crosshair, Activity, Fuel, Route,
  AlertTriangle, Gauge, Layers, Maximize2, Minimize2, X, Loader,
  Search, Filter, SortAsc,   Truck, MapPin, Navigation
} from 'lucide-react';
import { FleetTrackingService, computeFleetStats } from './FleetTrackingService';
import { VEHICLE_STATUS_CONFIG, ALERT_LABELS, DEFAULT_FLEET_FILTER } from './types';
import type { FleetVehicle, FleetStats, FleetFilter, VehicleStatus } from './types';
import { PlaceAutocomplete } from '../places/PlaceAutocomplete';
import type { PlaceResultExtended } from '../places/types';
import { FleetVehicleListView } from './FleetVehicleListView';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

let mapLoadPromise: Promise<void> | null = null;
function loadGoogleMapsForFleet(): Promise<void> {
  if (mapLoadPromise) return mapLoadPromise;
  mapLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const id = 'fleet-google-maps';
    if (document.getElementById(id)) {
      const check = () => window.google?.maps ? resolve() : setTimeout(check, 100);
      check(); return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=maps,marker,geometry&v=beta&loading=async&callback=initFleetMap`;
    (window as any).initFleetMap = () => { delete (window as any).initFleetMap; resolve(); };
    s.onerror = () => reject(new Error('Google Maps yüklenemedi'));
    document.head.appendChild(s);
  });
  return mapLoadPromise;
}

const MAP_STYLES: google.maps.MapOptions['styles'] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
];

const STATUS_KEYS: VehicleStatus[] = ['ON_ROUTE', 'WARNING', 'STANDBY', 'OFFLINE', 'IDLE', 'BREAK'];
const SORT_OPTIONS: { key: FleetFilter['sortBy']; label: string }[] = [
  { key: 'status', label: 'Durum' },
  { key: 'plate', label: 'Plaka' },
  { key: 'speed', label: 'Hız' },
  { key: 'progress', label: 'Rota' },
  { key: 'fuel', label: 'Yakıt' },
  { key: 'alerts', label: 'Uyarı' },
];

export const FleetTrackingModule: React.FC = () => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [moduleView, setModuleView] = useState<'tracking' | 'manage'>('tracking');
  const [filter, setFilter] = useState<FleetFilter>(DEFAULT_FLEET_FILTER);
  const [searchText, setSearchText] = useState('');
  const [showTrails, setShowTrails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeStops, setRouteStops] = useState<PlaceResultExtended[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersMap = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const trailLinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const initialized = useRef(false);
  const vehicleDataRef = useRef<FleetVehicle[]>([]);

  useEffect(() => {
    if (!GOOGLE_API_KEY) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    loadGoogleMapsForFleet().then(() => setMapsReady(true)).catch(e => setMapsError(e.message));
  }, []);

  useEffect(() => {
    const unsub = FleetTrackingService.subscribe((data) => {
      setVehicles(data);
      vehicleDataRef.current = data;
      setStats(computeFleetStats(data));
      if (initialized.current) updateMarkers(data);
    });
    FleetTrackingService.fetchVehicles('t-1001').then(data => {
      setVehicles(data); vehicleDataRef.current = data;
      setStats(computeFleetStats(data));
      setLoading(false);
    });
    return () => { unsub(); FleetTrackingService.cleanup(); };
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || initialized.current) return;
    initialized.current = true;
    const gm = window.google.maps;
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 41.092, lng: 29.088 }, zoom: 12,
      mapId: GOOGLE_MAP_ID || undefined,
      mapTypeId: 'roadmap',
      disableDefaultUI: true, gestureHandling: 'greedy', backgroundColor: '#0f172a',
    };
    if (!GOOGLE_MAP_ID) mapOptions.styles = MAP_STYLES;
    mapInstance.current = new gm.Map(mapRef.current, mapOptions);
    mapInstance.current.addListener('click', () => setSelectedVehicleId(null));
    if (vehicleDataRef.current.length > 0) createMarkers(vehicleDataRef.current);
  }, [mapsReady]);

  useEffect(() => { setFilter(f => ({ ...f, showTrails })); }, [showTrails]);

  const createMarker = useCallback((vehicle: FleetVehicle, map: google.maps.Map) => {
    const gm = window.google.maps;
    const { AdvancedMarkerElement } = gm.marker;
    const el = document.createElement('div');
    const alertDot = vehicle.alerts.some(a => !a.acknowledged)
      ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-ping"></span><span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>'
      : '';
    const pulse = vehicle.status === 'ON_ROUTE' ? 'animate-pulse shadow-[0_0_16px_rgba(52,211,153,0.4)]' : '';
    el.innerHTML = `
      <div class="relative cursor-pointer group">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 border-2 border-white/80 ${pulse}" style="background: ${vehicle.status === 'ON_ROUTE' ? 'linear-gradient(135deg, #059669, #10b981)' : vehicle.status === 'WARNING' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : vehicle.status === 'OFFLINE' ? 'linear-gradient(135deg, #6b7280, #9ca3af)' : 'linear-gradient(135deg, #334155, #475569)'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg>
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-md px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">${vehicle.plate}</div>
        ${alertDot}
      </div>`;
    const marker = new AdvancedMarkerElement({
      position: { lat: vehicle.position.lat, lng: vehicle.position.lng },
      map, content: el, title: vehicle.plate, zIndex: vehicle.status === 'WARNING' ? 100 : 10,
    });
    marker.addListener('gmp-click', () => setSelectedVehicleId(vehicle.id));
    return marker;
  }, []);

  const createMarkers = useCallback((data: FleetVehicle[]) => {
    if (!mapInstance.current) return;
    markersMap.current.forEach(m => m.map = null);
    markersMap.current.clear();
    trailLinesRef.current.forEach(l => l.setMap(null));
    trailLinesRef.current.clear();
    data.forEach(v => { const marker = createMarker(v, mapInstance.current!); markersMap.current.set(v.id, marker); });
  }, [createMarker]);

  const updateMarkers = useCallback((data: FleetVehicle[]) => {
    if (!mapInstance.current) return;
    const existingIds = new Set(data.map(v => v.id));
    markersMap.current.forEach((m, id) => { if (!existingIds.has(id)) { m.map = null; markersMap.current.delete(id); } });
    data.forEach(vehicle => {
      let marker = markersMap.current.get(vehicle.id);
      if (!marker) { marker = createMarker(vehicle, mapInstance.current!); markersMap.current.set(vehicle.id, marker); }
      else { marker.position = { lat: vehicle.position.lat, lng: vehicle.position.lng }; }
    });
    if (showTrails) updateTrails(data);
  }, [createMarker, showTrails]);

  const updateTrails = useCallback((data: FleetVehicle[]) => {
    if (!mapInstance.current) return;
    trailLinesRef.current.forEach(l => l.setMap(null));
    trailLinesRef.current.clear();
    const gm = window.google.maps;
    data.forEach(vehicle => {
      if (vehicle.trail.length < 2) return;
      const line = new gm.Polyline({
        path: vehicle.trail.map(t => ({ lat: t.lat, lng: t.lng })),
        strokeColor: vehicle.status === 'ON_ROUTE' ? '#10b981' : vehicle.status === 'WARNING' ? '#f59e0b' : '#64748b',
        strokeWeight: 3, strokeOpacity: 0.6, map: mapInstance.current!, zIndex: 1,
      });
      trailLinesRef.current.set(vehicle.id, line);
    });
  }, []);

  const filteredVehicles = useMemo(() => {
    let list = [...vehicles];
    if (filter.showAlertsOnly) list = list.filter(v => v.alerts.some(a => !a.acknowledged));
    if (filter.status.length > 0) list = list.filter(v => filter.status.includes(v.status));
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(v => v.plate.toLowerCase().includes(q) || v.driver.name.toLowerCase().includes(q) || v.route.name.toLowerCase().includes(q) || v.vin.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (filter.sortBy) {
        case 'plate': cmp = a.plate.localeCompare(b.plate); break;
        case 'speed': cmp = a.telemetry.speed - b.telemetry.speed; break;
        case 'status': cmp = STATUS_KEYS.indexOf(a.status) - STATUS_KEYS.indexOf(b.status); break;
        case 'progress': cmp = a.route.progress - b.route.progress; break;
        case 'fuel': cmp = a.telemetry.fuelLevel - b.telemetry.fuelLevel; break;
        case 'alerts': cmp = b.alerts.filter(x => !x.acknowledged).length - a.alerts.filter(x => !x.acknowledged).length; break;
      }
      return filter.sortOrder === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [vehicles, filter, searchText]);

  const toggleStatus = (s: VehicleStatus) => {
    setFilter(f => ({ ...f, status: f.status.includes(s) ? f.status.filter(x => x !== s) : [...f.status, s] }));
  };

  const selectedVehicle = selectedVehicleId ? vehicleDataRef.current.find(v => v.id === selectedVehicleId) : null;
  const activeAlerts = vehicles.reduce((a, v) => a + v.alerts.filter(al => !al.acknowledged).length, 0);

  const handleZoomTo = (vehicleId: string) => {
    const v = vehicleDataRef.current.find(v => v.id === vehicleId);
    if (v && mapInstance.current) { mapInstance.current.panTo({ lat: v.position.lat, lng: v.position.lng }); mapInstance.current.setZoom(15); setSelectedVehicleId(vehicleId); }
  };

  const handleFitAll = () => {
    if (mapInstance.current && vehicles.length > 0) {
      const bounds = new (window.google.maps.LatLngBounds)();
      vehicles.forEach(v => bounds.extend({ lat: v.position.lat, lng: v.position.lng }));
      mapInstance.current.fitBounds(bounds, 50);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 text-white overflow-hidden ${fullscreen ? 'fixed inset-0 z-[9999]' : 'min-h-[600px]'}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800/60 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 rounded-lg flex items-center justify-center"><Car className="w-4 h-4 text-emerald-400" /></div>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-sm font-bold">Filo Takip</h2>
              <p className="text-[9px] text-slate-500">{stats?.activeVehicles || 0}/{stats?.totalVehicles || 0} aktif • {filteredVehicles.length} araç</p>
            </div>
            <div className="flex gap-0.5 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/50 ml-2">
              <button onClick={() => setModuleView('tracking')} className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${moduleView === 'tracking' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Takip</button>
              <button onClick={() => setModuleView('manage')} className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${moduleView === 'manage' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Yönet</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowFilters(f => !f)} className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'} hover:bg-slate-700/60`}>
            <Filter className="w-3.5 h-3.5" />
          </button>
          <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
            <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><MapIcon className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => setShowAlerts(v => !v)} className={`p-2 rounded-lg transition-all relative ${showAlerts ? 'bg-red-600/20 border border-red-500/30' : 'bg-slate-800/60 border border-slate-700/50'} hover:bg-slate-700/60`}>
            <Bell className="w-3.5 h-3.5 text-slate-400" />
            {activeAlerts > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center">{activeAlerts}</span>}
          </button>
          <button onClick={() => setFullscreen(f => !f)} className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:bg-slate-700/60 transition-all">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 px-3 py-2 bg-slate-900/50 border-b border-slate-800/40 flex-shrink-0">
          {([
            { label: 'Aktif', value: stats.activeVehicles, icon: Car, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Uyarı', value: stats.warningVehicles, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Çevrimdışı', value: stats.offlineVehicles, icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Puan', value: stats.fleetScore, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Km', value: (stats.totalDistanceToday / 10).toFixed(0) + 'k', icon: Route, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Yakıt', value: stats.totalFuelUsed.toFixed(0) + 'L', icon: Fuel, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Ort. Hız', value: Math.round(stats.avgSpeed) + 'km', icon: Gauge, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Kritik', value: stats.criticalAlerts, icon: AlertTriangle, color: stats.criticalAlerts > 0 ? 'text-red-400' : 'text-slate-500', bg: stats.criticalAlerts > 0 ? 'bg-red-500/10' : 'bg-slate-500/10' },
          ] as const).map((s, i) => (
            <div key={i} className={`flex items-center gap-1.5 ${s.bg} rounded-lg px-2 py-1.5 border border-slate-800/60`}>
              <s.icon className={`w-3 h-3 ${s.color} flex-shrink-0`} />
              <div className="min-w-0"><p className={`text-[10px] font-bold ${s.color} truncate`}>{s.value}</p><p className="text-[7px] text-slate-600 truncate">{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-slate-800/40 bg-slate-900/80">
            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Plaka, sürücü veya rota ara..." className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-8 pr-3 py-2 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="flex flex-wrap gap-1">
                {STATUS_KEYS.map(s => {
                  const active = filter.status.includes(s);
                  const cfg = VEHICLE_STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => toggleStatus(s)} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 ${active ? cfg.color + ' ' + cfg.bgColor : 'text-slate-500 bg-slate-950 border border-slate-800/60 hover:border-slate-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dotColor : 'bg-slate-700'}`} />
                      {cfg.label}
                    </button>
                  );
                })}
                <button onClick={() => setFilter(f => ({ ...f, status: [] }))} className="px-2 py-1 rounded-lg text-[9px] text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all">
                  Temizle
                </button>
              </div>
              <div className="flex items-center gap-2">
                <SortAsc className="w-3 h-3 text-slate-500" />
                <select value={filter.sortBy} onChange={e => setFilter(f => ({ ...f, sortBy: e.target.value as FleetFilter['sortBy'] }))} className="bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1 text-[9px] text-slate-300 focus:outline-none focus:border-blue-500/50">
                  {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <button onClick={() => setFilter(f => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="px-2 py-1 rounded-lg text-[9px] bg-slate-950 border border-slate-700/60 text-slate-400 hover:text-white transition-all">
                  {filter.sortOrder === 'asc' ? '↑ Artan' : '↓ Azalan'}
                </button>
                <div className="flex-1" />
                <button onClick={() => setFilter(f => ({ ...f, showAlertsOnly: !f.showAlertsOnly }))} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${filter.showAlertsOnly ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-slate-950 text-slate-500 border border-slate-700/60 hover:border-slate-600'}`}>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />Sadece Uyarılar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {moduleView === 'tracking' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 relative ${viewMode === 'list' ? 'hidden' : ''}`}>
            {mapsError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-2"><MapIcon className="w-8 h-8 text-slate-700 mx-auto" /><p className="text-sm text-slate-500">{mapsError}</p></div>
              </div>
            ) : !mapsReady || loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-2"><Loader className="w-5 h-5 text-blue-400 animate-spin" /><p className="text-xs text-slate-500">Harita yükleniyor...</p></div>
              </div>
            ) : null}
            <div ref={mapRef} className="absolute inset-0" />
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <button onClick={handleFitAll} className="p-1.5 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-all"><Crosshair className="w-3.5 h-3.5 text-slate-300" /></button>
              <button onClick={() => setShowTrails(t => !t)} className={`p-1.5 backdrop-blur-sm border rounded-lg transition-all ${showTrails ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/90 border-slate-700/50 text-slate-400'} hover:bg-slate-800`}><Layers className="w-3.5 h-3.5" /></button>
              <button onClick={() => setShowRoutePlanner(r => !r)} className={`p-1.5 backdrop-blur-sm border rounded-lg transition-all ${showRoutePlanner ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-slate-900/90 border-slate-700/50 text-slate-400'} hover:bg-slate-800`}><MapPin className="w-3.5 h-3.5" /></button>
            </div>
            <div className="absolute bottom-2 left-2 z-10 flex gap-1.5 flex-wrap max-w-[80%]">
              {filteredVehicles.slice(0, 15).map(v => (
                <button key={v.id} onClick={() => handleZoomTo(v.id)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold backdrop-blur-sm border transition-all hover:scale-105 ${VEHICLE_STATUS_CONFIG[v.status].bgColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${VEHICLE_STATUS_CONFIG[v.status].dotColor}`} />{v.plate}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500"><Truck className="w-8 h-8 mb-2 opacity-30" /><p className="text-[10px]">Eşleşen araç bulunamadı</p></div>
              ) : filteredVehicles.map(v => (
                <button key={v.id} onClick={() => handleZoomTo(v.id)} className={`w-full p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${VEHICLE_STATUS_CONFIG[v.status].bgColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${VEHICLE_STATUS_CONFIG[v.status].dotColor}`} />
                      <span className="font-bold text-sm">{v.plate}</span>
                      <span className={`text-[10px] ${VEHICLE_STATUS_CONFIG[v.status].color}`}>{VEHICLE_STATUS_CONFIG[v.status].label}</span>
                      {v.alerts.some(a => !a.acknowledged) && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{v.telemetry.speed} km/h</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{v.driver.name}</span>
                    <span className="truncate max-w-[120px]">{v.route.name}</span>
                    <span>%{Math.round(v.route.progress)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showRoutePlanner && (
              <motion.div initial={{ opacity: 0, x: -300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }} className="absolute left-2 top-2 bottom-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400" />Rota Planla</h3>
                    <button onClick={() => setShowRoutePlanner(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div>
                    <p className="text-[9px] text-slate-500 font-semibold mb-1">Başlangıç</p>
                    <PlaceAutocomplete value={routeOrigin} onChange={setRouteOrigin} onSelect={(p) => { setRouteOrigin(p.formatted_address || p.name || ''); }} placeholder="Kalkış noktası..." inputClassName="!text-[10px] !py-1.5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-semibold mb-1">Varış</p>
                    <PlaceAutocomplete value={routeDestination} onChange={setRouteDestination} onSelect={(p) => { setRouteDestination(p.formatted_address || p.name || ''); }} placeholder="Varış noktası..." inputClassName="!text-[10px] !py-1.5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 font-semibold mb-1">Ara Duraklar ({routeStops.length})</p>
                    {routeStops.map((stop, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800/60 mb-1">
                        <span className="w-4 h-4 bg-blue-600/20 text-blue-400 rounded-full text-[8px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-[9px] text-slate-300 truncate flex-1">{stop.name}</span>
                        <button onClick={() => setRouteStops(s => s.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <PlaceAutocomplete value="" onChange={() => {}} onSelect={(p) => { setRouteStops(s => [...s, p]); }} placeholder="Durak ekle..." inputClassName="!text-[10px] !py-1.5" showIcon={false} />
                  </div>
                  {(routeOrigin || routeDestination || routeStops.length > 0) && (
                    <button className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all">
                      <Navigation className="w-3.5 h-3.5" />Rotayı Oluştur
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedVehicle && viewMode === 'map' && (
              <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="absolute right-2 top-2 bottom-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden">
                <div className={`p-3 border-b border-slate-800 ${VEHICLE_STATUS_CONFIG[selectedVehicle.status].bgColor}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${VEHICLE_STATUS_CONFIG[selectedVehicle.status].dotColor}`} />
                        <h3 className="font-bold text-sm">{selectedVehicle.plate}</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.year}</p>
                    </div>
                    <button onClick={() => setSelectedVehicleId(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold ${VEHICLE_STATUS_CONFIG[selectedVehicle.status].color} ${VEHICLE_STATUS_CONFIG[selectedVehicle.status].bgColor}`}>
                    {VEHICLE_STATUS_CONFIG[selectedVehicle.status].label}
                    {selectedVehicle.status === 'ON_ROUTE' && ` • ${selectedVehicle.telemetry.speed} km/h`}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[10px]">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Hız', value: `${selectedVehicle.telemetry.speed} km/h`, icon: Gauge },
                      { label: 'Yakıt', value: `%${selectedVehicle.telemetry.fuelLevel}`, icon: Fuel },
                      { label: 'Rota', value: `%${Math.round(selectedVehicle.route.progress)}`, icon: Route },
                      { label: 'Motor', value: `${selectedVehicle.telemetry.rpm} rpm`, icon: Activity },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                        <div className="flex items-center gap-1 text-slate-500 mb-0.5"><s.icon className="w-3 h-3" /><span>{s.label}</span></div>
                        <p className="font-bold text-white text-xs">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                    <p className="text-slate-400 font-semibold mb-1 text-[10px]">Sürücü</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{selectedVehicle.driver.name.charAt(0)}</div>
                      <div><p className="text-white font-bold text-[10px]">{selectedVehicle.driver.name}</p><p className="text-slate-500 text-[9px]">{selectedVehicle.driver.phone}</p></div>
                    </div>
                    <div className="flex gap-2 mt-1.5 text-[9px] text-slate-500">
                      <span>{selectedVehicle.driver.totalTrips} sefer</span>
                      <span>★ {selectedVehicle.driver.rating}</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                    <p className="text-slate-400 font-semibold mb-1 text-[10px]">Rota</p>
                    <p className="text-white font-bold text-[10px]">{selectedVehicle.route.name}</p>
                    <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${selectedVehicle.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${selectedVehicle.route.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>{selectedVehicle.route.completedStops}/{selectedVehicle.route.stopCount} durak</span>
                      <span>{selectedVehicle.route.nextStopEta}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">Sıradaki: {selectedVehicle.route.nextStop}</p>
                  </div>
                  {selectedVehicle.alerts.filter(a => !a.acknowledged).length > 0 && (
                    <div className="bg-red-950/30 rounded-lg p-2 border border-red-800/60">
                      <p className="text-red-400 font-semibold mb-1 flex items-center gap-1"><Bell className="w-3 h-3" />Uyarılar</p>
                      {selectedVehicle.alerts.filter(a => !a.acknowledged).map(a => (
                        <div key={a.id} className="flex items-start gap-1.5 py-1">
                          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div><p className="text-[9px] text-slate-300">{ALERT_LABELS[a.type]}: {a.message}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-800 bg-slate-950/50 flex gap-1.5">
                  <button onClick={() => handleZoomTo(selectedVehicle.id)} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold transition-all">Haritada Göster</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <FleetVehicleListView />
        </div>
      )}

      <AnimatePresence>
        {showAlerts && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute top-12 right-3 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl z-30 max-h-[400px] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900/95 p-3 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400" />Uyarılar ({activeAlerts})</h3>
              <button onClick={() => setShowAlerts(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="w-3 h-3" /></button>
            </div>
            <div className="p-2 space-y-1">
              {vehicles.filter(v => v.alerts.some(a => !a.acknowledged)).length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-[10px]">Aktif uyarı yok</div>
              ) : vehicles.filter(v => v.alerts.some(a => !a.acknowledged)).flatMap(v => v.alerts.filter(a => !a.acknowledged).map(a => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-800/40 transition-all cursor-pointer" onClick={() => { handleZoomTo(v.id); setShowAlerts(false); }}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}`}><AlertTriangle className="w-3 h-3" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-white truncate">{ALERT_LABELS[a.type]}</p>
                    <p className="text-[9px] text-slate-400 truncate">{a.message}</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">{v.plate} • {new Date(a.timestamp).toLocaleTimeString('tr-TR')}</p>
                  </div>
                </div>
              )))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
