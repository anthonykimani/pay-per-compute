import { createApp } from './app';
import { initializeDatabase } from './config/database';
import http from 'http';
import { ENV } from './config/env';
import logger from './utils/logger';

const bootstrap = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();
    
    // Create HTTP server
    const server = http.createServer(app);

    // Start server
    server.listen(ENV.PORT, () => {
      logger.info(`🚀 PayPerCompute Backend v2.0.0 started`, {
        port: ENV.PORT,
        env: ENV.NODE_ENV,
        network: ENV.PAYAI_NETWORK,
        facilitator: ENV.PAYAI_FACILITATOR_URL
      });
    });

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