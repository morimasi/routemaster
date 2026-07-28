const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function get<T>(url: string, params?: Record<string, string>): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}${params ? '?' + new URLSearchParams(params) : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return Promise.resolve({} as T);
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return Promise.resolve({} as T);
  }
}

export const ParentApi = {
  getChildren: (tenantId: string, parentId?: string) =>
    get<any[]>('/api/v5/parent/children', { tenant_id: tenantId, ...(parentId ? { parent_id: parentId } : {}) }),

  getRoute: (studentId: string) => get<any>('/api/v5/parent/route', { student_id: studentId }),

  getVehiclePosition: (vehicleId: string) =>
    get<{ lat: number; lng: number; speed: number; heading: number; timestamp: number } | null>('/api/v5/parent/vehicle-position', { vehicle_id: vehicleId }),

  flagAbsence: (tenantId: string, nodeId: string, reason: string) =>
    post<any>('/api/v5/parent/flag-absence', { tenant_id: tenantId, node_id: nodeId, reason }),

  rateDriver: (rating: number, driverId?: string) =>
    post('/api/v5/parent/rate-driver', { rating, driver_id: driverId }),

  getAttendance: (studentId: string) => get<any>('/api/v5/parent/attendance', { student_id: studentId }),

  getAlerts: (studentId: string) => get<any[]>('/api/v5/parent/alerts', { student_id: studentId }),

  getAnnouncements: (tenantId: string) => get<any[]>('/api/v5/parent/announcements', { tenant_id: tenantId }),

  initChat: (tenantId: string, parentId: string, teacherId: string) =>
    post('/api/v5/chat/room/init', { tenant_id: tenantId, sender_id: parentId, recipient_id: teacherId }),

  sendMessage: (roomId: string, text: string, senderId: string) =>
    post('/api/v5/chat/message', { room_id: roomId, text, sender_id: senderId }),
};
