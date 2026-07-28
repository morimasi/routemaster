export const dashboardStats = {
  activeVehicles: { current: 42, total: 48, inMaintenance: 6 },
  studentsTransported: 1247,
  aiFuelSaving: 18.4,
  systemSla: 99.72,
  telemetryLatencyMs: 187,
};

export const trafficData = [
  { hour: '06:00', value: 20, peak: false },
  { hour: '07:00', value: 55, peak: false },
  { hour: '08:00', value: 95, peak: true },
  { hour: '09:00', value: 75, peak: false },
  { hour: '10:00', value: 45, peak: false },
  { hour: '11:00', value: 40, peak: false },
  { hour: '12:00', value: 38, peak: false },
  { hour: '13:00', value: 42, peak: false },
  { hour: '14:00', value: 50, peak: false },
  { hour: '15:00', value: 70, peak: false },
  { hour: '16:00', value: 90, peak: true },
  { hour: '17:00', value: 100, peak: true },
  { hour: '18:00', value: 85, peak: false },
  { hour: '19:00', value: 55, peak: false },
  { hour: '20:00', value: 25, peak: false },
];

export const systemLogs = [
  { id: 1, text: 'Rota optimizasyonu tamamlandı (%19.2 yakıt tasarrufu)', time: '2 dk önce', status: 'RESOLVED', severity: 'success' },
  { id: 2, text: 'Araç #2042 telemetri bağlantısı koptu', time: '7 dk önce', status: 'ACTIVE', severity: 'warning' },
  { id: 3, text: 'AI tahmin motoru yeniden başlatıldı', time: '15 dk önce', status: 'RESOLVED', severity: 'info' },
  { id: 4, text: 'Yakıt seviyesi kritik eşiğin altında (ARAÇ #108)', time: '23 dk önce', status: 'ACTIVE', severity: 'warning' },
  { id: 5, text: 'Edge cihaz firmware güncellemesi başarılı', time: '42 dk önce', status: 'RESOLVED', severity: 'success' },
  { id: 6, text: 'Toplu öğrenci yoklama senkronizasyon hatası', time: '1 saat önce', status: 'ACTIVE', severity: 'warning' },
  { id: 7, text: 'Sistem rutin bakım penceresi açıldı', time: '2 saat önce', status: 'RESOLVED', severity: 'info' },
];

export const aiPredictions = [
  { id: 'p1', title: 'Haftalık Yakıt Tüketimi', value: '1,240 L', description: 'Geçen haftaya göre %12.4 azalma öngörülüyor', confidence: 94, type: 'fuel', trend: 'down' },
  { id: 'p2', title: 'Gecikme Riski', value: '%23', description: 'Saat 08:15-08:45 arası yoğun trafik kaynaklı gecikme', confidence: 87, type: 'delay', trend: 'up' },
  { id: 'p3', title: 'Öğrenci Katılımı', value: '%96.2', description: 'Bugün için tahmini katılım oranı, 12 öğrenci eksik', confidence: 92, type: 'attendance', trend: 'stable' },
  { id: 'p4', title: 'Bakım İhtiyacı', value: '3 Araç', description: 'Önümüzdeki 7 gün içinde periyodik bakım gerekiyor', confidence: 78, type: 'maintenance', trend: 'up' },
  { id: 'p5', title: 'Optimum Rota Verimliliği', value: '%91.5', description: 'Mevcut filo dağılımı ile maksimum rota verimlilik skoru', confidence: 96, type: 'fuel', trend: 'stable' },
];

export const systemHealth = [
  { name: 'API Servisi', status: 'healthy', value: '98 ms', uptime: '99.98%' },
  { name: 'Veritabanı', status: 'healthy', value: '12 ms', uptime: '99.99%' },
  { name: 'AI Tahmin Motoru', status: 'healthy', value: '340 ms', uptime: '99.87%' },
  { name: 'Edge Bağlantıları', status: 'warning', value: '41/48', uptime: '97.30%' },
  { name: 'Telemetri Pipeline', status: 'healthy', value: '187 ms', uptime: '99.72%' },
  { name: 'Önbellek Katmanı', status: 'critical', value: 'Hata Oranı %5.2', uptime: '94.10%' },
];

