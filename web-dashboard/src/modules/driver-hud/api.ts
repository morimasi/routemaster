import { ShuttleXApiService } from '../../services/api';

export const driverHudApi = {
  executePrune: (tenantId: string, routeId: string, nodeId: string, driverId: string) =>
    ShuttleXApiService.executeDriverPrune(tenantId, routeId, nodeId, driverId),
  parseVoiceIntent: (phrase: string) =>
    ShuttleXApiService.parseVoiceIntent(phrase),
};
