import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Başlatılıyor...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'kavacik-koleji' },
    update: {},
    create: {
      name: 'Kavacık Koleji',
      slug: 'kavacik-koleji',
      address: 'Atatürk Cad. No:42, Kavacık, Beykoz/İstanbul',
      phone: '0216 555 0000',
      email: 'info@kavacikkoleji.k12.tr',
    },
  });

  const hash = await bcrypt.hash('ShuttleX2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shuttlex.com' },
    update: {},
    create: {
      tenantId: tenant.id, email: 'admin@shuttlex.com', password: hash,
      name: 'Sistem Yöneticisi', role: 'SYSTEM_ADMIN', phone: '0532 000 0000',
    },
  });

  const planner = await prisma.user.upsert({
    where: { email: 'planner@shuttlex.com' },
    update: {},
    create: {
      tenantId: tenant.id, email: 'planner@shuttlex.com', password: hash,
      name: 'Ali Planlamacı', role: 'PLANNER', phone: '0532 111 1111',
    },
  });

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { id: 'd1' }, update: {},
      create: { id: 'd1', tenantId: tenant.id, name: 'Mehmet Şahin', phone: '0532 111 2233', email: 'mehmet@example.com', licenseNumber: '34-L-12345', rating: 4.9, totalTrips: 1247, totalHours: 8920, status: 'ACTIVE' },
    }),
    prisma.driver.upsert({
      where: { id: 'd2' }, update: {},
      create: { id: 'd2', tenantId: tenant.id, name: 'Ali Yılmaz', phone: '0533 222 3344', licenseNumber: '34-L-23456', rating: 4.7, totalTrips: 892, totalHours: 6540, status: 'ACTIVE' },
    }),
    prisma.driver.upsert({
      where: { id: 'd3' }, update: {},
      create: { id: 'd3', tenantId: tenant.id, name: 'Hasan Kaya', phone: '0535 333 4455', licenseNumber: '34-L-34567', rating: 5.0, totalTrips: 1563, totalHours: 11200, status: 'ACTIVE' },
    }),
    prisma.driver.upsert({
      where: { id: 'd4' }, update: {},
      create: { id: 'd4', tenantId: tenant.id, name: 'Burak Demir', phone: '0536 444 5566', licenseNumber: '34-L-45678', rating: 4.6, totalTrips: 670, totalHours: 4500, status: 'ON_LEAVE' },
    }),
  ]);

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { id: 'v1' }, update: {},
      create: { id: 'v1', tenantId: tenant.id, plate: '34 AB 1234', vin: 'WBA1234567890ABCD1', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, fuelType: 'diesel', capacity: 18, status: 'ON_ROUTE' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v2' }, update: {},
      create: { id: 'v2', tenantId: tenant.id, plate: '34 CD 5678', vin: 'WBA1234567890ABCD2', brand: 'Ford', model: 'Transit Custom', year: 2023, fuelType: 'diesel', capacity: 14, status: 'WARNING' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v3' }, update: {},
      create: { id: 'v3', tenantId: tenant.id, plate: '34 EF 9012', vin: 'WBA1234567890ABCD3', brand: 'IVECO', model: 'Daily 50C', year: 2024, fuelType: 'diesel', capacity: 20, status: 'STANDBY' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v4' }, update: {},
      create: { id: 'v4', tenantId: tenant.id, plate: '34 GH 3456', vin: 'WBA1234567890ABCD4', brand: 'Mercedes-Benz', model: 'Vito 119', year: 2023, fuelType: 'diesel', capacity: 8, status: 'ON_ROUTE' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v5' }, update: {},
      create: { id: 'v5', tenantId: tenant.id, plate: '34 İJ 7890', vin: 'WBA1234567890ABCD5', brand: 'Ford', model: 'Tourneo Custom', year: 2025, fuelType: 'hybrid', capacity: 12, status: 'IDLE' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v6' }, update: {},
      create: { id: 'v6', tenantId: tenant.id, plate: '34 KL 1234', vin: 'WBA1234567890ABCD6', brand: 'Mercedes-Benz', model: 'Sprinter 519', year: 2024, fuelType: 'diesel', capacity: 18, status: 'OFFLINE' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v7' }, update: {},
      create: { id: 'v7', tenantId: tenant.id, plate: '34 MN 5678', vin: 'WBA1234567890ABCD7', brand: 'IVECO', model: 'Daily 50C', year: 2024, fuelType: 'diesel', capacity: 20, status: 'BREAK' },
    }),
    prisma.vehicle.upsert({
      where: { id: 'v8' }, update: {},
      create: { id: 'v8', tenantId: tenant.id, plate: '34 OP 9012', vin: 'WBA1234567890ABCD8', brand: 'Ford', model: 'Transit Custom', year: 2023, fuelType: 'diesel', capacity: 14, status: 'ON_ROUTE' },
    }),
  ]);

  await prisma.vehicleTag.createMany({
    data: [
      { vehicleId: 'v1', tag: 'sabah' }, { vehicleId: 'v1', tag: 'kavacık' },
      { vehicleId: 'v2', tag: 'öğlen' }, { vehicleId: 'v2', tag: 'okul' },
      { vehicleId: 'v3', tag: 'akşam' }, { vehicleId: 'v3', tag: 'fabrika' },
      { vehicleId: 'v4', tag: 'etüt' }, { vehicleId: 'v4', tag: 'öğlen' },
      { vehicleId: 'v7', tag: 'mola' },
      { vehicleId: 'v8', tag: 'ring' }, { vehicleId: 'v8', tag: 'hastane' },
    ],
    skipDuplicates: true,
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, plan: 'ShuttleX Enterprise', version: 'v5.0', price: 2499, maxVehicles: 48, aiOcrLimit: 5000, smsLimit: 10000 },
  });

  await prisma.tenantSetting.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, rlsPolicyActive: true, mfaEnabled: true, sessionTimeoutMinutes: 30 },
  });

  await prisma.geofence.createMany({
    data: [
      { tenantId: tenant.id, name: 'Kavacık Koleji', lat: 41.092, lng: 29.088, radius: 200, type: 'school' },
      { tenantId: tenant.id, name: 'Anadolu Hisarı', lat: 41.086, lng: 29.083, radius: 150, type: 'stop' },
      { tenantId: tenant.id, name: 'Depo Alanı', lat: 41.100, lng: 29.110, radius: 100, type: 'depot' },
    ],
    skipDuplicates: true,
  });

  console.log('[Seed] Tamamlandı!');
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`  Admin: admin@shuttlex.com / ShuttleX2026!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