export const vehiclePositions = [
  { id: 'v1', plate: '34 AB 1234', route: 'Kavacık - Sabah', x: 35, y: 40, speed: 42, driver: 'Mehmet Şahin', status: 'ON_ROUTE' },
  { id: 'v2', plate: '34 CD 5678', route: 'Anaokulu Öğlen', x: 65, y: 55, speed: 28, driver: 'Ali Yılmaz', status: 'WARNING' },
  { id: 'v3', plate: '34 EF 9012', route: 'Akşam Fabrika', x: 50, y: 70, speed: 0, driver: 'Hasan Kaya', status: 'STANDBY' },
  { id: 'v4', plate: '34 GH 3456', route: 'Etüt Seferi', x: 20, y: 30, speed: 55, driver: 'Burak Demir', status: 'ON_ROUTE' },
];

export const fleet = [
  { id: 'v1', plate: '34 AB 1234', model: 'Mercedes Sprinter 2024', driver: 'Mehmet Şahin', phone: '0532 111 2233', status: 'ON_ROUTE', capacity: '16 Yolcu', fuelLevel: 85, rating: 4.9, totalKm: 45230 },
  { id: 'v2', plate: '34 CD 5678', model: 'VW Crafter 2023', driver: 'Ali Yılmaz', phone: '0533 222 3344', status: 'WARNING', capacity: '19 Yolcu', fuelLevel: 42, rating: 4.7, totalKm: 38100 },
  { id: 'v3', plate: '34 EF 9012', model: 'Ford Transit 2024', driver: 'Hasan Kaya', phone: '0535 333 4455', status: 'STANDBY', capacity: '16 Yolcu', fuelLevel: 95, rating: 5.0, totalKm: 12400 },
  { id: 'v4', plate: '34 GH 3456', model: 'Otokar Sultan 2023', driver: 'Burak Demir', phone: '0536 444 5566', status: 'MAINTENANCE', capacity: '29 Yolcu', fuelLevel: 15, rating: 4.6, totalKm: 67800 },
];

