import React from 'react';
import type { NavigationManeuver } from '../types';

const arrows: Record<NavigationManeuver['icon'], string> = {
  straight: '↑', 'turn-left': '←', 'turn-right': '→',
  'sharp-left': '↰', 'sharp-right': '↱',
  'slight-left': '↖', 'slight-right': '↗',
  roundabout: '⟳', arrive: '⏹', depart: '⬆',
  merge: '⇉', fork: '⤵',
};

interface Props { icon: NavigationManeuver['icon']; size?: number; className?: string; }

export const ManeuverIcon: React.FC<Props> = ({ icon, size = 20, className = '' }) => (
  <span className={`font-bold text-center leading-none ${className}`} style={{ fontSize: size }}>
    {arrows[icon]}
  </span>
);
