import { Router, Request, Response, NextFunction } from 'express';

import { ENV } from '../../config/env';
import logger from '../../utils/logger';
import { AssetController } from '../../controllers/asset-controller';
import { paymentLimiter } from '../../middleware/rate-limitier';

const router = Router();

// Public routes (status checks)
router.get('/', paymentLimiter, AssetController.list);
router.get('/:assetId/status', paymentLimiter, AssetController.getStatus);

// Admin routes (require API key)
router.post('/', verifyApiKey, paymentLimiter, AssetController.create);
router.patch('/:id/price', verifyApiKey, paymentLimiter, AssetController.updatePrice);
router.patch('/:id', verifyApiKey, paymentLimiter, AssetController.updateAsset);

// ✅ Typed API key middleware
function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey || apiKey !== ENV.MERCHANT_API_KEY) {
    logger.warn('❌ Unauthorized merchant access', { 
      ip: req.ip,
      attemptedKey: apiKey ? '***' + apiKey.slice(-4) : 'none'
    });
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'INVALID_API_KEY' 
    });
  }
  
  next();
}

export default router;