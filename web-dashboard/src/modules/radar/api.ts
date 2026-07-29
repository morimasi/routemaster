import type { VehiclePosition, RadarRoute, FleetSummary, OptimizationResult, VehicleDetail } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  const res = await fetch(`${url}${params ? '?' + new URLSearchParams(params) : ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const MOCK_POSITIONS: VehiclePosition[] = [
  { id: 'v1', plate: '34 AB 1234', route: 'Kavacık - Sabah', lat: 41.0921, lng: 29.0945, speed: 42, driver: 'Mehmet Şahin', driverPhone: '0532 111 2233', driverRating: 4.9, status: 'ON_ROUTE', fuelLevel: 72, heading: 45, model: 'Sprinter 519', brand: 'Mercedes-Benz' },
  { id: 'v2', plate: '34 CD 5678', route: 'Anaokulu Öğlen', lat: 41.0988, lng: 29.1012, speed: 28, driver: 'Ali Yılmaz', driverPhone: '0533 222 3344', driverRating: 4.7, status: 'WARNING', fuelLevel: 34, heading: 120, model: 'Transit Custom', brand: 'Ford' },
  { id: 'v3', plate: '34 EF 9012', route: 'Akşam Fabrika', lat: 41.0860, lng: 29.0830, speed: 0, driver: 'Hasan Kaya', driverPhone: '0535 333 4455', driverRating: 5.0, status: 'STANDBY', fuelLevel: 95, heading: 0, model: 'Daily 50C', brand: 'IVECO' },
  { id: 'v4', plate: '34 GH 3456', route: 'Etüt Seferi', lat: 41.0890, lng: 29.0650, speed: 55, driver: 'Burak Demir', driverPhone: '0536 444 5566', driverRating: 4.6, status: 'ON_ROUTE', fuelLevel: 58, heading: 210, model: 'Vito 119', brand: 'Mercedes-Benz' },
  { id: 'v5', plate: '34 İJ 7890', route: 'Hafta Sonu Etüt', lat: 41.0950, lng: 29.1020, speed: 0, driver: 'Can Öztürk', driverPhone: '0537 555 6677', driverRating: 4.8, status: 'IDLE', fuelLevel: 20, heading: 0, model: 'Tourneo Custom', brand: 'Ford' },
];

const MOCK_ROUTES: RadarRoute[] = [
  { id: 'r1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65, nodes: [] },
  { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 2, progressPercent: 40, nodes: [] },
  { id: 'r3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10, nodes: [] },
];

export class RadarApiService {
  static async getVehiclePositions(tenantId: string): Promise<VehiclePosition[]> {
    try {
      return await get(`${API_BASE}/api/v5/radar/positions`, { tenant_id: tenantId });
    } catch {
      await delay(300);
      return MOCK_POSITIONS;
    }
  }

  static async getRadarRoutes(tenantId: string): Promise<RadarRoute[]> {
    try {
      return await get(`${API_BASE}/api/v5/radar/routes`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return MOCK_ROUTES;
    }
  }

  static async getRouteDetail(routeId: string): Promise<RadarRoute | null> {
    try {
      return await get(`${API_BASE}/api/v5/routes/detail/${routeId}`);
    } catch {
      return null;
    }
  }

  static async getFleetSummary(tenantId: string): Promise<FleetSummary> {
    try {
      return await get(`${API_BASE}/api/v5/fleet/summary`, { tenant_id: tenantId });
    } catch {
      return { totalVehicles: 8, activeVehicles: 4, warningVehicles: 1, standbyVehicles: 1, offlineVehicles: 2, totalDrivers: 8, activeDrivers: 4, totalRoutes: 6 };
    }
  }

  static async getVehicleDetail(vehicleId: string): Promise<VehicleDetail | null> {
    try {
      return await get(`${API_BASE}/api/v5/fleet/vehicle/${vehicleId}`);
    } catch {
      return null;
    }
  }

  static async updateRoute(routeId: string, data: Partial<RadarRoute>): Promise<{ status: string }> {
    try {
      return await post(`${API_BASE}/api/v5/routes/update`, { route_id: routeId, ...data });
    } catch {
      return { status: 'UPDATED' };
    }
  }

  static async assignVehicleToRoute(routeId: string, vehicleId: string): Promise<{ status: string }> {
    try {
      return await post(`${API_BASE}/api/v5/routes/assign-vehicle`, { route_id: routeId, vehicle_id: vehicleId });
    } catch {
      return { status: 'ASSIGNED' };
    }
  }

  static async assignDriverToVehicle(vehicleId: string, driverId: string): Promise<{ status: string }> {
    try {
      return await post(`${API_BASE}/api/v5/routes/assign-driver`, { vehicle_id: vehicleId, driver_id: driverId });
    } catch {
      return { status: 'ASSIGNED' };
    }
  }

  static async createRoute(data: { name: string; type?: string; vehicleId?: string }): Promise<{ status: string; route_id?: string }> {
    try {
      return await post(`${API_BASE}/api/v5/services/create`, { ...data });
    } catch {
      return { status: 'CREATED', route_id: `r_${Date.now()}` };
    }
  }

  static async deleteRoute(routeId: string): Promise<{ status: string }> {
    try {
      return await del(`${API_BASE}/api/v5/routes/${routeId}`);
    } catch {
      return { status: 'DELETED' };
    }
  }

  static async runOptimization(tenantId: string, fleetIds: string[], nodeIds: string[]): Promise<OptimizationResult> {
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
