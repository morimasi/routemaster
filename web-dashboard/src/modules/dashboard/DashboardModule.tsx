import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Truck, Users, Fuel, Clock, Activity, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { DashboardApiService } from './api';
import { StatCard } from './components/StatCard';
import { TrafficChart } from './components/TrafficChart';
import { SystemHealthPanel } from './components/SystemHealthPanel';
import { AIPredictionsPanel } from './components/AIPredictionsPanel';
import type { DashboardStats, TrafficDataPoint, SystemLogEntry, AIPrediction, SystemHealthMetric } from './types';

interface DashboardModuleProps {
  tenantId?: string;
}

const severityIcon: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />,
  success: <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />,
  info: <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />,
};

const severityBg: Record<string, string> = {
  warning: 'bg-amber-500/10 border-amber-500/20',
  success: 'bg-emerald-500/10 border-emerald-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
};

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/[0.03] border border-white/[0.04] rounded-3xl animate-pulse ${className}`}>
    <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
      <div className="w-10 h-10 bg-white/[0.04] rounded-2xl" />
      <div className="space-y-2">
        <div className="h-6 sm:h-7 bg-white/[0.04] rounded-lg w-2/3" />
        <div className="h-3 sm:h-4 bg-white/[0.03] rounded-lg w-1/2" />
      </div>
    </div>
  </div>
);

export const DashboardModule: React.FC<DashboardModuleProps> = ({ tenantId = 't-1001' }) => {
  const { isMobile, isTablet } = useWindowSize();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficDataPoint[]>([]);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [health, setHealth] = useState<SystemHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [resolving, setResolving] = useState<number | null>(null);

  const fetchAll = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const [s, t, l, p, h] = await Promise.all([
        DashboardApiService.getDashboardStats(tenantId),
        DashboardApiService.getTrafficData(tenantId, 'today'),
        DashboardApiService.getSystemLogs(tenantId),
        DashboardApiService.getAIPredictions(tenantId),
        DashboardApiService.getSystemHealth(tenantId),
      ]);
      setStats(s);
      setTraffic(t);
      setLogs(l);
      setPredictions(p);
      setHealth(h);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleResolve = async (logId: number) => {
    setResolving(logId);
    try {
      await DashboardApiService.resolveLogEntry(tenantId, logId);
      setLogs((prev) =>
        prev.map((log) => (log.id === logId ? { ...log, status: 'RESOLVED' as const } : log))
      );
    } finally {
      setResolving(null);
    }
  };

  const gridCols = isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4';
  const sidebarCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-1';
  const mainGrid = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1' : 'grid-cols-3';

  return (
    <div className="min-h-screen bg-app-background text-white p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              Gösterge Paneli
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 mt-0.5">
              Gerçek zamanlı filo istatistikleri ve AI öngörüleri
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[8px] sm:text-[10px] text-slate-600 hidden sm:block">
              {lastRefresh.toLocaleTimeString('tr-TR')}
            </span>
            <button
              onClick={() => fetchAll(true)}
              disabled={loading}
              className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-blue-500/30 transition-all disabled:opacity-50 shadow-glass"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 sm:gap-3"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              <p className="text-[11px] sm:text-xs text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="p-1 text-red-400/60 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid ${mainGrid} gap-3 sm:gap-4 md:gap-5`}>
          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:col-span-2">
            {loading && !stats ? (
              <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
                {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} />)}
              </div>
            ) : stats ? (
              <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
                <StatCard
                  icon={<Truck className="w-4 h-4 sm:w-5 sm:h-5" />}
                  value={`${stats.activeVehicles.current}/${stats.activeVehicles.total}`}
                  title="Aktif Araçlar"
                  subtext={`${stats.activeVehicles.inMaintenance} bakımda`}
                  delay={0}
                />
                <StatCard
                  icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                  value={stats.studentsTransported.toLocaleString('tr-TR')}
                  title="Taşınan Öğrenci"
                  trend="up"
                  subtext="Bugünkü toplam"
                  delay={0.05}
                />
                <StatCard
                  icon={<Fuel className="w-4 h-4 sm:w-5 sm:h-5" />}
                  value={`%${stats.aiFuelSaving}`}
                  title="AI Yakıt Tasarrufu"
                  trend="down"
                  subtext="Optimizasyon sayesinde"
                  delay={0.1}
                />
                <StatCard
                  icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                  value={`${stats.telemetryLatencyMs} ms`}
                  title="Telemetri Gecikmesi"
                  subtext={`SLA: %${stats.systemSla}`}
                  delay={0.15}
                />
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {loading && traffic.length === 0 ? (
                <SkeletonBlock className="h-48 sm:h-56 md:h-64" />
              ) : (
                traffic.length > 0 && <TrafficChart data={traffic} />
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {loading && predictions.length === 0 ? (
                <SkeletonBlock className="h-64 sm:h-72" />
              ) : (
                predictions.length > 0 && <AIPredictionsPanel predictions={predictions} />
              )}
            </AnimatePresence>
          </div>

          <div className={`grid ${sidebarCols} gap-3 sm:gap-4 md:gap-5`}>
            <AnimatePresence mode="wait">
              {loading && health.length === 0 ? (
                <SkeletonBlock className="h-72 sm:h-80" />
              ) : (
                health.length > 0 && <SystemHealthPanel metrics={health} />
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-3xl blur-xl" />
              <div className="relative bg-glass-gradient border border-white/[0.06] backdrop-blur-glass rounded-3xl p-4 sm:p-5 md:p-6 shadow-glass">
                <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold font-display text-white">Sistem Günlükleri</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-500">Son aktiviteler</p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto pr-1 scroll-smooth-mobile">
                  <AnimatePresence>
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        layout
                        className={`flex items-start gap-2 p-2 sm:p-2.5 rounded-xl border transition-all duration-300 ${
                          log.status === 'ACTIVE' ? severityBg[log.severity] + ' border-opacity-50' : 'bg-white/[0.02] border-white/[0.04] opacity-60'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {severityIcon[log.severity]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] sm:text-[11px] leading-relaxed ${log.status === 'ACTIVE' ? 'text-white' : 'text-slate-400'} line-clamp-2`}>
                            {log.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] sm:text-[9px] text-slate-600">{log.time}</span>
                            <span className={`text-[8px] sm:text-[9px] font-medium uppercase ${
                              log.status === 'ACTIVE' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {log.status === 'ACTIVE' ? 'Aktif' : 'Çözüldü'}
                            </span>
                          </div>
                        </div>
                        {log.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleResolve(log.id)}
                            disabled={resolving === log.id}
                            className="flex-shrink-0 p-1.5 rounded-lg bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-white/[0.06] transition-all disabled:opacity-50"
                          >
                            {resolving === log.id ? (
                              <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 hover:text-emerald-400" />
                            )}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[8px] sm:text-[10px] text-slate-500">{logs.filter((l) => l.status === 'ACTIVE').length} Aktif</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[8px] sm:text-[10px] text-slate-500">{logs.filter((l) => l.status === 'RESOLVED').length} Çözüldü</span>
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[10px] text-slate-600">Toplam {logs.length}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
