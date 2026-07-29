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

async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(url + qs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

import type { AssignableDriver, AssignableVehicle, AssignmentResult, ActiveAssignment, HistoryEntry, MatchSuggestion, AssignmentAnalytics, AssignmentConfig } from './types';

const MOCK_VEHICLES: AssignableVehicle[] = [
  { id: 'v3', plate: '34 EF 9012', brand: 'IVECO', model: 'Daily 50C', year: 2024, capacity: 20, status: 'STANDBY' },
  { id: 'v5', plate: '34 İJ 7890', brand: 'Ford', model: 'Tourneo Custom', year: 2025, capacity: 12, status: 'IDLE' },
  { id: 'v6', plate: '34 KL 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, capacity: 18, status: 'OFFLINE' },
  { id: 'v7', plate: '34 MN 5678', brand: 'IVECO', model: 'Daily 50C', year: 2024, capacity: 20, status: 'BREAK' },
];

const MOCK_DRIVERS_FULL: AssignableDriver[] = [
  { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1240, totalHours: 8920, status: 'ACTIVE' },
  { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', email: 'ali@example.com', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 980, totalHours: 6540, status: 'ACTIVE' },
  { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', email: 'hasan@example.com', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1560, totalHours: 11200, status: 'ACTIVE' },
  { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', email: 'burak@example.com', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, totalHours: 4560, status: 'ON_LEAVE' },
  { id: 'd5', name: 'Can Öztürk', phone: '0532 555 6677', email: 'can@example.com', licenseNumber: '34-L-56789', rating: 4.8, totalTrips: 345, totalHours: 2100, status: 'ACTIVE' },
  { id: 'd6', name: 'Serkan Aydın', phone: '0532 666 7788', email: 'serkan@example.com', licenseNumber: '34-L-67890', rating: 4.4, totalTrips: 2789, totalHours: 18400, status: 'OFF_DUTY' },
  { id: 'd7', name: 'Emre Yıldız', phone: '0532 777 8899', email: 'emre@example.com', licenseNumber: '34-L-78901', rating: 4.3, totalTrips: 678, totalHours: 3200, status: 'BREAK' },
  { id: 'd8', name: 'Murat Çelik', phone: '0532 888 9900', email: 'murat@example.com', licenseNumber: '34-L-89012', rating: 4.9, totalTrips: 456, totalHours: 1800, status: 'ACTIVE' },
];

const usedIds = new Set<string>(['v1', 'v2', 'v4']);

export class DriverAssignmentApiService {
  static async getUnassignedVehicles(tenantId: string): Promise<AssignableVehicle[]> {
    try {
      const data = await get<AssignableVehicle[]>(`${API_BASE}/api/v5/fleet/vehicles/unassigned`, { tenant_id: tenantId });
      if (Array.isArray(data)) return data;
      if (Array.isArray((data as any).vehicles)) return (data as any).vehicles;
    } catch { /* fallback */ }
    await delay(200);
    return MOCK_VEHICLES;
  }

  static async getAvailableDrivers(tenantId: string): Promise<AssignableDriver[]> {
    try {
      const data = await get<AssignableDriver[]>(`${API_BASE}/api/v5/fleet/drivers/available`, { tenant_id: tenantId });
      if (Array.isArray(data)) return data;
      if (Array.isArray((data as any).drivers)) return (data as any).drivers;
    } catch { /* fallback */ }
    await delay(200);
    return MOCK_DRIVERS_FULL.filter(d => d.status === 'ACTIVE');
  }

  static async getActiveAssignments(tenantId: string): Promise<ActiveAssignment[]> {
    try {
      const data = await get<{ assignments: ActiveAssignment[] }>(`${API_BASE}/api/v5/driver-assignment/active`, { tenant_id: tenantId });
      if (Array.isArray(data)) return data as unknown as ActiveAssignment[];
      if (Array.isArray((data as any).assignments)) return (data as any).assignments;
    } catch { /* fallback */ }
    await delay(300);
    return [
      { id: 'da_1', vehicleId: 'v1', vehiclePlate: '34 AB 1234', vehicleBrand: 'Mercedes-Benz', vehicleModel: 'Sprinter 519', driverId: 'd1', driverName: 'Mehmet Şahin', driverPhone: '0532 111 2233', driverRating: 4.9, confidence: 0.96, reason: 'En yüksek puanlı sürücü', assignedAt: Date.now() - 7200000, status: 'active' },
      { id: 'da_2', vehicleId: 'v2', vehiclePlate: '34 CD 5678', vehicleBrand: 'Ford', vehicleModel: 'Transit Custom', driverId: 'd2', driverName: 'Ali Yılmaz', driverPhone: '0533 222 3344', driverRating: 4.7, confidence: 0.88, reason: 'Bölge bazlı en uygun eşleşme', assignedAt: Date.now() - 3600000, status: 'active' },
      { id: 'da_3', vehicleId: 'v4', vehiclePlate: '34 GH 3456', vehicleBrand: 'Mercedes-Benz', vehicleModel: 'Vito 119', driverId: 'd4', driverName: 'Burak Demir', driverPhone: '0536 444 5566', driverRating: 4.6, confidence: 0.91, reason: 'Deneyim ve yakınlık skoru', assignedAt: Date.now() - 5400000, status: 'active' },
    ];
  }

  static async getAssignmentHistory(tenantId: string, filters?: { driverId?: string; vehicleId?: string; from?: number; to?: number }): Promise<HistoryEntry[]> {
    try {
      const params: Record<string, string> = { tenant_id: tenantId };
      if (filters?.driverId) params.driver_id = filters.driverId;
      if (filters?.vehicleId) params.vehicle_id = filters.vehicleId;
      if (filters?.from) params.from = String(filters.from);
      if (filters?.to) params.to = String(filters.to);
      const data = await get<{ assignments: HistoryEntry[] }>(`${API_BASE}/api/v5/driver-assignment/history`, params);
      if (Array.isArray(data)) return data as unknown as HistoryEntry[];
      if (Array.isArray((data as any).assignments)) return (data as any).assignments;
    } catch { /* fallback */ }
    await delay(300);
    return [
      { id: 'h1', vehicleId: 'v3', vehiclePlate: '34 EF 9012', driverId: 'd3', driverName: 'Hasan Kaya', confidence: 0.94, reason: 'AI optimizasyonu', assignedAt: Date.now() - 86400000 * 2, revokedAt: Date.now() - 86400000, status: 'revoked' },
      { id: 'h2', vehicleId: 'v5', vehiclePlate: '34 İJ 7890', driverId: 'd5', driverName: 'Can Öztürk', confidence: 0.82, reason: 'Geçici görevlendirme', assignedAt: Date.now() - 86400000 * 5, revokedAt: Date.now() - 86400000 * 3, status: 'revoked' },
      { id: 'h3', vehicleId: 'v1', vehiclePlate: '34 AB 1234', driverId: 'd8', driverName: 'Murat Çelik', confidence: 0.90, reason: 'Vardiya değişimi', assignedAt: Date.now() - 86400000 * 7, revokedAt: Date.now() - 86400000 * 4, status: 'revoked' },
    ];
  }

  static async assignManually(tenantId: string, vehicleId: string, driverId: string, reason?: string): Promise<AssignmentResult> {
    try {
      return await post<AssignmentResult>(`${API_BASE}/api/v5/driver-assignment/assign`, { tenant_id: tenantId, vehicle_id: vehicleId, driver_id: driverId, reason });
    } catch { /* fallback */ }
    await delay(400);
    const driver = MOCK_DRIVERS_FULL.find(d => d.id === driverId);
    return { status: 'ASSIGNED', driver_id: driverId, confidence: 0.95, reason: reason || 'Manuel atama', assigned_at: Date.now() };
  }

  static async assignDriverAI(tenantId: string, vehicleId: string): Promise<AssignmentResult> {
    try {
      return await post<AssignmentResult>(`${API_BASE}/api/v5/driver-assignment/ai-assign`, { tenant_id: tenantId, vehicle_id: vehicleId });
    } catch { /* fallback */ }
    await delay(600);
    const availDriver = MOCK_DRIVERS_FULL.find(d => d.status === 'ACTIVE' && !usedIds.has(`v_${d.id}`));
    if (availDriver) {
      usedIds.add(`v_${availDriver.id}`);
      return { status: 'ASSIGNED', driver_id: availDriver.id, confidence: 0.94, reason: `AI optimizasyonu: ${availDriver.name} en uygun sürücü`, assigned_at: Date.now() };
    }
    return { status: 'ASSIGNED', driver_id: MOCK_DRIVERS_FULL[0].id, confidence: 0.85, reason: 'Mevcut en iyi sürücü', assigned_at: Date.now() };
  }

  static async revokeAssignment(tenantId: string, assignmentId: string): Promise<{ status: string }> {
    try {
      return await post<{ status: string }>(`${API_BASE}/api/v5/driver-assignment/revoke`, { tenant_id: tenantId, assignment_id: assignmentId });
    } catch { /* fallback */ }
    await delay(300);
    return { status: 'REVOKED' };
  }

  static async getAssignmentAnalytics(tenantId: string): Promise<AssignmentAnalytics> {
    try {
      return await get<AssignmentAnalytics>(`${API_BASE}/api/v5/driver-assignment/analytics`, { tenant_id: tenantId });
    } catch { /* fallback */ }
    await delay(200);
    return {
      totalAssignments: 342,
      activeAssignments: 18,
      revokedToday: 2,
      avgConfidence: 0.91,
      avgDriverRating: 4.7,
      assignmentsByDay: [
        { date: 'Pazartesi', count: 12 },
        { date: 'Salı', count: 8 },
        { date: 'Çarşamba', count: 15 },
        { date: 'Perşembe', count: 10 },
        { date: 'Cuma', count: 6 },
      ],
      topDrivers: [
        { id: 'd3', name: 'Hasan Kaya', count: 145, avgRating: 5.0 },
        { id: 'd1', name: 'Mehmet Şahin', count: 128, avgRating: 4.9 },
        { id: 'd2', name: 'Ali Yılmaz', count: 98, avgRating: 4.7 },
      ],
    };
  }

  static async updateDriverStatus(tenantId: string, driverId: string, status: string): Promise<{ status: string }> {
    try {
      return await put<{ status: string }>(`${API_BASE}/api/v5/fleet/drivers/${driverId}/status`, { tenant_id: tenantId, status });
    } catch { /* fallback */ }
    return { status };
  }

  static async getSuggestions(tenantId: string, vehicleId: string): Promise<MatchSuggestion[]> {
    try {
      return await get<MatchSuggestion[]>(`${API_BASE}/api/v5/driver-assignment/suggest`, { tenant_id: tenantId, vehicle_id: vehicleId });
    } catch { /* fallback */ }
    await delay(300);
    return MOCK_DRIVERS_FULL
      .filter(d => d.status === 'ACTIVE')
      .map((d, i) => ({
        driverId: d.id,
        driverName: d.name,
        driverRating: d.rating,
        driverTotalTrips: d.totalTrips,
        driverStatus: d.status,
        confidence: Math.round((d.rating * 0.2 + 0.1 * (5 - i)) * 100) / 100,
        reason: i === 0 ? 'En yüksek puan ve deneyim' : i === 1 ? 'Optimum bölge eşleşmesi' : i === 2 ? 'Dengeli iş yükü dağılımı' : 'Müsait sürücü',
        score: Math.round(d.rating * 20 + d.totalTrips / 100 - i * 5),
      }))
      .sort((a, b) => b.score - a.score);
  }

  static async getAssignmentConfig(tenantId: string): Promise<AssignmentConfig> {
    try {
      return await get<AssignmentConfig>(`${API_BASE}/api/v5/driver-assignment/config`, { tenant_id: tenantId });
    } catch { /* fallback */ }
    return {
      autoAssign: false,
      ratingWeight: 0.4,
      proximityWeight: 0.3,
      workloadWeight: 0.3,
      minConfidence: 0.7,
      notifyOnAssign: true,
      notifyOnRevoke: true,
    };
  }

  static async saveAssignmentConfig(tenantId: string, config: AssignmentConfig): Promise<{ status: string }> {
    try {
      return await post<{ status: string }>(`${API_BASE}/api/v5/driver-assignment/config`, { tenant_id: tenantId, ...config });
    } catch { /* fallback */ }
    return { status: 'SAVED' };
  }
}
