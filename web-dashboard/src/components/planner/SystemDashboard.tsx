import React from 'react';
import { motion } from 'framer-motion';
import { CarFront, Users, Zap, ShieldCheck, TrendingUp, Clock } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const SystemDashboard: React.FC = () => {
  const stats = [
    { title: 'Aktif Servis Aracı', value: '42 / 45', subtext: '3 araç bakımda', icon: <CarFront className="w-6 h-6 text-blue-400" />, trend: '+4%' },
    { title: 'Taşınan Öğrenci', value: '1,240', subtext: 'Bugünkü toplam katılım', icon: <Users className="w-6 h-6 text-emerald-400" />, trend: '+12%' },
    { title: 'AI Yakıt Tasarrufu', value: '%18.4', subtext: 'OR-Tools VRPTW Kazancı', icon: <Zap className="w-6 h-6 text-amber-400" />, trend: '+2.1%' },
    { title: 'Sistem Durumu (SLA)', value: '%99.99', subtext: '<4ms Telemetri gecikmesi', icon: <ShieldCheck className="w-6 h-6 text-purple-400" />, trend: 'Kusursuz' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-white mb-4">Sistem Genel Özeti</h2>

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

      {/* Analytics Chart Banner Placeholder */}
      <GlassCard hoverEffect={false} className="p-6 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Gerçek Zamanlı Telemetri & Canlı Akış Servisi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              gRPC Ingestion Service (Go) ve TimeScaleDB saniyede 50.000 veri paketini sıfır kayıpla işliyor.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-400 bg-blue-950/80 border border-blue-500/40 px-4 py-2 rounded-xl">
            Kafka Stream Aktif
          </span>
        </div>
      </GlassCard>
    </div>
  );
};
