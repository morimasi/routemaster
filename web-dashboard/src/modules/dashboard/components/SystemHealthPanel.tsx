import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { SystemHealthMetric } from '../types';

interface SystemHealthPanelProps {
  metrics: SystemHealthMetric[];
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; dotClass: string; borderClass: string; bgClass: string; textClass: string }> = {
  healthy: {
    icon: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    label: 'Sağlıklı',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    borderClass: 'border-emerald-500/20',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    label: 'Uyarı',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    borderClass: 'border-amber-500/20',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
  },
  critical: {
    icon: <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    label: 'Kritik',
    dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    borderClass: 'border-red-500/20',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
  },
};

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ metrics }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-sky-600/5 rounded-3xl blur-xl" />
      <div className="relative bg-glass-gradient border border-white/[0.06] backdrop-blur-glass rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass">
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-600/20 to-sky-600/20 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-display text-white">Sistem Sağlığı</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-500">Gerçek zamanlı metrikler</p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {metrics.map((metric, i) => {
            const cfg = statusConfig[metric.status] || statusConfig.healthy;
            return (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border ${cfg.borderClass} ${cfg.bgClass} bg-opacity-50`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${cfg.dotClass}`}>
                    <div className={`absolute inset-0 rounded-full ${cfg.dotClass} animate-ping opacity-40`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] sm:text-xs font-bold text-white truncate">{metric.name}</p>
                    <span className={`text-[9px] sm:text-[10px] font-bold flex-shrink-0 ${cfg.textClass}`}>{metric.value}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[8px] sm:text-[9px] font-medium ${cfg.textClass} flex items-center gap-1`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-600">•</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500">Çalışma: {metric.uptime}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/[0.04] text-[8px] sm:text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{metrics.filter((m) => m.status === 'healthy').length} Sağlıklı</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{metrics.filter((m) => m.status === 'warning').length} Uyarı</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>{metrics.filter((m) => m.status === 'critical').length} Kritik</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
