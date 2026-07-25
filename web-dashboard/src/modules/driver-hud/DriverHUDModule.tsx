import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, Mic, AlertTriangle, CheckCircle2, Clock, ShieldAlert,
  Volume2, UserX, ArrowRight, PhoneCall, Gauge, Compass, List,
  MessageCircle, BellRing, MicOff
} from 'lucide-react';
import { driverHudApi } from './api';
import type { RouteNode } from './types';

const INITIAL_NODES: RouteNode[] = [
  { id: 'n1', studentName: 'Ahmet Yılmaz',  stopName: 'Atatürk Cad. No:14, Kavacık',     seq: 1, status: 'PASSED',  absenceFlagged: false },
  { id: 'n2', studentName: 'Eymen Altunel', stopName: 'Cumhuriyet Mah. 4. Sok No:12',     seq: 2, status: 'CURRENT', absenceFlagged: true,  absenceNote: 'Veli (Ateş / Hastalık): Bugün servise binmeyecek.' },
  { id: 'n3', studentName: 'Zeynep Kaya',   stopName: 'Gül Apt. D:8, Anadolu Hisarı',    seq: 3, status: 'PENDING', absenceFlagged: false },
  { id: 'n4', studentName: 'Can Demir',     stopName: 'Deniz Evleri B Blok, Çubuklu',    seq: 4, status: 'PENDING', absenceFlagged: false },
  { id: 'n5', studentName: 'Mert Doğan',   stopName: 'Yıldız Sok. No:3, Kavacık',       seq: 5, status: 'PENDING', absenceFlagged: false },
];

