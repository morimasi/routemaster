import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Map, Users, Settings, CreditCard, CarFront, LogOut 
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
      isActive 
        ? 'bg-blue-600/15 text-white border border-blue-500/30 shadow-lg' 
        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
    }`}
  >
    <div className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`}>{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </div>
);

interface PremiumSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDocumentAIOpen: () => void;
}

export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ activeTab, onTabChange, onDocumentAIOpen }) => {
  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 glass-panel m-2 flex flex-col justify-between flex-shrink-0"
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <CarFront className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            ShuttleX
          </h1>
        </div>

        <nav className="space-y-2">
          <SidebarItem icon={<LayoutDashboard />} label="Sistem Özeti" isActive={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} />
          <SidebarItem icon={<Map />} label="Canlı Radar" isActive={activeTab === 'radar'} onClick={() => onTabChange('radar')} />
          <SidebarItem icon={<Users />} label="Filo & Şoförler" isActive={activeTab === 'fleet'} onClick={() => onTabChange('fleet')} />
          <SidebarItem icon={<Settings />} label="Kurum Ayarları" isActive={activeTab === 'settings'} onClick={() => onTabChange('settings')} />
          <SidebarItem icon={<CreditCard />} label="Abonelik & Fatura" isActive={activeTab === 'billing'} onClick={() => onTabChange('billing')} />
        </nav>

        <div className="mt-6 space-y-2">
          <button
            onClick={onDocumentAIOpen}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 hover:border-purple-500 text-purple-200 text-[10px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-600/20"
          >
            <span>Fotoğraftan Rota (AI)</span>
          </button>
        </div>
      </div>

      <div className="p-5 border-t border-slate-800/80">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img src="https://i.pravatar.cc/100?img=14" alt="Planlayıcı" className="w-8 h-8 rounded-full border-2 border-slate-700" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Koray G.</span>
            <span className="text-[9px] text-gray-400">Baş Planlayıcı</span>
          </div>
          <LogOut className="w-3 h-3 text-gray-400 ml-auto" />
        </div>
      </div>
    </motion.aside>
  );
};
