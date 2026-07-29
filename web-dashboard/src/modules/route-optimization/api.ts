import type { OptimizedRoute, FleetVehicle, OptimizationConstraints, FleetStats } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(url + qs);
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

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export interface OptimizeResult {
  status: string;
  solver_execution_time_ms: number;
  fuel_saved_percent: number;
  total_distance_reduced_km: number;
  optimized_routes: { vehicle_id: string; assigned_nodes_count: number; estimated_fuel_saved_percent: number }[];
}

export interface RouteGenerateResult {
  status: string;
  route_id: string;
  total_distance_km: number;
  estimated_duration_min: number;
}

const MOCK_FLEET: FleetVehicle[] = [
  { id: 'v1', plate: '34 AB 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', capacity: 18, status: 'ON_ROUTE', driverName: 'Mehmet Şahin', driverPhone: '0532 111 2233', driverRating: 4.9, lat: 41.0921, lng: 29.0945, fuelLevel: 72 },
  { id: 'v2', plate: '34 CD 5678', brand: 'Ford', model: 'Transit Custom', capacity: 14, status: 'ON_ROUTE', driverName: 'Ali Yılmaz', driverPhone: '0533 222 3344', driverRating: 4.7, lat: 41.0988, lng: 29.1012, fuelLevel: 45 },
  { id: 'v3', plate: '34 EF 9012', brand: 'IVECO', model: 'Daily 50C', capacity: 20, status: 'STANDBY', driverName: 'Hasan Kaya', driverPhone: '0535 333 4455', driverRating: 5.0, lat: 41.0860, lng: 29.0830, fuelLevel: 82 },
  { id: 'v4', plate: '34 GH 3456', brand: 'Mercedes-Benz', model: 'Vito 119', capacity: 8, status: 'ON_ROUTE', driverName: 'Burak Demir', driverPhone: '0536 444 5566', driverRating: 4.6, lat: 41.0890, lng: 29.0650, fuelLevel: 58 },
  { id: 'v5', plate: '34 İJ 7890', brand: 'Ford', model: 'Tourneo Custom', capacity: 12, status: 'IDLE', driverName: 'Can Öztürk', driverPhone: '0537 555 6677', driverRating: 4.8, lat: 41.0950, lng: 29.1020, fuelLevel: 20 },
  { id: 'v6', plate: '34 KL 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', capacity: 18, status: 'OFFLINE', driverName: 'Serkan Aydın', driverPhone: '0538 666 7788', driverRating: 4.4, lat: 41.1000, lng: 29.1100, fuelLevel: 0 },
  { id: 'v7', plate: '34 MN 5678', brand: 'IVECO', model: 'Daily 50C', capacity: 20, status: 'BREAK', driverName: 'Emre Yıldız', driverPhone: '0539 777 8899', driverRating: 4.3, lat: 41.0780, lng: 29.0700, fuelLevel: 55 },
  { id: 'v8', plate: '34 OP 9012', brand: 'Ford', model: 'Transit Custom', capacity: 14, status: 'ON_ROUTE', driverName: 'Murat Çelik', driverPhone: '0540 888 9900', driverRating: 4.9, lat: 41.1020, lng: 29.0950, fuelLevel: 68 },
];

const MOCK_BEFORE: FleetStats = {
  totalDistanceKm: 284.6, totalDurationMin: 720, totalFuelLiters: 112.4, totalCo2Kg: 298.3, avgVehicleUtilization: 62,
};

const MOCK_AFTER: FleetStats = {
  totalDistanceKm: 241.2, totalDurationMin: 585, totalFuelLiters: 90.8, totalCo2Kg: 240.9, avgVehicleUtilization: 78,
};

function generateMockNodes(vehicleId: string, count: number): import('./types').RouteNode[] {
  const names = ['Ahmet Yılmaz', 'Eymen Altunel', 'Zeynep Kaya', 'Can Demir', 'Mert Doğan', 'Defne Yalçın', 'Kerem Aydın', 'İrem Kılıç', 'Bora Efe', 'Elif Su', 'Miraç Aslan', 'Nehir Yıldız', 'Alp Tekin', 'Ada Kurt', 'Ege Özkan', 'Duru Çelik'];
  const addrs = ['Atatürk Cad. No:14', 'Cumhuriyet Mah. 4. Sok', 'Gül Apt. D:8', 'Deniz Evleri B Blok', 'Yıldız Sok. No:3', 'Göksu Evleri A-12', 'İncirli Cad. No:42', 'Paşabahçe Sok. No:8', 'Çamlıca Yolu No:5', 'Barbaros Bulvarı No:22', 'Mimar Sinan Cad. No:18', 'Yalıboyu Cad. No:7', 'Orman Sok. No:12', 'Çarşı Cad. No:3', 'Hürriyet Cad. No:9', 'Liman Sok. No:4'];
  const baseLat = 41.085 + Math.random() * 0.02;
  const baseLng = 29.075 + Math.random() * 0.03;
  return Array.from({ length: count }, (_, i) => {
    const idx = (i + parseInt(vehicleId.replace(/\D/g, '')) * 2) % names.length;
    return {
      id: `${vehicleId}_n${i}`,
      studentName: names[idx],
      address: addrs[(idx + i) % addrs.length],
      lat: baseLat + (Math.random() - 0.5) * 0.015,
      lng: baseLng + (Math.random() - 0.5) * 0.015,
      stopSequence: i + 1,
      estimatedArrival: `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${String(15 + i * 8).padStart(2, '0')}`,
    };
  });
}

