export interface RouteNode {
  id: string;
  studentName: string;
  address: string;
  lat: number;
  lng: number;
  stopSequence: number;
  estimatedArrival: string;
  phone?: string;
  note?: string;
  timeWindow?: { start: string; end: string };
}

export interface OptimizedRoute {
  vehiclePlate: string;
  vehicleId: string;
  driverName: string;
  driverPhone?: string;
  driverRating?: number;
  nodeCount: number;
  totalDistanceKm: number;
  estimatedDurationMin: number;
  fuelSavedPercent: number;
  fuelSavedLiters?: number;
  co2ReducedKg?: number;
  nodes: RouteNode[];
  polyline?: [number, number][];
  status?: 'optimal' | 'feasible' | 'constraint_violation';
}

export interface OptimizationRun {
  id: string;
  timestamp: number;
  solverTimeMs: number;
  fuelSavedPercent: number;
  distanceReducedKm: number;
  routeCount: number;
  totalNodes: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  constraints?: OptimizationConstraints;
  beforeStats?: FleetStats;
  afterStats?: FleetStats;
}

export interface FleetStats {
  totalDistanceKm: number;
  totalDurationMin: number;
  totalFuelLiters: number;
  totalCo2Kg: number;
  avgVehicleUtilization: number;
}

export interface OptimizationConstraints {
  maxStopsPerRoute: number;
  maxDistancePerRouteKm: number;
  maxDurationPerRouteMin: number;
  considerTraffic: boolean;
  considerTimeWindows: boolean;
  balancedLoad: boolean;
  prioritizeDriverPreference: boolean;
}

export interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  capacity: number;
  status: string;
  driverName: string;
  driverPhone?: string;
  driverRating?: number;
  lat: number;
  lng: number;
  fuelLevel?: number;
  selected?: boolean;
}
