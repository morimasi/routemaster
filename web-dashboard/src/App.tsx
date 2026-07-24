import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { TopBar } from './components/ui/TopBar';
import { PremiumSidebar } from './components/ui/PremiumSidebar';
import { MobileNav } from './components/ui/MobileNav';
import { DashboardModule } from './modules/dashboard';
import { RadarModule } from './modules/radar';
import { FleetModule } from './modules/fleet';
import { SettingsModule } from './modules/settings';
import { BillingModule } from './modules/billing';
import { PhotoRouteModule } from './modules/photo-route';
import { DocumentModule } from './modules/document';
import { DriverHUDModule } from './modules/driver-hud';
import { ParentModule } from './modules/parent-app';
import { useWindowSize } from './hooks/useWindowSize';
import { useSwipe } from './hooks/useSwipe';
import type { Route, DocumentAINode } from './types';

type TabId = 'dashboard' | 'radar' | 'fleet' | 'settings' | 'billing';

function App() {
  const { isMobile, isTablet } = useWindowSize();
  const [activeRole, setActiveRole] = useState<'planner' | 'driver' | 'parent'>('planner');
  const [activeTab, setActiveTab] = useState<TabId>('radar');
  const [isPhotoRouteOpen, setIsPhotoRouteOpen] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [routes] = useState<Route[]>([
    { id: '1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65, nodes: [] },
    { id: '2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 1, progressPercent: 40, nodes: [] },
    { id: '3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10, nodes: [] },
  ]);

  const [notifications] = useState([
    { id: 1, title: 'Veli İptal Bildirimi', text: 'Eymen Altunel için veli devamsızlık bildirdi.', time: '2 dk önce', type: 'alert' as const },
    { id: 2, title: 'VRPTW Rota Optimizasyonu', text: 'Sabah bandı rotalarında %19.2 yakıt tasarrufu sağlandı.', time: '15 dk önce', type: 'success' as const },
  ]);

  const handleNodesImported = useCallback((extractedNodes: DocumentAINode[]) => {
    console.log(`${extractedNodes.length} node imported via Photo Route AI`);
    setActiveTab('radar');
  }, []);

  const tabIds: TabId[] = ['dashboard', 'radar', 'fleet', 'settings', 'billing'];
  const currentTabIndex = tabIds.indexOf(activeTab);

  const nextTab = useCallback(() => {
    setActiveTab(tabIds[(currentTabIndex + 1) % tabIds.length]);
  }, [currentTabIndex]);

  const prevTab = useCallback(() => {
    setActiveTab(tabIds[(currentTabIndex - 1 + tabIds.length) % tabIds.length]);
  }, [currentTabIndex]);

  const swipeHandlers = useSwipe({ onSwipeLeft: nextTab, onSwipeRight: prevTab });

  const handleTabChange = (tab: string) => {
    if (tabIds.includes(tab as TabId)) {
      setActiveTab(tab as TabId);
    }
  };

  const handleExtraClick = (id: string) => {
    if (id === 'photo-route') setIsPhotoRouteOpen(true);
    if (id === 'document') setIsDocumentOpen(true);
  };

  const radarRoutes = routes
    .filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      vehiclePlate: r.vehiclePlate,
      status: r.status as 'ACTIVE' | 'WARNING' | 'SCHEDULED' | 'COMPLETED',
      alertsCount: r.alertsCount,
      progressPercent: r.progressPercent,
      nodes: [],
    }));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardModule />;
      case 'radar': return <RadarModule routes={radarRoutes} />;
      case 'fleet': return <FleetModule />;
      case 'settings': return <SettingsModule />;
      case 'billing': return <BillingModule />;
    }
  };

  if (activeRole === 'driver') return <DriverHUDModule />;
  if (activeRole === 'parent') return <ParentModule />;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-app-background text-foreground font-sans flex flex-col">
        <TopBar isMobile notifications={notifications} />
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 pb-24 scroll-smooth-mobile" {...swipeHandlers}>
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rota, plaka ara..." className="w-full bg-slate-900/80 border border-slate-800 text-white text-[10px] sm:text-xs rounded-full pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        <MobileNav activeTab={activeTab} onTabChange={handleTabChange} onExtraClick={handleExtraClick} />
        <PhotoRouteModule isOpen={isPhotoRouteOpen} onClose={() => setIsPhotoRouteOpen(false)} onNodesImported={handleNodesImported} />
        <DocumentModule isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-foreground flex flex-col font-sans">
      <TopBar isMobile={false} notifications={notifications} onRoleChange={setActiveRole} activeRole={activeRole} />
      {activeRole === 'planner' && (
        <div className={`flex-1 flex ${isTablet ? 'overflow-y-auto' : 'overflow-hidden'} p-2 sm:p-3 lg:p-4`}>
          {!isTablet && (
            <PremiumSidebar activeTab={activeTab} onTabChange={setActiveTab} onDocumentAIOpen={() => setIsPhotoRouteOpen(true)} />
          )}
          <main className="flex-1 flex flex-col p-1 sm:p-2 min-w-0">
            {isTablet && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <div className="flex gap-1 bg-slate-900/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-800 text-[8px] sm:text-xs font-bold flex-shrink-0">
                  {tabIds.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                      {tab === 'dashboard' ? 'Özet' : tab === 'radar' ? 'Radar' : tab === 'fleet' ? 'Filo' : tab === 'settings' ? 'Ayarlar' : 'Fatura'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsPhotoRouteOpen(true)} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-purple-300 text-[8px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                  AI Rota
                </button>
                <button onClick={() => setIsDocumentOpen(true)} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-emerald-600/30 border border-blue-500/40 text-blue-300 text-[8px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                  Belge
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-0.5">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <PhotoRouteModule isOpen={isPhotoRouteOpen} onClose={() => setIsPhotoRouteOpen(false)} onNodesImported={handleNodesImported} />
          <DocumentModule isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
