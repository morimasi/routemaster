import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation, Maximize2, Minimize2, List, X, CheckCircle2, Key, MapPin, Gauge, Clock, Route, Volume2, Crosshair, Navigation2 } from 'lucide-react';
import type { NavigationRoute } from '../navigation-core';
import { NavigationApi, formatDistance, formatDuration } from '../navigation-core';

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY || '';

interface GpsPosition { lat: number; lng: number; speed: number; heading: number; accuracy: number; timestamp: number; }
interface RouteStop { id: string; name: string; address: string; lat: number; lng: number; seq: number; eta: string; passed: boolean; }
interface Maneuver { id: string; instruction: string; distance: number; duration: number; streetName: string; lat: number; lng: number; }

const STOP_RADIUS_M = 80;

function loadHereMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).H) { resolve(); return; }
    const id = 'hm-script';
    if (document.getElementById(id)) { const c = () => (window as any).H ? resolve() : setTimeout(c, 100); c(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://js.api.here.com/v3/3.1/mapsjs-core.js?api-key=${HERE_API_KEY}`;
    s.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://js.api.here.com/v3/3.1/mapsjs-service.js';
      s2.onload = () => resolve();
      s2.onerror = () => reject(new Error('HERE Service yüklenemedi'));
      document.head.appendChild(s2);
    };
    s.onerror = () => reject(new Error('HERE Maps yüklenemedi'));
    document.head.appendChild(s);
  });
}

