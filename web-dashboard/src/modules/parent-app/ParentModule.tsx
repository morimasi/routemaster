import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Clock, MapPin, QrCode, Send, Lock, MessageSquare, UserCheck,
  AlertCircle, ChevronDown, CheckCircle2, Star, Phone, Bell,
  Calendar, Home, Navigation, Map, Users, Route,
  Radio, Crosshair, Layers, Loader, X, Gauge,
  Shield, AlertTriangle, Info, BarChart3, GraduationCap
} from 'lucide-react';
import { ParentApi } from './ParentApiService';
import type { ChatMessage, ChildInfo, VehicleInfo, DriverInfo, RouteInfo, AlertInfo, Announcement, AttendanceData } from './types';

type ParentTab = 'dashboard' | 'tracking' | 'nfc' | 'chat' | 'attendance' | 'alerts' | 'announcements';

interface TabConfig { key: ParentTab; icon: React.ReactNode; label: string; }

const QUICK_REPLIES = ['Kapıda bekliyoruz', 'Servise yaklaştı mı?', 'Teşekkürler', 'Bugün gecikecek'];
const ABSENCE_REASONS = ['Ateş / Hastalık', 'Ailevi İzin / Seyahat', 'Özel Araçla Bırakılacak', 'Doktor Randevusu'];

