import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Maximize2, Minimize2, List, X, CheckCircle2 } from 'lucide-react';
import { NavigationApi, NavigationHUD, ManeuverList, NavigationProgress, VoiceToast, ManeuverIcon, formatDuration } from '../navigation-core';
import type { NavigationRoute, NavigationState } from '../navigation-core';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const VEHICLE_ICON = L.divIcon({
  className: '',
  html: `<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white shadow-[0_0_16px_rgba(59,130,246,0.8)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg></div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const STOP_ICON = L.divIcon({
  className: '',
  html: `<div class="w-6 h-6 bg-purple-600 border-2 border-purple-300 rounded-full shadow-[0_0_12px_rgba(147,51,234,0.5)] flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
});

const PASSED_ICON = L.divIcon({
  className: '',
  html: `<div class="w-6 h-6 bg-emerald-600 border-2 border-emerald-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
});

interface VehicleMarkerProps { position: [number, number]; heading: number; }
const VehicleMarker: React.FC<VehicleMarkerProps> = ({ position, heading }) => {
  const markerRef = useRef<L.Marker>(null);
  useEffect(() => {
    markerRef.current?.setLatLng(position);
  }, [position, heading]);
  return <Marker ref={markerRef} position={position} icon={VEHICLE_ICON} zIndexOffset={1000}>
    <Popup><span className="text-xs font-bold">34 AB 1234 • {Math.round(heading)}°</span></Popup>
  </Marker>;
};

interface FitBoundsProps { bounds: [[number, number], [number, number]]; }
const FitBoundsOnLoad: React.FC<FitBoundsProps> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 }); }, [map, bounds]);
  return null;
};

export const LeafletNavigationModule: React.FC = () => {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [navState, setNavState] = useState<NavigationState>({
    status: 'idle', currentManeuverIndex: 0, currentStopIndex: 0,
    speed: 0, heading: 0, progressPercent: 0,
    remainingDistance: 0, remainingDuration: 0, elapsedTime: 0,
    currentPosition: [41.0880, 29.0880],
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManeuvers, setShowManeuvers] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const simRef = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => { NavigationApi.getRoute('nr1').then(setRoute); }, []);

  const totalPolyline = useMemo(() => route?.polyline || [], [route]);

  const speak = useCallback((text: string) => {
    setVoiceText(text);
    setTimeout(() => setVoiceText(null), 3500);
  }, []);

  const startNavigation = useCallback(() => {
    if (!route) return;
    setIsNavigating(true);
    setNavState(prev => ({ ...prev, status: 'navigating' }));
    progressRef.current = 0;
    const startTime = Date.now();
    speak('Navigasyon başlatıldı. İlk durağa doğru ilerleyin.');

    const simulate = () => {
      progressRef.current = Math.min(1, progressRef.current + 0.003 + Math.random() * 0.004);
      const idx = Math.floor(progressRef.current * totalPolyline.length);
      const pos = totalPolyline[Math.min(idx, totalPolyline.length - 1)];
      if (!pos) return;
      const nextIdx = Math.min(idx + 3, totalPolyline.length - 1);
      const nextPos = totalPolyline[nextIdx];
      const heading = nextPos ? Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]) * (180 / Math.PI) : 0;
      const maneuverIdx = Math.min(Math.floor(progressRef.current * route.maneuvers.length), route.maneuvers.length - 1);
      const remaining = route.totalDistance * (1 - progressRef.current);
      const elapsed = (Date.now() - startTime) / 1000;
      const remainingTime = route.totalDuration * (1 - progressRef.current);
      const stopIdx = Math.min(Math.floor(progressRef.current * route.stops.length), route.stops.length - 1);

      setNavState({
        status: 'navigating', currentManeuverIndex: maneuverIdx, currentStopIndex: stopIdx,
        speed: 28 + Math.sin(progressRef.current * 20) * 12 + Math.random() * 6, heading,
        progressPercent: Math.round(progressRef.current * 100), remainingDistance: remaining,
        remainingDuration: remainingTime, elapsedTime: elapsed, currentPosition: pos,
      });

      if (maneuverIdx > 0 && maneuverIdx < route.maneuvers.length && Math.random() < 0.008) {
        speak(route.maneuvers[maneuverIdx].instruction);
      }

      if (progressRef.current < 1) { simRef.current = requestAnimationFrame(simulate); }
      else { setNavState(prev => ({ ...prev, status: 'arrived' })); setIsNavigating(false); }
    };
    simRef.current = requestAnimationFrame(simulate);
  }, [route, totalPolyline, speak]);

  const stopNavigation = useCallback(() => {
    cancelAnimationFrame(simRef.current);
    setIsNavigating(false);
    setNavState(prev => ({ ...prev, status: 'idle', speed: 0 }));
  }, []);

  useEffect(() => () => cancelAnimationFrame(simRef.current), []);

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Rota yükleniyor...</p>
        </div>
      </div>
    );
  }

  const allCoords = route.polyline;
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...allCoords.map(c => c[0])) - 0.005, Math.min(...allCoords.map(c => c[1])) - 0.005],
    [Math.max(...allCoords.map(c => c[0])) + 0.005, Math.max(...allCoords.map(c => c[1])) + 0.005],
  ];

  return (
    <div className={`relative bg-slate-950 text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'min-h-screen'}`}>
      <div className="absolute inset-0">
        <MapContainer center={navState.currentPosition} zoom={14} className="w-full h-full" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <FitBoundsOnLoad bounds={bounds} />
          <Polyline positions={allCoords} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} />
          <Polyline positions={allCoords.slice(0, Math.floor(progressRef.current * allCoords.length) || 1)} pathOptions={{ color: '#10b981', weight: 5, opacity: 1 }} />
          {route.stops.map((stop, i) => (
            <Marker key={stop.id} position={stop.coordinates} icon={i < navState.currentStopIndex ? PASSED_ICON : STOP_ICON}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">{stop.name}</p>
                  <p className="text-slate-600">{stop.address}</p>
                  <p className="text-slate-500">ETA: {stop.eta}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          <VehicleMarker position={navState.currentPosition} heading={navState.heading} />
        </MapContainer>
      </div>

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent p-3 pb-8 z-10">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <Navigation className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">{route.name}</h2>
                <p className="text-[9px] text-slate-400">{route.vehiclePlate} • {route.driverName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIsFullscreen(f => !f)} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-all">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>
          <NavigationHUD state={navState} route={route} />
          {route.maneuvers[navState.currentManeuverIndex] && (
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <ManeuverIcon icon={route.maneuvers[navState.currentManeuverIndex].icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{route.maneuvers[navState.currentManeuverIndex].instruction}</p>
                <p className="text-[9px] text-slate-400">{route.maneuvers[navState.currentManeuverIndex].streetName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent pt-8 z-10">
        <div className="max-w-6xl mx-auto px-3 pb-3 space-y-2">
          <NavigationProgress state={navState} route={route} />
          <div className="flex items-center gap-1.5">
            {!isNavigating ? (
              <button onClick={startNavigation} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                <Navigation className="w-4 h-4" /><span>Navigasyonu Başlat</span>
              </button>
            ) : (
              <button onClick={stopNavigation} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-xs font-bold flex items-center justify-center gap-2 text-red-400">
                <X className="w-4 h-4" /><span>Durdur</span>
              </button>
            )}
            <button onClick={() => setShowManeuvers(v => !v)} className={`p-3 rounded-xl text-xs font-bold transition-all ${showManeuvers ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showManeuvers && route && (
        <ManeuverList route={route} state={navState} isNavigating={isNavigating} onClose={() => setShowManeuvers(false)} />
      )}

      <VoiceToast text={voiceText} />

      {navState.status === 'arrived' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Rota Tamamlandı</h2>
            <p className="text-sm text-slate-400">{formatDuration(navState.elapsedTime)} sürede {route.stops.length} durak ziyaret edildi</p>
            <button onClick={stopNavigation} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold shadow-lg">Gösterge Paneline Dön</button>
          </div>
        </div>
      )}
    </div>
  );
};
