import express from 'express';
import cors from 'cors';
import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, connectDB } from './src/db.js';
import { setupWebSocket, broadcastVehiclePosition } from './src/ws.js';
import { startSimulation, stopSimulation, runSimulationTick } from './src/simulation.js';
import {
  dashboardStats, trafficData, systemLogs, aiPredictions, systemHealth,
  vehiclePositions, fleet, fleetVehicles, drivers,
  subscriptionPlan, usageMetrics, invoices, paymentMethod,
  documents, institutionProfile, securityConfig, webhookConfig,
} from './src/data.js';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'shuttlex-premium-jwt-secret-2026';
const DB_MODE = process.env.DB_MODE !== 'mock';

// ── Auth ──────────────────────────────────────────────────────
app.post('/api/v5/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email ve şifre gerekli' }); return; }
  try {
    if (DB_MODE) {
      const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Geçersiz kimlik bilgileri' }); return;
      }
      const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant: user.tenant.name } });
    } else {
      if (email === 'admin@shuttlex.com' && password === 'ShuttleX2026!') {
        const token = jwt.sign({ userId: 'u-admin', tenantId: 't-1001', role: 'SYSTEM_ADMIN', name: 'Sistem Yöneticisi' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: 'u-admin', name: 'Sistem Yöneticisi', email, role: 'SYSTEM_ADMIN', tenant: 'Kavacık Koleji' } });
      } else if (email === 'parent@shuttlex.com' && password === 'Veli2026!') {
        const token = jwt.sign({ userId: 'p-9001', tenantId: 't-1001', role: 'PARENT', name: 'Veli Kullanıcı' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: 'p-9001', name: 'Ahmet Altunel', email, role: 'PARENT', tenant: 'Kavacık Koleji' } });
      } else if (email === 'driver@shuttlex.com' && password === 'Driver2026!') {
        const token = jwt.sign({ userId: 'd-5001', tenantId: 't-1001', role: 'DRIVER', name: 'Mehmet Şahin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: 'd-5001', name: 'Mehmet Şahin', email, role: 'DRIVER', tenant: 'Kavacık Koleji' } });
      } else {
        res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
      }
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v5/auth/register', async (req, res) => {
  const { email, password, name, role, tenantId } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { tenantId: tenantId || 't-1001', email, password: hash, name, role: role || 'PLANNER' },
    });
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET) as any; next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Live Radar (WebSocket-powered real-time) ──────────────────
app.get('/api/v5/radar/positions', async (_req, res) => {
  try {
    if (DB_MODE) {
      if (process.env.VERCEL) await runSimulationTick();
      const vehicles = await prisma.vehicle.findMany({
        include: { position: true, driver: { select: { name: true } }, routes: { select: { name: true }, take: 1 } },
      });
      res.json(vehicles.map(v => ({
        id: v.id, plate: v.plate,
        lat: v.position?.lat ?? 41.092, lng: v.position?.lng ?? 29.088,
        speed: v.position?.speed ?? 0, driver: v.driver?.name ?? 'Atanmamış', status: v.status,
        route: v.routes[0]?.name ?? 'Rota yok',
      })));
    } else res.json(vehiclePositions);
  } catch { res.json(vehiclePositions); }
});

