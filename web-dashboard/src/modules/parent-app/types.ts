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

export interface ChildInfo {
  id: string; name: string; grade: string; photo?: string;
  attendanceRate: number; address?: string; lat?: number; lng?: number;
}

export interface VehicleInfo {
  plate: string; brand: string; model: string;
  lat: number; lng: number; speed: number; status: string;
}

export interface DriverInfo {
  id: string; name: string; phone: string; rating: number; totalTrips: number; photo?: string;
}

export interface RouteInfo {
  id: string; name: string; progress: number; totalDistance: number; remainingDistance: number;
  stopCount: number; completedStops: number; nextStop: string; nextStopEta: string;
  estimatedArrival: string;
}

export interface AlertInfo {
  id: string; type: string; message: string; time: string; severity: string;
}

export interface Announcement {
  id: string; title: string; text: string; date: string; important: boolean;
}

export interface AttendanceData {
  totalDays: number; present: number; absent: number; rate: number;
  monthly: { week: string; rate: number }[];
}
