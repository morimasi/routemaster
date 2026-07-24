export interface DashboardStats {
  activeVehicles: { current: number; total: number; inMaintenance: number };
  studentsTransported: number;
  aiFuelSaving: number;
  systemSla: number;
  telemetryLatencyMs: number;
}

export interface TrafficDataPoint {
  hour: string;
  value: number;
  peak: boolean;
}

export interface SystemLogEntry {
  id: number;
  text: string;
  time: string;
  status: 'ACTIVE' | 'RESOLVED';
  severity: 'warning' | 'success' | 'info';
}

export interface AIPrediction {
  id: string;
  title: string;
  value: string;
  description: string;
  confidence: number;
  type: 'fuel' | 'delay' | 'attendance' | 'maintenance';
  trend: 'up' | 'down' | 'stable';
}

export interface SystemHealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  uptime: string;
}
