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
