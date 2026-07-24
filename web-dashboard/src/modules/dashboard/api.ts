import { apiClient } from '../../services/httpClient';
import { withFallback, delay } from '../../services/withFallback';
import type { DashboardStats, TrafficDataPoint, SystemLogEntry, AIPrediction, SystemHealthMetric } from './types';

export class DashboardApiService {

  static async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    return withFallback(
      () => apiClient.get('/api/v5/dashboard/stats', { params: { tenant: tenantId } }),
      async () => {
        await delay(300);
        return {
          activeVehicles: { current: 42, total: 48, inMaintenance: 6 },
          studentsTransported: 1247,
          aiFuelSaving: 18.4,
          systemSla: 99.72,
          telemetryLatencyMs: 187,
        };
      },
    );
  }

  static async getTrafficData(tenantId: string, dateRange: string): Promise<TrafficDataPoint[]> {
    return withFallback(
      () => apiClient.get('/api/v5/dashboard/traffic', { params: { tenant: tenantId, range: dateRange } }),
      async () => {
        await delay(350);
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
        return hours.map((hour, i) => ({
          hour,
          value: [20, 55, 95, 75, 45, 40, 38, 42, 50, 70, 90, 100, 85, 55, 25][i] || 40,
          peak: [2, 3, 12, 13].includes(i),
        }));
      },
    );
  }

  static async getSystemLogs(tenantId: string): Promise<SystemLogEntry[]> {
    return withFallback(
      () => apiClient.get('/api/v5/dashboard/logs', { params: { tenant: tenantId } }),
      async () => {
        await delay(200);
        return [
          { id: 1, text: 'Rota optimizasyonu tamamlandı (%19.2 yakıt tasarrufu)', time: '2 dk önce', status: 'RESOLVED', severity: 'success' as const },
          { id: 2, text: 'Araç #2042 telemetri bağlantısı koptu', time: '7 dk önce', status: 'ACTIVE', severity: 'warning' as const },
          { id: 3, text: 'AI tahmin motoru yeniden başlatıldı', time: '15 dk önce', status: 'RESOLVED', severity: 'info' as const },
          { id: 4, text: 'Yakıt seviyesi kritik eşiğin altında (ARAÇ #108)', time: '23 dk önce', status: 'ACTIVE', severity: 'warning' as const },
          { id: 5, text: 'Edge cihaz firmware güncellemesi başarılı', time: '42 dk önce', status: 'RESOLVED', severity: 'success' as const },
          { id: 6, text: 'Toplu öğrenci yoklama senkronizasyon hatası', time: '1 saat önce', status: 'ACTIVE', severity: 'warning' as const },
          { id: 7, text: 'Sistem rutin bakım penceresi açıldı', time: '2 saat önce', status: 'RESOLVED', severity: 'info' as const },
        ];
      },
    );
  }

  static async getAIPredictions(tenantId: string): Promise<AIPrediction[]> {
    return withFallback(
      () => apiClient.get('/api/v5/dashboard/ai-predictions', { params: { tenant: tenantId } }),
      async () => {
        await delay(400);
        return [
          { id: 'p1', title: 'Haftalık Yakıt Tüketimi', value: '1,240 L', description: 'Geçen haftaya göre %12.4 azalma öngörülüyor', confidence: 94, type: 'fuel', trend: 'down' as const },
          { id: 'p2', title: 'Gecikme Riski', value: '%23', description: 'Saat 08:15-08:45 arası yoğun trafik kaynaklı gecikme', confidence: 87, type: 'delay', trend: 'up' as const },
          { id: 'p3', title: 'Öğrenci Katılımı', value: '%96.2', description: 'Bugün için tahmini katılım oranı, 12 öğrenci eksik', confidence: 92, type: 'attendance', trend: 'stable' as const },
          { id: 'p4', title: 'Bakım İhtiyacı', value: '3 Araç', description: 'Önümüzdeki 7 gün içinde periyodik bakım gerekiyor', confidence: 78, type: 'maintenance', trend: 'up' as const },
          { id: 'p5', title: 'Optimum Rota Verimliliği', value: '%91.5', description: 'Mevcut filo dağılımı ile maksimum rota verimlilik skoru', confidence: 96, type: 'fuel', trend: 'stable' as const },
        ];
      },
    );
  }

  static async getSystemHealth(tenantId: string): Promise<SystemHealthMetric[]> {
    return withFallback(
      () => apiClient.get('/api/v5/dashboard/system-health', { params: { tenant: tenantId } }),
      async () => {
        await delay(250);
        return [
          { name: 'API Servisi', status: 'healthy' as const, value: '98 ms', uptime: '99.98%' },
          { name: 'Veritabanı', status: 'healthy' as const, value: '12 ms', uptime: '99.99%' },
          { name: 'AI Tahmin Motoru', status: 'healthy' as const, value: '340 ms', uptime: '99.87%' },
          { name: 'Edge Bağlantıları', status: 'warning' as const, value: '41/48', uptime: '97.30%' },
          { name: 'Telemetri Pipeline', status: 'healthy' as const, value: '187 ms', uptime: '99.72%' },
          { name: 'Önbellek Katmanı', status: 'critical' as const, value: 'Hata Oranı %5.2', uptime: '94.10%' },
        ];
      },
    );
  }

  static async resolveLogEntry(tenantId: string, logId: number): Promise<{ status: string }> {
    return withFallback(
      () => apiClient.post('/api/v5/dashboard/logs/resolve', { tenant_id: tenantId, log_id: logId }),
      async () => {
        await delay(150);
        return { status: 'RESOLVED' };
      },
    );
  }
}
