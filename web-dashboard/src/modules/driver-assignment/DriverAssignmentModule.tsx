import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Truck, Sparkles, RefreshCw, CheckCircle, Activity, Clock,
  Search, X, ChevronDown, ChevronUp, Filter, SlidersHorizontal, Download,
  RotateCcw, AlertTriangle, User, Phone, Star, Shield, TrendingUp,
  BarChart3, Settings, Eye, EyeOff, Bell, BellOff, Fuel, ArrowUpDown,
  GripVertical, Wifi, WifiOff, Zap, Award, Target, Hash, Calendar,
  MapPin, Info, Check, ChevronRight, MoreHorizontal, Upload,
} from 'lucide-react';
import { DriverAssignmentApiService } from './api';
import type {
  AssignableVehicle, AssignableDriver, AssignmentResult, ActiveAssignment,
  HistoryEntry, MatchSuggestion, AssignmentAnalytics, AssignmentConfig,
} from './types';

const STATUS_LABELS: Record<string, string> = {
  STANDBY: 'Beklemede', IDLE: 'Rölanti', BREAK: 'Molada',
  ON_ROUTE: 'Seferde', WARNING: 'Uyarı', OFFLINE: 'Çevrimdışı',
  MAINTENANCE: 'Bakımda', ACTIVE: 'Aktif', ON_LEAVE: 'İzinde',
  OFF_DUTY: 'Görev Dışı',
};

const statusStyle = (s: string) => {
  switch (s) {
    case 'ON_ROUTE': case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25';
    case 'STANDBY': case 'IDLE': return 'text-slate-400 bg-slate-500/15 border-slate-500/25';
    case 'BREAK': return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/25';
    case 'WARNING': return 'text-amber-400 bg-amber-500/15 border-amber-500/25';
    case 'OFFLINE': case 'ON_LEAVE': case 'OFF_DUTY': return 'text-slate-500 bg-slate-600/15 border-slate-600/25';
    case 'MAINTENANCE': return 'text-red-400 bg-red-500/15 border-red-500/25';
    default: return 'text-slate-400 bg-slate-500/15 border-slate-500/25';
  }
};

const formatTime = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  const days = Math.floor(hrs / 24);
  return `${days} gün önce`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const driverGradient = (rating: number) => {
  if (rating >= 4.8) return 'from-amber-400 to-orange-500';
  if (rating >= 4.5) return 'from-emerald-400 to-teal-500';
  if (rating >= 4.0) return 'from-blue-400 to-indigo-500';
  return 'from-slate-400 to-slate-500';
};

