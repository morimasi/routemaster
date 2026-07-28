export interface AssignableVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
}

export interface AssignableDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  rating: number;
  totalTrips: number;
  status: string;
  currentVehicleId?: string;
}

export interface AssignmentResult {
  status: string;
  driver_id: string;
  confidence: number;
  reason: string;
}

export interface DriverAssignment {
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  confidence: number;
  reason: string;
  assignedAt: number;
}