app.get('/api/v5/radar/routes', async (_req, res) => {
  try {
    if (DB_MODE) {
      const routes = await prisma.route.findMany({ include: { vehicle: true } });
      res.json(routes.map(r => ({
        id: r.id, name: r.name, vehiclePlate: r.vehicle?.plate ?? '—',
        status: r.status, alertsCount: 0, progressPercent: r.progressPercent,
      })));
    } else res.json([
      { id: 'r1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65 },
      { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 2, progressPercent: 40 },
      { id: 'r3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10 },
    ]);
  } catch { res.json([]); }
});

// ── Fleet ─────────────────────────────────────────────────────
app.get('/api/v5/fleet', async (_req, res) => {
  try {
    if (DB_MODE) {
      const vehicles = await prisma.vehicle.findMany({ include: { driver: true } });
      res.json(vehicles.map(v => ({
        id: v.id, plate: v.plate, model: `${v.brand ?? ''} ${v.model ?? ''}`.trim() || 'Bilinmiyor',
        driver: v.driver?.name ?? 'Atanmamış', phone: v.driver?.phone ?? '',
        status: v.status, fuelLevel: Math.floor(Math.random() * 60 + 30),
        rating: v.driver?.rating ?? 5.0, totalKm: Math.floor(Math.random() * 50000),
      })));
    } else res.json(fleet);
  } catch { res.json(fleet); }
});
app.post('/api/v5/fleet', async (req, res) => {
  try {
    if (DB_MODE) {
      const vehicles = await prisma.vehicle.findMany({ include: { driver: true } });
      res.json(vehicles.map(v => ({
        id: v.id, plate: v.plate, model: `${v.brand ?? ''} ${v.model ?? ''}`.trim() || 'Bilinmiyor',
        driver: v.driver?.name ?? 'Atanmamış', phone: v.driver?.phone ?? '',
        status: v.status, fuelLevel: Math.floor(Math.random() * 60 + 30),
        rating: v.driver?.rating ?? 5.0, totalKm: Math.floor(Math.random() * 50000),
      })));
    } else res.json(fleet);
  } catch { res.json(fleet); }
});

app.get('/api/v5/fleet/drivers', async (_req, res) => {
  try {
    if (DB_MODE) {
      const d = await prisma.driver.findMany();
      res.json(d.map(dd => ({ id: dd.id, name: dd.name, phone: dd.phone, licenseNumber: dd.licenseNumber, rating: dd.rating, totalTrips: dd.totalTrips, status: dd.status })));
    } else res.json(drivers);
  } catch { res.json(drivers); }
});
app.post('/api/v5/fleet/drivers', async (_req, res) => {
  try {
    if (DB_MODE) {
      const d = await prisma.driver.findMany();
      res.json(d.map(dd => ({ id: dd.id, name: dd.name, phone: dd.phone, licenseNumber: dd.licenseNumber, rating: dd.rating, totalTrips: dd.totalTrips, status: dd.status })));
    } else res.json(drivers);
  } catch { res.json(drivers); }
});

app.post('/api/v5/fleet/vehicles', async (req, res) => {
  try {
    if (DB_MODE) {
      const vehicles = await prisma.vehicle.findMany({ include: { driver: true, position: true, tags: true } });
      res.json({ tenant_id: req.body?.tenant_id || 't-1001', vehicles: vehicles.map(v => ({
        id: v.id, plate: v.plate, vin: v.vin, brand: v.brand, model: v.model, year: v.year,
        color: v.color, fuelType: v.fuelType, capacity: v.capacity, status: v.status,
        position: v.position ? { lat: v.position.lat, lng: v.position.lng, speed: v.position.speed, heading: v.position.heading, accuracy: v.position.accuracy, timestamp: v.position.timestamp.getTime() } : null,
        telemetry: { speed: v.position?.speed ?? 0, heading: v.position?.heading ?? 0, fuelLevel: Math.floor(Math.random() * 60 + 30), odometer: Math.floor(Math.random() * 50000) },
        driver: v.driver ? { id: v.driver.id, name: v.driver.name, phone: v.driver.phone, rating: v.driver.rating, totalTrips: v.driver.totalTrips, status: v.driver.status } : null,
        tags: v.tags.map(t => t.tag),
      })), total: vehicles.length });
    } else res.json({ tenant_id: 't-1001', vehicles: fleetVehicles, total: fleetVehicles.length });
  } catch { res.json({ tenant_id: 't-1001', vehicles: fleetVehicles, total: fleetVehicles.length }); }
});

app.post('/api/v5/fleet/vehicle', async (req, res) => {
  try {
    if (DB_MODE) {
      const { plate, model, brand, capacity } = req.body;
      const v = await prisma.vehicle.create({
        data: { tenantId: req.user?.tenantId || 't-1001', plate: plate || 'YENİ', model, brand, capacity: capacity ? parseInt(capacity) : 16, status: 'STANDBY' },
      });
      res.json({ status: 'CREATED', vehicle_id: v.id });
    } else res.json({ status: 'CREATED', vehicle_id: `v_${Date.now()}` });
  } catch { res.json({ status: 'CREATED', vehicle_id: `v_${Date.now()}` }); }
});

app.post('/api/v5/fleet/ai-assign', (_req, res) => {
  res.json({ status: 'ASSIGNED', driver_id: `d_ai_${Date.now()}`, confidence: 0.94, reason: 'Optimum sürücü-rota eşleşmesi' });
});

// ── Parent Module ─────────────────────────────────────────────
app.get('/api/v5/parent/children', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  const parentId = req.query.parent_id as string;
  try {
    if (DB_MODE && parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: { students: { include: { student: true } } },
      });
      if (parent) {
        res.json(parent.students.map(sp => ({
          id: sp.student.id, name: sp.student.name, grade: sp.student.grade,
          photo: sp.student.photo, attendanceRate: sp.student.attendanceRate,
          address: sp.student.address, lat: sp.student.lat, lng: sp.student.lng,
        })));
        return;
      }
    }
    res.json([
      { id: 's-eymen', name: 'Eymen Altunel', grade: '4-B', attendanceRate: 0.95, address: 'Cumhuriyet Mah. 4. Sok No:12, Kavacık', lat: 41.095, lng: 29.098 },
      { id: 's-zeynep', name: 'Zeynep Altunel', grade: 'Anaokulu K-1', attendanceRate: 0.90, address: 'Okul Ana Girişi', lat: 41.092, lng: 29.088 },
    ]);
  } catch { res.json([]); }
});

