// ShuttleX Enterprise Suite v5.0 — Domain Model Types

export type Role = 'SYSTEM_ADMIN' | 'PLANNER' | 'DRIVER' | 'TEACHER' | 'PARENT';

export type RouteStatus = 'ACTIVE' | 'WARNING' | 'SCHEDULED' | 'COMPLETED';

export type NodeStatus = 'PASSED' | 'CURRENT' | 'PENDING' | 'SKIPPED_BY_DRIVER';

export interface Location {
  lat: number;
  lng: number;
}

export interface RouteNode {
  id: string;
  studentId?: string;
  studentName: string;
  stopName: string;
  seq: number;
  status: NodeStatus;
  absenceFlagged: boolean;
  absenceNote?: string;
  driverAcknowledgmentStatus?: 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'PRUNED';
  location?: Location;
  updatedAt?: string;
}

export interface Route {
  id: string;
  name: string;
  vehiclePlate: string;
  vehicleModel?: string;
  status: RouteStatus;
  alertsCount: number;
  driverName?: string;
  nodes: RouteNode[];
  progressPercent: number;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  phone: string;
  status: 'ON_ROUTE' | 'WARNING' | 'STANDBY' | 'MAINTENANCE';
  capacity: string;
  fuelLevel: number;
  batteryStatus?: string;
  rating: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  text: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  resolved?: boolean;
}

export interface TelemetryFrame {
  tenantId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestampUtc: number;
  isOfflineBuffered: boolean;
}

export interface ChatMessage {
  id: string | number;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

export interface DocumentAINode {
  id: number | string;
  address: string;
  confidence: number;
  student: string;
  geo: string;
}
