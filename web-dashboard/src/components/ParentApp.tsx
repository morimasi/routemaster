import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Clock, MapPin, QrCode, Send, Lock, MessageSquare, UserCheck,
  AlertCircle, ChevronDown, CheckCircle2, Star, Phone
} from 'lucide-react';
import { ShuttleXApiService } from '../services/api';
import type { ChatMessage } from '../types';

type Tab = 'tracking' | 'nfc' | 'chat';
type ChildKey = 'eymen' | 'zeynep';

const CHILDREN: Record<ChildKey, {
  name: string; grade: string; vehicle: string; driver: string; driverPhone: string;
  stop: string; eta: number; dist: string; progress: number;
}> = {
  eymen: {
    name: 'Eymen Altunel', grade: '4-B', vehicle: '34 AB 1234 (Sprinter)',
    driver: 'Mehmet Şahin', driverPhone: '0532 111 2233',
    stop: 'Cumhuriyet Mah. 4. Sok.', eta: 4, dist: '~650m', progress: 80,
  },
  zeynep: {
    name: 'Zeynep Altunel', grade: 'Anaokulu K-1', vehicle: '34 CD 5678 (Crafter)',
    driver: 'Ali Yılmaz', driverPhone: '0533 222 3344',
    stop: 'Okul Ana Girişi', eta: 12, dist: '~2.1km', progress: 35,
  },
};

const QUICK_REPLIES = ['Kapıda bekliyoruz', 'Servise yaklaştı mı?', 'Teşekkürler sürücü bey', 'Bugün geç kaldı'];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, sender: 'Öğretmen Aynur H.', text: 'Eymen bugün derse aktif katıldı, tebrikler.', time: '08:45', isMe: false, delivered: true, read: true },
  { id: 2, sender: 'Siz (Veli)', text: 'Teşekkür ederim Aynur Hanım!', time: '08:47', isMe: true, delivered: true, read: true },
];

const ABSENCE_REASONS = ['Ateş / Hastalık', 'Ailevi İzin / Seyahat', 'Özel Araçla Bırakılacak', 'Doktor Randevusu', 'Diğer'];

