import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, CheckCircle2, Download, ArrowUpRight, TrendingUp,
  Zap, FileText, BarChart3, Wallet
} from 'lucide-react';
import { BillingApiService } from './api';
import type { SubscriptionPlan, UsageMetric, Invoice, PaymentMethod } from './types';

export const BillingModule: React.FC = () => {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<UsageMetric[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      BillingApiService.getSubscription('t-1001'),
      BillingApiService.getUsageMetrics('t-1001'),
      BillingApiService.getInvoices('t-1001'),
      BillingApiService.getPaymentMethod('t-1001'),
    ]).then(([p, u, i, pm]) => {
      setPlan(p);
      setUsage(u);
      setInvoices(i);
      setPayment(pm);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Fatura bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-0.5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white">Abonelik & Fatura</h2>
          <p className="text-[9px] sm:text-xs text-slate-400">ShuttleX Enterprise Lisans Yönetimi</p>
        </div>
        <span className="text-[9px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" /> Lisans Aktif
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-900/30 via-slate-900 to-purple-900/20 border border-blue-500/40 rounded-2xl relative overflow-hidden">
        {plan && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[9px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest">MEVCUT PAKET</span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-white mt-0.5">{plan.name} {plan.version}</h3>
                <p className="text-[9px] sm:text-xs text-slate-300 mt-0.5">Sınırsız veli, {plan.maxVehicles} araç, AI VRPTW, gRPC telemetri</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl sm:text-3xl font-black text-white">${plan.price}</span>
                <span className="text-[9px] sm:text-xs text-slate-400"> / ay</span>
                <button className="block mt-1 sm:mt-2 text-[9px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span>Yükselt</span> <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-800/80">
              {usage.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-slate-400 mb-1 text-[9px] sm:text-xs">
                    <span>{m.label}</span>
                    <span className="text-white font-bold">{m.current.toLocaleString()} / {m.limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`${m.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.min((m.current / m.limit) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400"><CreditCard className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white text-sm sm:text-base">Ödeme Yöntemi</h3><p className="text-[9px] sm:text-xs text-slate-400">Otomatik yenileme</p></div>
          </div>
          {payment && (
            <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-between text-[9px] sm:text-xs">
              <div className="flex items-center gap-2 sm:gap-3">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs sm:text-sm font-bold text-blue-400">•••• {payment.lastFour}</span>
                <span className="text-[8px] sm:text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">SKT: {payment.expiryDate}</span>
              </div>
              <button className="text-[9px] sm:text-xs text-blue-400 hover:underline">Düzenle</button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm sm:text-base">Faturalar</h3>
            <span className="text-[9px] sm:text-xs text-slate-400">Geçmiş</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2 text-[9px] sm:text-xs">
            {invoices.map((inv, i) => (
              <div key={inv.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-white block text-[9px] sm:text-xs">{inv.date}</span>
                  <span className={`text-[8px] sm:text-[10px] ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                    {inv.status === 'paid' ? 'Ödendi' : inv.status === 'pending' ? 'Bekliyor' : 'Gecikmiş'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-200">{inv.amount}</span>
                  <button className="text-slate-400 hover:text-white p-1"><Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