export const DriverHUDModule: React.FC = () => {
  const [nodes, setNodes]                             = useState<RouteNode[]>(INITIAL_NODES);
  const [isVoiceActive, setIsVoiceActive]             = useState(false);
  const [voiceStatus, setVoiceStatus]                 = useState('Sesli Komut Başlat');
  const [pendingPruneNode, setPendingPruneNode]       = useState<RouteNode | null>(null);
  const [legalTimer, setLegalTimer]                   = useState(120);
  const [isTimerRunning, setIsTimerRunning]           = useState(false);
  const [isPruning, setIsPruning]                     = useState(false);
  const [stopFilter, setStopFilter]                   = useState<'ALL' | 'PENDING' | 'PASSED'>('ALL');
  const [gpsSpeed, setGpsSpeed]                       = useState(42);
  const [showSosPanel, setShowSosPanel]               = useState(false);
  const [routeComplete, setRouteComplete]             = useState(false);
  const [toastMsg, setToastMsg]                       = useState<string | null>(null);

  const currentNode = nodes.find((n) => n.status === 'CURRENT') ?? null;
  const passedCount = nodes.filter((n) => n.status === 'PASSED' || n.status === 'SKIPPED_BY_DRIVER').length;
  const totalCount  = nodes.length;

  useEffect(() => {
    const iv = setInterval(() => {
      setGpsSpeed(prev => Math.max(0, Math.min(80, prev + Math.round((Math.random() - 0.45) * 8))));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!isTimerRunning || legalTimer <= 0) return;
    const iv = setInterval(() => setLegalTimer(p => p - 1), 1000);
    return () => clearInterval(iv);
  }, [isTimerRunning, legalTimer]);

  useEffect(() => {
    if (legalTimer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showToast('2 Dakika Doldu — Öğrenci Gelmedi. Durağı atabilirsiniz.');
    }
  }, [legalTimer, isTimerRunning]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const advanceRoute = useCallback((skippedId?: string) => {
    setNodes(prev => {
      const updated = prev.map(n =>
        n.id === (skippedId ?? currentNode?.id)
          ? { ...n, status: (skippedId ? 'SKIPPED_BY_DRIVER' : 'PASSED') as RouteNode['status'] }
          : n
      );
      const nextPending = updated.find(n => n.status === 'PENDING');
      if (!nextPending) {
        setRouteComplete(true);
        return updated;
      }
      return updated.map(n => n.id === nextPending.id ? { ...n, status: 'CURRENT' as const } : n);
    });
    setLegalTimer(120);
    setIsTimerRunning(false);
  }, [currentNode]);

  const handleBoardStudent = useCallback(() => {
    if (!currentNode) return;
    showToast(`${currentNode.studentName} bindi. Sonraki durağa geçildi.`);
    advanceRoute();
  }, [currentNode, advanceRoute, showToast]);

  const handlePruneConfirm = useCallback(async () => {
    if (!pendingPruneNode) return;
    setIsPruning(true);
    try {
      await driverHudApi.executePrune('t-1001', 'r-sabah-1', pendingPruneNode.id, 'd-5001');
      advanceRoute(pendingPruneNode.id);
      showToast(`${pendingPruneNode.studentName} durağı atlandı. ETA yeniden hesaplandı.`);
    } finally {
      setIsPruning(false);
      setPendingPruneNode(null);
    }
  }, [pendingPruneNode, advanceRoute, showToast]);

  const handleVoiceCommand = useCallback(async () => {
    if (isVoiceActive) { setIsVoiceActive(false); setVoiceStatus('Sesli Komut Başlat'); return; }
    setIsVoiceActive(true);
    setVoiceStatus('DİNLENİYOR...');
    await new Promise(r => setTimeout(r, 2500));
    const phrase = 'ShuttleX Eymen duraği atla';
    const res = await driverHudApi.parseVoiceIntent(phrase);
    if (res.resolved_intent.action === 'EXECUTE_PRUNE' && currentNode?.absenceFlagged) {
      setPendingPruneNode(currentNode);
    } else if (res.resolved_intent.action === 'MARK_BOARDED') {
      handleBoardStudent();
    }
    setIsVoiceActive(false);
    setVoiceStatus('Sesli Komut Başlat');
  }, [isVoiceActive, currentNode, handleBoardStudent]);

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const filteredNodes = nodes.filter(n => {
    if (stopFilter === 'PENDING') return n.status === 'PENDING' || n.status === 'CURRENT';
    if (stopFilter === 'PASSED')  return n.status === 'PASSED'  || n.status === 'SKIPPED_BY_DRIVER';
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 font-sans flex flex-col gap-5 select-none relative">

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-700 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-2xl max-w-lg text-center"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-950 border-2 border-gray-800 rounded-3xl p-4 md:p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/40">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-display font-extrabold tracking-wide text-white">
              ROTA: KAVACIK – SABAH SERVİSİ
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping inline-block"></span>
                GPS: Canlı Telemetri (34 AB 1234 · Sprinter)
              </span>
              <span className="text-xs font-bold text-blue-400">
                {passedCount} / {totalCount} Durak
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-2xl">
            <Gauge className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-black text-white tabular-nums">{gpsSpeed}</span>
            <span className="text-gray-500 text-xs font-bold">KM/H</span>
          </div>

          <button
            onClick={handleVoiceCommand}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              isVoiceActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 scale-105'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {isVoiceActive ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            {voiceStatus}
          </button>

          <button
            onClick={() => setShowSosPanel(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-950/60 border-2 border-red-700 text-red-400 font-bold text-sm hover:bg-red-900/60 transition-colors"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>
      </header>

      {routeComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-900/60 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-12 text-center space-y-3"
        >
          <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
          <h2 className="text-3xl font-display font-black text-white">ROTA TAMAMLANDI</h2>
          <p className="text-gray-300">Tüm duraklar başarıyla tamamlandı. Araç okul kapısında.</p>
          <button
            onClick={() => { setNodes(INITIAL_NODES); setRouteComplete(false); }}
            className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white"
          >
            Yeni Sefer Başlat
          </button>
        </motion.div>
      )}

      {!routeComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">

          <div className="lg:col-span-8 space-y-5">

            <div className="bg-blue-950/40 border-2 border-blue-500/30 rounded-2xl px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase block">SONRAKI MANEVRA</span>
                  <span className="text-sm font-extrabold text-white">
                    {currentNode ? `200m · ${currentNode.stopName.split(',')[0]}` : 'Yol Navigasyonu Tamamlandı'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-blue-600 px-3 py-1 rounded-full text-white">CANLI GPS</span>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-4 border-blue-500/30 rounded-3xl p-7 relative overflow-hidden flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <span className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
                  SIRADAKİ DURAK #{currentNode?.seq ?? '–'}
                </span>
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">{currentNode ? '~ 300 Metre' : 'YOL BITTI'}</span>
                </div>
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
                  {currentNode?.studentName ?? 'Tüm Duraklar Tamam'}
                </h2>
                <p className="text-xl text-gray-300 font-medium mt-1">
                  {currentNode?.stopName ?? 'Araç okul kapısına doğru ilerliyor'}
                </p>
              </div>

              {currentNode?.absenceFlagged && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl p-4 flex items-center justify-between alert-badge-pulse"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="text-amber-400 font-extrabold text-xs uppercase block">
                        VELİ BİLDİRİMİ — DURAK DIŞI BIRAKMA
                      </span>
                      <span className="text-gray-200 font-medium text-sm">{currentNode.absenceNote}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingPruneNode(currentNode)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-black px-5 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 ml-4 flex-shrink-0"
                  >
                    DURAĞI ATLA
                  </button>
                </motion.div>
              )}

              {currentNode && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (!isTimerRunning && legalTimer === 120) { setIsTimerRunning(true); }
                      else if (isTimerRunning) { setIsTimerRunning(false); }
                      else { setLegalTimer(120); setIsTimerRunning(false); }
                    }}
                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-base border-2 transition-all ${
                      legalTimer === 0
                        ? 'bg-red-600/30 border-red-500 text-red-300'
                        : isTimerRunning
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    {legalTimer === 0 ? 'SÜRE DOLDU' : isTimerRunning ? ` ${formatTimer(legalTimer)}` : '2 DAK. BEKLEME'}
                  </button>

                  <button
                    onClick={handleBoardStudent}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black p-5 rounded-2xl text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    ÖĞRENCİ BİNDİ
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={setShowSosPanel.bind(null, true)}
                className="flex-1 bg-red-950/50 hover:bg-red-900/60 border-2 border-red-700 text-red-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
              >
                <ShieldAlert className="w-5 h-5 text-red-500" />
                ACİL DURUM / SOS
              </button>
              <button
                onClick={() => showToast('Merkez (0850 555 0000) aranıyor...')}
                className="bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold p-4 rounded-2xl flex items-center gap-2 transition-colors"
              >
                <PhoneCall className="w-5 h-5 text-blue-400" />
                MERKEZİ ARA
              </button>
              <button
                onClick={() => showToast('Okul yöneticisi ile chat açıldı.')}
                className="bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold p-4 rounded-2xl flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-purple-400" />
                MESAJ
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-gray-950 border-2 border-gray-800 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-extrabold text-gray-300 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-400" />
                DURAK SIRASI
              </h3>
              <span className="text-xs bg-blue-950 border border-blue-700 text-blue-400 px-2.5 py-1 rounded-full font-bold">
                {passedCount}/{totalCount}
              </span>
            </div>

            <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-[10px] font-bold">
              {(['ALL', 'PENDING', 'PASSED'] as const).map(f => (
                <button key={f} onClick={() => setStopFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${stopFilter === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {f === 'ALL' ? 'Tümü' : f === 'PENDING' ? 'Bekleyen' : 'Geçilen'}
                </button>
              ))}
            </div>

            <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(passedCount / totalCount) * 100}%` }}
              />
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {filteredNodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => node.status !== 'PASSED' && node.status !== 'SKIPPED_BY_DRIVER' && setPendingPruneNode(node)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    node.status === 'CURRENT'
                      ? 'bg-blue-950/50 border-blue-500 text-white cursor-default'
                      : node.status === 'PASSED'
                      ? 'bg-gray-900/40 border-gray-800 text-gray-600 opacity-60'
                      : node.status === 'SKIPPED_BY_DRIVER'
                      ? 'bg-red-950/20 border-red-900/50 text-red-400 line-through'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-amber-600/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      #{node.seq}
                    </span>
                    <div>
                      <p className="font-bold text-sm leading-tight">{node.studentName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{node.stopName}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {node.absenceFlagged && node.status !== 'SKIPPED_BY_DRIVER' && (
                      <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                    )}
                    {node.status === 'SKIPPED_BY_DRIVER' && <UserX className="w-5 h-5 text-red-500" />}
                    {node.status === 'PASSED' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {node.status === 'CURRENT' && <BellRing className="w-5 h-5 text-blue-400 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {pendingPruneNode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 border-amber-500/60 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-9 h-9 text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-white">ROTA BUDAMA ONAYI</h3>
                <p className="text-gray-300 text-sm mt-2">
                  <span className="font-bold text-amber-400">{pendingPruneNode.studentName}</span> durağı rotadan
                  budanacak. ETA &lt;500ms içinde yeniden hesaplanacak.
                </p>
              </div>

              {pendingPruneNode.absenceNote && (
                <div className="bg-gray-950 p-3.5 rounded-xl text-left border border-gray-800 text-xs text-gray-400 space-y-1">
                  <p><strong className="text-gray-200">Veli Notu:</strong> {pendingPruneNode.absenceNote}</p>
                  <p><strong className="text-gray-200">Yetki:</strong> Sürücü Manuel Onayı (v4.1)</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-1">
                <button
                  onClick={() => setPendingPruneNode(null)}
                  disabled={isPruning}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  İPTAL
                </button>
                <button
                  onClick={handlePruneConfirm}
                  disabled={isPruning}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                >
                  {isPruning ? 'HESAPLANIYOR...' : <><span>DURAĞI ATLA</span><ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSosPanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-gray-950 border-2 border-red-600 rounded-3xl p-8 max-w-md w-full space-y-5 text-white"
            >
              <div className="text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-3 animate-pulse" />
                <h3 className="text-2xl font-display font-black text-red-400">ACİL DURUM PANELİ</h3>
                <p className="text-gray-400 text-sm mt-1">Acil durum türünü seçin:</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Kaza & Çarpışma Bildirimi', desc: 'Merkez + 112 otomatik aranır' },
                  { label: 'Araç Yangını', desc: 'İtfaiye + Merkez yönlendirilir' },
                  { label: 'Öğrenci Sağlık Acil', desc: '112 Ambulans + Veli anında bildirilir' },
                  { label: 'Araç Arızası', desc: 'Yedek araç + Çekici koordinasyonu' },
                ].map((sos) => (
                  <button
                    key={sos.label}
                    onClick={() => { showToast(`"${sos.label}" bildirimi merkeze iletildi!`); setShowSosPanel(false); }}
                    className="w-full text-left p-4 bg-red-950/40 hover:bg-red-900/50 border border-red-800 rounded-2xl transition-colors"
                  >
                    <div className="font-bold text-sm text-white">{sos.label}</div>
                    <div className="text-[11px] text-red-400 mt-0.5">{sos.desc}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSosPanel(false)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-bold transition-colors"
              >
                KAPAT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
