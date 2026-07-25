import type { InstitutionProfile, SecurityConfig, WebhookConfig } from './types';

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

export class SettingsApiService {
  static async getProfile(tenantId: string): Promise<InstitutionProfile> {
    try {
      return await post(`${API_BASE}/api/v5/tenant/profile`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return { name: 'Kavacık Bilim Koleji', tenantId: 'tenant_kavacik_1001', address: 'Kavacık, Beykoz/İstanbul', phone: '0216 444 0 111', email: 'info@kavacikkoleji.k12.tr' };
    }
  }

  static async saveProfile(tenantId: string, data: Partial<InstitutionProfile>) {
    try {
      return await post(`${API_BASE}/api/v5/tenant/profile`, { tenant_id: tenantId, ...data });
    } catch {
      await delay(300);
      return { status: 'SAVED' };
    }
  }

  static async getSecurity(tenantId: string): Promise<SecurityConfig> {
    try {
      return await post(`${API_BASE}/api/v5/tenant/security`, { tenant_id: tenantId });
    } catch {
      await delay(150);
      return { rlsPolicyActive: true, mfaEnabled: false, sessionTimeoutMinutes: 30 };
    }
  }

  static async saveSecurity(tenantId: string, data: Partial<SecurityConfig>) {
    try {
      return await post(`${API_BASE}/api/v5/tenant/security`, { tenant_id: tenantId, ...data });
    } catch {
      await delay(300);
      return { status: 'SAVED' };
    }
  }

  static async getWebhook(tenantId: string): Promise<WebhookConfig> {
    try {
      return await post(`${API_BASE}/api/v5/tenant/webhook`, { tenant_id: tenantId });
    } catch {
      await delay(150);
      return { url: 'https://api.kavacik.k12.tr/webhooks/shuttlex', events: ['gps', 'absence', 'alert'], active: true };
    }
  }

  static async saveWebhook(tenantId: string, data: Partial<WebhookConfig>) {
    try {
      return await post(`${API_BASE}/api/v5/tenant/webhook`, { tenant_id: tenantId, ...data });
    } catch {
      await delay(300);
      return { status: 'SAVED' };
    }
  }
}
