import React from 'react';
import { motion } from 'framer-motion';
import { Fuel, Clock, Users, Wrench, TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';
import type { AIPrediction } from '../types';

interface AIPredictionsPanelProps {
  predictions: AIPrediction[];
}

const typeConfig: Record<string, { icon: React.ReactNode; gradient: string }> = {
  fuel: { icon: <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, gradient: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/20 text-emerald-400' },
  delay: { icon: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, gradient: 'from-amber-600/20 to-orange-600/20 border-amber-500/20 text-amber-400' },
  attendance: { icon: <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, gradient: 'from-blue-600/20 to-indigo-600/20 border-blue-500/20 text-blue-400' },
  maintenance: { icon: <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, gradient: 'from-purple-600/20 to-pink-600/20 border-purple-500/20 text-purple-400' },
};

const trendIcon: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />,
  down: <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />,
  stable: <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />,
};

const confidenceColor = (val: number) => {
  if (val >= 90) return 'bg-emerald-500';
  if (val >= 80) return 'bg-amber-500';
  return 'bg-red-500';
};

export const AIPredictionsPanel: React.FC<AIPredictionsPanelProps> = ({ predictions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.3 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 rounded-3xl blur-xl" />
      <div className="relative bg-glass-gradient border border-white/[0.06] backdrop-blur-glass rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-display text-white">AI Tahminleri</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500">Makine öğrenmesi öngörüleri</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
          {predictions.map((pred, i) => {
            const cfg = typeConfig[pred.type] || typeConfig.fuel;
            return (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group/card"
              >
                <div className="relative bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] rounded-2xl p-3 sm:p-3.5 transition-all duration-300">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br ${cfg.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] sm:text-xs font-bold text-white truncate">{pred.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[11px] sm:text-xs font-bold font-display text-white">{pred.value}</span>
                          {trendIcon[pred.trend]}
                        </div>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 line-clamp-2">{pred.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pred.confidence}%` }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.5 + i * 0.05 }}
                            className={`h-full rounded-full ${confidenceColor(pred.confidence)}`}
                          />
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium flex-shrink-0">%{pred.confidence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
