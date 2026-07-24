export interface VehiclePosition {
  id: string;
  plate: string;
  route: string;
  x: number;
  y: number;
  speed: number;
  driver: string;
  status: 'ON_ROUTE' | 'WARNING' | 'STANDBY';
}

export interface RadarRoute {
  id: string;
  name: string;
  vehiclePlate: string;
  status: 'ACTIVE' | 'WARNING' | 'SCHEDULED' | 'COMPLETED';
  alertsCount: number;
  progressPercent: number;
  nodes: RadarRouteNode[];
}

export interface RadarRouteNode {
  id: string;
  seq: number;
  studentName: string;
  stopName: string;
  status: 'PASSED' | 'CURRENT' | 'PENDING';
  eta?: string;
}
