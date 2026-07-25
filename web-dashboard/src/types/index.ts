// ============================================================
// ShuttleX Enterprise Suite v5.0 — Comprehensive Domain Types
// ============================================================

export type Role = 'SYSTEM_ADMIN' | 'PLANNER' | 'DRIVER' | 'TEACHER' | 'PARENT';

export type RouteStatus = 'ACTIVE' | 'WARNING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type NodeStatus = 'PASSED' | 'CURRENT' | 'PENDING' | 'SKIPPED_BY_DRIVER';

export type VehicleStatus = 'ON_ROUTE' | 'WARNING' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

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
  absenceReason?: 'Ateş / Hastalık' | 'Ailevi İzin / Seyahat' | 'Özel Araçla Bırakılacak' | string;
  driverAcknowledgmentStatus?: 'PENDING_REVIEW' | 'ACKNOWLEDGED' | 'PRUNED';
  location?: Location;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
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
  driverId?: string;
  nodes: RouteNode[];
  progressPercent: number;
  totalDistance?: number;
  estimatedCompletionTime?: string;
  startedAt?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year?: number;
  driver: string;
  driverId?: string;
  phone: string;
  status: VehicleStatus;
  capacity: string;
  fuelLevel: number;
  rating: number;
  currentRouteId?: string;
  lastMaintenanceDate?: string;
  insuranceExpiry?: string;
  inspectionExpiry?: string;
  location?: Location;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry: string;
  rating: number;
  totalTrips: number;
  activeVehiclePlate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  profilePhoto?: string;
  hiredAt?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  address: string;
  routeId?: string;
  nodeId?: string;
  absenceToday: boolean;
  attendanceRate: number;
  photo?: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  text: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  severity?: AlertSeverity;
  resolved?: boolean;
  routeId?: string;
  vehicleId?: string;
}

export interface TelemetryFrame {
  tenantId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading?: number;
  timestampUtc: number;
  isOfflineBuffered: boolean;
  batteryVoltage?: number;
  engineTemp?: number;
}

export interface ChatMessage {
  id: string | number;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  encrypted?: boolean;
  delivered?: boolean;
  read?: boolean;
}

export interface DocumentAINode {
  id: number | string;
  address: string;
  confidence: number;
  student: string;
  geo: string;
}

export interface TenantSettings {
  institutionName: string;
  tenantId: string;
  webhookUrl: string;
  notificationEmail: string;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  rlsPolicyActive: boolean;
  kafkaTopicName: string;
  dbConnectionString?: string;
}

export interface BillingInvoice {
  id: string;
  date: string;
  amount: string;
  status: 'Ödendi' | 'Bekliyor' | 'Gecikmiş';
  pdfUrl?: string;
}

export interface KpiMetric {
  title: string;
  value: string;
  subtext: string;
  trend: string;
  trendPositive: boolean;
  color: string;
}

export interface HourlyTrafficBar {
  hour: string;
  value: number;
  peak?: boolean;
}
