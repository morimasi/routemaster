import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CarFront, Users, Zap, ShieldCheck, TrendingUp, Clock, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const SystemDashboard: React.FC = () => {
  const [logs, setLogs] = useState([
    { id: 1, text: 'v4.1 Rota Budama (Prune) Tetiklendi: 34 AB 1234 (Eymen Altunel Durağı)', time: '08:42:15', status: 'ACTIVE', severity: 'warning' },
    { id: 2, text: 'VRPTW Solver Optimizasyon Tamamlandı: %18.4 Yakıt Tasarrufu', time: '08:35:10', status: 'RESOLVED', severity: 'success' },
    { id: 3, text: 'gRPC Ingestion Service: TimeScaleDB 50.000 Pkts/sec Akış Stabil', time: '08:30:00', status: 'RESOLVED', severity: 'info' }
  ]);

  const stats = [
    { title: 'Aktif Servis Aracı', value: '42 / 45', subtext: '3 araç bakımda', icon: <CarFront className="w-6 h-6 text-blue-400" />, trend: '+4%' },
    { title: 'Taşınan Öğrenci', value: '1,240', subtext: 'Bugünkü toplam katılım', icon: <Users className="w-6 h-6 text-emerald-400" />, trend: '+12%' },
    { title: 'AI Yakıt Tasarrufu', value: '%18.4', subtext: 'OR-Tools VRPTW Kazancı', icon: <Zap className="w-6 h-6 text-amber-400" />, trend: '+2.1%' },
    { title: 'Sistem Durumu (SLA)', value: '%99.99', subtext: '<4ms Telemetri gecikmesi', icon: <ShieldCheck className="w-6 h-6 text-purple-400" />, trend: 'Kusursuz' },
  ];

  const handleResolveLog = (id: number) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, status: 'RESOLVED' } : log)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-white">Sistem Genel Özeti</h2>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-full font-bold">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Telemetri Akışı Canlı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GlassCard hoverEffect={false} className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">{stat.icon}</div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-white">{stat.value}</h3>
                <p className="text-xs font-medium text-slate-300">{stat.title}</p>
                <p className="text-[10px] text-slate-500 mt-1">{stat.subtext}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Hourly Passenger Volume Bar Chart Simulation */}
      <GlassCard hoverEffect={false} className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base">Saatlik Yolcu Taşımacılığı Trafiği</h3>
            <p className="text-xs text-slate-400">Giriş/Çıkış pik saatleri yoğunluk dağılımı</p>
          </div>
          <span className="text-xs text-blue-400 font-bold bg-blue-950 px-3 py-1 rounded-full border border-blue-500/30">
            Bugünün Trafiği
          </span>
        </div>

        <div className="h-32 flex items-end gap-3 pt-4 px-2">
          {[
            { hour: '07:00', val: 40 },
            { hour: '07:30', val: 85 },
            { hour: '08:00', val: 100 },
            { hour: '08:30', val: 65 },
            { hour: '12:00', val: 30 },
            { hour: '16:00', val: 90 },
            { hour: '17:00', val: 75 },
          ].map((bar) => (
            <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-emerald-400 rounded-t-lg transition-all group-hover:brightness-125"
                style={{ height: `${bar.val}%` }}
              ></div>
              <span className="text-[10px] text-slate-500 font-medium">{bar.hour}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Live System Log Event Stream */}
      <GlassCard hoverEffect={false} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Gerçek Zamanlı Olay Günlüğü Stream (Audit Log)</span>
          </h3>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            Kafka Topic: `shuttle-events`
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {log.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <span className="font-medium text-slate-200">{log.text}</span>
                  <span className="text-[10px] text-slate-600 block">{log.time}</span>
                </div>
              </div>

              {log.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleResolveLog(log.id)}
                  className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg font-bold hover:bg-amber-500 hover:text-black transition-colors"
                >
                  İşlendi İşaretle
                </button>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  Çözüldü
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
