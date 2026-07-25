import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation, Maximize2, Minimize2, List, X, CheckCircle2, Key, MapPin, Gauge, Clock, Route, Volume2, Crosshair, Navigation2 } from 'lucide-react';
import type { NavigationRoute } from '../navigation-core';
import { NavigationApi, formatDistance, formatDuration } from '../navigation-core';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const id = 'gm-nav-script';
    if (document.getElementById(id)) {
      const c = () => window.google?.maps ? resolve() : setTimeout(c, 100); c(); return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=maps,marker,routes&v=beta&loading=async&callback=initNavMap`;
    (window as any).initNavMap = () => {
      delete (window as any).initNavMap;
      resolve();
    };
    s.onerror = () => reject(new Error('Google Maps yüklenemedi'));
    document.head.appendChild(s);
  });
}

const STOP_RADIUS_M = 80;
const WAYPOINT_LIMIT = 23;

interface GpsPosition {
  lat: number; lng: number; speed: number; heading: number; accuracy: number; timestamp: number;
}

interface RouteStop {
  id: string; name: string; address: string; lat: number; lng: number; seq: number; eta: string; passed: boolean;
}

interface Maneuver {
  id: string; instruction: string; distance: number; duration: number; streetName: string; icon: string; lat: number; lng: number;
}

export const GoogleNavigationModule: React.FC = () => {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [currentManeuverIdx, setCurrentManeuverIdx] = useState(0);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showManeuvers, setShowManeuvers] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'navigating' | 'arrived'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const userCircleRef = useRef<google.maps.Circle | null>(null);
  const watchId = useRef<number>(0);
  const navStart = useRef(0);
  const gpsPosRef = useRef<GpsPosition | null>(null);
  const stopMarkers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const mapInitDone = useRef(false);
  const [progress, setProgress] = useState(0);
  const [remainingDist, setRemainingDist] = useState(0);
  const [remainingDur, setRemainingDur] = useState(0);

  useEffect(() => {
    if (!GOOGLE_API_KEY) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    loadGoogleMaps().then(() => setMapsReady(true)).catch(e => setMapsError(e.message));
    NavigationApi.getRoute('nr1').then(r => {
      setRoute(r);
      setStops(r.stops.map(s => ({ ...s, lat: s.coordinates[0], lng: s.coordinates[1], passed: false })));
    });
  }, []);

  useEffect(() => {
    if (!GOOGLE_API_KEY || !('geolocation' in navigator)) { setGpsError('GPS desteklenmiyor'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const g: GpsPosition = {
          lat: p.coords.latitude, lng: p.coords.longitude,
          speed: p.coords.speed || 0, heading: p.coords.heading || 0,
          accuracy: p.coords.accuracy, timestamp: p.timestamp,
        };
        setGps(g); gpsPosRef.current = g;
      },
      (e) => setGpsError(`GPS hatası: ${e.message}`),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(watchId.current);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInitDone.current) return;
    mapInitDone.current = true;
    const gm = window.google.maps;
    mapInstance.current = new gm.Map(mapRef.current, {
      center: { lat: 41.088, lng: 29.088 }, zoom: 14,
      mapId: GOOGLE_MAP_ID || undefined,
      disableDefaultUI: true, gestureHandling: 'greedy', backgroundColor: '#0f172a',
      styles: MAP_STYLES,
    });
    rendererRef.current = new gm.DirectionsRenderer({
      map: mapInstance.current,
      polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 5, strokeOpacity: 0.9 },
      suppressMarkers: true,
      suppressInfoWindows: true,
    });
    mapInstance.current.addListener('click', () => setShowManeuvers(false));
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || !mapInstance.current || stops.length === 0) return;
    stopMarkers.current.forEach(m => m.map = null);
    stopMarkers.current = [];
    const { AdvancedMarkerElement } = window.google.maps.marker;
    stops.forEach((s, i) => {
      const el = document.createElement('div');
      const passed = s.passed;
      el.innerHTML = passed
        ? `<div class="w-6 h-6 bg-emerald-600 border-2 border-emerald-300 rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg><div class="absolute -bottom-4 text-[7px] font-bold text-emerald-400 whitespace-nowrap">${s.name}</div></div>`
        : `<div class="w-6 h-6 bg-purple-600 border-2 border-purple-300 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30 animate-pulse"><span class="text-[9px] font-bold text-white">${i + 1}</span><div class="absolute -bottom-4 text-[7px] font-bold text-white whitespace-nowrap">${s.name}</div></div>`;
      const m = new AdvancedMarkerElement({ position: { lat: s.lat, lng: s.lng }, map: mapInstance.current!, content: el });
      stopMarkers.current.push(m);
    });
  }, [mapsReady, stops]);

  useEffect(() => {
    if (!mapsReady || !mapInstance.current || !gps) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.position = { lat: gps.lat, lng: gps.lng };
    } else {
      const { AdvancedMarkerElement } = window.google.maps.marker;
      const el = document.createElement('div');
      el.innerHTML = `<div class="w-5 h-5 bg-blue-500 border-3 border-white rounded-full shadow-[0_0_16px_rgba(59,130,246,0.8)]"></div>`;
      userMarkerRef.current = new AdvancedMarkerElement({ position: { lat: gps.lat, lng: gps.lng }, map: mapInstance.current, content: el });
    }
    if (userCircleRef.current) {
      userCircleRef.current.setCenter({ lat: gps.lat, lng: gps.lng });
      userCircleRef.current.setRadius(gps.accuracy);
    } else {
      userCircleRef.current = new window.google.maps.Circle({
        center: { lat: gps.lat, lng: gps.lng }, radius: gps.accuracy,
        fillColor: '#3b82f6', fillOpacity: 0.08, strokeColor: '#3b82f6', strokeOpacity: 0.2, strokeWeight: 1,
        map: mapInstance.current,
      });
    }
  }, [mapsReady, gps]);

  const calcRoute = useCallback((from: GpsPosition, toStops: RouteStop[], idx: number) => {
    if (!mapsReady || !rendererRef.current || !window.google?.maps) return;
    const gm = window.google.maps;
    if (idx >= toStops.length) { setStatus('arrived'); setIsNavigating(false); return; }
    const waypoints = toStops.slice(idx, idx + Math.min(WAYPOINT_LIMIT, toStops.length - idx)).map(s => ({
      location: new gm.LatLng(s.lat, s.lng), stopover: true,
    }));
    const svc = new gm.DirectionsService();
    svc.route({
      origin: new gm.LatLng(from.lat, from.lng),
      destination: waypoints[waypoints.length - 1].location,
      waypoints: waypoints.slice(0, -1),
      travelMode: gm.TravelMode.DRIVING,
    }, (result, status) => {
      if (status !== 'OK' || !result) return;
      rendererRef.current!.setDirections(result);
      const steps: Maneuver[] = [];
      result.routes[0].legs.forEach((leg, li) => {
        leg.steps.forEach((step, si) => {
          steps.push({
            id: `m_${li}_${si}`, instruction: step.instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance?.value || 0, duration: step.duration?.value || 0,
            streetName: (step as any).street_name || '',
            icon: step.maneuver || 'straight',
            lat: step.start_location.lat(), lng: step.start_location.lng(),
          });
        });
      });
      setManeuvers(steps);
      setCurrentManeuverIdx(0);
      const totalDist = result.routes[0].legs.reduce((a, l) => a + (l.distance?.value || 0), 0);
      const totalDur = result.routes[0].legs.reduce((a, l) => a + (l.duration?.value || 0), 0);
      setRemainingDist(totalDist); setRemainingDur(totalDur);
    });
  }, [mapsReady]);

  const startNavigation = useCallback(() => {
    if (!gps || stops.length === 0) return;
    setIsNavigating(true); setStatus('navigating'); setCurrentStopIdx(0); navStart.current = Date.now();
    calcRoute(gps, stops, 0);
    speak('Navigasyon başlatıldı, ilk durağa yönelin.');
    const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - navStart.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [gps, stops, calcRoute]);

  useEffect(() => {
    if (!isNavigating || !gps || stops.length === 0 || currentStopIdx >= stops.length) return;
    const current = stops[currentStopIdx];
    const dist = haversine(gps.lat, gps.lng, current.lat, current.lng);
    if (dist < STOP_RADIUS_M) {
      setStops(prev => prev.map((s, i) => i === currentStopIdx ? { ...s, passed: true } : s));
      speak(`${current.name} durağına varıldı.`);
      const nextIdx = currentStopIdx + 1;
      if (nextIdx >= stops.length) {
        setStatus('arrived'); setIsNavigating(false);
        speak('Tüm duraklar tamamlandı. Rota bitti.');
      } else {
        setCurrentStopIdx(nextIdx);
        if (gpsPosRef.current) calcRoute(gpsPosRef.current, stops, nextIdx);
      }
    }
    const remaining = maneuvers.slice(currentManeuverIdx).reduce((a, m) => a + m.distance, 0);
    setRemainingDist(remaining);
    const total = route?.totalDistance || 1;
    setProgress(Math.min(100, Math.round((1 - remaining / total) * 100)));

    const mIdx = maneuvers.findIndex(m => haversine(gps.lat, gps.lng, m.lat, m.lng) < 30);
    if (mIdx >= 0 && mIdx !== currentManeuverIdx) {
      setCurrentManeuverIdx(mIdx);
      if (Math.random() < 0.3) speak(maneuvers[mIdx].instruction);
    }
  }, [isNavigating, gps, currentStopIdx, stops, maneuvers, currentManeuverIdx, route, calcRoute]);

  const speak = useCallback((text: string) => {
    setVoiceText(text);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setVoiceText(null), 4000);
  }, []);

  const stopNav = useCallback(() => {
    setIsNavigating(false); setStatus('idle');
    rendererRef.current?.setDirections(null);
  }, []);

  const centerOnUser = useCallback(() => {
    if (gps && mapInstance.current) mapInstance.current.panTo({ lat: gps.lat, lng: gps.lng });
  }, [gps]);

  const speedKmh = gps ? Math.round(gps.speed * 3.6) : 0;
  const currentStop = stops[currentStopIdx];

  if (mapsError && !gps) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <Key className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold">Google Maps API Anahtarı Gerekli</h2>
          <p className="text-sm text-slate-400">.env.local dosyasına VITE_GOOGLE_API_KEY ekleyin</p>
        </div>
      </div>
    );
  }

  const arrivalPanel = status === 'arrived' && (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center">
      <div className="text-center space-y-4 p-6">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold">Tüm Duraklar Tamamlandı</h2>
        <p className="text-sm text-slate-400">{formatDuration(elapsedTime)} sürede {stops.length} durak</p>
        <button onClick={stopNav} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold">Kapat</button>
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
              <div className="w-9 h-9 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Navigation className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Gerçek Navigasyon</h2>
                <p className="text-[9px] text-slate-400">Google Maps • {gps ? 'GPS Aktif' : 'GPS Bekleniyor...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={centerOnUser} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-all">
                <Crosshair className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button onClick={() => setIsFullscreen(f => !f)} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-all">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><Gauge className="w-3 h-3" /> Hız</p>
              <p className="text-lg font-bold text-blue-400 font-mono">{speedKmh}</p>
              <p className="text-[8px] text-slate-600">km/h</p>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
              <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Kalan</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{formatDuration(remainingDur)}</p>
              <p className="text-[8px] text-slate-600">{formatDistance(remainingDist)}</p>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center col-span-2">
              <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> Sonraki Durak</p>
              <p className="text-sm font-bold text-white truncate">{currentStop?.name || '—'}</p>
              <p className="text-[8px] text-slate-600 truncate">{currentStop?.address || 'Varış noktası'}</p>
            </div>
          </div>

          {maneuvers[currentManeuverIdx] && (
            <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <Navigation2 className="w-4 h-4" />
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
              <button onClick={startNavigation} disabled={!gps} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40">
                <Navigation className="w-4 h-4" />
                <span>{gps ? 'Navigasyonu Başlat' : 'GPS bekleniyor...'}</span>
              </button>
            ) : (
              <button onClick={stopNav} className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-xs font-bold flex items-center justify-center gap-2 text-red-400">
                <X className="w-4 h-4" /><span>Durdur</span>
              </button>
            )}
            <button onClick={() => setShowManeuvers(v => !v)} className={`p-3 rounded-xl transition-all ${showManeuvers ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showManeuvers && maneuvers.length > 0 && (
        <div className="absolute top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/80 z-20 overflow-y-auto">
          <div className="sticky top-0 bg-slate-900/95 p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold flex items-center gap-2"><Route className="w-3.5 h-3.5 text-emerald-400" />Manevralar</h3>
            <button onClick={() => setShowManeuvers(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2 space-y-0.5">
            {maneuvers.map((m, i) => {
              const active = i === currentManeuverIdx && isNavigating;
              return (
                <div key={m.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${active ? 'bg-emerald-600/15 border border-emerald-500/30' : i < currentManeuverIdx ? 'opacity-40' : 'hover:bg-slate-800/40'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-emerald-600 text-white' : i < currentManeuverIdx ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {i < currentManeuverIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold truncate ${active ? 'text-white' : 'text-slate-300'}`}>{m.instruction}</p>
                    <p className="text-[8px] text-slate-500">{formatDistance(m.distance)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {voiceText && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl max-w-xs w-full">
          <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-[10px] text-white font-medium">{voiceText}</p>
        </div>
      )}

      {gpsError && !gps && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-amber-600/20 border border-amber-500/30 rounded-xl px-4 py-2 text-[10px] text-amber-400">
          {gpsError}
        </div>
      )}

      {arrivalPanel}
    </div>
  );
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
