import React from 'react';
import { Gauge, Clock, MapPin } from 'lucide-react';
import type { NavigationState, NavigationRoute } from '../types';
import { formatDistance, formatDuration } from '../utils';

interface Props {
  state: NavigationState;
  route: NavigationRoute;
}

export const NavigationHUD: React.FC<Props> = ({ state, route }) => {
  const nextStop = route.stops[state.currentStopIndex];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
        <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><Gauge className="w-3 h-3" /> Hız</p>
        <p className="text-lg font-bold text-blue-400 font-mono">{Math.round(state.speed)}</p>
        <p className="text-[8px] text-slate-600">km/h</p>
      </div>
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center">
        <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Kalan Süre</p>
        <p className="text-lg font-bold text-emerald-400 font-mono">{formatDuration(state.remainingDuration)}</p>
        <p className="text-[8px] text-slate-600">{formatDistance(state.remainingDistance)}</p>
      </div>
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2.5 text-center col-span-2">
        <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> Sonraki Durak</p>
        <p className="text-sm font-bold text-white truncate max-w-full">{nextStop?.name || 'Okul'}</p>
        <p className="text-[8px] text-slate-600 truncate">{nextStop?.address || 'Varış'}</p>
      </div>
    </div>
  );
};
