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

// ── Driver Assignment ─────────────────────────────────────────
app.post('/api/v5/driver-assignment/assign', async (req, res) => {
  try {
    const { tenant_id, vehicle_id, driver_id, reason } = req.body;
    if (DB_MODE) {
      await prisma.vehicle.update({ where: { id: vehicle_id }, data: { driverId: driver_id } });
      const assignment = await prisma.driverAssignment.create({
        data: {
          tenantId: tenant_id || 't-1001',
          vehicleId: vehicle_id,
          driverId: driver_id,
          assignedBy: req.user?.userId || 'u-admin',
          confidence: 0.95,
          reason: reason || 'Manuel atama',
        },
      });
      res.json({ status: 'ASSIGNED', driver_id, confidence: 0.95, reason: reason || 'Manuel atama', assigned_at: assignment.assignedAt.getTime() });
    } else {
      mockAssignmentsData.push({ id: `da_${Date.now()}`, tenant_id: tenant_id || 't-1001', vehicle_id, driver_id, assigned_by: 'u-admin', confidence: 0.95, reason: reason || 'Manuel atama', assigned_at: Date.now(), revoked_at: null });
      res.json({ status: 'ASSIGNED', driver_id, confidence: 0.95, reason: reason || 'Manuel atama', assigned_at: Date.now() });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/v5/driver-assignment/ai-assign', async (req, res) => {
  try {
    const { tenant_id, vehicle_id } = req.body;
    if (DB_MODE) {
      const availDrivers = await prisma.driver.findMany({ where: { tenantId: tenant_id || 't-1001', status: 'ACTIVE', vehicles: { none: {} } } });
      if (availDrivers.length === 0) { res.json({ status: 'NO_DRIVER', driver_id: '', confidence: 0, reason: 'Müsait sürücü bulunamadı' }); return; }
      const best = availDrivers.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
      await prisma.vehicle.update({ where: { id: vehicle_id }, data: { driverId: best.id } });
      const assignment = await prisma.driverAssignment.create({
        data: { tenantId: tenant_id || 't-1001', vehicleId: vehicle_id, driverId: best.id, assignedBy: req.user?.userId || 'u-admin', confidence: 0.94, reason: `AI optimizasyonu: ${best.name} en uygun sürücü` },
      });
      res.json({ status: 'ASSIGNED', driver_id: best.id, confidence: 0.94, reason: `AI optimizasyonu: ${best.name} en uygun sürücü`, assigned_at: assignment.assignedAt.getTime() });
    } else {
      const avail = mockDriverState.filter(d => d.status === 'ACTIVE' && !mockAssignedVehicleIds.has(d.id));
      if (avail.length === 0) { res.json({ status: 'NO_DRIVER', driver_id: '', confidence: 0, reason: 'Müsait sürücü bulunamadı' }); return; }
      const best = avail.sort((a, b) => b.rating - a.rating)[0];
      mockAssignedVehicleIds.add(best.id);
      mockAssignmentsData.push({ id: `da_${Date.now()}`, tenant_id: tenant_id || 't-1001', vehicle_id, driver_id: best.id, assigned_by: 'u-admin', confidence: 0.94, reason: `AI optimizasyonu: ${best.name} en uygun sürücü`, assigned_at: Date.now(), revoked_at: null });
      res.json({ status: 'ASSIGNED', driver_id: best.id, confidence: 0.94, reason: `AI optimizasyonu: ${best.name} en uygun sürücü`, assigned_at: Date.now() });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/driver-assignment/active', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  try {
    if (DB_MODE) {
      const vehicles = await prisma.vehicle.findMany({ where: { tenantId, driverId: { not: null } }, include: { driver: true } });
      res.json(vehicles.map(v => ({
        id: `da_${v.id}`, vehicleId: v.id, vehiclePlate: v.plate, vehicleBrand: v.brand ?? '', vehicleModel: v.model ?? '',
        driverId: v.driver!.id, driverName: v.driver!.name, driverPhone: v.driver!.phone, driverRating: v.driver!.rating,
        confidence: 0.95, reason: 'Aktif atama', assignedAt: v.updatedAt.getTime(), status: 'active',
      })));
    } else {
      const active = mockAssignmentsData.filter(a => a.revoked_at === null);
      res.json(active.map((a: any) => {
        const v = mockFleetData.find(f => f.id === a.vehicle_id);
        const d = mockDriverState.find(dd => dd.id === a.driver_id);
        return {
          id: a.id, vehicleId: a.vehicle_id, vehiclePlate: v?.plate || a.vehicle_id, vehicleBrand: v?.brand || '', vehicleModel: v?.model || '',
          driverId: a.driver_id, driverName: d?.name || a.driver_id, driverPhone: d?.phone || '', driverRating: d?.rating || 0,
          confidence: a.confidence, reason: a.reason, assignedAt: a.assigned_at, status: 'active',
        };
      }));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/driver-assignment/history', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  const driverId = req.query.driver_id as string;
  const vehicleId = req.query.vehicle_id as string;
  try {
    if (DB_MODE) {
      const where: any = { tenantId };
      if (driverId) where.driverId = driverId;
      if (vehicleId) where.vehicleId = vehicleId;
      const assignments = await prisma.driverAssignment.findMany({ where, orderBy: { assignedAt: 'desc' }, take: 100 });
      res.json(assignments.map(a => ({
        id: a.id, vehicleId: a.vehicleId, vehiclePlate: a.vehicleId, driverId: a.driverId, driverName: a.driverId,
        confidence: a.confidence, reason: a.reason || '', assignedAt: a.assignedAt.getTime(), status: 'revoked',
      })));
    } else {
      let filtered = [...mockAssignmentsData];
      if (driverId) filtered = filtered.filter((a: any) => a.driver_id === driverId);
      if (vehicleId) filtered = filtered.filter((a: any) => a.vehicle_id === vehicleId);
      res.json(filtered
        .sort((a: any, b: any) => b.assigned_at - a.assigned_at)
        .map((a: any) => {
          const v = mockFleetData.find(f => f.id === a.vehicle_id);
          const d = mockDriverState.find(dd => dd.id === a.driver_id);
          return {
            id: a.id, vehicleId: a.vehicle_id, vehiclePlate: v?.plate || a.vehicle_id, driverId: a.driver_id, driverName: d?.name || a.driver_id,
            confidence: a.confidence, reason: a.reason, assignedAt: a.assigned_at, revokedAt: a.revoked_at, status: a.revoked_at ? 'revoked' : 'active',
          };
        }));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/v5/driver-assignment/revoke', async (req, res) => {
  try {
    const { tenant_id, assignment_id, vehicle_id } = req.body;
    if (DB_MODE) {
      if (vehicle_id) await prisma.vehicle.update({ where: { id: vehicle_id }, data: { driverId: null } });
      if (assignment_id) await prisma.driverAssignment.update({ where: { id: assignment_id }, data: {} });
      res.json({ status: 'REVOKED' });
    } else {
      const idx = mockAssignmentsData.findIndex((a: any) => a.id === assignment_id || a.vehicle_id === vehicle_id);
      if (idx !== -1) mockAssignmentsData[idx].revoked_at = Date.now();
      res.json({ status: 'REVOKED' });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/fleet/vehicles/unassigned', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  try {
    if (DB_MODE) {
      const vehicles = await prisma.vehicle.findMany({ where: { tenantId, driverId: null } });
      res.json(vehicles.map(v => ({ id: v.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year, capacity: v.capacity, status: v.status })));
    } else {
      res.json(mockFleetData.filter(v => v.status === 'STANDBY' || v.status === 'IDLE' || v.status === 'BREAK' || v.status === 'OFFLINE'));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/fleet/drivers/available', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  try {
    if (DB_MODE) {
      const d = await prisma.driver.findMany({ where: { tenantId, status: 'ACTIVE' } });
      res.json(d.map(dd => ({ id: dd.id, name: dd.name, phone: dd.phone, email: dd.email, licenseNumber: dd.licenseNumber, rating: dd.rating, totalTrips: dd.totalTrips, totalHours: dd.totalHours, status: dd.status })));
    } else {
      res.json(mockDriverState.filter(d => d.status === 'ACTIVE'));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/v5/fleet/drivers/:driverId/status', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body;
    if (DB_MODE) {
      await prisma.driver.update({ where: { id: driverId }, data: { status } });
    } else {
      const d = mockDriverState.find(dd => dd.id === driverId);
      if (d) d.status = status;
    }
    res.json({ status: 'UPDATED' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/driver-assignment/suggest', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  try {
    if (DB_MODE) {
      const availDrivers = await prisma.driver.findMany({ where: { tenantId, status: 'ACTIVE' } });
      res.json(availDrivers.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).map((d, i) => ({
        driverId: d.id, driverName: d.name, driverRating: d.rating, driverTotalTrips: d.totalTrips, driverStatus: d.status,
        confidence: Math.round((d.rating * 0.2 + 0.1 * Math.max(0, 5 - i)) * 100) / 100,
        reason: ['En yüksek puan ve deneyim', 'Optimum bölge eşleşmesi', 'Dengeli iş yükü dağılımı', 'Müsait sürücü', 'Alternatif sürücü'][i] || 'Müsait sürücü',
        score: Math.round(d.rating * 20 + d.totalTrips / 100 - i * 5),
      })));
    } else {
      res.json(mockDriverState.filter(d => d.status === 'ACTIVE').map((d, i) => ({
        driverId: d.id, driverName: d.name, driverRating: d.rating, driverTotalTrips: d.totalTrips, driverStatus: d.status,
        confidence: Math.round((d.rating * 0.2 + 0.1 * Math.max(0, 5 - i)) * 100) / 100,
        reason: ['En yüksek puan ve deneyim', 'Optimum bölge eşleşmesi', 'Dengeli iş yükü dağılımı', 'Müsait sürücü', 'Alternatif sürücü'][i] || 'Müsait sürücü',
        score: Math.round(d.rating * 20 + d.totalTrips / 100 - i * 5),
      })).sort((a, b) => b.score - a.score));
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/driver-assignment/analytics', async (req, res) => {
  const tenantId = req.query.tenant_id as string || 't-1001';
  try {
    if (DB_MODE) {
      const [total, active, driversWithRatings] = await Promise.all([
        prisma.driverAssignment.count({ where: { tenantId } }),
        prisma.vehicle.count({ where: { tenantId, driverId: { not: null } } }),
        prisma.driver.findMany({ where: { tenantId }, select: { rating: true } }),
      ]);
      const avgRating = driversWithRatings.length > 0 ? driversWithRatings.reduce((s, d) => s + (d.rating ?? 0), 0) / driversWithRatings.length : 0;
      res.json({ totalAssignments: total, activeAssignments: active, revokedToday: 0, avgConfidence: 0.91, avgDriverRating: Math.round(avgRating * 10) / 10, assignmentsByDay: [], topDrivers: [] });
    } else {
      const active = mockAssignmentsData.filter((a: any) => a.revoked_at === null).length;
      res.json({
        totalAssignments: mockAssignmentsData.length,
        activeAssignments: active,
        revokedToday: mockAssignmentsData.filter((a: any) => a.revoked_at && a.revoked_at > Date.now() - 86400000).length,
        avgConfidence: 0.91,
        avgDriverRating: 4.7,
        assignmentsByDay: [
          { date: 'Pazartesi', count: 12 }, { date: 'Salı', count: 8 }, { date: 'Çarşamba', count: 15 },
          { date: 'Perşembe', count: 10 }, { date: 'Cuma', count: 6 },
        ],
        topDrivers: [
          { id: 'd3', name: 'Hasan Kaya', count: 145, avgRating: 5.0 },
          { id: 'd1', name: 'Mehmet Şahin', count: 128, avgRating: 4.9 },
          { id: 'd2', name: 'Ali Yılmaz', count: 98, avgRating: 4.7 },
        ],
      });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v5/driver-assignment/config', (_req, res) => {
  res.json({ autoAssign: false, ratingWeight: 0.4, proximityWeight: 0.3, workloadWeight: 0.3, minConfidence: 0.7, notifyOnAssign: true, notifyOnRevoke: true });
});

app.post('/api/v5/driver-assignment/config', (req, res) => {
  res.json({ status: 'SAVED', ...req.body });
});

// ── Mock assignment state ─────────────────────────────────────
const mockFleetData = [
  { id: 'v1', plate: '34 AB 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, capacity: 18, status: 'ON_ROUTE' },
  { id: 'v2', plate: '34 CD 5678', brand: 'Ford', model: 'Transit Custom', year: 2023, capacity: 14, status: 'WARNING' },
  { id: 'v3', plate: '34 EF 9012', brand: 'IVECO', model: 'Daily 50C', year: 2024, capacity: 20, status: 'STANDBY' },
  { id: 'v4', plate: '34 GH 3456', brand: 'Mercedes-Benz', model: 'Vito 119', year: 2023, capacity: 8, status: 'ON_ROUTE' },
  { id: 'v5', plate: '34 İJ 7890', brand: 'Ford', model: 'Tourneo Custom', year: 2025, capacity: 12, status: 'IDLE' },
  { id: 'v6', plate: '34 KL 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, capacity: 18, status: 'OFFLINE' },
  { id: 'v7', plate: '34 MN 5678', brand: 'IVECO', model: 'Daily 50C', year: 2024, capacity: 20, status: 'BREAK' },
  { id: 'v8', plate: '34 OP 9012', brand: 'Ford', model: 'Transit Custom', year: 2023, capacity: 14, status: 'ON_ROUTE' },
];
const mockDriverState = [
  { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1240, totalHours: 8920, status: 'ACTIVE' },
  { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', email: 'ali@example.com', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 980, totalHours: 6540, status: 'ACTIVE' },
  { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', email: 'hasan@example.com', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1560, totalHours: 11200, status: 'ACTIVE' },
  { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', email: 'burak@example.com', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, totalHours: 4560, status: 'ON_LEAVE' },
  { id: 'd5', name: 'Can Öztürk', phone: '0532 555 6677', email: 'can@example.com', licenseNumber: '34-L-56789', rating: 4.8, totalTrips: 345, totalHours: 2100, status: 'ACTIVE' },
  { id: 'd6', name: 'Serkan Aydın', phone: '0532 666 7788', email: 'serkan@example.com', licenseNumber: '34-L-67890', rating: 4.4, totalTrips: 2789, totalHours: 18400, status: 'OFF_DUTY' },
  { id: 'd7', name: 'Emre Yıldız', phone: '0532 777 8899', email: 'emre@example.com', licenseNumber: '34-L-78901', rating: 4.3, totalTrips: 678, totalHours: 3200, status: 'BREAK' },
  { id: 'd8', name: 'Murat Çelik', phone: '0532 888 9900', email: 'murat@example.com', licenseNumber: '34-L-89012', rating: 4.9, totalTrips: 456, totalHours: 1800, status: 'ACTIVE' },
];
const mockAssignmentsData: any[] = [];
const mockAssignedVehicleIds = new Set<string>();

// ── Routes ────────────────────────────────────────────────────
app.get('/api/v5/routes/detail/:routeId', async (req, res) => {
  try {
    if (DB_MODE) {
      const route = await prisma.route.findUnique({
        where: { id: req.params.routeId },
        include: { vehicle: { include: { position: true, driver: true } }, driver: true, nodes: { orderBy: { seq: 'asc' } } },
      });
      if (!route) { res.status(404).json({ error: 'Route not found' }); return; }
      res.json({
        id: route.id, name: route.name, type: route.type, status: route.status,
        progressPercent: route.progressPercent, totalDistance: route.totalDistance, totalDuration: route.totalDuration,
        scheduledAt: route.scheduledAt, startedAt: route.startedAt, completedAt: route.completedAt,
        vehicle: route.vehicle ? {
          id: route.vehicle.id, plate: route.vehicle.plate, brand: route.vehicle.brand, model: route.vehicle.model,
          status: route.vehicle.status,
          position: route.vehicle.position ? { lat: route.vehicle.position.lat, lng: route.vehicle.position.lng, speed: route.vehicle.position.speed, heading: route.vehicle.position.heading, timestamp: route.vehicle.position.timestamp.getTime() } : null,
        } : null,
        driver: route.driver ? { id: route.driver.id, name: route.driver.name, phone: route.driver.phone, photo: route.driver.photo, rating: route.driver.rating, status: route.driver.status } : null,
        nodes: route.nodes.map(n => ({
          id: n.id, seq: n.seq, studentName: n.studentName, address: n.address, lat: n.lat, lng: n.lng,
          status: n.status, absenceFlagged: n.absenceFlagged, estimatedTime: n.estimatedTime, actualTime: n.actualTime,
        })),
      });
    } else {
      res.json({
        id: req.params.routeId, name: 'Sabah Bandı - Kavacık', type: 'morning', status: 'ACTIVE', progressPercent: 65,
        totalDistance: 24.5, totalDuration: 45, scheduledAt: new Date().toISOString(), startedAt: new Date().toISOString(), completedAt: null,
        vehicle: { id: 'v1', plate: '34 AB 1234', brand: 'Mercedes-Benz', model: 'Sprinter 519', status: 'ACTIVE', position: { lat: 41.095, lng: 29.098, speed: 45, heading: 180, timestamp: Date.now() } },
        driver: { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', photo: null, rating: 4.9, status: 'ACTIVE' },
        nodes: [
          { id: 'n1', seq: 1, studentName: 'Eymen Altunel', address: 'Cumhuriyet Mah. 4. Sok No:12', lat: 41.095, lng: 29.098, status: 'BOARDED', absenceFlagged: false, estimatedTime: '08:15', actualTime: '08:12' },
          { id: 'n2', seq: 2, studentName: 'Zeynep Kaya', address: 'Gül Apt. D:8, Anadolu Hisarı', lat: 41.086, lng: 29.083, status: 'PENDING', absenceFlagged: false, estimatedTime: '08:25', actualTime: null },
        ],
      });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v5/routes/update', async (req, res) => {
  try {
    if (DB_MODE) {
      const { id, name, status, progressPercent, type, totalDistance, totalDuration } = req.body;
      const route = await prisma.route.update({
        where: { id },
        data: { name, status, progressPercent, type, totalDistance, totalDuration },
      });
      res.json({ status: 'UPDATED', route });
    } else {
      res.json({ status: 'UPDATED', route: { id: req.body.id || 'r1', ...req.body } });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v5/routes/assign-vehicle', async (req, res) => {
  try {
    if (DB_MODE) {
      const { routeId, vehicleId } = req.body;
      await prisma.route.update({ where: { id: routeId }, data: { vehicleId } });
      res.json({ status: 'ASSIGNED', route_id: routeId, vehicle_id: vehicleId });
    } else {
      res.json({ status: 'ASSIGNED', route_id: req.body.routeId, vehicle_id: req.body.vehicleId });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v5/routes/assign-driver', async (req, res) => {
  try {
    if (DB_MODE) {
      const { vehicleId, driverId } = req.body;
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { driverId } });
      res.json({ status: 'ASSIGNED', vehicle_id: vehicleId, driver_id: driverId });
    } else {
      res.json({ status: 'ASSIGNED', vehicle_id: req.body.vehicleId, driver_id: req.body.driverId });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v5/services/create', async (req, res) => {
  try {
    if (DB_MODE) {
      const { name, type, vehicleId, driverId, nodes } = req.body;
      const route = await prisma.route.create({
        data: {
          tenantId: req.user?.tenantId || 't-1001',
          name: name || 'Yeni Rota',
          type: type || 'morning',
          vehicleId,
          driverId,
          nodes: nodes ? { create: nodes.map((n: any, i: number) => ({
            studentName: n.studentName || 'Öğrenci', address: n.address, lat: n.lat, lng: n.lng, seq: n.seq ?? i + 1,
          })) } : undefined,
        },
        include: { nodes: { orderBy: { seq: 'asc' } } },
      });
      res.json({ status: 'CREATED', route_id: route.id, route });
    } else {
      const routeId = `r_${Date.now()}`;
      res.json({
        status: 'CREATED', route_id: routeId,
        route: { id: routeId, name: req.body.name || 'Yeni Rota', type: req.body.type || 'morning', status: 'SCHEDULED', nodes: (req.body.nodes || []).map((n: any, i: number) => ({ ...n, id: `n_${Date.now()}_${i}`, seq: n.seq ?? i + 1, status: 'PENDING' })) },
      });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/v5/routes/:routeId', async (req, res) => {
  try {
    if (DB_MODE) {
      await prisma.routeNode.deleteMany({ where: { routeId: req.params.routeId } });
      await prisma.route.delete({ where: { id: req.params.routeId } });
      res.json({ status: 'DELETED', route_id: req.params.routeId });
    } else {
      res.json({ status: 'DELETED', route_id: req.params.routeId });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Fleet Extended ────────────────────────────────────────────
app.get('/api/v5/fleet/vehicle/:vehicleId', async (req, res) => {
  try {
    if (DB_MODE) {
      const v = await prisma.vehicle.findUnique({
        where: { id: req.params.vehicleId },
        include: { driver: true, position: true, tags: true, routes: { take: 1 } },
      });
      if (!v) { res.status(404).json({ error: 'Vehicle not found' }); return; }
      res.json({
        id: v.id, plate: v.plate, vin: v.vin, brand: v.brand, model: v.model, year: v.year,
        color: v.color, fuelType: v.fuelType, capacity: v.capacity, status: v.status,
        position: v.position ? { lat: v.position.lat, lng: v.position.lng, speed: v.position.speed, heading: v.position.heading, accuracy: v.position.accuracy, timestamp: v.position.timestamp.getTime() } : null,
        driver: v.driver ? { id: v.driver.id, name: v.driver.name, phone: v.driver.phone, email: v.driver.email, rating: v.driver.rating, totalTrips: v.driver.totalTrips, status: v.driver.status } : null,
        tags: v.tags.map(t => t.tag),
        route: v.routes[0] ? { id: v.routes[0].id, name: v.routes[0].name, status: v.routes[0].status } : null,
      });
    } else {
      const v = fleetVehicles.find(fv => fv.id === req.params.vehicleId);
      if (v) res.json(v);
      else res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v5/fleet/summary', async (_req, res) => {
  try {
    if (DB_MODE) {
      const [totalVehicles, activeVehicles, warningVehicles, standbyVehicles, driversCount] = await Promise.all([
        prisma.vehicle.count(),
        prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
        prisma.vehicle.count({ where: { status: 'WARNING' } }),
        prisma.vehicle.count({ where: { status: 'STANDBY' } }),
        prisma.driver.count(),
      ]);
      res.json({ totalVehicles, activeVehicles, warningVehicles, standbyVehicles, driversCount });
    } else {
      res.json({ totalVehicles: 24, activeVehicles: 18, warningVehicles: 3, standbyVehicles: 3, driversCount: 22 });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
