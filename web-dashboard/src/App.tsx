import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  Settings, 
  CarFront, 
  BellRing,
  AlertTriangle,
  Search,
  LogOut,
  ChevronRight
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('radar');

  // V4.1 Uyarı Göstergeli Sahte Rota Verisi
  const mockRoutes = [
    { id: '1', name: 'Sabah Bandı - Kavacık', vehicle: '34 AB 1234', status: 'ACTIVE', alerts: 0 },
    { id: '2', name: 'Anaokulu Öğlen Bağlantısı', vehicle: '34 CD 5678', status: 'WARNING', alerts: 1 }, // Uyarı rozetli araç
    { id: '3', name: 'Akşam Fabrika Servisi', vehicle: '34 EF 9012', status: 'SCHEDULED', alerts: 0 }
  ];

  return (
    <div className="flex h-screen bg-app-background text-foreground overflow-hidden font-sans">
      
      {/* 1. GLASSMORPHISM SIDEBAR (Aeronautic Radar Hissi) */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-72 glass-panel m-4 flex flex-col justify-between"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-premium-accent to-blue-400 flex items-center justify-center shadow-glow">
                <CarFront className="text-white w-6 h-6" />
             </div>
             <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
               ShuttleX
             </h1>
          </div>

          <nav className="space-y-4">
            <SidebarItem icon={<LayoutDashboard />} label="Sistem Özeti" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={<MapIcon />} label="Canlı Radar" isActive={activeTab === 'radar'} onClick={() => setActiveTab('radar')} />
            <SidebarItem icon={<Users />} label="Filo & Şoförler" isActive={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
            <SidebarItem icon={<Settings />} label="Kurum Ayarları" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </nav>
        </div>

        <div className="p-8 border-t border-premium-border/50">
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="https://i.pravatar.cc/100?img=14" alt="Planlayıcı" className="w-10 h-10 rounded-full border-2 border-premium-border" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Koray G.</span>
              <span className="text-xs text-gray-400">Baş Planlayıcı</span>
            </div>
            <LogOut className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </div>
      </motion.aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-4 pl-0">
        
        {/* Top Navbar */}
        <header className="h-20 glass-panel mb-6 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3" />
            <input 
              type="text" 
              placeholder="Rota, öğrenci veya araç plakası ara..." 
              className="bg-premium-dark/30 border border-premium-border text-white text-sm rounded-full pl-10 pr-4 py-2.5 w-80 focus:outline-none focus:border-premium-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-5">
             <div className="text-sm text-gray-300 font-medium px-4 py-2 rounded-full bg-premium-dark/50 border border-premium-border">
               Sistem Durumu: <span className="text-green-400 ml-1">Kusursuz (4ms Gecikme)</span>
             </div>
             
             {/* Animasyonlu Bildirim Zili */}
             <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
               <BellRing className="w-5 h-5 text-gray-300" />
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-premium-alert rounded-full border-2 border-[#151f32]"></span>
             </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 gap-6 h-full">
          
          {/* Kolon 1: Aktif Rotalar (Sol Paneller) */}
          <section className="col-span-1 space-y-4">
             <h2 className="text-xl font-display font-semibold mb-4 px-2">Anlık Rota Bağlantıları</h2>
             
             {mockRoutes.map((route, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  key={route.id}
                  className="glass-panel p-5 cursor-pointer group hover:bg-white/5 transition-colors relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-100 group-hover:text-premium-accent transition-colors">{route.name}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CarFront className="w-4 h-4" />
                    <span>{route.vehicle}</span>
                  </div>

                  {/* V4.1 Hibrid İşaretleme Rozeti (Pulse Animasyonlu) */}
                  {route.alerts > 0 && (
                    <div className="absolute top-0 right-0 p-3">
                       <div className="flex items-center gap-2 bg-premium-alert/20 text-premium-alert border border-premium-alert/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md alert-badge-pulse">
                         <AlertTriangle className="w-3.5 h-3.5" />
                         <span>{route.alerts} İptal İsteği</span>
                       </div>
                    </div>
                  )}

                  {/* Progress Line */}
                  <div className="w-full bg-premium-dark/50 h-1.5 rounded-full mt-5 overflow-hidden">
                    <div className="bg-premium-accent h-full rounded-full w-2/3"></div>
                  </div>
                </motion.div>
             ))}
          </section>

          {/* Kolon 2 & 3: Dev Harita Alanı (Sağ) */}
          <section className="col-span-2 glass-panel relative overflow-hidden flex flex-col justify-center items-center">
              {/* Buraya Mapbox GL / Kayan Harita API'si Gelecek. Şimdilik Cam Efektli Placeholder */}
              <div className="absolute inset-0 bg-glass-gradient opacity-50"></div>
              
              <div className="z-10 text-center space-y-4">
                 <div className="w-20 h-20 bg-premium-dark/60 rounded-full border border-premium-border/50 flex items-center justify-center mx-auto shadow-glow">
                   <MapIcon className="w-10 h-10 text-premium-accent" />
                 </div>
                 <h2 className="text-3xl font-display font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">
                   Canlı Kuşbakışı Radarı
                 </h2>
                 <p className="text-gray-400 text-sm max-w-sm mx-auto">
                   Gelişmiş WebGL harita motoru başlatılıyor. Tüm canlı telemetri verileri WebSocket üzerinden akıtılmaya hazır.
                 </p>
                 
                 <button className="mt-8 px-6 py-2.5 bg-premium-accent/10 border border-premium-accent/50 text-premium-accent rounded-full hover:bg-premium-accent hover:text-white transition-all shadow-glow hover:shadow-glow-alert font-medium text-sm">
                   Radarı Tam Ekran Aç
                 </button>
              </div>

              {/* Decorational Lines for Tech Feel */}
              <div className="absolute left-[-20%] top-[40%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-premium-accent/20 to-transparent transform rotate-12"></div>
              <div className="absolute left-[-20%] top-[60%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-premium-border/30 to-transparent transform -rotate-12"></div>
          </section>

        </div>
      </main>
    </div>
  );
}

// Sidebar Alt Bileşeni 
function SidebarItem({ icon, label, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
        isActive 
         ? 'bg-premium-accent/15 text-white border border-premium-accent/30 shadow-glow' 
         : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      {React.cloneElement(icon, { className: `w-5 h-5 ${isActive ? 'text-premium-accent' : ''}` })}
      <span className="font-medium">{label}</span>
    </div>
  )
}

export default App;
