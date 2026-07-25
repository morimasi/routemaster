import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  trend?: 'up' | 'down';
  subtext?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, title, trend, subtext, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative bg-glass-gradient border border-white/[0.06] backdrop-blur-glass rounded-3xl p-4 sm:p-5 md:p-6 hover:border-blue-500/20 transition-all duration-400 shadow-glass hover:shadow-glow">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 flex-shrink-0">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${
              trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              <span>%{trend === 'up' ? '12' : '8'}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-display text-white tracking-tight truncate">
            {value}
          </p>
          <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 font-medium truncate">
            {title}
          </p>
          {subtext && (
            <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 mt-0.5 line-clamp-2">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
