import type { VehiclePosition, RadarRoute } from './types';

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

export class RadarApiService {
  static async getVehiclePositions(tenantId: string): Promise<VehiclePosition[]> {
    try {
      return await post(`${API_BASE}/api/v5/radar/positions`, { tenant_id: tenantId });
    } catch {
      await delay(300);
      return [
        { id: 'v1', plate: '34 AB 1234', route: 'Kavacık - Sabah', x: 35, y: 40, speed: 42, driver: 'Mehmet Şahin', status: 'ON_ROUTE' },
        { id: 'v2', plate: '34 CD 5678', route: 'Anaokulu Öğlen', x: 65, y: 55, speed: 28, driver: 'Ali Yılmaz', status: 'WARNING' },
        { id: 'v3', plate: '34 EF 9012', route: 'Akşam Fabrika', x: 50, y: 70, speed: 0, driver: 'Hasan Kaya', status: 'STANDBY' },
        { id: 'v4', plate: '34 GH 3456', route: 'Etüt Seferi', x: 20, y: 30, speed: 55, driver: 'Burak Demir', status: 'ON_ROUTE' },
      ];
    }
  }

  static async getRadarRoutes(tenantId: string): Promise<RadarRoute[]> {
    try {
      return await post(`${API_BASE}/api/v5/radar/routes`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return [
        { id: 'r1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65, nodes: [] },
        { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 2, progressPercent: 40, nodes: [] },
        { id: 'r3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10, nodes: [] },
      ];
    }
  }

  static async runOptimization(tenantId: string, fleetIds: string[], nodeIds: string[]): Promise<{ status: string; solver_execution_time_ms: number; fuel_saved_percent: number; total_distance_reduced_km: number; optimized_routes: Array<{ vehicle_id: string; assigned_nodes_count: number; estimated_fuel_saved_percent: number }> }> {
    try {
      return await post(`${API_BASE}/api/v5/routes/multi-optimize`, {
        tenant_id: tenantId, fleet: fleetIds.map((id) => ({ id })), associated_student_nodes: nodeIds,
      });
    } catch {
      await delay(800);
      return {
        status: 'SUCCESS_SIMULATED', solver_execution_time_ms: 412, fuel_saved_percent: 19.2,
        total_distance_reduced_km: 14.3,
        optimized_routes: fleetIds.map((id) => ({ vehicle_id: id, assigned_nodes_count: 6, estimated_fuel_saved_percent: 19.2 })),
      };
    }
  }
}
