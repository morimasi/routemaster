import React from 'react';
import { Lock, Database, Server } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-display font-bold text-white">Kurum ve Güvenlik Ayarları</h2>

      <GlassCard hoverEffect={false} className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Multi-Tenant Veri Yalıtımı (RLS)</h3>
            <p className="text-xs text-slate-400">PostgreSQL 16 Row-Level Security Politikası Aktif</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
          <p className="text-purple-400">-- Tenant Isolation SQL Policy Active</p>
          <p>CREATE POLICY tenant_isolation_policy ON route_nodes</p>
          <p>USING (tenant_id = current_setting('app.current_tenant_id'));</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard hoverEffect={false} className="space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Veri Tabanı & PostGIS</span>
          </div>
          <p className="text-xs text-slate-300">Spatial GiST indeksli konum sorguları (ST_DWithin)</p>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
            Durum: Bağlı (PostgreSQL 16)
          </span>
        </GlassCard>

        <GlassCard hoverEffect={false} className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>Event-Bus Kafka Streaming</span>
          </div>
          <p className="text-xs text-slate-300">KRaft Mode Kafka Cluster (`shuttle-telemetry` topic)</p>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
            Durum: Bağlı (Kafka 3.7)
          </span>
        </GlassCard>
      </div>
    </div>
  );
};
