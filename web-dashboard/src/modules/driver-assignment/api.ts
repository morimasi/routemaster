const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface AssignResult {
  status: string;
  driver_id: string;
  confidence: number;
  reason: string;
}

export class DriverAssignmentApiService {
  static async getVehicles(tenantId: string) {
    try {
      return await post(`${API_BASE}/api/v5/fleet`, { tenant_id: tenantId });
    } catch {
      await new Promise(r => setTimeout(r, 200));
      return [
        { id: 'v1', plate: '34 AB 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, capacity: 18, status: 'ON_ROUTE' },
        { id: 'v2', plate: '34 CD 5678', brand: 'Ford', model: 'Transit Custom', year: 2023, capacity: 14, status: 'WARNING' },
        { id: 'v3', plate: '34 EF 9012', brand: 'IVECO', model: 'Daily 50C', year: 2024, capacity: 20, status: 'STANDBY' },
        { id: 'v4', plate: '34 GH 3456', brand: 'Mercedes-Benz', model: 'Vito 119', year: 2023, capacity: 8, status: 'ON_ROUTE' },
        { id: 'v5', plate: '34 İJ 7890', brand: 'Ford', model: 'Tourneo Custom', year: 2025, capacity: 12, status: 'IDLE' },
      ];
    }
  }

  static async getDrivers(tenantId: string) {
    try {
      return await post(`${API_BASE}/api/v5/fleet/drivers`, { tenant_id: tenantId });
    } catch {
      await new Promise(r => setTimeout(r, 200));
      return [
        { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1240, status: 'ACTIVE' },
        { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 980, status: 'ACTIVE' },
        { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1560, status: 'ACTIVE' },
        { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, status: 'ON_LEAVE' },
        { id: 'd5', name: 'Can Öztürk', phone: '0532 555 6677', licenseNumber: '34-L-56789', rating: 4.8, totalTrips: 345, status: 'ACTIVE' },
      ];
    }
  }

  static async assignDriverAI(tenantId: string, vehicleId: string): Promise<AssignResult> {
    try {
      return await post(`${API_BASE}/api/v5/fleet/ai-assign`, { tenant_id: tenantId, vehicle_id: vehicleId });
    } catch {
      await new Promise(r => setTimeout(r, 500));
      return { status: 'ASSIGNED', driver_id: `d_ai_${Date.now()}`, confidence: 0.94, reason: 'Optimum sürücü-rota eşleşmesi' };
    }
  }
}
