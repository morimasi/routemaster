import type { FleetVehicle, FleetStats, FleetGroup, GeoPoint } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MOCK_VEHICLES: FleetVehicle[] = [
  {
    id: 'v1', plate: '34 AB 1234', vin: 'WBA1234567890ABCD1', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024,
    color: '#1e293b', fuelType: 'diesel', capacity: 18, status: 'ON_ROUTE',
    position: { lat: 41.0921, lng: 29.0945, speed: 42, heading: 180, accuracy: 5, timestamp: Date.now() },
    telemetry: { speed: 42, heading: 180, rpm: 1850, fuelLevel: 73, fuelConsumption: 12.4, engineTemp: 88, batteryVoltage: 12.6, odometer: 45230, doorStatus: 'locked', ignition: true, tirePressure: [38, 37, 38, 36], lastMaintenanceKm: 1000 },
    driver: { id: 'd1', name: 'Mehmet Şahin', phone: '+905321234567', license: '06-B-12345', rating: 4.8, totalTrips: 1247, totalHours: 8920, status: 'active' },
    route: { id: 'r1', name: 'Kavacık Sabah Seferi', type: 'morning', progress: 65, totalDistance: 42.5, remainingDistance: 14.8, totalDuration: 5400, remainingDuration: 1890, stopCount: 14, completedStops: 9, nextStop: 'Mimar Sinan Cad. No:42', nextStopEta: '08:14', estimatedArrival: '08:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['sabah', 'kavacık'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v2', plate: '34 CD 5678', vin: 'WBA1234567890ABCD2', brand: 'Ford', model: 'Transit Custom', year: 2023,
    color: '#334155', fuelType: 'diesel', capacity: 14, status: 'WARNING',
    position: { lat: 41.0988, lng: 29.1012, speed: 58, heading: 45, accuracy: 8, timestamp: Date.now() },
    telemetry: { speed: 58, heading: 45, rpm: 2200, fuelLevel: 45, fuelConsumption: 15.2, engineTemp: 92, batteryVoltage: 12.8, odometer: 28450, doorStatus: 'locked', ignition: true, tirePressure: [36, 35, 36, 34], lastMaintenanceKm: 450 },
    driver: { id: 'd2', name: 'Ali Yılmaz', phone: '+905322345678', license: '06-B-23456', rating: 4.5, totalTrips: 892, totalHours: 6540, status: 'active' },
    route: { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', type: 'afternoon', progress: 40, totalDistance: 28.3, remainingDistance: 16.9, totalDuration: 3600, remainingDuration: 2160, stopCount: 10, completedStops: 4, nextStop: 'İstiklal Mah. Çiçek Sk. No:8', nextStopEta: '12:28', estimatedArrival: '13:00' },
    alerts: [
      { id: 'a1', type: 'speeding', severity: 'warning', message: 'Hız sınırı aşıldı: 72 km/s (50 km/s)', timestamp: Date.now() - 120000, location: { lat: 41.096, lng: 29.099, speed: 72, heading: 50, accuracy: 5, timestamp: Date.now() - 120000 }, acknowledged: false },
      { id: 'a2', type: 'off_route', severity: 'info', message: 'Rota dışı sapma tespit edildi (50m)', timestamp: Date.now() - 600000, location: { lat: 41.095, lng: 29.098, speed: 35, heading: 30, accuracy: 5, timestamp: Date.now() - 600000 }, acknowledged: false },
    ], trail: [], lastUpdated: Date.now(), tags: ['öğlen', 'okul'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v3', plate: '34 EF 9012', vin: 'WBA1234567890ABCD3', brand: 'IVECO', model: 'Daily 50C', year: 2024,
    color: '#1e3a5f', fuelType: 'diesel', capacity: 20, status: 'STANDBY',
    position: { lat: 41.0860, lng: 29.0830, speed: 0, heading: 0, accuracy: 3, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 82, fuelConsumption: 0, engineTemp: 45, batteryVoltage: 12.4, odometer: 18920, doorStatus: 'locked', ignition: false, tirePressure: [37, 37, 36, 37], lastMaintenanceKm: 3000 },
    driver: { id: 'd3', name: 'Hasan Kaya', phone: '+905323456789', license: '06-B-34567', rating: 4.9, totalTrips: 1563, totalHours: 11200, status: 'off_duty' },
    route: { id: 'r3', name: 'Akşam Fabrika Servisi', type: 'evening', progress: 10, totalDistance: 35.8, remainingDistance: 32.2, totalDuration: 4800, remainingDuration: 4320, stopCount: 12, completedStops: 0, nextStop: 'Fabrika Ana Durak', nextStopEta: '17:30', estimatedArrival: '18:15' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['akşam', 'fabrika'], groupId: 'g2', zone: 'Gebze',
  },
  {
    id: 'v4', plate: '34 GH 3456', vin: 'WBA1234567890ABCD4', brand: 'Mercedes-Benz', model: 'Vito 119', year: 2023,
    color: '#0f172a', fuelType: 'diesel', capacity: 8, status: 'ON_ROUTE',
    position: { lat: 41.0890, lng: 29.0650, speed: 55, heading: 270, accuracy: 4, timestamp: Date.now() },
    telemetry: { speed: 55, heading: 270, rpm: 1950, fuelLevel: 61, fuelConsumption: 11.8, engineTemp: 86, batteryVoltage: 12.7, odometer: 36200, doorStatus: 'locked', ignition: true, tirePressure: [38, 38, 37, 38], lastMaintenanceKm: 1800 },
    driver: { id: 'd4', name: 'Burak Demir', phone: '+905324567890', license: '06-B-45678', rating: 4.7, totalTrips: 1104, totalHours: 7890, status: 'active' },
    route: { id: 'r4', name: 'Etüt Seferi - Öğlen', type: 'extra', progress: 82, totalDistance: 18.6, remainingDistance: 3.3, totalDuration: 2400, remainingDuration: 432, stopCount: 6, completedStops: 5, nextStop: 'Kültür Merkezi', nextStopEta: '13:42', estimatedArrival: '13:55' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['etüt', 'öğlen'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v5', plate: '34 İJ 7890', vin: 'WBA1234567890ABCD5', brand: 'Ford', model: 'Tourneo Custom', year: 2025,
    color: '#1e293b', fuelType: 'hybrid', capacity: 12, status: 'IDLE',
    position: { lat: 41.094, lng: 29.076, speed: 0, heading: 0, accuracy: 3, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 800, fuelLevel: 90, fuelConsumption: 0.5, engineTemp: 52, batteryVoltage: 12.9, odometer: 5230, doorStatus: 'unlocked', ignition: true, tirePressure: [37, 36, 37, 36], lastMaintenanceKm: 8000 },
    driver: { id: 'd5', name: 'Can Öztürk', phone: '+905325678901', license: '06-B-56789', rating: 4.6, totalTrips: 345, totalHours: 2100, status: 'break' },
    route: { id: 'r5', name: 'Akşam Servisi', type: 'evening', progress: 5, totalDistance: 38.2, remainingDistance: 36.3, totalDuration: 5400, remainingDuration: 5130, stopCount: 15, completedStops: 0, nextStop: 'İlk Durak - Merkez', nextStopEta: '16:00', estimatedArrival: '16:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['akşam'], groupId: 'g2', zone: 'Gebze',
  },
  {
    id: 'v6', plate: '34 KL 1234', vin: 'WBA1234567890ABCD6', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024,
    color: '#1e3a5f', fuelType: 'diesel', capacity: 18, status: 'OFFLINE',
    position: { lat: 41.100, lng: 29.110, speed: 0, heading: 0, accuracy: 0, timestamp: Date.now() - 7200000 },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 0, fuelConsumption: 0, engineTemp: 25, batteryVoltage: 11.8, odometer: 67200, doorStatus: 'locked', ignition: false, tirePressure: [0, 0, 0, 0], lastMaintenanceKm: 200 },
    driver: { id: 'd6', name: 'Serkan Aydın', phone: '+905326789012', license: '06-B-67890', rating: 4.4, totalTrips: 2789, totalHours: 18400, status: 'off_duty' },
    route: { id: 'r6', name: 'Sabah Bandı - Geçici', type: 'morning', progress: 0, totalDistance: 45.0, remainingDistance: 45.0, totalDuration: 6000, remainingDuration: 6000, stopCount: 16, completedStops: 0, nextStop: 'Depo', nextStopEta: '--:--', estimatedArrival: '--:--' },
    alerts: [
      { id: 'a3', type: 'maintenance', severity: 'critical', message: 'Periyodik bakım zamanı geçti (200km)', timestamp: Date.now() - 86400000, acknowledged: false },
      { id: 'a4', type: 'engine_fault', severity: 'warning', message: 'Motor arıza lambası yanıyor', timestamp: Date.now() - 43200000, acknowledged: false },
    ], trail: [], lastUpdated: Date.now() - 7200000, tags: ['sabah'], groupId: 'g3', zone: 'Depo',
  },
  {
    id: 'v7', plate: '34 MN 5678', vin: 'WBA1234567890ABCD7', brand: 'IVECO', model: 'Daily 50C', year: 2024,
    color: '#0f172a', fuelType: 'diesel', capacity: 20, status: 'BREAK',
    position: { lat: 41.078, lng: 29.070, speed: 0, heading: 0, accuracy: 5, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 55, fuelConsumption: 0, engineTemp: 48, batteryVoltage: 12.5, odometer: 22100, doorStatus: 'locked', ignition: false, tirePressure: [36, 36, 35, 36], lastMaintenanceKm: 4500 },
    driver: { id: 'd7', name: 'Emre Yıldız', phone: '+905327890123', license: '06-B-78901', rating: 4.3, totalTrips: 678, totalHours: 4560, status: 'break' },
    route: { id: 'r7', name: 'Öğlen Servisi', type: 'afternoon', progress: 55, totalDistance: 22.4, remainingDistance: 10.1, totalDuration: 3000, remainingDuration: 1350, stopCount: 8, completedStops: 4, nextStop: 'Çarşı Durak', nextStopEta: '12:15', estimatedArrival: '12:40' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['mola', 'öğlen'], groupId: 'g1', zone: 'Merkez',
  },
  {
    id: 'v8', plate: '34 OP 9012', vin: 'WBA1234567890ABCD8', brand: 'Ford', model: 'Transit Custom', year: 2023,
    color: '#334155', fuelType: 'diesel', capacity: 14, status: 'ON_ROUTE',
    position: { lat: 41.102, lng: 29.095, speed: 38, heading: 120, accuracy: 6, timestamp: Date.now() },
    telemetry: { speed: 38, heading: 120, rpm: 1750, fuelLevel: 68, fuelConsumption: 13.1, engineTemp: 85, batteryVoltage: 12.7, odometer: 15800, doorStatus: 'locked', ignition: true, tirePressure: [37, 36, 37, 36], lastMaintenanceKm: 6000 },
    driver: { id: 'd8', name: 'Murat Çelik', phone: '+905328901234', license: '06-B-89012', rating: 4.9, totalTrips: 456, totalHours: 3200, status: 'active' },
    route: { id: 'r8', name: 'Hastane Ring Servisi', type: 'shuttle', progress: 45, totalDistance: 15.2, remainingDistance: 8.4, totalDuration: 1800, remainingDuration: 990, stopCount: 6, completedStops: 3, nextStop: 'Eğitim Hastanesi', nextStopEta: '10:22', estimatedArrival: '10:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['ring', 'hastane'], groupId: 'g4', zone: 'Merkez',
  },
];

const MOCK_GROUPS: FleetGroup[] = [
  { id: 'g1', name: 'Kavacık Filosu', color: '#3b82f6', vehicleCount: 4, activeCount: 3, alertCount: 1 },
  { id: 'g2', name: 'Gebze Filosu', color: '#10b981', vehicleCount: 2, activeCount: 0, alertCount: 0 },
  { id: 'g3', name: 'Depo', color: '#f59e0b', vehicleCount: 1, activeCount: 0, alertCount: 2 },
  { id: 'g4', name: 'Merkez Ring', color: '#8b5cf6', vehicleCount: 1, activeCount: 1, alertCount: 0 },
];

export function computeFleetStats(vehicles: FleetVehicle[]): FleetStats {
  const active = vehicles.filter(v => v.status === 'ON_ROUTE');
  const totals = active.reduce((a, v) => ({
    dist: a.dist + (v.route.remainingDistance > 0 ? v.route.totalDistance : 0),
    dur: a.dur + (v.route.remainingDuration > 0 ? v.route.totalDuration - v.route.remainingDuration : 0),
    speed: a.speed + v.telemetry.speed,
    fuel: a.fuel + (v.telemetry.fuelConsumption || 0),
  }), { dist: 0, dur: 0, speed: 0, fuel: 0 });

  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'ON_ROUTE').length,
    idleVehicles: vehicles.filter(v => v.status === 'IDLE' || v.status === 'STANDBY' || v.status === 'BREAK').length,
    offlineVehicles: vehicles.filter(v => v.status === 'OFFLINE').length,
    warningVehicles: vehicles.filter(v => v.status === 'WARNING' || v.alerts.some(a => !a.acknowledged)).length,
    totalDistanceToday: totals.dist,
    totalDurationToday: totals.dur,
    totalFuelUsed: totals.fuel,
    avgSpeed: active.length ? totals.speed / active.length : 0,
    maxSpeed: Math.max(...vehicles.map(v => v.telemetry.speed || 0)),
    completedRoutes: vehicles.filter(v => v.status === 'COMPLETED').length,
    activeRoutes: active.length,
    alertsToday: vehicles.reduce((a, v) => a + v.alerts.filter(a => a.timestamp > Date.now() - 86400000).length, 0),
    criticalAlerts: vehicles.reduce((a, v) => a + v.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length, 0),
    fleetScore: Math.round(95 - vehicles.filter(v => v.status === 'WARNING' || v.status === 'OFFLINE').length * 5),
  };
}

export class FleetTrackingService {
  private static vehicles: FleetVehicle[] = [];
  private static callbacks: Set<(vehicles: FleetVehicle[]) => void> = new Set();
  private static timer: ReturnType<typeof setInterval> | null = null;
  private static trailEnabled = false;
  private static ws: WebSocket | null = null;
  private static wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private static useMock = true;

  static getVehicles(): FleetVehicle[] { return this.vehicles.map(v => ({ ...v, trail: [...v.trail] })); }
  static getGroups(): FleetGroup[] { return MOCK_GROUPS; }
  static getVehicle(id: string): FleetVehicle | undefined { return this.vehicles.find(v => v.id === id); }

  static async fetchVehicles(tenantId: string = 't-1001'): Promise<FleetVehicle[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/fleet/vehicles`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.vehicles?.length) {
          this.useMock = false;
          this.vehicles = data.vehicles.map((v: FleetVehicle) => ({
            ...v, trail: [],
            alerts: v.alerts?.map((a: any) => ({ ...a })) || [],
            lastUpdated: Date.now(),
          }));
          return this.getVehicles();
        }
      }
    } catch { /* API unavailable */ }
    this.useMock = true;
    this.vehicles = [...MOCK_VEHICLES.map(v => ({
      ...v, trail: [], position: { ...v.position, timestamp: Date.now() },
      alerts: v.alerts.map(a => ({ ...a })), lastUpdated: Date.now(),
    }))];
    return this.getVehicles();
  }

  static subscribe(callback: (vehicles: FleetVehicle[]) => void): () => void {
    this.callbacks.add(callback);
    this.connectWebSocket();
    if (!this.timer && this.useMock) {
      this.timer = setInterval(() => this.simulateMovement(), 3000);
    }
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.disconnectWebSocket();
      }
    };
  }

  private static connectWebSocket() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    try {
      const wsUrl = API_BASE.replace(/^http/, 'ws');
      this.ws = new WebSocket(`${wsUrl}/?tenant=t-1001`);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.vehicles) {
            this.vehicles = data.vehicles;
            this.notify();
          }
        } catch { /* ignore malformed */ }
      };
      this.ws.onclose = () => {
        this.ws = null;
        this.wsReconnectTimer = setTimeout(() => this.connectWebSocket(), 5000);
      };
      this.ws.onerror = () => { this.ws?.close(); };
    } catch { /* WS unavailable, mock will be used */ }
  }

  private static disconnectWebSocket() {
    if (this.wsReconnectTimer) { clearTimeout(this.wsReconnectTimer); this.wsReconnectTimer = null; }
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
  }

  static enableTrails(enabled: boolean) { this.trailEnabled = enabled; }
  static getTrailEnabled() { return this.trailEnabled; }

  static acknowledgeAlert(vehicleId: string, alertId: string, by = 'system') {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    const alert = vehicle?.alerts.find(a => a.id === alertId);
    if (alert) { alert.acknowledged = true; alert.acknowledgedBy = by; alert.acknowledgedAt = Date.now(); }
  }

  static cleanup() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.disconnectWebSocket();
    this.callbacks.clear();
  }

  private static simulateMovement() {
    this.vehicles = this.vehicles.map(v => {
      if (v.status !== 'ON_ROUTE' && v.status !== 'WARNING') return { ...v, trail: this.trailEnabled ? v.trail : [] };
      const headingDelta = (Math.random() - 0.5) * 20;
      const newHeading = (v.position.heading + headingDelta + 360) % 360;
      const speedVariation = v.telemetry.speed * (0.85 + Math.random() * 0.3);
      const speed = Math.max(0, Math.round(speedVariation));
      const distPerTick = speed * 3000 / 3600;
      const latDelta = distPerTick * Math.cos(newHeading * Math.PI / 180) / 111000;
      const lngDelta = distPerTick * Math.sin(newHeading * Math.PI / 180) / (111000 * Math.cos(v.position.lat * Math.PI / 180));
      const newLat = v.position.lat + latDelta;
      const newLng = v.position.lng + lngDelta;
      const newPoint: GeoPoint = { lat: newLat, lng: newLng, speed, heading: Math.round(newHeading), accuracy: 3 + Math.random() * 5, timestamp: Date.now() };
      const progress = Math.min(100, v.route.progress + (Math.random() * 0.5));
      return {
        ...v, status: speed > 10 && v.status === 'WARNING' ? 'WARNING' : v.status,
        position: newPoint,
        telemetry: { ...v.telemetry, speed, heading: Math.round(newHeading), rpm: speed > 0 ? 1500 + Math.round(speed * 18) : 0, fuelConsumption: speed > 0 ? 10 + Math.random() * 5 : 0, engineTemp: speed > 0 ? 85 + Math.random() * 8 : 45 },
        route: { ...v.route, progress, remainingDistance: Math.max(0, v.route.totalDistance * (100 - progress) / 100), completedStops: Math.floor(progress / (100 / v.route.stopCount)), remainingDuration: Math.max(0, v.route.totalDuration * (100 - progress) / 100) },
        trail: this.trailEnabled ? [...v.trail.slice(-100), { ...newPoint, snapToRoad: true }] : v.trail,
        lastUpdated: Date.now(),
      };
    });
    this.notify();
  }

  private static notify() {
    const snapshot = this.getVehicles();
    this.callbacks.forEach(cb => { try { cb(snapshot); } catch { /* ignore */ } });
  }
}
