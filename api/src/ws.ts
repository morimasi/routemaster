import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shuttlex-premium-jwt-secret-2026';

interface WsClient {
  ws: WebSocket;
  tenantId: string;
  userId: string;
  role: string;
  subscriptions: Set<string>;
}

const clients = new Map<string, WsClient>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Token required');
      return;
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    const clientId = `${payload.userId}_${Date.now()}`;
    const client: WsClient = {
      ws,
      tenantId: payload.tenantId,
      userId: payload.userId,
      role: payload.role,
      subscriptions: new Set(),
    };
    clients.set(clientId, client);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
          case 'subscribe':
            if (msg.channel) client.subscriptions.add(msg.channel);
            break;
          case 'unsubscribe':
            if (msg.channel) client.subscriptions.delete(msg.channel);
            break;
        }
      } catch { /* ignore malformed */ }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      tenantId: payload.tenantId,
      user: { id: payload.userId, name: payload.name, role: payload.role },
    }));
  });

  return wss;
}

export function broadcast(tenantId: string, channel: string, data: unknown) {
  const message = JSON.stringify({ channel, data });
  clients.forEach((client) => {
    if (client.tenantId === tenantId && client.subscriptions.has(channel)) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  });
}

export function broadcastVehiclePosition(tenantId: string, vehicleData: unknown) {
  const message = JSON.stringify({
    channel: 'vehicle:positions',
    data: vehicleData,
  });
  clients.forEach((client) => {
    if (client.tenantId === tenantId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
