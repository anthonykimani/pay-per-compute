// packages/backend/src/websocket/index.ts
import { Server } from 'socket.io';
import http from 'http';
import logger from '../utils/logger';

let io: Server | null = null;

export const initializeWebSocket = (server: http.Server): void => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info('🔌 WebSocket client connected', { socketId: socket.id });

    // User subscribes to their wallet events
    socket.on('subscribe:user', (walletAddress: string) => {
      socket.join(`user:${walletAddress}`);
      logger.info(`👤 User subscribed`, { walletAddress });
    });

    // Merchant subscribes via API key
    socket.on('subscribe:merchant', (apiKey: string) => {
      socket.join(`merchant:${apiKey}`);
      logger.info(`🏪 Merchant subscribed`, { apiKey: apiKey.slice(-6) });
    });

    socket.on('disconnect', () => {
      logger.info('🔌 WebSocket client disconnected', { socketId: socket.id });
    });
  });
};

/**
 * Broadcast agent log to specific user
 */
export const broadcastAgentLog = (data: {
  intentId: string;
  userWallet: string;
  timestamp: Date;
  message: string;
  action: string;
  asset?: { id: string; name: string; pricePerUnit: string };
  totalCost?: string;
  requiresApproval?: boolean;
}): void => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }

  io.to(`user:${data.userWallet}`).emit('agent:log', data);
  logger.debug('📡 Broadcasted agent log', { intentId: data.intentId });
};

/**
 * Broadcast price change to all users
 */
export const broadcastPriceChange = (data: {
  assetId: string;
  oldPrice: string;
  newPrice: string;
}): void => {
  if (!io) return;

  io.emit('price:update', data);
  logger.debug('📡 Broadcasted price update', { assetId: data.assetId });
};