app.get('/api/v5/parent/route', async (req, res) => {
  const studentId = req.query.student_id as string;
  const vehicle = fleetVehicles.find(v => v.id === (studentId === 's-eymen' ? 'v1' : 'v2'));
  res.json(vehicle ? {
    vehicle: { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, lat: vehicle.position.lat, lng: vehicle.position.lng, speed: vehicle.telemetry.speed, status: vehicle.status },
    driver: vehicle.driver,
    route: vehicle.route,
    alerts: vehicle.alerts,
  } : null);
});

app.get('/api/v5/parent/vehicle-position', async (req, res) => {
  const { vehicle_id } = req.query;
  try {
    if (DB_MODE) {
      if (process.env.VERCEL) await runSimulationTick();
      const pos = await prisma.position.findUnique({ where: { vehicleId: vehicle_id as string } });
      res.json(pos ? { lat: pos.lat, lng: pos.lng, speed: pos.speed, heading: pos.heading, timestamp: pos.timestamp.getTime() } : null);
    } else {
      const v = fleetVehicles.find(v => v.id === vehicle_id);
      res.json(v ? { lat: v.position.lat, lng: v.position.lng, speed: v.telemetry.speed, heading: v.position.heading, timestamp: Date.now() } : null);
    }
  } catch { res.json(null); }
});

app.post('/api/v5/parent/flag-absence', (req, res) => {
  res.json({ status: 'FLAGGED', node_id: req.body.node_id, driver_hud_alert: 'ALERT_ORANGE' });
});

app.post('/api/v5/parent/rate-driver', (req, res) => {
  res.json({ status: 'RATED', rating: req.body.rating });
});

app.get('/api/v5/parent/attendance', (_req, res) => {
  res.json({ totalDays: 20, present: 18, absent: 2, rate: 0.90, monthly: [
    { week: '1. Hafta', rate: 1.0 }, { week: '2. Hafta', rate: 0.8 },
    { week: '3. Hafta', rate: 1.0 }, { week: '4. Hafta', rate: 0.8 },
  ]});
});

app.get('/api/v5/parent/alerts', (_req, res) => {
  res.json([
    { id: 'a1', type: 'arrival', message: 'Eymen okula vardı', time: '08:45', severity: 'info' },
    { id: 'a2', type: 'departure', message: 'Servis okuldan ayrıldı', time: '15:30', severity: 'info' },
  ]);
});

app.get('/api/v5/parent/announcements', (_req, res) => {
  res.json([
    { id: 'n1', title: 'Yarıyıl Tatili', text: 'Okul 15 Ocak-2 Şubat arası kapalı olacaktır.', date: '10 Oca 2026', important: true },
    { id: 'n2', title: 'Veli Toplantısı', text: 'Dönem sonu veli toplantısı 25 Aralık saat 18:00\'de.', date: '20 Ara 2026', important: false },
  ]);
});

// ── Dashboard ────────────────────────────────────────────────
app.get('/api/v5/dashboard/stats', (_req, res) => res.json(dashboardStats));
app.get('/api/v5/dashboard/traffic', (_req, res) => res.json(trafficData));
app.get('/api/v5/dashboard/logs', (_req, res) => res.json(systemLogs));
app.get('/api/v5/dashboard/ai-predictions', (_req, res) => res.json(aiPredictions));
app.get('/api/v5/dashboard/system-health', (_req, res) => res.json(systemHealth));
app.post('/api/v5/dashboard/logs/resolve', (req, res) => {
  const { log_id } = req.body;
  const idx = systemLogs.findIndex((l: any) => l.id === log_id);
  if (idx !== -1) systemLogs[idx].status = 'RESOLVED';
  res.json({ status: 'RESOLVED' });
});

// ── Route Optimization ────────────────────────────────────────
app.post('/api/v5/routes/multi-optimize', (req, res) => {
  const { fleet: f } = req.body;
  res.json({
    status: 'SUCCESS_SIMULATED', solver_execution_time_ms: 412, fuel_saved_percent: 19.2,
    total_distance_reduced_km: 14.3,
    optimized_routes: (f || []).map((v: any) => ({ vehicle_id: v.id, assigned_nodes_count: 6, estimated_fuel_saved_percent: 19.2 })),
  });
});

app.post('/api/v5/routes/node/driver-prune', (req, res) => {
  res.json({ status: 'PRUNED', node_id: req.body.node_id, recalculated_eta_ms: 380, message: 'Düğüm grafikten budandı.' });
});

app.post('/api/v5/routes/node/flag-absence', (req, res) => {
  res.json({ status: 'FLAGGED', node_id: req.body.node_id, driver_hud_alert: 'ALERT_ORANGE' });
});

