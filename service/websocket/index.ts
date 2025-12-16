// packages/backend/src/websocket/index.ts
import { Server, Socket } from 'socket.io';
import http from 'http';
import logger from '../utils/logger';
import { ENV } from '../config/env';

let io: Server | null = null;

export const initializeWebSocket = (server: http.Server): void => {
  const corsOrigins = ENV.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: "/socket.io",
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    logger.info('🔌 WebSocket client connected', { 
      socketId: socket.id,
      ip: socket.handshake.address,
      transport: socket.conn.transport.name
    });

    // Debug: Log all subscription attempts
    socket.on('subscribe:intent', (intentId: string) => {
      if (!intentId) {
        logger.warn('❌ Invalid intent subscription attempt', { socketId: socket.id });
        return;
      }
      socket.join(`intent:${intentId}`);
      logger.info(`🎯 Intent subscribed: intent:${intentId}`, { 
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });
    });

    socket.on('subscribe:user', (walletAddress: string) => {
      if (!walletAddress) {
        logger.warn('❌ Invalid wallet subscription attempt', { socketId: socket.id });
        return;
      }
      // ✅ Normalize wallet to lowercase for consistency
      const normalizedWallet = walletAddress.toLowerCase();
      socket.join(`user:${normalizedWallet}`);
      logger.info(`👤 User subscribed: user:${normalizedWallet}`, { 
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });
    });

    socket.on('subscribe:merchant', (apiKey: string) => {
      if (!apiKey) {
        logger.warn('❌ Invalid merchant subscription attempt', { socketId: socket.id });
        return;
      }
      socket.join(`merchant:${apiKey}`);
      logger.info(`🏪 Merchant subscribed: merchant:${apiKey.slice(-6)}`, { 
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info('🔌 WebSocket client disconnected', { 
        socketId: socket.id, 
        reason,
        rooms: Array.from(socket.rooms) // Show what rooms they left
      });
    });

    socket.on('error', (err: Error) => {
      logger.error('💥 Socket error', { socketId: socket.id, error: err.message });
    });
  });

  logger.info('✅ WebSocket server initialized');
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

  // ✅ Normalize wallet address
  const normalizedWallet = data.userWallet.toLowerCase();
  
  logger.info('📡 BROADCASTING agent log', {
    intentRoom: `intent:${data.intentId}`,
    userRoom: `user:${normalizedWallet}`,
    message: data.message,
  });

  io.to(`intent:${data.intentId}`).emit('agent:log', data);
  io.to(`user:${normalizedWallet}`).emit('agent:log', data);
  
  // ✅ Debug: Log rooms to verify broadcast targets
  io.fetchSockets().then(sockets => {
    const targetSockets = sockets.filter(s => 
      s.rooms.has(`intent:${data.intentId}`) || 
      s.rooms.has(`user:${normalizedWallet}`)
    );
    logger.debug(`📡 Broadcast reached ${targetSockets.length} sockets`);
  });
};