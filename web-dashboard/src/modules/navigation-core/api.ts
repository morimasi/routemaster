import type { NavigationRoute, NavigationManeuver, NavigationStop } from './types';



function generatePolyline(from: [number, number], to: [number, number], steps = 12): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t + (Math.random() - 0.5) * 0.002;
    const lng = from[1] + (to[1] - from[1]) * t + (Math.random() - 0.5) * 0.002;
    points.push([lat, lng]);
  }
  return points;
}

const S1: [number, number] = [41.0921, 29.0945];
const S2: [number, number] = [41.0945, 29.0970];
const S3: [number, number] = [41.0860, 29.0830];
const S4: [number, number] = [41.0988, 29.1012];
const S5: [number, number] = [41.0905, 29.0920];
const S6: [number, number] = [41.0781, 29.0730];
const S7: [number, number] = [41.0890, 29.0650];
const S8: [number, number] = [41.1040, 29.0880];

export const MOCK_STOPS: NavigationStop[] = [
  { id: 's1', name: 'Ahmet Yılmaz', address: 'Atatürk Cad. No:14, Kavacık', coordinates: S1, seq: 1, eta: '07:25' },
  { id: 's2', name: 'Eymen Altunel', address: 'Cumhuriyet Mah. 4. Sok No:12', coordinates: S2, seq: 2, eta: '07:32' },
  { id: 's3', name: 'Zeynep Kaya', address: 'Gül Apt. D:8, Anadolu Hisarı', coordinates: S3, seq: 3, eta: '07:40' },
  { id: 's4', name: 'Can Demir', address: 'Deniz Evleri B Blok, Çubuklu', coordinates: S4, seq: 4, eta: '07:48' },
  { id: 's5', name: 'Mert Doğan', address: 'Yıldız Sok. No:3, Kavacık', coordinates: S5, seq: 5, eta: '07:55' },
  { id: 's6', name: 'Defne Yalçın', address: 'Göksu Evleri A-12, Beykoz', coordinates: S6, seq: 6, eta: '08:05' },
  { id: 's7', name: 'Kerem Aydın', address: 'İncirli Cad. No:42, İncirköy', coordinates: S7, seq: 7, eta: '08:15' },
  { id: 's8', name: 'İrem Kılıç', address: 'Paşabahçe Sok. No:8', coordinates: S8, seq: 8, eta: '08:25' },
];

function generateManeuvers(stops: NavigationStop[]): NavigationManeuver[] {
  const icons: NavigationManeuver['icon'][] = ['depart', 'turn-right', 'straight', 'turn-left', 'straight', 'slight-right', 'turn-right', 'turn-left', 'straight', 'arrive'];
  const streets = ['Atatürk Caddesi', 'Cumhuriyet Sokak', 'Boğaziçi Yolu', 'Gül Sokak', 'Deniz Caddesi', 'Kavacık Yolu', 'Göksu Caddesi', 'İncirli Yokuşu', 'Paşabahçe Caddesi', 'Okul Yolu'];
  const maneuvers: NavigationManeuver[] = [];
  for (let i = 0; i < stops.length + 2; i++) {
    maneuvers.push({
      id: `m${i}`,
      instruction: i === 0 ? 'Kavacık\'tan hareket' : i === stops.length + 1 ? 'Okula varış' : `${stops[i - 1].name} durağına ilerleyin`,
      streetName: streets[i % streets.length],
      distance: 300 + Math.floor(Math.random() * 1200),
      duration: 30 + Math.floor(Math.random() * 120),
      icon: icons[i % icons.length],
      index: i,
    });
  }
  return maneuvers;
}

function generateFullPolyline(stops: NavigationStop[]): [number, number][] {
  const start: [number, number] = [41.0880, 29.0880];
  const end: [number, number] = [41.0950, 29.1020];
  let allPoints: [number, number][] = [start];
  for (const stop of stops) {
    allPoints = allPoints.concat(generatePolyline(allPoints[allPoints.length - 1], stop.coordinates, 10));
  }
  allPoints = allPoints.concat(generatePolyline(allPoints[allPoints.length - 1], end, 10));
  return allPoints;
}

export const MOCK_ROUTE: NavigationRoute = {
  id: 'nr1',
  name: 'Sabah Bandı - Kavacık',
  polyline: generateFullPolyline(MOCK_STOPS),
  totalDistance: 18700,
  totalDuration: 3420,
  maneuvers: generateManeuvers(MOCK_STOPS),
  stops: MOCK_STOPS,
  vehiclePlate: '34 AB 1234',
  driverName: 'Mehmet Şahin',
};

export const NavigationApi = {
  getRoute: async (_routeId: string): Promise<NavigationRoute> => MOCK_ROUTE,
  getAlternativeRoutes: async (): Promise<NavigationRoute[]> => [MOCK_ROUTE],
};
