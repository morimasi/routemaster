export interface NavigationManeuver {
  id: string;
  instruction: string;
  streetName: string;
  distance: number;
  duration: number;
  icon: 'straight' | 'turn-left' | 'turn-right' | 'sharp-left' | 'sharp-right' | 'slight-left' | 'slight-right' | 'roundabout' | 'arrive' | 'depart' | 'merge' | 'fork';
  index: number;
}

export interface NavigationRoute {
  id: string;
  name: string;
  polyline: [number, number][];
  totalDistance: number;
  totalDuration: number;
  maneuvers: NavigationManeuver[];
  stops: NavigationStop[];
  vehiclePlate: string;
  driverName: string;
}

export interface NavigationStop {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  seq: number;
  eta: string;
  passed?: boolean;
}

export interface NavigationState {
  status: 'idle' | 'navigating' | 'paused' | 'arrived' | 'completed';
  currentManeuverIndex: number;
  currentStopIndex: number;
  speed: number;
  heading: number;
  progressPercent: number;
  remainingDistance: number;
  remainingDuration: number;
  elapsedTime: number;
  currentPosition: [number, number];
}

export interface NavigationProviderProps {
  route: NavigationRoute;
  navState: NavigationState;
  isNavigating: boolean;
  onNavigate: (action: 'start' | 'stop' | 'pause' | 'resume') => void;
}

export type MapProvider = 'leaflet' | 'google';