export const HereNavigationModule: React.FC = () => {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [currentManeuverIdx, setCurrentManeuverIdx] = useState(0);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManeuvers, setShowManeuvers] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'navigating' | 'arrived'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [remainingDist, setRemainingDist] = useState(0);
  const [remainingDur, setRemainingDur] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const platformRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const stopMarkers: any[] = [];
  const watchId = useRef(0);
  const navStart = useRef(0);
  const gpsPosRef = useRef<GpsPosition | null>(null);
  const mapInitDone = useRef(false);

  useEffect(() => {
    if (!HERE_API_KEY) { setMapsError('HERE API anahtarı gerekli'); return; }
    loadHereMaps().then(() => setMapsReady(true)).catch(e => setMapsError(e.message));
    NavigationApi.getRoute('nr1').then(r => {
      setRoute(r);
      setStops(r.stops.map(s => ({ ...s, lat: s.coordinates[0], lng: s.coordinates[1], passed: false })));
    });
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) { setMapsError('GPS desteklenmiyor'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const g: GpsPosition = { lat: p.coords.latitude, lng: p.coords.longitude, speed: p.coords.speed || 0, heading: p.coords.heading || 0, accuracy: p.coords.accuracy, timestamp: p.timestamp };
        setGps(g); gpsPosRef.current = g;
      },
      (e) => setMapsError(`GPS: ${e.message}`),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(watchId.current);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInitDone.current || !(window as any).H) return;
    mapInitDone.current = true;
    const H = (window as any).H;
    platformRef.current = new H.service.Platform({ apikey: HERE_API_KEY });
    const layers = platformRef.current.createDefaultLayers();
    mapInstance.current = new H.Map(mapRef.current, layers.vector.normal.map, {
      center: { lat: 41.088, lng: 29.088 }, zoom: 14, padding: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    new H.mapevents.Behavior(new H.mapevents.MapEvents(mapInstance.current));
    H.ui.UI.createDefault(mapInstance.current, layers);
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || !mapInstance.current || stops.length === 0) return;
    const H = (window as any).H;
    stopMarkers.forEach((m: any) => mapInstance.current.removeObject(m));
    stopMarkers.length = 0;
    stops.forEach((s, i) => {
      const marker = new H.map.Marker({ lat: s.lat, lng: s.lng }, {
        icon: new H.map.Icon(s.passed
          ? `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981" stroke="#6ee7b7" stroke-width="2"/><polyline points="8,12 11,15 16,9" fill="none" stroke="white" stroke-width="2"/></svg>`
          : `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#7c3aed" stroke="#a78bfa" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${i + 1}</text></svg>`),
        data: s.name,
      });
      mapInstance.current.addObject(marker);
      stopMarkers.push(marker);
    });
  }, [mapsReady, stops]);

  useEffect(() => {
    if (!mapsReady || !mapInstance.current || !gps) return;
    const H = (window as any).H;
    if (userMarkerRef.current) {
      userMarkerRef.current.setGeometry({ lat: gps.lat, lng: gps.lng });
    } else {
      userMarkerRef.current = new H.map.Marker({ lat: gps.lat, lng: gps.lng }, {
        icon: new H.map.Icon(`<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/></svg>`),
      });
      mapInstance.current.addObject(userMarkerRef.current);
    }
  }, [mapsReady, gps]);

  const calcRoute = useCallback(async (from: GpsPosition) => {
    const waypoints = stops.slice(currentStopIdx).map(s => `${s.lat},${s.lng}`).join(';');
    if (!waypoints) return;
    try {
      const resp = await fetch(`https://router.hereapi.com/v8/routes?origin=${from.lat},${from.lng}&destination=${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}&transportMode=car&return=summary,polyline,instructions&apikey=${HERE_API_KEY}&lang=tr-TR`);
      const data = await resp.json();
      if (!data.routes?.[0]) return;
      const r = data.routes[0];
      const sections = r.sections || [];
      const allSteps: Maneuver[] = [];
      let totalDist = 0, totalDur = 0;
      sections.forEach((sec: any, si: number) => {
        totalDist += sec.summary?.length || 0;
        totalDur += sec.summary?.duration || 0;
        (sec.instructions || sec.steps || sec.actions || []).forEach((step: any, sti: number) => {
          const text = step.instruction || step.text || step.action || '';
          allSteps.push({
            id: `h_${si}_${sti}`, instruction: text,
            distance: step.length || step.distance || 0,
            duration: step.duration || 0, streetName: step.streetName || '',
            lat: (step.startLocation || step.position || {}).lat || from.lat,
            lng: (step.startLocation || step.position || {}).lng || from.lng,
          });
        });
      });
      setManeuvers(allSteps);
      setCurrentManeuverIdx(0);
      setRemainingDist(totalDist);
      setRemainingDur(totalDur);

      const H = (window as any).H;
      if (routeLineRef.current) mapInstance.current.removeObject(routeLineRef.current);
      const polylinePoints = sections.flatMap((sec: any) => {
        if (sec.polyline) {
          const decoded = decodeFlexiblePolyline(sec.polyline);
          return decoded.map((p: [number, number]) => ({ lat: p[0], lng: p[1] }));
        }
        return [];
      });
      if (polylinePoints.length > 0) {
        routeLineRef.current = new H.map.Polyline(new H.geo.LineString(polylinePoints.flatMap((p: any) => [p.lat, p.lng])), {
          style: { strokeColor: '#3b82f6', lineWidth: 5, strokeOpacity: 0.9 },
        });
        mapInstance.current.addObject(routeLineRef.current);
        mapInstance.current.getViewModel().setLookAtData({ bounds: routeLineRef.current.getBoundingBox() });
      }
    } catch (e) {
      console.error('HERE routing error', e);
    }
  }, [stops, currentStopIdx]);

  const startNavigation = useCallback(() => {
    if (!gps || stops.length === 0) return;
    setIsNavigating(true); setStatus('navigating'); setCurrentStopIdx(0); navStart.current = Date.now();
    calcRoute(gps);
    speak('HERE navigasyon başlatıldı.');
    const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - navStart.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [gps, stops, calcRoute]);

  useEffect(() => {
    if (!isNavigating || !gps || currentStopIdx >= stops.length) return;
    const current = stops[currentStopIdx];
    const dist = haversine(gps.lat, gps.lng, current.lat, current.lng);
    if (dist < STOP_RADIUS_M) {
      setStops(prev => prev.map((s, i) => i === currentStopIdx ? { ...s, passed: true } : s));
      speak(`${current.name} durağına varıldı.`);
      const nextIdx = currentStopIdx + 1;
      if (nextIdx >= stops.length) { setStatus('arrived'); setIsNavigating(false); speak('Rota tamamlandı!'); }
      else { setCurrentStopIdx(nextIdx); if (gpsPosRef.current) calcRoute(gpsPosRef.current); }
    }
    const mIdx = maneuvers.findIndex(m => haversine(gps.lat, gps.lng, m.lat, m.lng) < 30);
    if (mIdx >= 0 && mIdx !== currentManeuverIdx) setCurrentManeuverIdx(mIdx);
    setProgress(Math.min(100, Math.round((1 - remainingDist / (route?.totalDistance || 1)) * 100)));
  }, [isNavigating, gps, currentStopIdx, stops, maneuvers, currentManeuverIdx, remainingDist, route]);

  const speak = useCallback((text: string) => {
    setVoiceText(text);
    if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.rate = 0.9; window.speechSynthesis.speak(u); }
    setTimeout(() => setVoiceText(null), 4000);
  }, []);

  const stopNav = useCallback(() => { setIsNavigating(false); setStatus('idle'); if (routeLineRef.current) mapInstance.current?.removeObject(routeLineRef.current); }, []);

  const speedKmh = gps ? Math.round(gps.speed * 3.6) : 0;
  const currentStop = stops[currentStopIdx];

  if (mapsError) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <Key className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold">HERE API Anahtarı Gerekli</h2>
        <p className="text-sm text-slate-400">.env.local dosyasına VITE_HERE_API_KEY ekleyin</p>
      </div>
    </div>
  );

  return (
    <div className={`relative bg-slate-950 text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'min-h-screen'}`}>
      <div ref={mapRef} className="absolute inset-0" />

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent p-3 pb-8 z-10">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-orange-600/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                <Navigation className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">HERE Navigasyon</h2>
                <p className="text-[9px] text-slate-400">HERE Maps • {gps ? 'GPS Aktif' : 'GPS Bekleniyor...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => gps && mapInstance.current?.setCenter({ lat: gps.lat, lng: gps.lng })} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60">
                <Crosshair className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button onClick={() => setIsFullscreen(f => !f)} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500"><Gauge className="w-3 h-3 inline" /> Hız</p>
              <p className="text-lg font-bold text-blue-400 font-mono">{speedKmh}</p>
              <p className="text-[8px] text-slate-600">km/h</p>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500"><Clock className="w-3 h-3 inline" /> Kalan</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{formatDuration(remainingDur)}</p>
              <p className="text-[8px] text-slate-600">{formatDistance(remainingDist)}</p>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center col-span-2">
              <p className="text-[9px] text-slate-500"><MapPin className="w-3 h-3 inline" /> Sonraki Durak</p>
              <p className="text-sm font-bold text-white truncate">{currentStop?.name || '—'}</p>
              <p className="text-[8px] text-slate-600 truncate">{currentStop?.address || 'Varış'}</p>
            </div>
          </div>

          {maneuvers[currentManeuverIdx] && (
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600/30 to-red-600/30 border border-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Navigation2 className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{maneuvers[currentManeuverIdx].instruction}</p>
                <p className="text-[9px] text-slate-400">{formatDistance(maneuvers[currentManeuverIdx].distance)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent pt-8 z-10">
        <div className="max-w-6xl mx-auto px-3 pb-3 space-y-2">
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2">
            <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1.5">
              <span>İlerleme</span>
              <span className="font-mono font-bold text-emerald-400">%{progress}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[8px] text-slate-600 mt-1">
              <span>{stops.filter(s => s.passed).length}/{stops.length} durak</span>
              <span>{formatDuration(elapsedTime)} geçti</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            {!isNavigating ? (
              <button onClick={startNavigation} disabled={!gps} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 disabled:opacity-40">
                <Navigation className="w-4 h-4" />
                <span>{gps ? 'Navigasyonu Başlat' : 'GPS bekleniyor...'}</span>
              </button>
            ) : (
              <button onClick={stopNav} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-xs font-bold flex items-center justify-center gap-2 text-red-400">
                <X className="w-4 h-4" /><span>Durdur</span>
              </button>
            )}
            <button onClick={() => setShowManeuvers(v => !v)} className={`p-3 rounded-xl transition-all ${showManeuvers ? 'bg-orange-600/20 border border-orange-500/30 text-orange-400' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showManeuvers && maneuvers.length > 0 && (
        <div className="absolute top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/80 z-20 overflow-y-auto">
          <div className="sticky top-0 bg-slate-900/95 p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold flex items-center gap-2"><Route className="w-3.5 h-3.5 text-orange-400" />Manevralar</h3>
            <button onClick={() => setShowManeuvers(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2 space-y-0.5">
            {maneuvers.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${i === currentManeuverIdx && isNavigating ? 'bg-orange-600/15 border border-orange-500/30' : i < currentManeuverIdx ? 'opacity-40' : 'hover:bg-slate-800/40'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${i === currentManeuverIdx && isNavigating ? 'bg-orange-600 text-white' : i < currentManeuverIdx ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {i < currentManeuverIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate">{m.instruction}</p>
                  <p className="text-[8px] text-slate-500">{formatDistance(m.distance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {voiceText && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl max-w-xs w-full">
          <Volume2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-[10px] text-white font-medium">{voiceText}</p>
        </div>
      )}

      {status === 'arrived' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold">Rota Tamamlandı</h2>
            <p className="text-sm text-slate-400">{formatDuration(elapsedTime)} sürede {stops.length} durak</p>
            <button onClick={stopNav} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; const dLat = (lat2 - lat1) * Math.PI / 180; const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodeFlexiblePolyline(encoded: string): [number, number][] {
  try {
    const parts = encoded.split(',');
    const coords: [number, number][] = [];
    for (let i = 0; i < parts.length - 1; i += 2) {
      coords.push([parseFloat(parts[i]), parseFloat(parts[i + 1])]);
    }
    return coords;
  } catch { return []; }
}
