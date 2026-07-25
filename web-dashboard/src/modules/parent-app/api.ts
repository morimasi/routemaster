import { ShuttleXApiService } from '../../services/api';

export const parentApi = {
  flagAbsence: (tenantId: string, routeId: string, nodeId: string, parentId: string, note: string) =>
    ShuttleXApiService.flagParentAbsence(tenantId, routeId, nodeId, parentId, note),
  initChatRoom: (tenantId: string, parentId: string, teacherId: string) =>
    ShuttleXApiService.initChatRoom(tenantId, parentId, teacherId),
  sendMessage: (roomId: string, text: string, parentId: string) =>
    ShuttleXApiService.sendChatMessage(roomId, text, parentId),
};
