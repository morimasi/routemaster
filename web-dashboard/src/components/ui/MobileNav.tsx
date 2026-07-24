import React from 'react';
import { 
  LayoutDashboard, Map, Users, Settings, CreditCard, 
  Sparkles, FileText
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Özet', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'radar', label: 'Radar', icon: <Map className="w-5 h-5" /> },
  { id: 'fleet', label: 'Filo', icon: <Users className="w-5 h-5" /> },
  { id: 'settings', label: 'Ayarlar', icon: <Settings className="w-5 h-5" /> },
  { id: 'billing', label: 'Fatura', icon: <CreditCard className="w-5 h-5" /> },
];

const extraItems: NavItem[] = [
  { id: 'photo-route', label: 'AI Rota', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'document', label: 'Belge', icon: <FileText className="w-5 h-5" /> },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExtraClick: (id: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onExtraClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-1.5 px-2 min-w-0 rounded-xl transition-all ${
                activeTab === item.id ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600/15' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-semibold mt-0.5 leading-none">{item.label}</span>
            </button>
          ))}
          
          <div className="w-px h-8 bg-slate-800/60" />
          
          {extraItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onExtraClick(item.id)}
              className="flex flex-col items-center py-1.5 px-2 min-w-0 rounded-xl transition-all text-purple-400"
            >
              <div className="p-1 rounded-lg bg-purple-600/10">
                {item.icon}
              </div>
              <span className="text-[9px] font-semibold mt-0.5 leading-none text-purple-400">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
