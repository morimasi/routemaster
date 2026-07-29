export interface AssignableVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
  driverName?: string;
}

export interface AssignableDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  rating: number;
  totalTrips: number;
  totalHours: number;
  status: string;
  currentVehicleId?: string;
  currentVehiclePlate?: string;
}

export interface AssignmentResult {
  status: string;
  driver_id: string;
  confidence: number;
  reason: string;
  assigned_at?: number;
}

export interface ActiveAssignment {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  confidence: number;
  reason: string;
  assignedAt: number;
  status: string;
}

export interface HistoryEntry {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  confidence: number;
  reason: string;
  assignedAt: number;
  revokedAt?: number;
  status: 'active' | 'revoked';
}

export interface MatchSuggestion {
  driverId: string;
  driverName: string;
  driverRating: number;
  driverTotalTrips: number;
  driverStatus: string;
  confidence: number;
  reason: string;
  score: number;
}

export interface AssignmentAnalytics {
  totalAssignments: number;
  activeAssignments: number;
  revokedToday: number;
  avgConfidence: number;
  avgDriverRating: number;
  assignmentsByDay: { date: string; count: number }[];
  topDrivers: { id: string; name: string; count: number; avgRating: number }[];
}

export interface AssignmentFilters {
  driverId?: string;
  vehicleId?: string;
  from?: number;
  to?: number;
  status?: 'active' | 'revoked' | 'all';
}

export interface AssignmentConfig {
  autoAssign: boolean;
  ratingWeight: number;
  proximityWeight: number;
  workloadWeight: number;
  minConfidence: number;
  notifyOnAssign: boolean;
  notifyOnRevoke: boolean;
}
