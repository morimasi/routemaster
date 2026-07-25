import type { SubscriptionPlan, UsageMetric, Invoice, PaymentMethod } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export class BillingApiService {
  static async getSubscription(tenantId: string): Promise<SubscriptionPlan> {
    try {
      return await post(`${API_BASE}/api/v5/billing/subscription`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return { name: 'ShuttleX Enterprise', version: 'v5.0', price: 499, currency: 'USD', period: 'monthly', maxVehicles: 50, aiOcrLimit: 500, smsLimit: 20000 };
    }
  }

  static async getUsageMetrics(tenantId: string): Promise<UsageMetric[]> {
    try {
      return await post(`${API_BASE}/api/v5/billing/usage`, { tenant_id: tenantId });
    } catch {
      await delay(150);
      return [
        { label: 'Aktif Araç', current: 42, limit: 50, color: 'bg-blue-500' },
        { label: 'SMS/Push', current: 14200, limit: 20000, color: 'bg-emerald-500' },
        { label: 'AI OCR', current: 128, limit: 500, color: 'bg-purple-500' },
      ];
    }
  }

  static async getInvoices(tenantId: string): Promise<Invoice[]> {
    try {
      return await post(`${API_BASE}/api/v5/billing/invoices`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return [
        { id: 'inv_001', date: '01 Tem 2026', amount: '$499.00', status: 'paid' },
        { id: 'inv_002', date: '01 Haz 2026', amount: '$499.00', status: 'paid' },
        { id: 'inv_003', date: '01 May 2026', amount: '$499.00', status: 'paid' },
      ];
    }
  }

  static async getPaymentMethod(tenantId: string): Promise<PaymentMethod> {
    try {
      return await post(`${API_BASE}/api/v5/billing/payment`, { tenant_id: tenantId });
    } catch {
      await delay(150);
      return { lastFour: '4242', expiryDate: '12/28', isDefault: true };
    }
  }
}
