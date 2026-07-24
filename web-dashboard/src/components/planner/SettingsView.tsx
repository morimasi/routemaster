import React, { useState } from 'react';
import { Lock, Database, Server, Building2, Bell, CheckCircle2, Copy } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const SettingsView: React.FC = () => {
  const [institutionName, setInstitutionName] = useState('Kavacık Bilim Koleji');
  const [tenantId, setTenantId] = useState('tenant_kavacik_1001');
  const [webhookUrl, setWebhookUrl] = useState('https://api.kavacik.k12.tr/webhooks/shuttlex');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopySql = () => {
    const sql = `CREATE POLICY tenant_isolation_policy ON route_nodes\nUSING (tenant_id = '${tenantId}');`;
    navigator.clipboard.writeText(sql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Kurum ve Güvenlik Ayarları</h2>
          <p className="text-xs text-slate-400">Multi-Tenant yalıtım ve entegrasyon parametreleri</p>
        </div>

        {isSaved && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ayarlar Başarıyla Kaydedildi!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Institution Info Card */}
        <GlassCard hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Kurum Profili</h3>
              <p className="text-xs text-slate-400">Okul ve organizasyon genel tanımları</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Kurum Adı</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tenant Kimliği (ID)</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </GlassCard>

        {/* Multi-Tenant RLS Policy Card */}
        <GlassCard hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Multi-Tenant Veri Yalıtımı (RLS)</h3>
                <p className="text-xs text-slate-400">PostgreSQL 16 Row-Level Security Politikası</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopySql}
              className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1.5 rounded-xl hover:bg-purple-900/60 transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Kopyalandı!' : 'SQL Kopyala'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <p className="text-purple-400">-- Tenant Isolation SQL Policy Active</p>
            <p>CREATE POLICY tenant_isolation_policy ON route_nodes</p>
            <p>
              USING (tenant_id = <span className="text-amber-400">'{tenantId}'</span>);
            </p>
          </div>
        </GlassCard>

        {/* Webhooks & Notifications */}
        <GlassCard hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Webhook & Olay Bildirim Entegrasyonu</h3>
              <p className="text-xs text-slate-400">Canlı GPS ve devamsızlık event-stream webhook ucu</p>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 mb-1 font-semibold">Webhook Endpoint URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </GlassCard>

        {/* Infrastructure Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard hoverEffect={false} className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>Veri Tabanı & PostGIS</span>
            </div>
            <p className="text-xs text-slate-300">Spatial GiST indeksli konum sorguları (ST_DWithin)</p>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
              Durum: Bağlı (PostgreSQL 16)
            </span>
          </GlassCard>

          <GlassCard hoverEffect={false} className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Server className="w-4 h-4" />
              <span>Event-Bus Kafka Streaming</span>
            </div>
            <p className="text-xs text-slate-300">KRaft Mode Kafka Cluster (`shuttle-telemetry` topic)</p>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
              Durum: Bağlı (Kafka 3.7)
            </span>
          </GlassCard>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30 text-xs transition-all"
          >
            Tüm Değişiklikleri Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
