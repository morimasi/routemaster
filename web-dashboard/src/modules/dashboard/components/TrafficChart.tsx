import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { TrafficDataPoint } from '../types';
import { BarChart3 } from 'lucide-react';

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const getBarColor = (peak: boolean, active: boolean) => {
    if (active) return peak ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500';
    return peak ? 'from-amber-500/30 to-orange-600/20' : 'from-blue-500/20 to-indigo-600/10';
  };

  const getBarGlow = (peak: boolean, active: boolean) => {
    if (!active) return '';
    return peak ? 'shadow-glow-alert' : 'shadow-glow';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-amber-600/5 rounded-3xl blur-xl" />
      <div className="relative bg-glass-gradient border border-white/[0.06] backdrop-blur-glass rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5 md:mb-6">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-display text-white">Trafik Yoğunluğu</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500">Saatlik araç hareketleri</p>
          </div>
        </div>

        <div className="flex items-end gap-[2px] sm:gap-1 h-28 sm:h-32 md:h-36 lg:h-40">
          {data.map((point, i) => {
            const heightPct = (point.value / maxVal) * 100;
            const isActive = activeIndex === i;
            return (
              <div
                key={point.hour}
                className="flex-1 flex flex-col items-center justify-end h-full relative group/bar"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200, delay: i * 0.03 }}
                  className={`w-full min-h-[4px] rounded-t-sm sm:rounded-t-md bg-gradient-to-t ${getBarColor(point.peak, isActive)} ${getBarGlow(point.peak, isActive)} transition-all duration-300 cursor-pointer`}
                />
                <span className="text-[6px] sm:text-[7px] md:text-[8px] text-slate-500 mt-1 sm:mt-1.5 truncate w-full text-center select-none">
                  {point.hour}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg"
                  >
                    {point.value} araç
                    {point.peak && <span className="text-amber-400 ml-1">▼</span>}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-gradient-to-br from-blue-400 to-indigo-500" />
              <span className="text-[8px] sm:text-[10px] text-slate-500">Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-gradient-to-br from-amber-400 to-orange-500" />
              <span className="text-[8px] sm:text-[10px] text-slate-500">Zirve</span>
            </div>
          </div>
          <div className="text-[8px] sm:text-[10px] text-slate-600 font-medium">
            Maks: {maxVal}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
