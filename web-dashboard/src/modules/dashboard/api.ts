import type { DashboardStats, TrafficDataPoint, SystemLogEntry, AIPrediction, SystemHealthMetric } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export class DashboardApiService {

  static async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/stats?tenant=${tenantId}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(300);
      return {
        activeVehicles: { current: 42, total: 48, inMaintenance: 6 },
        studentsTransported: 1247,
        aiFuelSaving: 18.4,
        systemSla: 99.72,
        telemetryLatencyMs: 187,
      };
    }
  }

  static async getTrafficData(tenantId: string, dateRange: string): Promise<TrafficDataPoint[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/traffic?tenant=${tenantId}&range=${dateRange}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(350);
      const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
      return hours.map((hour, i) => ({
        hour,
        value: [20, 55, 95, 75, 45, 40, 38, 42, 50, 70, 90, 100, 85, 55, 25][i] || 40,
        peak: [2, 3, 12, 13].includes(i),
      }));
    }
  }

  static async getSystemLogs(tenantId: string): Promise<SystemLogEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/logs?tenant=${tenantId}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(200);
      return [
        { id: 1, text: 'Rota optimizasyonu tamamlandı (%19.2 yakıt tasarrufu)', time: '2 dk önce', status: 'RESOLVED', severity: 'success' },
        { id: 2, text: 'Araç #2042 telemetri bağlantısı koptu', time: '7 dk önce', status: 'ACTIVE', severity: 'warning' },
        { id: 3, text: 'AI tahmin motoru yeniden başlatıldı', time: '15 dk önce', status: 'RESOLVED', severity: 'info' },
        { id: 4, text: 'Yakıt seviyesi kritik eşiğin altında (ARAÇ #108)', time: '23 dk önce', status: 'ACTIVE', severity: 'warning' },
        { id: 5, text: 'Edge cihaz firmware güncellemesi başarılı', time: '42 dk önce', status: 'RESOLVED', severity: 'success' },
        { id: 6, text: 'Toplu öğrenci yoklama senkronizasyon hatası', time: '1 saat önce', status: 'ACTIVE', severity: 'warning' },
        { id: 7, text: 'Sistem rutin bakım penceresi açıldı', time: '2 saat önce', status: 'RESOLVED', severity: 'info' },
      ];
    }
  }

  static async getAIPredictions(tenantId: string): Promise<AIPrediction[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/ai-predictions?tenant=${tenantId}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(400);
      return [
        { id: 'p1', title: 'Haftalık Yakıt Tüketimi', value: '1,240 L', description: 'Geçen haftaya göre %12.4 azalma öngörülüyor', confidence: 94, type: 'fuel', trend: 'down' },
        { id: 'p2', title: 'Gecikme Riski', value: '%23', description: 'Saat 08:15-08:45 arası yoğun trafik kaynaklı gecikme', confidence: 87, type: 'delay', trend: 'up' },
        { id: 'p3', title: 'Öğrenci Katılımı', value: '%96.2', description: 'Bugün için tahmini katılım oranı, 12 öğrenci eksik', confidence: 92, type: 'attendance', trend: 'stable' },
        { id: 'p4', title: 'Bakım İhtiyacı', value: '3 Araç', description: 'Önümüzdeki 7 gün içinde periyodik bakım gerekiyor', confidence: 78, type: 'maintenance', trend: 'up' },
        { id: 'p5', title: 'Optimum Rota Verimliliği', value: '%91.5', description: 'Mevcut filo dağılımı ile maksimum rota verimlilik skoru', confidence: 96, type: 'fuel', trend: 'stable' },
      ];
    }
  }

  static async getSystemHealth(tenantId: string): Promise<SystemHealthMetric[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/system-health?tenant=${tenantId}`);
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(250);
      return [
        { name: 'API Servisi', status: 'healthy', value: '98 ms', uptime: '99.98%' },
        { name: 'Veritabanı', status: 'healthy', value: '12 ms', uptime: '99.99%' },
        { name: 'AI Tahmin Motoru', status: 'healthy', value: '340 ms', uptime: '99.87%' },
        { name: 'Edge Bağlantıları', status: 'warning', value: '41/48', uptime: '97.30%' },
        { name: 'Telemetri Pipeline', status: 'healthy', value: '187 ms', uptime: '99.72%' },
        { name: 'Önbellek Katmanı', status: 'critical', value: 'Hata Oranı %5.2', uptime: '94.10%' },
      ];
    }
  }

  static async resolveLogEntry(tenantId: string, logId: number): Promise<{ status: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/dashboard/logs/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, log_id: logId }),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    } catch {
      await delay(150);
      return { status: 'RESOLVED' };
    }
  }
}
