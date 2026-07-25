import React from 'react';
import type { NavigationState, NavigationRoute } from '../types';
import { formatDuration } from '../utils';

interface Props {
  state: NavigationState;
  route: NavigationRoute;
}

export const NavigationProgress: React.FC<Props> = ({ state, route }) => {
  const passedStopsCount = route.stops.filter((_, i) => i < state.currentStopIndex).length;
  return (
    <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/60 rounded-xl p-2">
      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1.5">
        <span>İlerleme</span>
        <span className="font-mono font-bold text-emerald-400">%{state.progressPercent}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${state.progressPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-[8px] text-slate-600 mt-1">
        <span>{passedStopsCount}/{route.stops.length} durak</span>
        <span>{formatDuration(state.elapsedTime)} geçti</span>
      </div>
    </div>
  );
};
