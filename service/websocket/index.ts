// packages/backend/src/websocket/index.ts
import { Server } from 'socket.io';
import http from 'http';
import logger from '../utils/logger';
import { ENV } from '../config/env';

let io: Server | null = null;

export const initializeWebSocket = (server: http.Server): void => {
  const corsOrigins = ENV.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info('🔌 WebSocket client connected', { 
      socketId: socket.id,
      ip: socket.handshake.address 
    });

    // Error handling
    socket.on('error', (err) => {
      logger.error('Socket error:', { socketId: socket.id, error: err });
    });

    socket.on('subscribe:user', (walletAddress: string) => {
      if (!walletAddress) {
        logger.warn('Invalid wallet subscription attempt', { socketId: socket.id });
        return;
      }
      socket.join(`user:${walletAddress}`);
      logger.info(`👤 User subscribed`, { walletAddress, socketId: socket.id });
    });

    socket.on('subscribe:merchant', (apiKey: string) => {
      if (!apiKey) {
        logger.warn('Invalid merchant subscription attempt', { socketId: socket.id });
        return;
      }
      socket.join(`merchant:${apiKey}`);
      logger.info(`🏪 Merchant subscribed`, { apiKey: apiKey.slice(-6), socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      logger.info('🔌 WebSocket client disconnected', { 
        socketId: socket.id, 
        reason 
      });
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