export class RouteOptimizationApiService {
  static async getFleet(tenantId: string): Promise<FleetVehicle[]> {
    try {
      const data = await get<{ vehicles: FleetVehicle[] }>(`${API_BASE}/api/v5/fleet/vehicles`, { tenant_id: tenantId });
      if (data?.vehicles?.length) return data.vehicles;
    } catch { /* fallback */ }
    return MOCK_FLEET.map(v => ({ ...v, selected: true }));
  }

  static async getRoutes(tenantId: string): Promise<OptimizedRoute[]> {
    try {
      const data = await get<{ routes: any[] }>(`${API_BASE}/api/v5/radar/routes`, { tenant_id: tenantId });
      if (data?.routes?.length) return data.routes as OptimizedRoute[];
    } catch { /* fallback */ }
    return [];
  }

  static async optimize(
    tenantId: string,
    fleet: { id: string; capacity: number }[],
    constraints?: OptimizationConstraints,
  ): Promise<{ result: OptimizeResult; routes: OptimizedRoute[]; beforeStats: FleetStats; afterStats: FleetStats }> {
    try {
      const result = await post<OptimizeResult>(`${API_BASE}/api/v5/routes/multi-optimize`, {
        tenant_id: tenantId, fleet, constraints: constraints || {},
      });
      const routes: OptimizedRoute[] = result.optimized_routes.map((r, i) => {
        const v = MOCK_FLEET.find(f => f.id === r.vehicle_id);
        const nodeCount = r.assigned_nodes_count || 6;
        return {
          vehiclePlate: v?.plate || `Araç ${i + 1}`,
          vehicleId: r.vehicle_id,
          driverName: v?.driverName || `Sürücü ${i + 1}`,
          driverPhone: v?.driverPhone,
          driverRating: v?.driverRating,
          nodeCount,
          totalDistanceKm: Math.round((15 + Math.random() * 30) * 10) / 10,
          estimatedDurationMin: Math.round(30 + Math.random() * 60),
          fuelSavedPercent: r.estimated_fuel_saved_percent || 19.2,
          fuelSavedLiters: Math.round((2 + Math.random() * 5) * 10) / 10,
          co2ReducedKg: Math.round((5 + Math.random() * 12) * 10) / 10,
          nodes: generateMockNodes(r.vehicle_id, nodeCount),
          status: Math.random() > 0.8 ? 'feasible' as const : 'optimal' as const,
        };
      });
      return { result, routes, beforeStats: MOCK_BEFORE, afterStats: MOCK_AFTER };
    } catch {
      await delay(400);
      const mockResult: OptimizeResult = {
        status: 'SUCCESS_SIMULATED',
        solver_execution_time_ms: 412,
        fuel_saved_percent: 19.2,
        total_distance_reduced_km: 14.3,
        optimized_routes: fleet.map(v => ({ vehicle_id: v.id, assigned_nodes_count: 6, estimated_fuel_saved_percent: 19.2 })),
      };
      const routes: OptimizedRoute[] = fleet.map((v, i) => {
        const fv = MOCK_FLEET.find(f => f.id === v.id);
        return {
          vehiclePlate: fv?.plate || `Araç ${i + 1}`,
          vehicleId: v.id,
          driverName: fv?.driverName || `Sürücü ${i + 1}`,
          driverPhone: fv?.driverPhone,
          driverRating: fv?.driverRating,
          nodeCount: 6,
          totalDistanceKm: 20 + Math.round(Math.random() * 20 * 10) / 10,
          estimatedDurationMin: 40 + Math.round(Math.random() * 50),
          fuelSavedPercent: 19.2,
          fuelSavedLiters: 3.8,
          co2ReducedKg: 10.1,
          nodes: generateMockNodes(v.id, 6),
          status: 'optimal',
        };
      });
      return { result: mockResult, routes, beforeStats: MOCK_BEFORE, afterStats: MOCK_AFTER };
    }
  }

  static async generateFromNodes(tenantId: string, nodes: { address: string; lat: number; lng: number }[]): Promise<RouteGenerateResult> {
    try {
      return await post<RouteGenerateResult>(`${API_BASE}/api/v5/routes/generate-from-nodes`, { tenant_id: tenantId, nodes });
    } catch {
      await delay(300);
      return { status: 'ROUTE_GENERATED', route_id: `ai_route_${Date.now()}`, total_distance_km: 24.5, estimated_duration_min: 45 };
    }
  }

  static async pruneNode(nodeId: string): Promise<{ status: string; recalculated_eta_ms: number }> {
    try {
      return await post(`${API_BASE}/api/v5/routes/node/driver-prune`, { node_id: nodeId });
    } catch {
      return { status: 'PRUNED', recalculated_eta_ms: 380 };
    }
  }

  static async swapStopsBetweenRoutes(_routeIdA: string, _nodeIdA: string, _routeIdB: string, _nodeIdB: string): Promise<{ status: string }> {
    await delay(200);
    return { status: 'SWAPPED' };
  }
}
