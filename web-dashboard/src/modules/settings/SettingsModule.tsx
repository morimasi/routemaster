import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Lock, Bell, Database, Server, Copy, CheckCircle2,
  Shield, Globe, Webhook, Activity, Save, RefreshCw
} from 'lucide-react';
import { SettingsApiService } from './api';
import type { InstitutionProfile, SecurityConfig, WebhookConfig } from './types';

type SettingsTab = 'kurum' | 'guvenlik' | 'webhook' | 'entegrasyon';

export const SettingsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('kurum');
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [security, setSecurity] = useState<SecurityConfig | null>(null);
  const [webhook, setWebhook] = useState<WebhookConfig | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      SettingsApiService.getProfile('t-1001'),
      SettingsApiService.getSecurity('t-1001'),
      SettingsApiService.getWebhook('t-1001'),
    ]).then(([p, s, w]) => {
      setProfile(p);
      setSecurity(s);
      setWebhook(w);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) await SettingsApiService.saveProfile('t-1001', profile);
    if (security) await SettingsApiService.saveSecurity('t-1001', security);
    if (webhook) await SettingsApiService.saveWebhook('t-1001', webhook);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopySql = () => {
    const sql = `CREATE POLICY tenant_isolation_policy ON route_nodes USING (tenant_id = '${profile?.tenantId || ''}');`;
    navigator.clipboard.writeText(sql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'kurum', label: 'Kurum', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'guvenlik', label: 'Güvenlik', icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'webhook', label: 'Webhook', icon: <Webhook className="w-3.5 h-3.5" /> },
    { id: 'entegrasyon', label: 'Bağlantılar', icon: <Globe className="w-3.5 h-3.5" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-0.5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white">Kurum Ayarları</h2>
        {isSaved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kaydedildi
          </motion.div>
        )}
      </div>

      <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-[9px] sm:text-xs font-bold overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {activeTab === 'kurum' && profile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400"><Building2 className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-sm sm:text-base">Kurum Profili</h3><p className="text-[10px] text-slate-400">Okul tanımları</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] sm:text-xs">
              <div><label className="block text-slate-400 mb-1 font-semibold">Kurum Adı</label><input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-slate-400 mb-1 font-semibold">Tenant ID</label><input type="text" value={profile.tenantId} onChange={(e) => setProfile({ ...profile, tenantId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-slate-400 mb-1 font-semibold">Adres</label><input type="text" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-slate-400 mb-1 font-semibold">Telefon</label><input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
              <div className="sm:col-span-2"><label className="block text-slate-400 mb-1 font-semibold">E-posta</label><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
            </div>
          </motion.div>
        )}

        {activeTab === 'guvenlik' && security && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400"><Lock className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-sm sm:text-base">Güvenlik</h3><p className="text-[10px] text-slate-400">Multi-Tenant RLS ve MFA</p></div>
            </div>
            <div className="space-y-3 text-[10px] sm:text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span>RLS Veri Yalıtımı</span>
                <button type="button" onClick={() => setSecurity({ ...security, rlsPolicyActive: !security.rlsPolicyActive })} className={`w-10 h-5 rounded-full transition-colors ${security.rlsPolicyActive ? 'bg-blue-600' : 'bg-slate-700'} relative`}>
                  <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${security.rlsPolicyActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span>MFA (Çok Faktörlü)</span>
                <button type="button" onClick={() => setSecurity({ ...security, mfaEnabled: !security.mfaEnabled })} className={`w-10 h-5 rounded-full transition-colors ${security.mfaEnabled ? 'bg-blue-600' : 'bg-slate-700'} relative`}>
                  <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${security.mfaEnabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span>Oturum Süresi: {security.sessionTimeoutMinutes} dk</span>
                <input type="range" min="5" max="120" step="5" value={security.sessionTimeoutMinutes} onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: parseInt(e.target.value) })} className="w-24 accent-blue-500" />
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[9px] text-slate-300">
                <p className="text-purple-400 mb-1">-- RLS Policy</p>
                <p>CREATE POLICY tenant_isolation ON route_nodes</p>
                <p>USING (tenant_id = '<span className="text-amber-400">{profile?.tenantId || ''}</span>');</p>
              </div>
              <button type="button" onClick={handleCopySql} className="text-[9px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-3 py-1.5 rounded-xl hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 w-fit">
                <Copy className="w-3 h-3" /> {isCopied ? 'Kopyalandı!' : 'SQL Kopyala'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'webhook' && webhook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600/20 border border-amber-500/30 rounded-xl text-amber-400"><Bell className="w-5 h-5" /></div>
              <div><h3 className="font-bold text-white text-sm sm:text-base">Webhook</h3><p className="text-[10px] text-slate-400">Olay bildirim entegrasyonu</p></div>
            </div>
            <div className="text-[10px] sm:text-xs space-y-3">
              <div><label className="block text-slate-400 mb-1 font-semibold">Endpoint URL</label><input type="url" value={webhook.url} onChange={(e) => setWebhook({ ...webhook, url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-slate-400 mb-1 font-semibold">Olaylar</label><div className="flex flex-wrap gap-2">{['gps', 'absence', 'alert', 'maintenance'].map((ev) => (<button key={ev} type="button" onClick={() => { const evts = webhook.events.includes(ev) ? webhook.events.filter((e) => e !== ev) : [...webhook.events, ev]; setWebhook({ ...webhook, events: evts }); }} className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold transition-all ${webhook.events.includes(ev) ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{ev.toUpperCase()}</button>))}</div></div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span>Aktif</span>
                <button type="button" onClick={() => setWebhook({ ...webhook, active: !webhook.active })} className={`w-10 h-5 rounded-full transition-colors ${webhook.active ? 'bg-emerald-600' : 'bg-slate-700'} relative`}>
                  <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${webhook.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'entegrasyon' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'PostgreSQL 16', icon: <Database className="w-4 h-4" />, desc: 'Spatial GiST indeksli', status: 'Bağlı', color: 'text-emerald-400' },
              { title: 'Kafka 3.7', icon: <Server className="w-4 h-4" />, desc: 'KRaft Mode Cluster', status: 'Bağlı', color: 'text-emerald-400' },
              { title: 'gRPC Telemetri', icon: <Activity className="w-4 h-4" />, desc: '50K pkts/sec', status: 'Aktif', color: 'text-emerald-400' },
              { title: 'Redis Cache', icon: <RefreshCw className="w-4 h-4" />, desc: 'Session store', status: 'Bağlı', color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs sm:text-sm">{s.icon}<span>{s.title}</span></div>
                <p className="text-[10px] text-slate-300">{s.desc}</p>
                <span className={`text-[9px] font-bold ${s.color} bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block`}>{s.status}</span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30 text-[10px] sm:text-xs transition-all flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Kaydet
          </button>
        </div>
      </form>
    </div>
  );
};
