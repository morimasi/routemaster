import { prisma } from './db.js';
import { broadcastVehiclePosition } from './ws.js';

const VEHICLE_LAT_BASE = 41.092;
const VEHICLE_LNG_BASE = 29.088;

let simulationTimer: ReturnType<typeof setInterval> | null = null;

const vehicleMovement = new Map<string, { lat: number; lng: number; heading: number; speed: number }>();

export async function runSimulationTick() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { in: ['ON_ROUTE', 'WARNING'] } },
    });

    for (const v of vehicles) {
      let move = vehicleMovement.get(v.id);
      if (!move) {
        const lastPos = await prisma.position.findUnique({ where: { vehicleId: v.id } });
        move = {
          lat: lastPos?.lat ?? VEHICLE_LAT_BASE + Math.random() * 0.02,
          lng: lastPos?.lng ?? VEHICLE_LNG_BASE + Math.random() * 0.02,
          heading: lastPos?.heading ?? Math.random() * 360,
          speed: lastPos?.speed ?? 20 + Math.random() * 40,
        };
        vehicleMovement.set(v.id, move);
      }

      const headingDelta = (Math.random() - 0.5) * 15;
      move.heading = (move.heading + headingDelta + 360) % 360;
      move.speed = Math.max(5, move.speed + (Math.random() - 0.5) * 10);

      const distPerTick = move.speed * 3 / 3.6;
      move.lat += distPerTick * Math.cos(move.heading * Math.PI / 180) / 111000;
      move.lng += distPerTick * Math.sin(move.heading * Math.PI / 180) / (111000 * Math.cos(move.lat * Math.PI / 180));

      await prisma.position.upsert({
        where: { vehicleId: v.id },
        update: { lat: move.lat, lng: move.lng, speed: Math.round(move.speed), heading: Math.round(move.heading), timestamp: new Date() },
        create: { vehicleId: v.id, lat: move.lat, lng: move.lng, speed: Math.round(move.speed), heading: Math.round(move.heading) },
      });

      await prisma.trailPoint.create({
        data: { vehicleId: v.id, lat: move.lat, lng: move.lng, speed: Math.round(move.speed), heading: Math.round(move.heading) },
      });

      broadcastVehiclePosition(v.tenantId, {
        id: v.id,
        plate: v.plate,
        lat: move.lat,
        lng: move.lng,
        speed: Math.round(move.speed),
        heading: Math.round(move.heading),
        status: v.status,
        timestamp: Date.now(),
      });
    }
  } catch {
    /* DB not ready */
  }
}

export function startSimulation() {
  if (simulationTimer) return;
  simulationTimer = setInterval(runSimulationTick, 3000);
}

export function stopSimulation() {
  if (simulationTimer) { clearInterval(simulationTimer); simulationTimer = null; }
}
