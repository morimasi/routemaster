export interface FleetVehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  driverId?: string;
  phone: string;
  status: 'ON_ROUTE' | 'WARNING' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';
  capacity: string;
  fuelLevel: number;
  rating: number;
  lastMaintenanceDate?: string;
  totalKm?: number;
}

export interface FleetDriver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  rating: number;
  totalTrips: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}
