import express from 'express';
import cors from "cors";
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import router from './routes/v1';
import { corsConfig } from './middleware/cors';


export const createApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cors(corsConfig));
  
  // Logging
  app.use((req, res, next) => {
    logger.info('📥 Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // Routes
  app.use('/api', router);

  // Error handling
  app.use(errorHandler);

  return app;
};