export const fleetVehicles = [
  {
    id: 'v1', plate: '34 AB 1234', vin: 'WBA1234567890ABCD1', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024,
    color: '#1e293b', fuelType: 'diesel', capacity: 18, status: 'ON_ROUTE',
    position: { lat: 41.0921, lng: 29.0945, speed: 42, heading: 180, accuracy: 5, timestamp: Date.now() },
    telemetry: { speed: 42, heading: 180, rpm: 1850, fuelLevel: 73, fuelConsumption: 12.4, engineTemp: 88, batteryVoltage: 12.6, odometer: 45230, doorStatus: 'locked', ignition: true, tirePressure: [38, 37, 38, 36], lastMaintenanceKm: 1000 },
    driver: { id: 'd1', name: 'Mehmet Şahin', phone: '+905321234567', license: '06-B-12345', rating: 4.8, totalTrips: 1247, totalHours: 8920, status: 'active' },
    route: { id: 'r1', name: 'Kavacık Sabah Seferi', type: 'morning', progress: 65, totalDistance: 42.5, remainingDistance: 14.8, totalDuration: 5400, remainingDuration: 1890, stopCount: 14, completedStops: 9, nextStop: 'Mimar Sinan Cad. No:42', nextStopEta: '08:14', estimatedArrival: '08:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['sabah', 'kavacık'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v2', plate: '34 CD 5678', vin: 'WBA1234567890ABCD2', brand: 'Ford', model: 'Transit Custom', year: 2023,
    color: '#334155', fuelType: 'diesel', capacity: 14, status: 'WARNING',
    position: { lat: 41.0988, lng: 29.1012, speed: 58, heading: 45, accuracy: 8, timestamp: Date.now() },
    telemetry: { speed: 58, heading: 45, rpm: 2200, fuelLevel: 45, fuelConsumption: 15.2, engineTemp: 92, batteryVoltage: 12.8, odometer: 28450, doorStatus: 'locked', ignition: true, tirePressure: [36, 35, 36, 34], lastMaintenanceKm: 450 },
    driver: { id: 'd2', name: 'Ali Yılmaz', phone: '+905322345678', license: '06-B-23456', rating: 4.5, totalTrips: 892, totalHours: 6540, status: 'active' },
    route: { id: 'r2', name: 'Anaokulu Öğlen Bağlantısı', type: 'afternoon', progress: 40, totalDistance: 28.3, remainingDistance: 16.9, totalDuration: 3600, remainingDuration: 2160, stopCount: 10, completedStops: 4, nextStop: 'İstiklal Mah. Çiçek Sk. No:8', nextStopEta: '12:28', estimatedArrival: '13:00' },
    alerts: [
      { id: 'a1', type: 'speeding', severity: 'warning', message: 'Hız sınırı aşıldı: 72 km/s (50 km/s)', timestamp: Date.now() - 120000, location: { lat: 41.096, lng: 29.099, speed: 72, heading: 50, accuracy: 5, timestamp: Date.now() - 120000 }, acknowledged: false },
      { id: 'a2', type: 'off_route', severity: 'info', message: 'Rota dışı sapma tespit edildi (50m)', timestamp: Date.now() - 600000, location: { lat: 41.095, lng: 29.098, speed: 35, heading: 30, accuracy: 5, timestamp: Date.now() - 600000 }, acknowledged: false },
    ], trail: [], lastUpdated: Date.now(), tags: ['öğlen', 'okul'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v3', plate: '34 EF 9012', vin: 'WBA1234567890ABCD3', brand: 'IVECO', model: 'Daily 50C', year: 2024,
    color: '#1e3a5f', fuelType: 'diesel', capacity: 20, status: 'STANDBY',
    position: { lat: 41.0860, lng: 29.0830, speed: 0, heading: 0, accuracy: 3, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 82, fuelConsumption: 0, engineTemp: 45, batteryVoltage: 12.4, odometer: 18920, doorStatus: 'locked', ignition: false, tirePressure: [37, 37, 36, 37], lastMaintenanceKm: 3000 },
    driver: { id: 'd3', name: 'Hasan Kaya', phone: '+905323456789', license: '06-B-34567', rating: 4.9, totalTrips: 1563, totalHours: 11200, status: 'off_duty' },
    route: { id: 'r3', name: 'Akşam Fabrika Servisi', type: 'evening', progress: 10, totalDistance: 35.8, remainingDistance: 32.2, totalDuration: 4800, remainingDuration: 4320, stopCount: 12, completedStops: 0, nextStop: 'Fabrika Ana Durak', nextStopEta: '17:30', estimatedArrival: '18:15' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['akşam', 'fabrika'], groupId: 'g2', zone: 'Gebze',
  },
  {
    id: 'v4', plate: '34 GH 3456', vin: 'WBA1234567890ABCD4', brand: 'Mercedes-Benz', model: 'Vito 119', year: 2023,
    color: '#0f172a', fuelType: 'diesel', capacity: 8, status: 'ON_ROUTE',
    position: { lat: 41.0890, lng: 29.0650, speed: 55, heading: 270, accuracy: 4, timestamp: Date.now() },
    telemetry: { speed: 55, heading: 270, rpm: 1950, fuelLevel: 61, fuelConsumption: 11.8, engineTemp: 86, batteryVoltage: 12.7, odometer: 36200, doorStatus: 'locked', ignition: true, tirePressure: [38, 38, 37, 38], lastMaintenanceKm: 1800 },
    driver: { id: 'd4', name: 'Burak Demir', phone: '+905324567890', license: '06-B-45678', rating: 4.7, totalTrips: 1104, totalHours: 7890, status: 'active' },
    route: { id: 'r4', name: 'Etüt Seferi - Öğlen', type: 'extra', progress: 82, totalDistance: 18.6, remainingDistance: 3.3, totalDuration: 2400, remainingDuration: 432, stopCount: 6, completedStops: 5, nextStop: 'Kültür Merkezi', nextStopEta: '13:42', estimatedArrival: '13:55' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['etüt', 'öğlen'], groupId: 'g1', zone: 'Kavacık',
  },
  {
    id: 'v5', plate: '34 İJ 7890', vin: 'WBA1234567890ABCD5', brand: 'Ford', model: 'Tourneo Custom', year: 2025,
    color: '#1e293b', fuelType: 'hybrid', capacity: 12, status: 'IDLE',
    position: { lat: 41.094, lng: 29.076, speed: 0, heading: 0, accuracy: 3, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 800, fuelLevel: 90, fuelConsumption: 0.5, engineTemp: 52, batteryVoltage: 12.9, odometer: 5230, doorStatus: 'unlocked', ignition: true, tirePressure: [37, 36, 37, 36], lastMaintenanceKm: 8000 },
    driver: { id: 'd5', name: 'Can Öztürk', phone: '+905325678901', license: '06-B-56789', rating: 4.6, totalTrips: 345, totalHours: 2100, status: 'break' },
    route: { id: 'r5', name: 'Akşam Servisi', type: 'evening', progress: 5, totalDistance: 38.2, remainingDistance: 36.3, totalDuration: 5400, remainingDuration: 5130, stopCount: 15, completedStops: 0, nextStop: 'İlk Durak - Merkez', nextStopEta: '16:00', estimatedArrival: '16:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['akşam'], groupId: 'g2', zone: 'Gebze',
  },
  {
    id: 'v6', plate: '34 KL 1234', vin: 'WBA1234567890ABCD6', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024,
    color: '#1e3a5f', fuelType: 'diesel', capacity: 18, status: 'OFFLINE',
    position: { lat: 41.100, lng: 29.110, speed: 0, heading: 0, accuracy: 0, timestamp: Date.now() - 7200000 },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 0, fuelConsumption: 0, engineTemp: 25, batteryVoltage: 11.8, odometer: 67200, doorStatus: 'locked', ignition: false, tirePressure: [0, 0, 0, 0], lastMaintenanceKm: 200 },
    driver: { id: 'd6', name: 'Serkan Aydın', phone: '+905326789012', license: '06-B-67890', rating: 4.4, totalTrips: 2789, totalHours: 18400, status: 'off_duty' },
    route: { id: 'r6', name: 'Sabah Bandı - Geçici', type: 'morning', progress: 0, totalDistance: 45.0, remainingDistance: 45.0, totalDuration: 6000, remainingDuration: 6000, stopCount: 16, completedStops: 0, nextStop: 'Depo', nextStopEta: '--:--', estimatedArrival: '--:--' },
    alerts: [
      { id: 'a3', type: 'maintenance', severity: 'critical', message: 'Periyodik bakım zamanı geçti (200km)', timestamp: Date.now() - 86400000, acknowledged: false },
      { id: 'a4', type: 'engine_fault', severity: 'warning', message: 'Motor arıza lambası yanıyor', timestamp: Date.now() - 43200000, acknowledged: false },
    ], trail: [], lastUpdated: Date.now() - 7200000, tags: ['sabah'], groupId: 'g3', zone: 'Depo',
  },
  {
    id: 'v7', plate: '34 MN 5678', vin: 'WBA1234567890ABCD7', brand: 'IVECO', model: 'Daily 50C', year: 2024,
    color: '#0f172a', fuelType: 'diesel', capacity: 20, status: 'BREAK',
    position: { lat: 41.078, lng: 29.070, speed: 0, heading: 0, accuracy: 5, timestamp: Date.now() },
    telemetry: { speed: 0, heading: 0, rpm: 0, fuelLevel: 55, fuelConsumption: 0, engineTemp: 48, batteryVoltage: 12.5, odometer: 22100, doorStatus: 'locked', ignition: false, tirePressure: [36, 36, 35, 36], lastMaintenanceKm: 4500 },
    driver: { id: 'd7', name: 'Emre Yıldız', phone: '+905327890123', license: '06-B-78901', rating: 4.3, totalTrips: 678, totalHours: 4560, status: 'break' },
    route: { id: 'r7', name: 'Öğlen Servisi', type: 'afternoon', progress: 55, totalDistance: 22.4, remainingDistance: 10.1, totalDuration: 3000, remainingDuration: 1350, stopCount: 8, completedStops: 4, nextStop: 'Çarşı Durak', nextStopEta: '12:15', estimatedArrival: '12:40' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['mola', 'öğlen'], groupId: 'g1', zone: 'Merkez',
  },
  {
    id: 'v8', plate: '34 OP 9012', vin: 'WBA1234567890ABCD8', brand: 'Ford', model: 'Transit Custom', year: 2023,
    color: '#334155', fuelType: 'diesel', capacity: 14, status: 'ON_ROUTE',
    position: { lat: 41.102, lng: 29.095, speed: 38, heading: 120, accuracy: 6, timestamp: Date.now() },
    telemetry: { speed: 38, heading: 120, rpm: 1750, fuelLevel: 68, fuelConsumption: 13.1, engineTemp: 85, batteryVoltage: 12.7, odometer: 15800, doorStatus: 'locked', ignition: true, tirePressure: [37, 36, 37, 36], lastMaintenanceKm: 6000 },
    driver: { id: 'd8', name: 'Murat Çelik', phone: '+905328901234', license: '06-B-89012', rating: 4.9, totalTrips: 456, totalHours: 3200, status: 'active' },
    route: { id: 'r8', name: 'Hastane Ring Servisi', type: 'shuttle', progress: 45, totalDistance: 15.2, remainingDistance: 8.4, totalDuration: 1800, remainingDuration: 990, stopCount: 6, completedStops: 3, nextStop: 'Eğitim Hastanesi', nextStopEta: '10:22', estimatedArrival: '10:45' },
    alerts: [], trail: [], lastUpdated: Date.now(), tags: ['ring', 'hastane'], groupId: 'g4', zone: 'Merkez',
  },
];

export const drivers = [
  { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1240, status: 'ACTIVE' },
  { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 980, status: 'ACTIVE' },
  { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1560, status: 'ACTIVE' },
  { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, status: 'ON_LEAVE' },
];

export const subscriptionPlan = {
  name: 'ShuttleX Enterprise',
  version: 'v5.0',
  price: 2499,
  currency: 'USD',
  period: 'monthly',
  maxVehicles: 48,
  aiOcrLimit: 5000,
  smsLimit: 10000,
};

export const usageMetrics = [
  { label: 'Aktif Araç', current: 42, limit: 48, color: 'bg-blue-500' },
  { label: 'AI OCR İşleme', current: 3240, limit: 5000, color: 'bg-purple-500' },
  { label: 'SMS Kullanımı', current: 4200, limit: 10000, color: 'bg-emerald-500' },
];

export const invoices = [
  { id: 'inv-001', date: '01 Temmuz 2026', amount: '$2,499.00', status: 'paid' },
  { id: 'inv-002', date: '01 Haziran 2026', amount: '$2,499.00', status: 'paid' },
  { id: 'inv-003', date: '01 Mayıs 2026', amount: '$2,499.00', status: 'paid' },
  { id: 'inv-004', date: '01 Nisan 2026', amount: '$2,499.00', status: 'pending' },
];

export const paymentMethod = {
  lastFour: '4242',
  expiryDate: '08/27',
  isDefault: true,
};

export const documents = [
  { id: 'd1', name: 'Kavacık Sabah Rotası.pdf', type: 'pdf', size: '2.4 MB', date: 'Bugün 10:23', status: 'processed', pages: 4 },
  { id: 'd2', name: 'Öğrenci Listesi 2026.xlsx', type: 'spreadsheet', size: '856 KB', date: 'Dün 14:15', status: 'processed', pages: 3 },
  { id: 'd3', name: 'Servis Güzergah Haritası.png', type: 'image', size: '3.1 MB', date: 'Dün 09:45', status: 'processing' },
  { id: 'd4', name: 'Veli İzin Formları.pdf', type: 'pdf', size: '1.2 MB', date: '3 gün önce', status: 'processed', pages: 8 },
  { id: 'd5', name: 'Ayarlanmamış Rapor.docx', type: 'other', size: '420 KB', date: '5 gün önce', status: 'error' },
];

export const institutionProfile = {
  name: 'Kavacık Koleji',
  tenantId: 't-1001',
  address: 'Atatürk Cad. No:42, Kavacık, Beykoz/İstanbul',
  phone: '0216 555 0000',
  email: 'info@kavacikkoleji.k12.tr',
};

export const securityConfig = {
  rlsPolicyActive: true,
  mfaEnabled: true,
  sessionTimeoutMinutes: 30,
};

export const webhookConfig = {
  url: 'https://hooks.example.com/shuttlex',
  events: ['route.optimized', 'absence.flagged', 'vehicle.maintenance'],
  active: true,
};