export const ParentApp: React.FC = () => {
  const [child, setChild]               = useState<ChildKey>('eymen');
  const [activeTab, setActiveTab]       = useState<Tab>('tracking');
  const [reason, setReason]             = useState(ABSENCE_REASONS[0]);
  const [isFlagged, setIsFlagged]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [roomId, setRoomId]             = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [newMsg, setNewMsg]             = useState('');
  const [isSending, setIsSending]       = useState(false);
  const [etaCountdown, setEtaCount]     = useState(CHILDREN.eymen.eta * 60);
  const [toast, setToast]               = useState<string | null>(null);
  const chatEndRef                       = useRef<HTMLDivElement>(null);

  const currentChild = CHILDREN[child];

  // ETA countdown
  useEffect(() => {
    setEtaCount(CHILDREN[child].eta * 60);
    setIsFlagged(false);
  }, [child]);

  useEffect(() => {
    if (etaCountdown <= 0) return;
    const iv = setInterval(() => setEtaCount(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv);
  }, [etaCountdown, child]);

  // Init chat room on tab switch
  useEffect(() => {
    if (activeTab !== 'chat' || roomId) return;
    ShuttleXApiService.initChatRoom('t-1001', 'p-9001', 't-7001').then((res: any) => {
      setRoomId(res.room_id ?? '');
    });
  }, [activeTab, roomId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggleAbsence = async () => {
    setIsLoading(true);
    const next = !isFlagged;
    try {
      await ShuttleXApiService.flagParentAbsence('t-1001', 'r-sabah-1', 'n2', 's-8001',
        next ? `Veli (${reason}): Bugün servise binmeyecek.` : 'Veli bildirimi iptal edildi.');
      setIsFlagged(next);
      showToast(next
        ? `✅ Bildirim iletildi. Şoför HUD uyarısı aktif.`
        : '🔄 Devamsızlık bildirimi iptal edildi.');
    } finally {
      setIsLoading(false);
    }
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

    try {
      await ShuttleXApiService.sendChatMessage(roomId, msg, 'p-9001');
      setChatMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, delivered: true } : m));
    } finally {
      setIsSending(false);
    }
  }, [newMsg, roomId]);

  const etaMins = Math.floor(etaCountdown / 60);
  const etaSecs = etaCountdown % 60;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-0 md:p-6 font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Frame */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <header className="px-5 pt-6 pb-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base text-white leading-tight">ShuttleX Veli</h1>
                <div className="relative mt-0.5">
                  <select
                    value={child}
                    onChange={e => setChild(e.target.value as ChildKey)}
                    className="bg-slate-800 border border-slate-700 text-[11px] text-blue-300 font-bold rounded-lg px-2 py-0.5 pr-6 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="eymen">👦 Eymen Altunel — 4-B</option>
                    <option value="zeynep">👧 Zeynep Altunel — Anaokulu</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1.5 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              Canlı
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── TAB 1: TRACKING ───────────────────────────────── */}
          {activeTab === 'tracking' && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* ETA Hero Card */}
              <div className="glass-panel p-5 bg-gradient-to-br from-blue-900/30 to-slate-900/80 border-blue-500/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">TAHMİNİ VARIŞ (ETA)</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-display font-black text-white tabular-nums">
                    {etaCountdown === 0 ? '0' : etaMins}
                  </span>
                  <span className="text-xl font-bold text-slate-300">
                    {etaCountdown === 0 ? 'Kapıda!' : `dk ${String(etaSecs).padStart(2, '0')}s`}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto font-medium">{currentChild.dist}</span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Durak: {currentChild.stop}</span>
                </p>
                <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${currentChild.progress}%` }}
                  />
                </div>
              </div>

              {/* Absence Flag Card (V4.1) */}
              <div className={`glass-panel p-4 space-y-3 transition-all ${isFlagged ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-700/50'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isFlagged ? 'text-amber-400' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-bold text-sm text-white">Devamsızlık Bildirimi</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bildirim sonrası şoför HUD'ına anlık uyarı düşer.
                    </p>
                  </div>
                </div>

                {!isFlagged && (
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}

                <button
                  onClick={handleToggleAbsence}
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isFlagged
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  } disabled:opacity-60`}
                >
                  {isLoading ? '...' : isFlagged
                    ? <><UserCheck className="w-4 h-4" /> BİLDİRİM İPTAL ET</>
                    : 'BUGÜN SERVİSE BİNMEYECEK — BİLDİR'
                  }
                </button>
              </div>

              {/* Vehicle & Driver Card */}
              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Araç ve Sürücü Bilgisi</h3>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Araç Plakası</span>
                    <span className="font-bold text-white text-sm mt-0.5">{currentChild.vehicle}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Sürücü</span>
                    <span className="font-bold text-white text-sm mt-0.5">{currentChild.driver}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href={`tel:${currentChild.driverPhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-500/30 px-3 py-2 rounded-xl hover:bg-blue-900/40 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> {currentChild.driverPhone}
                  </a>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.9 Puan</span>
                  </div>
                </div>
              </div>

              {/* Journey Log */}
              <div className="glass-panel p-4 space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bugünün Servis Kaydı</h3>
                {[
                  { label: 'Araç Hareket Etti', time: '07:42', done: true },
                  { label: 'İlk Durak Tamamlandı', time: '07:58', done: true },
                  { label: `${currentChild.name} Durağı`, time: `~0${currentChild.eta + 7}:12`, done: false },
                  { label: 'Okul Kapısı', time: '–', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${step.done ? 'bg-emerald-500' : 'bg-slate-700 border border-slate-600'}`}>
                      {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={step.done ? 'text-slate-300' : 'text-slate-500'}>{step.label}</span>
                    <span className="ml-auto text-slate-500 font-mono">{step.time}</span>
                  </div>
                ))}
              </div>

            </motion.div>
          )}

          {/* ── TAB 2: NFC DIGITAL BOARDING CARD ──────────────── */}
          {activeTab === 'nfc' && (
            <motion.div key="nfc" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
              <div className="glass-panel p-6 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border-blue-500/30">
                <div className="w-14 h-14 bg-blue-600/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                  <QrCode className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">{currentChild.name}</h3>
                <p className="text-xs text-slate-400">{currentChild.grade} — Dijital Biniş Kartı</p>

                {/* Simulated QR */}
                <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto my-5 flex items-center justify-center shadow-2xl">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Simple QR-like pattern */}
                    {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                      const corner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
                      const fill = corner || Math.random() > 0.5 ? '#000' : '#fff';
                      return <rect key={`${r}-${c}`} x={c*14+1} y={r*14+1} width={12} height={12} fill={fill} />;
                    }))}
                  </svg>
                </div>

                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg inline-block border border-slate-800 mb-4">
                  SX-NFC-{child === 'eymen' ? '77891' : '88902'}-{Date.now().toString().slice(-4)}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-2 rounded-full">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ECDH_AES_GCM Kriptografik NFC Hash</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Bu kartı araç NFC okuyucusuna veya şoförün tabletine yaklaştırın.
                    Her 24 saatte bir otomatik yenilenir.
                  </p>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="glass-panel p-4 text-xs">
                <h4 className="font-bold text-slate-300 text-left mb-3">Bu Ay Devam Durumu</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Katıldı', value: '18', color: 'text-emerald-400' },
                    { label: 'Devamsız', value: '2',  color: 'text-amber-400' },
                    { label: 'Oran',    value: '%90', color: 'text-blue-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TAB 3: E2E ENCRYPTED CHAT ──────────────────────── */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              {/* Encryption Badge */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center text-[11px] flex items-center justify-center gap-2 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>ECDH_AES_GCM Uçtan Uca Şifreli Sohbet — {currentChild.driver}</span>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    {!msg.isMe && (
                      <span className="text-[10px] text-slate-500 mb-1 ml-1">{msg.sender}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] text-xs font-medium ${
                      msg.isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] text-slate-600">{msg.time}</span>
                      {msg.isMe && (
                        <span className="text-[9px] text-slate-500">
                          {msg.delivered ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_REPLIES.map(r => (
                  <button
                    key={r}
                    onClick={() => handleSendMessage(r)}
                    className="text-[10px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isSending && handleSendMessage()}
                  placeholder="Şifreli mesaj yazın..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!newMsg.trim() || isSending}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Teacher Rating */}
              <div className="glass-panel p-3 flex items-center justify-between text-xs mt-1">
                <span className="text-slate-400">Şoför Değerlendirme</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => showToast(`⭐ ${s} yıldız değerlendirmesi gönderildi!`)}>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 hover:scale-125 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="p-3 bg-slate-900 border-t border-slate-800/80 grid grid-cols-3 gap-2">
          {[
            { key: 'tracking', icon: <Bus className="w-5 h-5" />, label: 'Canlı Takip' },
            { key: 'nfc',      icon: <QrCode className="w-5 h-5" />, label: 'NFC Kart' },
            { key: 'chat',     icon: <MessageSquare className="w-5 h-5" />, label: 'E2E Sohbet' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as Tab)}
              className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === t.key
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon}
              <span className="mt-1">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
