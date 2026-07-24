import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  Settings, 
  CarFront, 
  BellRing,
  Search,
  LogOut,
  Sparkles,
  Smartphone,
  Navigation
} from 'lucide-react';
import { DriverHUD } from './components/DriverHUD';
import { ParentApp } from './components/ParentApp';
import { DocumentAIModal } from './components/DocumentAIModal';
import { PlannerRadar } from './components/planner/PlannerRadar';
import type { Route, DocumentAINode } from './types';

function App() {
  const [activeRole, setActiveRole] = useState<'planner' | 'driver' | 'parent'>('planner');
  const [activeTab, setActiveTab] = useState('radar');
  const [isDocumentAIOpen, setIsDocumentAIOpen] = useState(false);

  // Dynamic state for routes
  const [routes, setRoutes] = useState<Route[]>([
    { id: '1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65, nodes: [] },
    { id: '2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 1, progressPercent: 40, nodes: [] },
    { id: '3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10, nodes: [] }
  ]);

  // Handler when Document AI imports new extracted nodes
  const handleNodesImported = (extractedNodes: DocumentAINode[]) => {
    const newRoute: Route = {
      id: `ai-route-${Date.now()}`,
      name: `AI OCR Rota (${extractedNodes.length} Durak)`,
      vehiclePlate: '34 AI 2026',
      status: 'ACTIVE',
      alertsCount: 0,
      progressPercent: 0,
      nodes: extractedNodes.map((n, idx) => ({
        id: `node-${n.id}`,
        studentName: n.student,
        stopName: n.address,
        seq: idx + 1,
        status: idx === 0 ? 'CURRENT' : 'PENDING',
        absenceFlagged: false,
      })),
    };
    setRoutes((prev) => [newRoute, ...prev]);
  };

  return (
    <div className="min-h-screen bg-app-background text-foreground flex flex-col font-sans">
      
      {/* GLOBAL ROLE SWITCHER BAR (HEADER TOP) */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">ShuttleX v5.0 Canlı Önizleme:</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveRole('planner')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeRole === 'planner'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Planlayıcı Radarı</span>
          </button>

          <button
            onClick={() => setActiveRole('driver')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeRole === 'driver'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Şoför HUD (Dark Mode)</span>
          </button>

          <button
            onClick={() => setActiveRole('parent')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeRole === 'parent'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Veli App (Mobil)</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE ROLE VIEW */}
      {activeRole === 'driver' && <DriverHUD />}
      {activeRole === 'parent' && <ParentApp />}
      {activeRole === 'planner' && (
        <div className="flex-1 flex overflow-hidden p-4">
          {/* GLASSMORPHISM SIDEBAR */}
          <motion.aside 
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-72 glass-panel m-2 flex flex-col justify-between"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-10">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <CarFront className="text-white w-6 h-6" />
                 </div>
                 <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                   ShuttleX
                 </h1>
              </div>

              <nav className="space-y-3">
                <SidebarItem icon={<LayoutDashboard />} label="Sistem Özeti" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarItem icon={<MapIcon />} label="Canlı Radar" isActive={activeTab === 'radar'} onClick={() => setActiveTab('radar')} />
                <SidebarItem icon={<Users />} label="Filo & Şoförler" isActive={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
                <SidebarItem icon={<Settings />} label="Kurum Ayarları" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </nav>

              {/* DOCUMENT AI TRIGGER BUTTON */}
              <div className="mt-8">
                <button
                  onClick={() => setIsDocumentAIOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 hover:border-purple-500 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-600/20"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Fotoğraftan Rota (Document AI)</span>
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800/80">
              <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                <img src="https://i.pravatar.cc/100?img=14" alt="Planlayıcı" className="w-10 h-10 rounded-full border-2 border-slate-700" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Koray G.</span>
                  <span className="text-xs text-gray-400">Baş Planlayıcı</span>
                </div>
                <LogOut className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            </div>
          </motion.aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 flex flex-col p-2 pl-0">
            <header className="h-20 glass-panel mb-4 flex items-center justify-between px-8">
              <div className="flex items-center gap-4 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3" />
                <input 
                  type="text" 
                  placeholder="Rota, öğrenci veya araç plakası ara..." 
                  className="bg-slate-900/50 border border-slate-800 text-white text-sm rounded-full pl-10 pr-4 py-2.5 w-80 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-5">
                 <div className="text-xs text-gray-300 font-medium px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800">
                   Sistem Durumu: <span className="text-emerald-400 ml-1">Kusursuz (4ms Gecikme)</span>
                 </div>
                 
                 <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
                   <BellRing className="w-5 h-5 text-gray-300" />
                   <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[#151f32]"></span>
                 </button>
              </div>
            </header>

            {/* MODULAR PLANNER RADAR COMPONENT */}
            <div className="flex-1 overflow-y-auto">
              <PlannerRadar routes={routes} />
            </div>
          </main>

          {/* DOCUMENT AI MODAL */}
          <DocumentAIModal
            isOpen={isDocumentAIOpen}
            onClose={() => setIsDocumentAIOpen(false)}
            onNodesImported={handleNodesImported}
          />
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, isActive, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
        isActive 
         ? 'bg-blue-600/15 text-white border border-blue-500/30 shadow-lg' 
         : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      {React.cloneElement(icon, { className: `w-5 h-5 ${isActive ? 'text-blue-400' : ''}` })}
      <span className="font-medium">{label}</span>
    </div>
  );
}

export default App;
