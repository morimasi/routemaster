import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, 
  Clock, 
  MapPin, 
  QrCode, 
  Send, 
  Lock, 
  MessageSquare, 
  UserCheck, 
  AlertCircle
} from 'lucide-react';

export const ParentApp: React.FC = () => {
  const [isAbsenceFlagged, setIsAbsenceFlagged] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracking' | 'nfc' | 'chat'>('tracking');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Öğretmen - Ayşe Hoca', text: 'Eymen derse zamanında katıldı, bilgilendirme.', time: '08:45', isMe: false },
    { id: 2, sender: 'Siz (Veli)', text: 'Teşekkürler Ayşe Hanım.', time: '08:47', isMe: true }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'Siz (Veli)', text: newMessage, time: 'Şimdi', isMe: true }
    ]);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-0 md:p-6 font-sans">
      
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 md:rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="p-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white">ShuttleX Veli</h1>
              <p className="text-xs text-slate-400">Öğrenci: Eymen Altunel</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Canlı Takip</span>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* TAB 1: REALTIME CANLI TAKİP & V4.1 ABSENCE FLAG */}
          {activeTab === 'tracking' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* ETA Counter Hero Card */}
              <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-slate-900 border-blue-500/30">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">TAHMİNİ VARIŞ (ETA)</span>
                  <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-display font-black text-white">4</span>
                  <span className="text-xl font-bold text-slate-300">Dakika</span>
                  <span className="text-xs text-slate-400 ml-auto font-medium">~650 Metre</span>
                </div>

                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Durak: Cumhuriyet Mah. 4. Sokak</span>
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-4/5 rounded-full"></div>
                </div>
              </div>

              {/* V4.1 ABSENCE BUTTON ("BUGÜN SERVİSE BİNMEYECEK") */}
              <div className="glass-panel p-5 border-amber-500/30 bg-amber-950/10">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Devamsızlık Bildirimi (v4.1)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Butona bastığınızda şoför ekranına <strong className="text-amber-300">Uyarı Rozeti</strong> düşer. Rota silinmez, şoför durağa geldiğinde onaylar.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAbsenceFlagged(!isAbsenceFlagged)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    isAbsenceFlagged
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isAbsenceFlagged ? (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>İPTAL BİLDİRİLDİ (GELMEYECEK)</span>
                    </>
                  ) : (
                    <span>BUGÜN SERVİSE BİNMEYECEK (BİLDİR)</span>
                  )}
                </button>
              </div>

              {/* Vehicle & Driver Mini Specs */}
              <div className="glass-panel p-4 flex items-center justify-between text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block">Servis Aracı</span>
                  <span className="font-bold text-white text-sm">34 AB 1234 (Mercedes Sprinter)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Sürücü</span>
                  <span className="font-bold text-white text-sm">Mehmet Şahin</span>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: DIGITAL NFC & QR KİMLİK KARTI */}
          {activeTab === 'nfc' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
              <div className="glass-panel p-8 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-blue-500/40 relative">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-400/40 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Öğrenci Dijital Biniş Kartı</h3>
                <p className="text-xs text-slate-400 mb-6">Şoför cihazına veya kapı okuyucuya yaklaştırın.</p>

                {/* Simulated QR Code Canvas */}
                <div className="w-48 h-48 bg-white p-4 rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
                  <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center text-black font-black text-xs tracking-tighter">
                    [ SHUTTLEX-NFC-HASH-77891 ]
                  </div>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-4 py-2 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kriptografik NFC Hash Aktif</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: E2E ENCRYPTED HIYERARŞIK CHAT */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-96 justify-between">
              
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-center text-slate-400 flex items-center justify-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>ECDH-P256 & AES-256-GCM Uçtan Uca Şifreli Sohbet</span>
              </div>

              {/* Chat Log */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-500 mb-1">{msg.sender}</span>
                    <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${
                      msg.isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-600 mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Şifreli mesaj yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

        </div>

        {/* Bottom Mobile Tab Bar Nav */}
        <nav className="p-3 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'tracking' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bus className="w-5 h-5 mb-1" />
            <span>Canlı Takip</span>
          </button>

          <button
            onClick={() => setActiveTab('nfc')}
            className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'nfc' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-5 h-5 mb-1" />
            <span>Dijital NFC</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'chat' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span>E2E Sohbet</span>
          </button>
        </nav>

      </div>

    </div>
  );
};
