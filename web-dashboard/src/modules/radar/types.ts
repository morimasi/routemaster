export interface VehiclePosition {
  id: string;
  plate: string;
  route: string;
  lat: number;
  lng: number;
  speed: number;
  driver: string;
  driverPhone?: string;
  driverRating?: number;
  status: 'ON_ROUTE' | 'WARNING' | 'STANDBY' | 'IDLE' | 'BREAK' | 'OFFLINE';
  fuelLevel?: number;
  heading?: number;
  capacity?: number;
  model?: string;
  brand?: string;
  lastUpdated?: number;
  trail?: { lat: number; lng: number; speed: number; heading: number; timestamp: number }[];
  stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  seq: number;
  studentName: string;
  stopName: string;
  address?: string;
  lat: number;
  lng: number;
  status: 'PASSED' | 'CURRENT' | 'PENDING';
  eta?: string;
  phone?: string;
  boarded?: boolean;
}

export interface RadarRoute {
  id: string;
  name: string;
  vehiclePlate: string;
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  status: 'ACTIVE' | 'WARNING' | 'SCHEDULED' | 'COMPLETED';
  alertsCount: number;
  progressPercent: number;
  nodes: RadarRouteNode[];
  totalDistance?: number;
  remainingDistance?: number;
  estimatedDuration?: number;
  startTime?: string;
  endTime?: string;
  type?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'EXTRA';
}

export interface RadarRouteNode {
  id: string;
  seq: number;
  studentName: string;
  stopName: string;
  status: 'PASSED' | 'CURRENT' | 'PENDING';
  eta?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  address?: string;
}

export interface FleetSummary {
  totalVehicles: number;
  activeVehicles: number;
  warningVehicles: number;
  standbyVehicles: number;
  offlineVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
}

export interface OptimizationResult {
  status: string;
  solver_execution_time_ms: number;
  fuel_saved_percent: number;
  total_distance_reduced_km: number;
  optimized_routes: {
    vehicle_id: string;
    assigned_nodes_count: number;
    estimated_fuel_saved_percent: number;
  }[];
}

export interface VehicleDetail {
  id: string;
  plate: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  fuelType?: string;
  capacity?: number;
  status: string;
  position?: { lat: number; lng: number; speed: number; heading: number; timestamp: number };
  telemetry: { speed: number; heading: number; fuelLevel: number; odometer: number };
  driver?: { id: string; name: string; phone: string; rating: number; totalTrips: number; status: string };
  tags?: string[];
  route?: { id: string; name: string; status: string; progressPercent: number };
}
