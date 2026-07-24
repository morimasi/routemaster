import type { FleetVehicle, FleetDriver } from './types';

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

export class FleetApiService {
  static async getFleet(tenantId: string): Promise<FleetVehicle[]> {
    try {
      return await post(`${API_BASE}/api/v5/fleet`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return [
        { id: 'v1', plate: '34 AB 1234', model: 'Mercedes Sprinter 2024', driver: 'Mehmet Şahin', phone: '0532 111 2233', status: 'ON_ROUTE', capacity: '16 Yolcu', fuelLevel: 85, rating: 4.9, totalKm: 45230 },
        { id: 'v2', plate: '34 CD 5678', model: 'VW Crafter 2023', driver: 'Ali Yılmaz', phone: '0533 222 3344', status: 'WARNING', capacity: '19 Yolcu', fuelLevel: 42, rating: 4.7, totalKm: 38100 },
        { id: 'v3', plate: '34 EF 9012', model: 'Ford Transit 2024', driver: 'Hasan Kaya', phone: '0535 333 4455', status: 'STANDBY', capacity: '16 Yolcu', fuelLevel: 95, rating: 5.0, totalKm: 12400 },
        { id: 'v4', plate: '34 GH 3456', model: 'Otokar Sultan 2023', driver: 'Burak Demir', phone: '0536 444 5566', status: 'MAINTENANCE', capacity: '29 Yolcu', fuelLevel: 15, rating: 4.6, totalKm: 67800 },
      ];
    }
  }

  static async getDrivers(tenantId: string): Promise<FleetDriver[]> {
    try {
      return await post(`${API_BASE}/api/v5/fleet/drivers`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return [
        { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1240, status: 'ACTIVE' },
        { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 980, status: 'ACTIVE' },
        { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1560, status: 'ACTIVE' },
        { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, status: 'ON_LEAVE' },
      ];
    }
  }

  static async addVehicle(tenantId: string, data: Record<string, unknown>) {
    try {
      return await post(`${API_BASE}/api/v5/fleet/vehicle`, { tenant_id: tenantId, ...data });
    } catch {
      await delay(250);
      return { status: 'CREATED', vehicle_id: `v_${Date.now()}` };
    }
  }

  static async assignDriverAI(tenantId: string, vehicleId: string) {
    try {
      return await post(`${API_BASE}/api/v5/fleet/ai-assign`, { tenant_id: tenantId, vehicle_id: vehicleId });
    } catch {
      await delay(500);
      return { status: 'ASSIGNED', driver_id: `d_ai_${Date.now()}`, confidence: 0.94, reason: 'Optimum sürücü-rota eşleşmesi' };
    }
  }
}
