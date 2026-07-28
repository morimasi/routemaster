export interface RouteNode {
  id: string;
  studentName: string;
  address: string;
  lat: number;
  lng: number;
  stopSequence: number;
  estimatedArrival: string;
}

export interface OptimizedRoute {
  vehiclePlate: string;
  vehicleId: string;
  driverName: string;
  nodeCount: number;
  totalDistanceKm: number;
  estimatedDurationMin: number;
  fuelSavedPercent: number;
  nodes: RouteNode[];
}

export interface OptimizationRun {
  id: string;
  timestamp: number;
  solverTimeMs: number;
  fuelSavedPercent: number;
  distanceReducedKm: number;
  routeCount: number;
  status: 'success' | 'failed';
}
