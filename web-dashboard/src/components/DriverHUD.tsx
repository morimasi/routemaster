import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, 
  Mic, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Volume2, 
  UserX, 
  ArrowRight,
  PhoneCall
} from 'lucide-react';

export const DriverHUD: React.FC = () => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedNodeForPrune, setSelectedNodeForPrune] = useState<any>(null);
  const [legalTimer, setLegalTimer] = useState(120); // 2 Dakikalık Yasal Bekleme Kronometresi (120sn)
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Kronometre Sayacı
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && legalTimer > 0) {
      interval = setInterval(() => setLegalTimer((prev) => prev - 1), 1000);
    } else if (legalTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, legalTimer]);

  // V4.1 Örnek Durak Dizilimi (Preserved Sequence)
  const [nodes, setNodes] = useState([
    { id: 'n1', studentName: 'Ahmet Yılmaz', stopName: 'Atatürk Cad. No:14', seq: 1, status: 'PASSED', absenceFlagged: false },
    { id: 'n2', studentName: 'Eymen Altunel', stopName: 'Cumhuriyet Mah. 4. Sok', seq: 2, status: 'CURRENT', absenceFlagged: true, absenceNote: 'Veli: Ateşlendi, bugün gelmeyecek.' },
    { id: 'n3', studentName: 'Zeynep Kaya', stopName: 'Gül Apt. Kat:3', seq: 3, status: 'PENDING', absenceFlagged: false },
    { id: 'n4', studentName: 'Can Demir', stopName: 'Deniz Evleri B Blok', seq: 4, status: 'PENDING', absenceFlagged: false }
  ]);

  // Dinamik olarak mevcut aktif durağı bul (hardcoded index yerine)
  const currentNode = nodes.find((n) => n.status === 'CURRENT');

  const handlePruneConfirm = () => {
    if (!selectedNodeForPrune) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeForPrune.id
          ? { ...node, status: 'SKIPPED_BY_DRIVER', absenceFlagged: false }
          : node
      )
    );
    setSelectedNodeForPrune(null);
    setLegalTimer(120);
    setIsTimerRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 font-sans flex flex-col justify-between select-none">
      
      {/* HUD Header Bar - High Contrast & Status Indicators */}
      <header className="flex justify-between items-center bg-gray-900/90 border-2 border-gray-800 rounded-3xl p-4 md:p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/50">
            <Navigation className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-wide text-white">
              ROTA: KAVACIK - SABAH SERVİSİ
            </h1>
            <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              GPS: Canlı Telemetri Aktif (34 AB 1234)
            </p>
          </div>
        </div>

        {/* Dynamic Voice AI Status Badge */}
        <button
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
            isVoiceActive
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/60 animate-bounce'
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          <Mic className="w-5 h-5" />
          <span>{isVoiceActive ? 'DINLENIYOR: "ShuttleX..."' : 'Sesli Komut Başlat'}</span>
        </button>
      </header>

      {/* Main HUD Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1">
        
        {/* Left 8 Cols: Current Navigation & Stop Focus */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          
          {/* Active Stop Hero Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-4 border-blue-500/40 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start">
              <span className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded-full text-xs tracking-wider uppercase">
                SIRADAKİ DURAK #{currentNode?.seq ?? '-'}
              </span>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <Volume2 className="w-6 h-6 animate-pulse" />
                <span>300 METRE KALDI</span>
              </div>
            </div>

            <div className="my-6">
              <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-2">
                {currentNode?.studentName ?? 'Rota Tamamlandı'}
              </h2>
              <p className="text-2xl text-gray-300 font-medium">
                {currentNode?.stopName ?? 'Tüm duraklar geçildi.'}
              </p>
            </div>

            {/* V4.1 ALERT BADGE - VELI DEVAMSIZLIK UYARISI (Dinamik) */}
            {currentNode?.absenceFlagged && (
              <div className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/20 alert-badge-pulse">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <span className="text-amber-400 font-extrabold text-sm uppercase block">
                      ⚠ VELİ BİLDİRİMİ (DURAK DIŞI BIRAKMA UYARISI)
                    </span>
                    <span className="text-gray-200 font-medium text-base">
                      {(currentNode as any).absenceNote}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeForPrune(currentNode)}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black px-6 py-3 rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  DURAĞI ATLA (PRUNE)
                </button>
              </div>
            )}

            {/* Bottom Actions: 2 Min Timer & Board Confirmation */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {/* Yasal Bekleme Kronometresi (2 Dakika Rule) */}
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center justify-center gap-3 p-5 rounded-2xl font-black text-lg border-2 transition-all ${
                  legalTimer === 0
                    ? 'bg-red-600/30 border-red-500 text-red-300'
                    : isTimerRunning
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Clock className="w-7 h-7" />
                <span>
                  {legalTimer === 0
                    ? 'SÜRE DOLDU — ÇOCUK GELMEDİ'
                    : isTimerRunning
                    ? `KRONOMETRE: ${Math.floor(legalTimer / 60)}:${(legalTimer % 60).toString().padStart(2, '0')}`
                    : '2 DAKİKA BEKLEME BAŞLAT'}
                </span>
              </button>

              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black p-5 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/40 active:scale-95 transition-all">
                <CheckCircle2 className="w-7 h-7" />
                <span>ÖĞRENCİ BİNDİ (ONAYLA)</span>
              </button>
            </div>
          </div>

          {/* Quick SOS & Emergency */}
          <div className="flex gap-4">
            <button className="flex-1 bg-red-950/60 hover:bg-red-900 border-2 border-red-600 text-red-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-3 transition-colors">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <span>ACİL DURUM / SOS ARAMASI</span>
            </button>
            <button className="bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold p-4 rounded-2xl flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-400" />
              <span>MERKEZİ ARA</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Route Sequence Node Timeline (Preserved Order) */}
        <div className="lg:col-span-4 bg-gray-900/80 border-2 border-gray-800 rounded-3xl p-6 flex flex-col">
          <h3 className="text-lg font-display font-extrabold text-gray-300 mb-6 flex items-center justify-between">
            <span>DURAK SIRALAMASI</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">4 Durak</span>
          </h3>

          <div className="space-y-4 flex-1">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  node.status === 'CURRENT'
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg'
                    : node.status === 'PASSED'
                    ? 'bg-gray-900/50 border-gray-800 text-gray-500 opacity-60'
                    : node.status === 'SKIPPED_BY_DRIVER'
                    ? 'bg-red-950/20 border-red-900/50 text-red-400 line-through'
                    : 'bg-gray-900 border-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-sm">
                    #{node.seq}
                  </span>
                  <div>
                    <h4 className="font-bold text-base">{node.studentName}</h4>
                    <p className="text-xs text-gray-400">{node.stopName}</p>
                  </div>
                </div>

                {node.absenceFlagged && node.status !== 'SKIPPED_BY_DRIVER' && (
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                )}
                {node.status === 'SKIPPED_BY_DRIVER' && (
                  <UserX className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* V4.1 DRIVER MANUAL PRUNE CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedNodeForPrune && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 border-amber-500/60 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-display font-black text-white">
                  ROTA BUDAMA ONAYI
                </h3>
                <p className="text-gray-300 text-sm mt-2">
                  <span className="font-bold text-amber-400">{selectedNodeForPrune.studentName}</span> isimli öğrenci durağı rotadan geçici olarak çıkarılacak. ETA <span className="text-blue-400 font-bold">&lt; 500ms</span> içerisinde yeniden hesaplanacak.
                </p>
              </div>

              <div className="bg-gray-950 p-4 rounded-xl text-left border border-gray-800 text-xs text-gray-400 space-y-1">
                <p><strong className="text-gray-200">Veli Notu:</strong> {selectedNodeForPrune.absenceNote}</p>
                <p><strong className="text-gray-200">Yetki:</strong> Sürücü Manuel Onayı (v4.1 Şeffaf İşaretleme)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => setSelectedNodeForPrune(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-colors"
                >
                  İPTAL
                </button>
                <button
                  onClick={handlePruneConfirm}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>DURAĞI ATLA</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