app.post('/api/v5/routes/generate-from-nodes', (_req, res) => {
  res.json({ status: 'ROUTE_GENERATED', route_id: `ai_route_${Date.now()}`, total_distance_km: 24.5, estimated_duration_min: 45 });
});

// ── Billing ──────────────────────────────────────────────────
app.get('/api/v5/billing/subscription', (_req, res) => res.json(subscriptionPlan));
app.get('/api/v5/billing/usage', (_req, res) => res.json(usageMetrics));
app.get('/api/v5/billing/invoices', (_req, res) => res.json(invoices));
app.get('/api/v5/billing/payment-method', (_req, res) => res.json(paymentMethod));

// ── Documents ────────────────────────────────────────────────
app.get('/api/v5/documents', (_req, res) => res.json(documents));
app.post('/api/v5/documents/upload', (req, res) => {
  const newDoc = { id: `d_${Date.now()}`, name: req.body.name || 'Yeni Belge.pdf', type: 'pdf', size: req.body.size || '0 B', date: 'Az önce', status: 'processing' as const };
  documents.unshift(newDoc as any);
  res.json({ status: 'UPLOADED', document: newDoc });
});
app.delete('/api/v5/documents/:id', (req, res) => {
  const idx = documents.findIndex((d: any) => d.id === req.params.id);
  if (idx !== -1) documents.splice(idx, 1);
  res.json({ status: 'DELETED' });
});

// ── OCR ──────────────────────────────────────────────────────
app.post('/api/v5/ocr/analyze', (_req, res) => {
  res.json([
    { id: 1, address: 'Atatürk Cad. No:14/A, Kavacık', confidence: 0.98, student: 'Ahmet Yılmaz', geo: '41.0921, 29.0945' },
    { id: 2, address: 'Cumhuriyet Mah. 4. Sok No:12', confidence: 0.95, student: 'Eymen Altunel', geo: '41.0950, 29.0980' },
    { id: 3, address: 'Deniz Evleri B Blok, Çubuklu', confidence: 0.88, student: 'Can Demir', geo: '41.0988, 29.1012' },
    { id: 4, address: 'Gül Apt. D:8, Anadolu Hisarı', confidence: 0.93, student: 'Zeynep Kaya', geo: '41.0860, 29.0830' },
  ]);
});

// ── Voice ────────────────────────────────────────────────────
app.post('/api/v5/voice/intent', (req, res) => {
  const phrase = (req.body.spoken_phrase || '').toLowerCase();
  const action = phrase.includes('atla') || phrase.includes('prune') ? 'EXECUTE_PRUNE'
    : phrase.includes('bindi') || phrase.includes('tamamla') ? 'MARK_BOARDED' : 'UNKNOWN';
  res.json({ status: 'PARSED', spoken_phrase: req.body.spoken_phrase, resolved_intent: { action, confidence_score: 0.96 } });
});

// ── Chat ─────────────────────────────────────────────────────
app.post('/api/v5/chat/room/init', (req, res) => {
  res.json({ status: 'INITIALIZED', room_id: `room_${req.body.tenant_id}_${Date.now()}`, encryption: 'ECDH_AES_GCM' });
});
app.post('/api/v5/chat/message', (req, res) => {
  res.json({ status: 'DELIVERED', message_id: `msg_${Date.now()}` });
});

// ── Settings ─────────────────────────────────────────────────
app.get('/api/v5/tenant/settings', (_req, res) => res.json({ ...institutionProfile, ...securityConfig, ...webhookConfig }));
app.post('/api/v5/tenant/settings', (req, res) => res.json({ status: 'SAVED', tenant_id: req.body.tenant_id || 't-1001' }));

// ── Analytics ────────────────────────────────────────────────
app.get('/api/v5/analytics/attendance', (_req, res) => res.json({ total_students: 248, avg_attendance_rate: 0.946, absences_today: 14, peak_absence_day: 'Pazartesi' }));

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'healthy', version: '5.0.0', uptime: process.uptime() }));

// ── Error Handler ────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start ────────────────────────────────────────────────────
const port = process.env.PORT || 4000;

async function start() {
  if (DB_MODE) await connectDB();
  setupWebSocket(server);
  startSimulation();

  server.listen(port, () => {
    console.log(`ShuttleX Premium API running on http://localhost:${port}`);
    console.log(`  Mode: ${DB_MODE ? 'REAL DATABASE' : 'MOCK DATA'}`);
    console.log(`  WebSocket: ws://localhost:${port}/ws`);
  });
}

if (!process.env.VERCEL) start();

process.on('SIGTERM', () => { stopSimulation(); server.close(); });
process.on('SIGINT', () => { stopSimulation(); server.close(); });

export default app;
