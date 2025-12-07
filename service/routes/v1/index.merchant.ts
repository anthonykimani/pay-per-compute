import { Router, Request, Response, NextFunction } from 'express';
import { ENV } from '../../config/env';
import logger from '../../utils/logger';
import { apiKeyLimiter } from '../../middleware/rate-limitier';
import { MerchantController } from '../../controllers/merchant-controller';

const router = Router();

// API Key verification middleware
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== ENV.MERCHANT_API_KEY) {
    logger.warn('❌ Unauthorized merchant access attempt', { 
      ip: req.ip,
      path: req.path 
    });
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'INVALID_API_KEY' 
    });
  }
  
  logger.info('✅ Merchant authenticated', { path: req.path });
  next();
};

// Apply API key verification to all merchant routes
router.use(verifyApiKey);

// Asset management
router.get('/assets', apiKeyLimiter, MerchantController.getAssets);

// Earnings reports
router.get('/earnings', apiKeyLimiter, MerchantController.getEarnings);

// Update asset (price, status, etc.)
router.patch('/assets/:id', apiKeyLimiter, MerchantController.updateAsset);

export default router;