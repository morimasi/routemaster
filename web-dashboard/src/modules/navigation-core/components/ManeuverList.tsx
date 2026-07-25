import React from 'react';
import { motion } from 'framer-motion';
import { Route, X, CheckCircle2 } from 'lucide-react';
import type { NavigationRoute, NavigationState } from '../types';
import { ManeuverIcon } from './ManeuverIcon';
import { formatDistance } from '../utils';

interface Props {
  route: NavigationRoute;
  state: NavigationState;
  isNavigating: boolean;
  onClose: () => void;
}

export const ManeuverList: React.FC<Props> = ({ route, state, isNavigating, onClose }) => {
  return (
    <motion.div
      initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/80 z-20 overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-3 border-b border-slate-800 flex items-center justify-between z-10">
        <h3 className="text-xs font-bold flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-blue-400" />
          Manevralar
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-0.5">
        {route?.maneuvers.map((m, i) => {
          const isActive = i === state.currentManeuverIndex && isNavigating;
          const isPast = i < state.currentManeuverIndex;
          return (
            <div key={m.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${isActive ? 'bg-blue-600/15 border border-blue-500/30 shadow-sm shadow-blue-600/10' : isPast ? 'opacity-40' : 'hover:bg-slate-800/40'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ManeuverIcon icon={m.icon} size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{m.instruction}</p>
                <p className="text-[8px] text-slate-500">{m.streetName}</p>
              </div>
              <div className="text-[9px] text-slate-500 font-mono flex-shrink-0">{formatDistance(m.distance)}</div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
