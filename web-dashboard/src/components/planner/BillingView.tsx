import React from 'react';
import { CreditCard, CheckCircle2, Download, ArrowUpRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const BillingView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Abonelik ve Fatura Yönetimi</h2>
          <p className="text-xs text-slate-400">ShuttleX Enterprise SaaS Lisans ve Kullanım Detayları</p>
        </div>

        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>Kurumsal Lisans Aktif</span>
        </span>
      </div>

      {/* Subscription Plan Hero Card */}
      <GlassCard hoverEffect={false} className="p-6 bg-gradient-to-br from-blue-900/30 via-slate-900 to-purple-900/20 border-blue-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">MEVCUT PAKET</span>
            <h3 className="text-3xl font-display font-black text-white mt-1">ShuttleX Enterprise v5.0</h3>
            <p className="text-xs text-slate-300 mt-1">Sınırsız Veli Hesabı, 50 Araç Kapasitesi, AI VRPTW Motoru, gRPC Telemetri</p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-white">$499</span>
            <span className="text-xs text-slate-400"> / ay</span>
            <button className="block mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto">
              <span>Planı Yükselt</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Aktif Servis Aracı</span>
              <span className="text-white font-bold">42 / 50</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full w-[84%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>SMS / Push Bildirimi</span>
              <span className="text-white font-bold">14.2K / 20K</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[71%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Document AI OCR İşlemi</span>
              <span className="text-white font-bold">128 / 500</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full w-[25%]"></div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Payment Method & Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Kayıtlı Ödeme Yöntemi</h3>
              <p className="text-xs text-slate-400">Otomatik yenileme aktif</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-blue-400">•••• •••• •••• 4242</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">SKT: 12/28</span>
            </div>
            <button className="text-xs text-blue-400 hover:underline">Düzenle</button>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={false} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Son Faturalar</h3>
            <span className="text-xs text-slate-400">Geçmiş ödemeler</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { date: '01 Tem 2026', amount: '$499.00', status: 'Ödendi' },
              { date: '01 Haz 2026', amount: '$499.00', status: 'Ödendi' },
            ].map((inv, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-white block">{inv.date}</span>
                  <span className="text-[10px] text-emerald-400">{inv.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-200">{inv.amount}</span>
                  <button className="text-slate-400 hover:text-white p-1">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
