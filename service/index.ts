import { createApp } from './app';
import { initializeDatabase } from './config/database';
import { initializeWebSocket } from './websocket/index'; 
import http from 'http';
import { ENV } from './config/env';
import logger from './utils/logger';
import { AgentExecutionService } from './services/agent-execution-service'; // ✅ ADD THIS IMPORT

const bootstrap = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();
    
    // Create HTTP server
    const server = http.createServer(app);

    initializeWebSocket(server);

    // Start server
    server.listen(ENV.PORT, () => {
      logger.info(`🚀 PayPerCompute Backend v2.0.0 started`, {
        port: ENV.PORT,
        env: ENV.NODE_ENV,
        network: ENV.PAYAI_NETWORK,
        facilitator: ENV.PAYAI_FACILITATOR_URL
      });
    });

    //  Start agent intent processing loop
    setInterval(async () => {
      logger.debug('⏰ Agent execution interval triggered');
      await AgentExecutionService.executeIntents();
    }, 30000); // Run every 30 seconds

    logger.info('🤖 Agent execution loop started (30s interval)');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('💥 Failed to bootstrap application', { error });
    process.exit(1);
  }
};

bootstrap();