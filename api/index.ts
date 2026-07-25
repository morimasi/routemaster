import express from 'express';
import cors from 'cors';
import {
  dashboardStats, trafficData, systemLogs, aiPredictions, systemHealth,
  vehiclePositions, fleet, drivers,
  subscriptionPlan, usageMetrics, invoices, paymentMethod,
  documents, institutionProfile, securityConfig, webhookConfig,
} from './src/data.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Dashboard ────────────────────────────────────────────────
app.get('/api/v5/dashboard/stats', (_req, res) => res.json(dashboardStats));
app.get('/api/v5/dashboard/traffic', (_req, res) => res.json(trafficData));
app.get('/api/v5/dashboard/logs', (_req, res) => res.json(systemLogs));
app.get('/api/v5/dashboard/ai-predictions', (_req, res) => res.json(aiPredictions));
app.get('/api/v5/dashboard/system-health', (_req, res) => res.json(systemHealth));
app.post('/api/v5/dashboard/logs/resolve', (req, res) => {
  const { log_id } = req.body;
  const idx = systemLogs.findIndex((l) => l.id === log_id);
  if (idx !== -1) systemLogs[idx].status = 'RESOLVED';
  res.json({ status: 'RESOLVED' });
});

// ── Radar ────────────────────────────────────────────────────
app.get('/api/v5/radar/positions', (_req, res) => res.json(vehiclePositions));

app.get('/api/v5/radar/routes', (_req, res) => {
  res.json([
    { id: 'r1', name: 'Sabah Bandı - Kavacık', vehiclePlate: '34 AB 1234', status: 'ACTIVE', alertsCount: 0, progressPercent: 65, nodes: [] },
    { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', vehiclePlate: '34 CD 5678', status: 'WARNING', alertsCount: 2, progressPercent: 40, nodes: [] },
    { id: 'r3', name: 'Akşam Fabrika Servisi', vehiclePlate: '34 EF 9012', status: 'SCHEDULED', alertsCount: 0, progressPercent: 10, nodes: [] },
  ]);
});

app.post('/api/v5/routes/multi-optimize', (req, res) => {
  const { fleet: f } = req.body;
  res.json({
    status: 'SUCCESS_SIMULATED', solver_execution_time_ms: 412, fuel_saved_percent: 19.2,
    total_distance_reduced_km: 14.3,
    optimized_routes: (f || []).map((v: any, i: number) => ({
      vehicle_id: v.id, assigned_nodes_count: 6, estimated_fuel_saved_percent: 19.2,
    })),
  });
});

app.post('/api/v5/routes/node/driver-prune', (req, res) => {
  const { node_id } = req.body;
  res.json({ status: 'PRUNED', node_id, recalculated_eta_ms: 380, message: 'Düğüm grafikten budandı.' });
});

app.post('/api/v5/routes/node/flag-absence', (req, res) => {
  const { node_id } = req.body;
  res.json({ status: 'FLAGGED', node_id, driver_hud_alert: 'ALERT_ORANGE' });
});

app.post('/api/v5/routes/generate-from-nodes', (req, res) => {
  res.json({ status: 'ROUTE_GENERATED', route_id: `ai_route_${Date.now()}`, total_distance_km: 24.5, estimated_duration_min: 45 });
});

// ── Fleet ────────────────────────────────────────────────────
app.get('/api/v5/fleet', (_req, res) => res.json(fleet));
app.get('/api/v5/fleet/drivers', (_req, res) => res.json(drivers));

app.post('/api/v5/fleet/vehicle', (req, res) => {
  const { plate, model, driver, phone } = req.body;
  const newVehicle = {
    id: `v_${Date.now()}`, plate, model, driver, phone, status: 'STANDBY',
    capacity: '16 Yolcu', fuelLevel: 100, rating: 5.0, totalKm: 0,
  };
  fleet.push(newVehicle as any);
  res.json({ status: 'CREATED', vehicle_id: newVehicle.id });
});

app.post('/api/v5/fleet/ai-assign', (_req, res) => {
  res.json({ status: 'ASSIGNED', driver_id: `d_ai_${Date.now()}`, confidence: 0.94, reason: 'Optimum sürücü-rota eşleşmesi' });
});

// ── Billing ──────────────────────────────────────────────────
app.get('/api/v5/billing/subscription', (_req, res) => res.json(subscriptionPlan));
app.get('/api/v5/billing/usage', (_req, res) => res.json(usageMetrics));
app.get('/api/v5/billing/invoices', (_req, res) => res.json(invoices));
app.get('/api/v5/billing/payment-method', (_req, res) => res.json(paymentMethod));

// ── Documents ────────────────────────────────────────────────
app.get('/api/v5/documents', (_req, res) => res.json(documents));

app.post('/api/v5/documents/upload', (req, res) => {
  const newDoc = {
    id: `d_${Date.now()}`, name: req.body.name || 'Yeni Belge.pdf',
    type: 'pdf', size: req.body.size || '0 B', date: 'Az önce', status: 'processing' as const,
  };
  documents.unshift(newDoc as any);
  res.json({ status: 'UPLOADED', document: newDoc });
});

app.delete('/api/v5/documents/:id', (req, res) => {
  const idx = documents.findIndex((d) => d.id === req.params.id);
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
  const action = phrase.includes('atla') || phrase.includes('prune')
    ? 'EXECUTE_PRUNE'
    : phrase.includes('bindi') || phrase.includes('tamamla')
    ? 'MARK_BOARDED'
    : 'UNKNOWN';
  res.json({ status: 'PARSED', spoken_phrase: req.body.spoken_phrase, resolved_intent: { action, confidence_score: 0.96 } });
});

// ── Chat ─────────────────────────────────────────────────────
app.post('/api/v5/chat/room/init', (req, res) => {
  const { tenant_id } = req.body;
  res.json({ status: 'INITIALIZED', room_id: `room_${tenant_id}_${Date.now()}`, encryption: 'ECDH_AES_GCM' });
});

app.post('/api/v5/chat/message', (req, res) => {
  res.json({ status: 'DELIVERED', message_id: `msg_${Date.now()}` });
});

// ── Settings ─────────────────────────────────────────────────
app.get('/api/v5/tenant/settings', (_req, res) => {
  res.json({ ...institutionProfile, ...securityConfig, ...webhookConfig });
});

app.post('/api/v5/tenant/settings', (req, res) => {
  res.json({ status: 'SAVED', tenant_id: req.body.tenant_id || 't-1001' });
});

// ── Analytics ────────────────────────────────────────────────
app.get('/api/v5/analytics/attendance', (_req, res) => {
  res.json({ total_students: 248, avg_attendance_rate: 0.946, absences_today: 14, peak_absence_day: 'Pazartesi' });
});

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', version: '5.0.0', uptime: process.uptime() });
});

// ── Error handler ────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const port = process.env.PORT || 4000;
if (process.argv[1] && !process.env.VERCEL) {
  app.listen(port, () => console.log(`ShuttleX API running on http://localhost:${port}`));
}

export default app;
