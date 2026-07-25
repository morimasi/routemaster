import { apiClient, chatClient } from './httpClient';
import { withFallback, delay } from './withFallback';
import type { DocumentAINode } from '../types';

export class ShuttleXApiService {

  static async multiOptimizeFleet(tenantId: string, fleet: any[], nodeIds: string[]) {
    return withFallback(
      () => apiClient.post('/api/v5/routes/multi-optimize', {
        tenant_id: tenantId, optimization_timestamp: Date.now(), fleet, associated_student_nodes: nodeIds,
      }),
      async () => {
        await delay(800);
        return {
          status: 'SUCCESS_SIMULATED', solver_execution_time_ms: 412, fuel_saved_percent: 19.2,
          total_distance_reduced_km: 14.3,
          optimized_routes: fleet.map((v, i) => ({
            vehicle_id: v.id, assigned_nodes_count: Math.max(4, nodeIds.length - i), estimated_fuel_saved_percent: 19.2,
          })),
        };
      },
    );
  }

  static async executeDriverPrune(tenantId: string, routeId: string, nodeId: string, driverId: string) {
    return withFallback(
      () => apiClient.post('/api/v5/routes/node/driver-prune', {
        tenant_id: tenantId, route_id: routeId, node_id: nodeId, driver_id: driverId, action: 'EXECUTE_PRUNE',
      }),
      async () => {
        await delay(380);
        return { status: 'PRUNED', node_id: nodeId, recalculated_eta_ms: 380, message: 'Düğüm grafikten budandı.' };
      },
    );
  }

  static async flagParentAbsence(tenantId: string, routeId: string, nodeId: string, studentId: string, note?: string) {
    return withFallback(
      () => apiClient.post('/api/v5/routes/node/flag-absence', {
        tenant_id: tenantId, route_id: routeId, node_id: nodeId, student_id: studentId, absence_reason: note || 'Veli bildirimi',
      }),
      async () => {
        await delay(200);
        return { status: 'FLAGGED', node_id: nodeId, driver_hud_alert: 'ALERT_ORANGE' };
      },
    );
  }

  static async parseVoiceIntent(phrase: string): Promise<{ status: string; spoken_phrase: string; resolved_intent: { action: string; confidence_score: number } }> {
    return withFallback(
      () => apiClient.post('/api/v5/voice/intent', {
        tenant_id: 't-1001', user_id: 'd-5001', role: 'DRIVER', spoken_phrase: phrase,
      }),
      async () => {
        await delay(300);
        const lc = phrase.toLowerCase();
        const action = (lc.includes('atla') || lc.includes('prune') || lc.includes('gelmeyecek'))
          ? 'EXECUTE_PRUNE'
          : (lc.includes('bindi') || lc.includes('tamamla'))
          ? 'MARK_BOARDED'
          : 'UNKNOWN';
        return { status: 'PARSED', spoken_phrase: phrase, resolved_intent: { action, confidence_score: 0.96 } };
      },
    );
  }

  static async ingestDocumentAI(): Promise<DocumentAINode[]> {
    await delay(1800);
    return [
      { id: 1, address: 'Atatürk Cad. No:14/A, Kavacık, Beykoz', confidence: 0.98, student: 'Ahmet Yılmaz', geo: '41.0921, 29.0945' },
      { id: 2, address: 'Cumhuriyet Mah. 4. Sok No:12, Kavacık', confidence: 0.95, student: 'Eymen Altunel', geo: '41.0950, 29.0980' },
      { id: 3, address: 'Deniz Evleri B Blok Kat:2, Çubuklu', confidence: 0.88, student: 'Can Demir', geo: '41.0988, 29.1012' },
      { id: 4, address: 'Gül Apt. D:8, Anadolu Hisarı', confidence: 0.93, student: 'Zeynep Kaya', geo: '41.0860, 29.0830' },
      { id: 5, address: 'Yıldız Sok. No:3, Kavacık', confidence: 0.79, student: 'Mert Doğan', geo: '41.0900, 29.0910' },
    ];
  }

  static async initChatRoom(tenantId: string, senderId: string, recipientId: string) {
    return withFallback(
      () => chatClient.post('/api/v5/chat/room/init', {
        tenant_id: tenantId, sender_id: senderId, recipient_id: recipientId, encryption_type: 'ECDH_AES_GCM',
      }),
      async () => {
        await delay(150);
        return { status: 'INITIALIZED', room_id: `room_${tenantId}_${Date.now()}`, encryption: 'ECDH_AES_GCM' };
      },
    );
  }

  static async sendChatMessage(roomId: string, text: string, senderId: string) {
    return withFallback(
      () => chatClient.post('/api/v5/chat/message', { room_id: roomId, text, sender_id: senderId }),
      async () => {
        await delay(100);
        return { status: 'DELIVERED', message_id: `msg_${Date.now()}` };
      },
    );
  }

  static async saveTenantSettings(tenantId: string, settings: Record<string, unknown>) {
    return withFallback(
      () => apiClient.post('/api/v5/tenant/settings', { tenant_id: tenantId, ...settings }),
      async () => {
        await delay(300);
        return { status: 'SAVED', tenant_id: tenantId };
      },
    );
  }

  static async addVehicle(tenantId: string, vehicleData: Record<string, unknown>) {
    return withFallback(
      () => apiClient.post('/api/v5/fleet/vehicle', { tenant_id: tenantId, ...vehicleData }),
      async () => {
        await delay(250);
        return { status: 'CREATED', vehicle_id: `v_${Date.now()}` };
      },
    );
  }

  static async getAttendanceStats(tenantId: string, dateRange: string) {
    return withFallback(
      () => apiClient.get('/api/v5/analytics/attendance', { params: { tenant: tenantId, range: dateRange } }),
      async () => {
        await delay(200);
        return { total_students: 248, avg_attendance_rate: 0.946, absences_today: 14, peak_absence_day: 'Pazartesi' };
      },
    );
  }
}