export const DriverAssignmentModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assign' | 'active' | 'history' | 'settings'>('assign');

  const [unassignedVehicles, setUnassignedVehicles] = useState<AssignableVehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AssignableDriver[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [config, setConfig] = useState<AssignmentConfig | null>(null);

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [driverFilterStatus, setDriverFilterStatus] = useState('all');
  const [driverSort, setDriverSort] = useState<'rating' | 'trips' | 'name'>('rating');
  const [historyFilterDriver, setHistoryFilterDriver] = useState('');
  const [historyFilterVehicle, setHistoryFilterVehicle] = useState('');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [assignReason, setAssignReason] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((t: { type: 'success' | 'error' | 'info'; message: string }) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uv, ad, aa, h, an, c] = await Promise.all([
        DriverAssignmentApiService.getUnassignedVehicles('t-1001'),
        DriverAssignmentApiService.getAvailableDrivers('t-1001'),
        DriverAssignmentApiService.getActiveAssignments('t-1001'),
        DriverAssignmentApiService.getAssignmentHistory('t-1001'),
        DriverAssignmentApiService.getAssignmentAnalytics('t-1001'),
        DriverAssignmentApiService.getAssignmentConfig('t-1001'),
      ]);
      setUnassignedVehicles(Array.isArray(uv) ? uv : []);
      setAvailableDrivers(Array.isArray(ad) ? ad : []);
      setActiveAssignments(Array.isArray(aa) ? aa : []);
      setHistory(Array.isArray(h) ? h : []);
      setAnalytics(an || null);
      setConfig(c || null);
    } catch { /* fallback handled in service */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return unassignedVehicles;
    const q = vehicleSearch.toLowerCase();
    return unassignedVehicles.filter(v =>
      v.plate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  }, [unassignedVehicles, vehicleSearch]);

  const filteredDrivers = useMemo(() => {
    let list = [...availableDrivers];
    if (driverFilterStatus !== 'all') list = list.filter(d => d.status === driverFilterStatus);
    if (driverSearch) {
      const q = driverSearch.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.phone.includes(q));
    }
    if (driverSort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (driverSort === 'trips') list.sort((a, b) => b.totalTrips - a.totalTrips);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [availableDrivers, driverSearch, driverFilterStatus, driverSort]);

  const filteredHistory = useMemo(() => {
    let list = [...history];
    if (historyFilterDriver) list = list.filter(e => e.driverId === historyFilterDriver);
    if (historyFilterVehicle) list = list.filter(e => e.vehicleId === historyFilterVehicle);
    return list;
  }, [history, historyFilterDriver, historyFilterVehicle]);

  const selectedVehicle = useMemo(() =>
    unassignedVehicles.find(v => v.id === selectedVehicleId) || null,
    [unassignedVehicles, selectedVehicleId]
  );

  const selectedDriver = useMemo(() =>
    availableDrivers.find(d => d.id === selectedDriverId) || null,
    [availableDrivers, selectedDriverId]
  );

  const handleSelectVehicle = useCallback(async (vehicleId: string) => {
    if (selectedVehicleId === vehicleId) { setSelectedVehicleId(null); return; }
    setSelectedVehicleId(vehicleId);
    setSelectedDriverId(null);
    setAssignReason('');
    setSuggestionsLoading(true);
    try {
      const s = await DriverAssignmentApiService.getSuggestions('t-1001', vehicleId);
      setSuggestions(Array.isArray(s) ? s : []);
    } catch { setSuggestions([]); }
    setSuggestionsLoading(false);
  }, [selectedVehicleId]);

  const handleSelectSuggestion = useCallback((suggestion: MatchSuggestion) => {
    setSelectedDriverId(suggestion.driverId);
    setAssignReason(suggestion.reason);
  }, []);

  const handleAssign = useCallback(async () => {
    if (!selectedVehicleId || !selectedDriverId) return;
    setAssigning(true);
    try {
      const result = await DriverAssignmentApiService.assignManually('t-1001', selectedVehicleId, selectedDriverId, assignReason || undefined);
      showToast({ type: 'success', message: `${selectedVehicle?.plate} → ${selectedDriver?.name} başarıyla atandı (${Math.round(result.confidence * 100)}%)` });
      setSelectedVehicleId(null);
      setSelectedDriverId(null);
      setAssignReason('');
      fetchAll();
    } catch {
      showToast({ type: 'error', message: 'Atama başarısız!' });
    }
    setAssigning(false);
  }, [selectedVehicleId, selectedDriverId, assignReason, selectedVehicle, selectedDriver, showToast, fetchAll]);

  const handleAiAssign = useCallback(async (vehicleId: string) => {
    setAssigning(true);
    try {
      const result = await DriverAssignmentApiService.assignDriverAI('t-1001', vehicleId);
      showToast({ type: 'success', message: `AI atama tamamlandı: ${result.reason}` });
      fetchAll();
    } catch {
      showToast({ type: 'error', message: 'AI atama başarısız!' });
    }
    setAssigning(false);
  }, [showToast, fetchAll]);

  const handleRevoke = useCallback(async (assignmentId: string) => {
    setRevokingId(assignmentId);
    try {
      await DriverAssignmentApiService.revokeAssignment('t-1001', assignmentId);
      showToast({ type: 'info', message: 'Atama iptal edildi' });
      fetchAll();
    } catch {
      showToast({ type: 'error', message: 'İptal başarısız!' });
    }
    setRevokingId(null);
  }, [showToast, fetchAll]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify({ history, analytics }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `surucu-atama-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast({ type: 'success', message: 'Veriler JSON olarak dışa aktarıldı' });
  }, [history, analytics, showToast]);

  const handleSaveConfig = useCallback(async (updated: AssignmentConfig) => {
    setConfig(updated);
    await DriverAssignmentApiService.saveAssignmentConfig('t-1001', updated);
    showToast({ type: 'success', message: 'Ayarlar kaydedildi' });
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-amber-500/30 animate-ping" />
          </div>
          <p className="text-xs text-slate-500">Sürücü atama verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'assign' as const, label: 'Ataç', icon: Truck, count: filteredVehicles.length },
    { key: 'active' as const, label: 'Aktif', icon: Activity, count: activeAssignments.length },
    { key: 'history' as const, label: 'Geçmiş', icon: Clock, count: history.length },
    { key: 'settings' as const, label: 'Ayarlar', icon: SlidersHorizontal, count: undefined },
  ];

  const stats = [
    { label: 'Toplam Araç', value: `${(analytics?.totalAssignments ?? 42) + (unassignedVehicles?.length ?? 0)}`, icon: Truck, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Müsait Sürücü', value: `${availableDrivers?.length ?? 0}`, icon: User, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Aktif Atama', value: `${activeAssignments?.length ?? 0}`, icon: CheckCircle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Ort. Güven', value: `${Math.round((analytics?.avgConfidence ?? 0.91) * 100)}%`, icon: Shield, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-3 relative">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-4 left-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-bold flex items-center gap-2 border ${
            toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-300' :
            toast.type === 'error' ? 'bg-red-900/90 border-red-700/50 text-red-300' :
            'bg-blue-900/90 border-blue-700/50 text-blue-300'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
           toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {toast.message}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-600/30 to-orange-600/30 border border-amber-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/20">
            <UserCheck className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Sürücü Atama</h2>
            <p className="text-[9px] text-slate-500">AI Destekli Akıllı Eşleştirme ve Filo Yönetimi</p>
          </div>
        </div>
        <button onClick={fetchAll} className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all text-slate-400 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`${s.color} rounded-xl p-2.5 border backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5" />
              <span className="text-[9px] font-medium opacity-80">{s.label}</span>
            </div>
            <p className="text-lg font-bold tracking-tight">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-slate-800'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'assign' && (
          <motion.div key="assign" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
                placeholder="Araç plaka veya model ile filtrele..."
                className="w-full bg-slate-900/80 border border-slate-800/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
              />
              {vehicleSearch && (
                <button onClick={() => setVehicleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedVehicleId && selectedVehicle && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/30 rounded-xl p-3 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">{selectedVehicle.plate}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${statusStyle(selectedVehicle.status)}`}>
                      {STATUS_LABELS[selectedVehicle.status] || selectedVehicle.status}
                    </span>
                  </div>
                  <button onClick={() => { setSelectedVehicleId(null); setSelectedDriverId(null); }}
                    className="p-1 hover:bg-slate-800/60 rounded-lg transition-all text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.year} • {selectedVehicle.capacity} kişilik
                </div>

                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />AI Önerilen Sürücüler
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {suggestions.map((s, i) => (
                        <motion.div key={s.driverId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          onClick={() => handleSelectSuggestion(s)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer border transition-all ${
                            selectedDriverId === s.driverId
                              ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-900/20'
                              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${driverGradient(s.driverRating)} flex items-center justify-center text-[10px] font-bold text-white shadow-lg shrink-0`}>
                            {getInitials(s.driverName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-white truncate">{s.driverName}</span>
                              <span className="text-[9px] text-amber-400 font-bold">#{i + 1}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[8px] text-slate-500">
                              <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-yellow-500" />{s.driverRating}</span>
                              <span>{s.driverTotalTrips} sefer</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold text-emerald-400">%{Math.round(s.confidence * 100)}</div>
                            <div className="text-[8px] text-slate-500">{s.score} puan</div>
                          </div>
                          {selectedDriverId === s.driverId && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" />Manuel Sürücü Seçimi
                  </p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input value={driverSearch} onChange={e => setDriverSearch(e.target.value)}
                      placeholder="Sürücü ara..."
                      className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg py-2 pl-8 pr-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['all', 'ACTIVE', 'ON_LEAVE', 'OFF_DUTY', 'BREAK'].map(st => (
                      <button key={st} onClick={() => setDriverFilterStatus(st)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                          driverFilterStatus === st ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'Tümü' : STATUS_LABELS[st] || st}
                      </button>
                    ))}
                    <div className="flex-1" />
                    {['rating', 'trips', 'name'].map(sort => (
                      <button key={sort} onClick={() => setDriverSort(sort as any)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                          driverSort === sort ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {sort === 'rating' ? 'Puan' : sort === 'trips' ? 'Sefer' : 'İsim'}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {filteredDrivers.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-3">Eşleşen sürücü bulunamadı</p>
                    ) : filteredDrivers.map((d, i) => (
                      <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => setSelectedDriverId(selectedDriverId === d.id ? null : d.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer border transition-all ${
                          selectedDriverId === d.id
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700/60'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${driverGradient(d.rating)} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                          {getInitials(d.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white truncate">{d.name}</span>
                            <span className={`text-[7px] px-1 py-0.5 rounded ${statusStyle(d.status)}`}>
                              {STATUS_LABELS[d.status] || d.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[8px] text-slate-500">
                            <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-yellow-500" />{d.rating}</span>
                            <span>{d.totalTrips} sefer</span>
                            <span>{d.phone}</span>
                          </div>
                        </div>
                        {selectedDriverId === d.id && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </motion.div>
                    ))}
                  </div>
                  {selectedDriverId && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <input value={assignReason} onChange={e => setAssignReason(e.target.value)}
                        placeholder="Atama sebebi (opsiyonel)..."
                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg py-2 px-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition-all"
                      />
                      <button onClick={handleAssign} disabled={assigning}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
                      >
                        {assigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {selectedVehicle?.plate} → {selectedDriver?.name} Ata
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <CheckCircle className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Atanmayı Bekleyen Araç Yok</p>
                <p className="text-[10px] text-slate-600 mt-1">Tüm araçlara sürücü atanmış durumda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredVehicles.map((v, i) => (
                  <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`group relative bg-slate-900/80 border rounded-xl p-3 cursor-pointer transition-all ${
                      selectedVehicleId === v.id
                        ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-900/20'
                        : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-800/80'
                    }`}
                    onClick={() => handleSelectVehicle(v.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center">
                          <Truck className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-white">{v.plate}</span>
                          <span className={`ml-1.5 text-[8px] px-1.5 py-0.5 rounded border ${statusStyle(v.status)}`}>
                            {STATUS_LABELS[v.status] || v.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${selectedVehicleId === v.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-500 flex items-center gap-2">
                      <span>{v.brand} {v.model}</span>
                      <span>•</span>
                      <span>{v.capacity} kişi</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600/0 via-amber-600/0 group-hover:via-amber-600/40 to-orange-600/0 transition-all duration-500 rounded-full" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2.5">
            {activeAssignments.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Aktif Atama Bulunmuyor</p>
                <p className="text-[10px] text-slate-600 mt-1">Hiçbir aktif sürücü-araç eşleşmesi yok</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500">
                    <span className="text-emerald-400 font-bold">{activeAssignments.length}</span> aktif atama
                  </p>
                  <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-400 hover:text-white transition-all">
                    <Download className="w-3 h-3" />Dışa Aktar
                  </button>
                </div>
                <div className="space-y-2">
                  {activeAssignments.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold">{a.vehiclePlate}</span>
                              <span className="text-[8px] text-slate-500">{a.vehicleBrand} {a.vehicleModel}</span>
                            </div>
                            <span className="text-[8px] text-slate-500">{formatTime(a.assignedAt)} atandı</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-emerald-400">%{Math.round(a.confidence * 100)}</div>
                            <div className="text-[8px] text-slate-500">güven</div>
                          </div>
                          <button onClick={() => handleRevoke(a.id)} disabled={revokingId === a.id}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all text-red-400 disabled:opacity-50"
                            title="Atamayı iptal et"
                          >
                            {revokingId === a.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${driverGradient(a.driverRating)} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-lg`}>
                          {getInitials(a.driverName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-white truncate">{a.driverName}</span>
                            <span className="text-[8px] text-slate-400 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-yellow-500" />{a.driverRating}
                            </span>
                          </div>
                          <div className="text-[8px] text-slate-500 flex items-center gap-2">
                            <Phone className="w-2.5 h-2.5" />{a.driverPhone}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] text-slate-500 italic">{a.reason}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2.5">
            {analytics && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Toplam Atama', value: analytics.totalAssignments, icon: BarChart3, color: 'text-blue-400' },
                  { label: 'Ort. Güven', value: `${Math.round(analytics.avgConfidence * 100)}%`, icon: Shield, color: 'text-emerald-400' },
                  { label: 'Ort. Sürücü Puanı', value: analytics.avgDriverRating.toFixed(1), icon: Star, color: 'text-yellow-400' },
                  { label: 'Bugün İptal', value: analytics.revokedToday, icon: X, color: 'text-red-400' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 text-center"
                  >
                    <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                    <p className="text-sm font-bold">{s.value}</p>
                    <p className="text-[8px] text-slate-500">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input value={historyFilterDriver} onChange={e => setHistoryFilterDriver(e.target.value)}
                  placeholder="Sürücü ID ile filtrele..."
                  className="w-full bg-slate-900/80 border border-slate-800/80 rounded-lg py-2 pl-8 pr-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 transition-all"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input value={historyFilterVehicle} onChange={e => setHistoryFilterVehicle(e.target.value)}
                  placeholder="Araç ID ile filtrele..."
                  className="w-full bg-slate-900/80 border border-slate-800/80 rounded-lg py-2 pl-8 pr-3 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 transition-all"
                />
              </div>
              <button onClick={handleExport} className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-slate-400 hover:text-white transition-all">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Atama Geçmişi Bulunmuyor</p>
                <p className="text-[10px] text-slate-600 mt-1">Henüz hiçbir atama kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredHistory.map((h, i) => (
                  <motion.div key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5"
                  >
                    <div className="flex flex-col items-center gap-0.5 w-8 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${h.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <div className="w-0.5 h-6 bg-slate-800" />
                    </div>
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${h.status === 'active' ? 'from-emerald-500 to-teal-500' : 'from-slate-500 to-slate-600'} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                      {getInitials(h.driverName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white truncate">{h.driverName}</span>
                        <span className="text-[8px] text-slate-500">→</span>
                        <span className="text-[10px] font-bold text-white">{h.vehiclePlate}</span>
                      </div>
                      <div className="text-[8px] text-slate-500">{formatDate(h.assignedAt)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] font-bold text-emerald-400">%{Math.round(h.confidence * 100)}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[7px] px-1 py-0.5 rounded font-bold ${
                          h.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-600/10'
                        }`}>
                          {h.status === 'active' ? 'Aktif' : 'İptal'}
                        </span>
                        {h.revokedAt && <span className="text-[7px] text-slate-600">{formatTime(h.revokedAt)}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && config && (
          <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-amber-400" />Atama Algoritması
              </p>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <p className="text-[10px] font-bold text-white">Otomatik Atama</p>
                    <p className="text-[8px] text-slate-500">AI müsait araçlara otomatik sürücü atasın</p>
                  </div>
                </div>
                <button onClick={() => handleSaveConfig({ ...config, autoAssign: !config.autoAssign })}
                  className={`relative w-10 h-5 rounded-full transition-all ${config.autoAssign ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all shadow ${config.autoAssign ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'ratingWeight' as const, label: 'Sürücü Puanı Ağırlığı', desc: 'Yüksek puanlı sürücüler öncelikli', value: config.ratingWeight, icon: Award },
                  { key: 'proximityWeight' as const, label: 'Yakınlık Ağırlığı', desc: 'Araca yakın sürücüler öncelikli', value: config.proximityWeight, icon: MapPin },
                  { key: 'workloadWeight' as const, label: 'İş Yükü Dengesi', desc: 'Eşit iş dağılımı sağla', value: config.workloadWeight, icon: BarChart3 },
                ].map(s => (
                  <div key={s.key} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <s.icon className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-white">{s.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 font-mono">{(s.value * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[8px] text-slate-500 mb-2">{s.desc}</p>
                    <input type="range" min="0" max="100" value={Math.round(s.value * 100)}
                      onChange={e => {
                        const newVal = parseInt(e.target.value) / 100;
                        const others = config.ratingWeight + config.proximityWeight + config.workloadWeight - s.value;
                        const scale = others > 0 ? (1 - newVal) / others : 0;
                        const updated = { ...config,
                          [s.key]: newVal,
                          ratingWeight: s.key === 'ratingWeight' ? newVal : config.ratingWeight * scale,
                          proximityWeight: s.key === 'proximityWeight' ? newVal : config.proximityWeight * scale,
                          workloadWeight: s.key === 'workloadWeight' ? newVal : config.workloadWeight * scale,
                        };
                        handleSaveConfig(updated);
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-white">Minimum Güven Eşiği</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">{Math.round(config.minConfidence * 100)}%</span>
                </div>
                <p className="text-[8px] text-slate-500 mb-2">AI önerisi için minimum eşik değeri</p>
                <input type="range" min="50" max="100" value={Math.round(config.minConfidence * 100)}
                  onChange={e => handleSaveConfig({ ...config, minConfidence: parseInt(e.target.value) / 100 })}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
              <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />Bildirim Tercihleri
              </p>
              {[
                { key: 'notifyOnAssign' as const, label: 'Atama Bildirimi', desc: 'Yeni atama yapıldığında bildirim gönder', icon: Bell },
                { key: 'notifyOnRevoke' as const, label: 'İptal Bildirimi', desc: 'Atama iptal edildiğinde bildirim gönder', icon: BellOff },
              ].map(t => (
                <div key={t.key} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <t.icon className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-white">{t.label}</p>
                      <p className="text-[8px] text-slate-500">{t.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleSaveConfig({ ...config, [t.key]: !config[t.key] })}
                    className={`relative w-10 h-5 rounded-full transition-all ${config[t.key] ? 'bg-amber-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all shadow ${config[t.key] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>

            {analytics && (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
                <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />Haftalık Atama Dağılımı
                </p>
                <div className="flex items-end gap-2 h-24">
                  {analytics.assignmentsByDay.map((d, i) => {
                    const maxCount = Math.max(...analytics.assignmentsByDay.map(x => x.count), 1);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[8px] font-bold text-slate-400">{d.count}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.count / maxCount) * 100}%` }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                          className="w-full bg-gradient-to-t from-amber-600 to-orange-500 rounded-t-md"
                        />
                        <span className="text-[7px] text-slate-600">{d.date.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-slate-400 mt-1">En Çok Atama Yapan Sürücüler</p>
                  {analytics.topDrivers.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2 text-[9px]">
                      <span className="w-4 text-center text-slate-500">#{i + 1}</span>
                      <span className="flex-1 text-white">{d.name}</span>
                      <span className="text-slate-400">{d.count} atama</span>
                      <span className="flex items-center gap-0.5 text-yellow-400"><Star className="w-2.5 h-2.5" />{d.avgRating.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