export const ParentModule: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState('s-eymen');
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [activeTab, setActiveTab] = useState<ParentTab>('dashboard');
  const [reason, setReason] = useState(ABSENCE_REASONS[0]);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [etaCountdown, setEtaCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [showMap, setShowMap] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const vehicleMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const currentChild = children.find(c => c.id === selectedChildId);

  // --- Real-time vehicle position: WebSocket + REST polling fallback ---
  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/^http/, 'ws');
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let pollTimer: ReturnType<typeof setInterval>;
    let wsFailed = false;

    const pollPosition = () => {
      if (!vehicleInfo?.id) return;
      ParentApi.getVehiclePosition(vehicleInfo.id).then(pos => {
        if (pos && pos.lat && pos.lng) {
          setVehicleInfo(prev => prev ? { ...prev, lat: pos.lat, lng: pos.lng, speed: pos.speed, heading: pos.heading } : prev);
          if (vehicleMarker.current && mapInstance.current) {
            vehicleMarker.current.position = { lat: pos.lat, lng: pos.lng };
          }
        }
      });
    };

    function connect() {
      try {
        ws = new WebSocket(`${wsUrl}/ws`);
        const failTimeout = setTimeout(() => { wsFailed = true; ws?.close(); }, 3000);
        ws.onopen = () => {
          clearTimeout(failTimeout);
          wsFailed = false;
          ws?.send(JSON.stringify({ type: 'subscribe', channel: 'vehicle:positions' }));
          clearInterval(pollTimer);
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.channel === 'vehicle:positions' && msg.data) {
              const v = msg.data as VehicleInfo;
              setVehicleInfo(prev => prev && v.plate === prev.plate ? v : prev);
              if (vehicleMarker.current && mapInstance.current) {
                vehicleMarker.current.position = { lat: v.lat, lng: v.lng };
              }
            }
          } catch { /* ignore */ }
        };
        ws.onclose = () => {
          clearTimeout(failTimeout);
          if (!wsFailed) reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => { wsFailed = true; ws?.close(); };
      } catch { wsFailed = true; }
    }
    connect();

    if (wsFailed) pollTimer = setInterval(pollPosition, 3000);

    return () => { ws?.close(); clearTimeout(reconnectTimer); clearInterval(pollTimer); };
  }, [vehicleInfo?.id]);

  // --- Data loading ---
  useEffect(() => {
    Promise.all([
      ParentApi.getChildren('t-1001'),
    ]).then(([c]) => {
      setChildren(c || [
        { id: 's-eymen', name: 'Eymen Altunel', grade: '4-B', attendanceRate: 0.95, address: 'Cumhuriyet Mah. 4. Sok No:12', lat: 41.095, lng: 29.098 },
        { id: 's-zeynep', name: 'Zeynep Altunel', grade: 'Anaokulu K-1', attendanceRate: 0.90 },
      ]);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    setIsLoading(true);
    Promise.all([
      ParentApi.getRoute(selectedChildId),
      ParentApi.getAlerts(selectedChildId),
      ParentApi.getAttendance(selectedChildId),
      ParentApi.getAnnouncements('t-1001'),
    ]).then(([routeData, alertsData, attendanceData, announcementsData]) => {
      if (routeData) {
        setVehicleInfo(routeData.vehicle || null);
        setDriverInfo(routeData.driver || null);
        setRouteInfo(routeData.route || null);
        if (routeData.route?.eta) setEtaCount(routeData.route.eta * 60);
      }
      setAlerts(alertsData || []);
      setAttendance(attendanceData || null);
      setAnnouncements(announcementsData || []);
      setIsLoading(false);
    });
  }, [selectedChildId]);

  useEffect(() => {
    if (etaCountdown <= 0) return;
    const iv = setInterval(() => setEtaCount(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv);
  }, [etaCountdown]);

  useEffect(() => {
    if (activeTab !== 'chat' || roomId) return;
    ParentApi.initChat('t-1001', 'p-9001', 't-7001').then((r: any) => r?.room_id && setRoomId(r.room_id));
  }, [activeTab, roomId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // --- Google Maps ---
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_API_KEY || '';
    if (!key) { setMapsError('Google Maps API anahtarı gerekli'); return; }
    if (window.google?.maps) { setMapsReady(true); return; }
    const id = 'parent-gmaps';
    if (document.getElementById(id)) {
      const check = () => window.google?.maps ? setMapsReady(true) : setTimeout(check, 100);
      check(); return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=maps,marker&v=beta&loading=async&callback=initParentMap`;
    (window as any).initParentMap = () => { delete (window as any).initParentMap; setMapsReady(true); };
    s.onerror = () => setMapsError('Google Maps yüklenemedi');
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !showMap || !vehicleInfo) return;
    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: vehicleInfo.lat, lng: vehicleInfo.lng },
        zoom: 14, mapId: import.meta.env.VITE_GOOGLE_MAP_ID || undefined,
        disableDefaultUI: true, gestureHandling: 'greedy', backgroundColor: '#0f172a',
      });
    }
    const gm = google.maps.marker;
    if (!vehicleMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `<div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-2 border-white shadow-[0_0_20px_rgba(52,211,153,0.6)] flex items-center justify-center animate-pulse"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 17h14M5 17a2 2 0 1 1-4 0M19 17a2 2 0 1 0 4 0M5 9l2-4h10l2 4M5 9v5M19 9v5"/></svg></div>`;
      vehicleMarker.current = new gm.AdvancedMarkerElement({
        position: { lat: vehicleInfo.lat, lng: vehicleInfo.lng },
        map: mapInstance.current, content: el, title: vehicleInfo.plate,
      });
    } else {
      vehicleMarker.current.position = { lat: vehicleInfo.lat, lng: vehicleInfo.lng };
    }
    mapInstance.current.panTo({ lat: vehicleInfo.lat, lng: vehicleInfo.lng });
  }, [mapsReady, vehicleInfo, showMap]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleToggleAbsence = async () => {
    setIsLoading(true);
    const next = !isFlagged;
    try {
      await ParentApi.flagAbsence('t-1001', selectedChildId, next ? reason : 'İptal');
      setIsFlagged(next);
      showToast(next ? 'Devamsızlık bildirildi. Şoför HUD uyarısı aktif.' : 'Bildirim iptal edildi.');
    } finally { setIsLoading(false); }
  };

  const handleSendMessage = useCallback(async (text?: string) => {
    const msg = text ?? newMsg;
    if (!msg.trim()) return;
    if (!text) setNewMsg('');
    setIsSending(true);
    const optimistic: ChatMessage = {
      id: Date.now(), sender: 'Siz (Veli)', text: msg,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true, delivered: false, encrypted: true,
    };
    setChatMessages(prev => [...prev, optimistic]);
    try { await ParentApi.sendMessage(roomId, msg, 'p-9001'); } finally { setIsSending(false); }
  }, [newMsg, roomId]);

  const handleRateDriver = (rating: number) => {
    ParentApi.rateDriver(rating, driverInfo?.id);
    showToast(`${rating} yıldız değerlendirmeniz için teşekkürler!`);
  };

  const tabs: TabConfig[] = [
    { key: 'dashboard', icon: <Home className="w-4 h-4" />, label: 'Ana Sayfa' },
    { key: 'tracking', icon: <Map className="w-4 h-4" />, label: 'Canlı Takip' },
    { key: 'nfc', icon: <QrCode className="w-4 h-4" />, label: 'NFC Kart' },
    { key: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Sohbet' },
    { key: 'alerts', icon: <Bell className="w-4 h-4" />, label: 'Bildirimler' },
    { key: 'attendance', icon: <Calendar className="w-4 h-4" />, label: 'Devam' },
    { key: 'announcements', icon: <Info className="w-4 h-4" />, label: 'Duyurular' },
  ];

  const etaMins = Math.floor(etaCountdown / 60);
  const etaSecs = etaCountdown % 60;

  if (isLoading && children.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Veli paneli yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl"
          >{toast}</motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border-b border-slate-800/80 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base">ShuttleX Veli</h1>
              <div className="relative">
                <select value={selectedChildId} onChange={e => { setSelectedChildId(e.target.value); setChatMessages([]); }}
                  className="bg-slate-800/80 border border-slate-700 text-[10px] text-blue-300 font-bold rounded-lg px-2 py-0.5 pr-6 focus:outline-none appearance-none cursor-pointer">
                  {children.map(c => <option key={c.id} value={c.id}>{c.name} — {c.grade}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Gerçek Zamanlı
            </span>
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 bg-slate-800/80 border border-slate-700/60 rounded-lg">
              <Users className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Horizontal scroll on mobile */}
      <nav className="bg-slate-900/90 border-b border-slate-800/60 overflow-x-auto flex-shrink-0">
        <div className="flex gap-1 p-2 max-w-7xl mx-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === t.key ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >{t.icon}{t.label}</button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 space-y-4">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* ETA Countdown */}
              <div className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">TAHMİNİ VARIŞ</span>
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display font-black text-white tabular-nums">
                      {etaCountdown === 0 ? '0' : etaMins}
                    </span>
                    <span className="text-xl font-bold text-slate-300">
                      {etaCountdown === 0 ? 'Kapıda!' : `dk ${String(etaSecs).padStart(2, '0')}s`}
                    </span>
                  </div>
                  {routeInfo && (
                    <div className="mt-3 space-y-2">
                      <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${routeInfo.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" />{routeInfo.nextStop}</span>
                        <span>{routeInfo.completedStops}/{routeInfo.stopCount} durak</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <Navigation className="w-4 h-4" />, label: 'Araç', value: vehicleInfo?.plate || '—', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { icon: <UserCheck className="w-4 h-4" />, label: 'Sürücü', value: driverInfo?.name || '—', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { icon: <Gauge className="w-4 h-4" />, label: 'Hız', value: vehicleInfo ? `${vehicleInfo.speed} km/h` : '—', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { icon: <Star className="w-4 h-4" />, label: 'Sürücü Puanı', value: driverInfo ? `${driverInfo.rating}` : '—', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} border border-slate-800/60 rounded-xl p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[9px] text-slate-500">{s.label}</span></div>
                    <p className={`text-xs font-bold ${s.color} truncate`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Absence Flag */}
              <div className={`rounded-2xl p-4 border space-y-3 transition-all ${isFlagged ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/60 border-slate-800/80'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isFlagged ? 'text-amber-400' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">Devamsızlık Bildirimi</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Bildirim sonrası şoför HUD ekranına anlık uyarı düşer</p>
                    {!isFlagged && (
                      <select value={reason} onChange={e => setReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 mt-2 focus:outline-none focus:border-amber-500 font-medium"
                      >{ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    )}
                  </div>
                </div>
                <button onClick={handleToggleAbsence} disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isFlagged ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                  } disabled:opacity-60`}
                >{isLoading ? <Loader className="w-4 h-4 animate-spin" /> : isFlagged ? <><UserCheck className="w-4 h-4" />BİLDİRİM İPTAL</> : 'BUGÜN SERVİSE BİNMEYECEK — BİLDİR'}</button>
              </div>

              {/* Recent Alerts */}
              {alerts.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Bell className="w-3.5 h-3.5" />Son Bildirimler</h3>
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map(a => (
                      <div key={a.id} className="flex items-start gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60">
                        <div className={`p-1 rounded-lg ${a.severity === 'critical' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          {a.severity === 'critical' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{a.message}</p>
                          <p className="text-[8px] text-slate-500">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== LIVE TRACKING ===== */}
          {activeTab === 'tracking' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600/20 border border-emerald-500/30 rounded-lg"><Radio className="w-3.5 h-3.5 text-emerald-400" /></div>
                  <span className="text-xs font-bold">GPS Canlı Takip</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowMap(!showMap)} className={`p-1.5 rounded-lg border text-[9px] font-bold ${showMap ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <Layers className="w-3 h-3" />
                  </button>
                  <button onClick={() => { if (vehicleInfo && mapInstance.current) { mapInstance.current.panTo({ lat: vehicleInfo.lat, lng: vehicleInfo.lng }); mapInstance.current.setZoom(15); } }}
                    className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"><Crosshair className="w-3 h-3" /></button>
                </div>
              </div>

              {mapsError ? (
                <div className="h-64 flex items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                  <div className="text-center"><Map className="w-8 h-8 text-slate-700 mx-auto mb-2" /><p className="text-xs text-slate-500">{mapsError}</p></div>
                </div>
              ) : !mapsReady ? (
                <div className="h-64 flex items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2"><Loader className="w-4 h-4 text-blue-400 animate-spin" /><p className="text-xs text-slate-500">Harita yükleniyor...</p></div>
                </div>
              ) : (
                <div className="h-72 lg:h-96 rounded-2xl overflow-hidden border border-slate-800/80 relative">
                  <div ref={mapRef} className="absolute inset-0" style={{ display: showMap ? 'block' : 'none' }} />
                  {!showMap && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <Map className="w-8 h-8 text-slate-600 mb-2 mx-auto" />
                      <p className="text-xs text-slate-500">Harita gizli</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-lg px-2 py-1 text-[9px] text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {vehicleInfo ? `${vehicleInfo.plate} • ${vehicleInfo.speed} km/h` : 'Veri bekleniyor...'}
                  </div>
                </div>
              )}

              {vehicleInfo && driverInfo && routeInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2"><Navigation className="w-3.5 h-3.5 text-blue-400" /><span className="text-[10px] font-bold text-slate-300">Araç</span></div>
                    <p className="text-sm font-bold">{vehicleInfo.plate}</p>
                    <p className="text-[9px] text-slate-400">{vehicleInfo.brand} {vehicleInfo.model}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">{vehicleInfo.speed} km/h</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2"><UserCheck className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[10px] font-bold text-slate-300">Sürücü</span></div>
                    <p className="text-sm font-bold">{driverInfo.name}</p>
                    <a href={`tel:${driverInfo.phone}`} className="text-[10px] text-blue-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{driverInfo.phone}</a>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2"><Route className="w-3.5 h-3.5 text-purple-400" /><span className="text-[10px] font-bold text-slate-300">Rota</span></div>
                    <p className="text-sm font-bold truncate">{routeInfo.name}</p>
                    <p className="text-[9px] text-slate-400">%{Math.round(routeInfo.progress)} tamamlandı</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full" style={{ width: `${routeInfo.progress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== NFC CARD ===== */}
          {activeTab === 'nfc' && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto space-y-4">
              <div className="bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/30 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-blue-600/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">{currentChild?.name || 'Öğrenci'}</h3>
                <p className="text-xs text-slate-400">{currentChild?.grade || '—'} — Dijital Biniş Kartı</p>
                <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto my-5 flex items-center justify-center shadow-2xl">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => {
                      const corner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
                      return <rect key={`${r}-${c}`} x={c * 14 + 1} y={r * 14 + 1} width={12} height={12} fill={corner || Math.random() > 0.45 ? '#000' : '#fff'} />;
                    }))}
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-2 rounded-full mx-auto w-fit mb-3">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ECDH_AES_GCM Kriptografik NFC</span>
                </div>
                <p className="text-[10px] text-slate-500">Kartı araç NFC okuyucusuna veya şoför tabletine yaklaştırın. Her 24 saatte otomatik yenilenir.</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <h4 className="font-bold text-xs text-slate-300 mb-3">Bu Ay Devam Durumu</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Katıldı', value: attendance?.present ?? 18, color: 'text-emerald-400' },
                    { label: 'Devamsız', value: attendance?.absent ?? 2, color: 'text-amber-400' },
                    { label: 'Oran', value: attendance ? `%${Math.round(attendance.rate * 100)}` : '%90', color: 'text-blue-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/60">
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== CHAT ===== */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 mb-3 text-center text-[10px] flex items-center justify-center gap-2 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>ECDH_AES_GCM Uçtan Uca Şifreli Sohbet — {driverInfo?.name || 'Sürücü'}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-[10px]">Henüz mesaj yok. Hızlı yanıtlardan birini seçin veya mesaj yazın.</div>
                  )}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isMe && <span className="text-[9px] text-slate-500 mb-1 ml-1">{msg.sender}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-medium ${
                        msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}>{msg.text}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] text-slate-600">{msg.time}</span>
                        {msg.isMe && <span className="text-[8px] text-slate-500">{msg.delivered ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map(r => (
                    <button key={r} onClick={() => handleSendMessage(r)}
                      className="text-[9px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                    >{r}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !isSending && handleSendMessage()}
                    placeholder="Şifreli mesaj yazın..." disabled={!roomId}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 disabled:opacity-50"
                  />
                  <button onClick={() => handleSendMessage()} disabled={!newMsg.trim() || isSending || !roomId}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs mt-3">
                <span className="text-slate-400">Sürücü Değerlendirme</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => handleRateDriver(s)}>
                      <Star className={`w-4 h-4 ${s <= (driverInfo?.rating ? Math.round(driverInfo.rating) : 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} hover:scale-125 transition-transform`} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== ALERTS / NOTIFICATIONS ===== */}
          {activeTab === 'alerts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" />Bildirim Geçmişi</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-[10px]">Henüz bildirim yok</div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map(a => (
                      <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                        <div className={`p-1.5 rounded-lg ${a.severity === 'critical' ? 'bg-red-600/20 text-red-400' : a.severity === 'warning' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          {a.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-white">{a.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                            <span>{a.time}</span>
                            <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-bold ${
                              a.severity === 'critical' ? 'text-red-400 bg-red-950/60 border-red-500/30' : 'text-blue-400 bg-blue-950/60 border-blue-500/30'
                            }`}>{a.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== ATTENDANCE ===== */}
          {activeTab === 'attendance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Toplam Gün', value: attendance?.totalDays ?? 20, icon: Calendar, color: 'text-blue-400' },
                  { label: 'Katılım', value: attendance?.present ?? 18, icon: CheckCircle2, color: 'text-emerald-400' },
                  { label: 'Devamsızlık', value: attendance?.absent ?? 2, icon: X, color: 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-center">
                    <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-400" />Haftalık Devam Oranı</h3>
                {(attendance?.monthly || [{ week: '1. Hafta', rate: 1.0 }, { week: '2. Hafta', rate: 0.8 }, { week: '3. Hafta', rate: 1.0 }, { week: '4. Hafta', rate: 0.8 }]).map((w, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] text-slate-400 w-16 flex-shrink-0">{w.week}</span>
                    <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: `${w.rate * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 w-10 text-right">%{Math.round(w.rate * 100)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-amber-400" />Genel Durum</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${(attendance?.rate ?? 0.9) * 100}, 100`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-emerald-400">%{Math.round((attendance?.rate ?? 0.9) * 100)}</span>
                  </div>
                  <div className="flex-1 space-y-1.5 text-[10px] text-slate-400">
                    <p><span className="text-emerald-400 font-bold">{currentChild?.name}</span> bu dönem düzenli devam gösteriyor.</p>
                    <p>Toplam {attendance?.absent ?? 2} gün devamsızlık, {attendance?.present ?? 18} gün katılım.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== ANNOUNCEMENTS ===== */}
          {activeTab === 'announcements' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" />Kurum Duyuruları</h3>
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-[10px]">Henüz duyuru yayınlanmadı</div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map(a => (
                      <div key={a.id} className={`p-4 rounded-xl border ${a.important ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-950/60 border-slate-800/60'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{a.title}</h4>
                              {a.important && <span className="text-[8px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-full">ÖNEMLİ</span>}
                            </div>
                            <p className="text-[10px] text-slate-300 mt-1.5">{a.text}</p>
                            <p className="text-[8px] text-slate-500 mt-2">{a.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex justify-around px-2 py-1.5">
          {tabs.slice(0, 5).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-all ${activeTab === t.key ? 'text-blue-400' : 'text-slate-500'}`}
            >{t.icon}<span className="text-[7px] mt-0.5">{t.label}</span></button>
          ))}
        </div>
      </nav>
    </div>
  );
};
