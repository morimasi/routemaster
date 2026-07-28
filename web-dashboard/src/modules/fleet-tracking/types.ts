export type VehicleStatus = 'ON_ROUTE' | 'WARNING' | 'STANDBY' | 'OFFLINE' | 'IDLE' | 'BREAK' | 'COMPLETED';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'cng' | 'lpg';

export interface GeoPoint {
  lat: number;
  lng: number;
  alt?: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export interface VehicleTelemetry {
  speed: number;
  heading: number;
  rpm: number;
  fuelLevel: number;
  fuelConsumption: number;
  engineTemp: number;
  batteryVoltage: number;
  odometer: number;
  doorStatus: 'locked' | 'unlocked' | 'open';
  ignition: boolean;
  tirePressure: number[];
  lastMaintenanceKm: number;
}

export interface VehicleDriver {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  license: string;
  rating: number;
  totalTrips: number;
  totalHours: number;
  status: 'active' | 'break' | 'off_duty';
}

export interface VehicleRouteInfo {
  id: string;
  name: string;
  type: 'morning' | 'afternoon' | 'evening' | 'extra' | 'shuttle';
  progress: number;
  totalDistance: number;
  remainingDistance: number;
  totalDuration: number;
  remainingDuration: number;
  stopCount: number;
  completedStops: number;
  nextStop: string;
  nextStopEta: string;
  estimatedArrival: string;
}

export interface VehicleAlert {
  id: string;
  type: 'speeding' | 'off_route' | 'hard_brake' | 'hard_accel' | 'engine_fault' | 'maintenance' | 'door_open' | 'geofence' | 'idle' | 'emergency';
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  location?: GeoPoint;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export interface VehicleTrailPoint extends GeoPoint {
  snapToRoad: boolean;
}

export interface FleetVehicle {
  id: string;
  plate: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: FuelType;
  capacity: number;
  photo?: string;
  status: VehicleStatus;
  position: GeoPoint;
  telemetry: VehicleTelemetry;
  driver: VehicleDriver;
  route: VehicleRouteInfo;
  alerts: VehicleAlert[];
  trail: VehicleTrailPoint[];
  lastUpdated: number;
  tags: string[];
  groupId: string;
  zone: string;
}

export interface FleetGroup {
  id: string;
  name: string;
  color: string;
  vehicleCount: number;
  activeCount: number;
  alertCount: number;
  icon?: string;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  warningVehicles: number;
  totalDistanceToday: number;
  totalDurationToday: number;
  totalFuelUsed: number;
  avgSpeed: number;
  maxSpeed: number;
  completedRoutes: number;
  activeRoutes: number;
  alertsToday: number;
  criticalAlerts: number;
  fleetScore: number;
}

export interface FleetFilter {
  status: VehicleStatus[];
  groups: string[];
  search: string;
  sortBy: 'plate' | 'speed' | 'status' | 'progress' | 'fuel' | 'alerts';
  sortOrder: 'asc' | 'desc';
  showAlertsOnly: boolean;
  showTrails: boolean;
}

export const DEFAULT_FLEET_FILTER: FleetFilter = {
  status: [],
  groups: [],
  search: '',
  sortBy: 'status',
  sortOrder: 'asc',
  showAlertsOnly: false,
  showTrails: false,
};

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  ON_ROUTE: { label: 'Seferde', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/30', dotColor: 'bg-emerald-400' },
  WARNING: { label: 'Uyarı', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30', dotColor: 'bg-amber-400' },
  STANDBY: { label: 'Beklemede', color: 'text-slate-400', bgColor: 'bg-slate-500/15 border-slate-500/30', dotColor: 'bg-slate-400' },
  OFFLINE: { label: 'Çevrimdışı', color: 'text-red-400', bgColor: 'bg-red-500/15 border-red-500/30', dotColor: 'bg-red-400' },
  IDLE: { label: 'Rölanti', color: 'text-yellow-400', bgColor: 'bg-yellow-500/15 border-yellow-500/30', dotColor: 'bg-yellow-400' },
  BREAK: { label: 'Mola', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/30', dotColor: 'bg-blue-400' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-green-400', bgColor: 'bg-green-500/15 border-green-500/30', dotColor: 'bg-green-400' },
};

export const ALERT_ICONS: Record<VehicleAlert['type'], string> = {
  speeding: '🚀',
  off_route: '🛤️',
  hard_brake: '🛑',
  hard_accel: '⚡',
  engine_fault: '🔧',
  maintenance: '🛠️',
  door_open: '🚪',
  geofence: '📍',
  idle: '⏸️',
  emergency: '🆘',
};

export const ALERT_LABELS: Record<VehicleAlert['type'], string> = {
  speeding: 'Hız İhlali',
  off_route: 'Rota Dışı',
  hard_brake: 'Sert Fren',
  hard_accel: 'Sert Hızlanma',
  engine_fault: 'Motor Arızası',
  maintenance: 'Bakım Zamanı',
  door_open: 'Kapı Açık',
  geofence: 'Bölge Dışı',
  idle: 'Gereksiz Çalışma',
  emergency: 'Acil Durum',
};
