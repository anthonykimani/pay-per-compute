import { Request, Response, NextFunction } from 'express';
import { MerchantService } from '../services/merchant-service';
import logger from '../utils/logger';


export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'MISSING_API_KEY' 
    });
  }

  // Skip auth for development (optional)
  if (process.env.NODE_ENV === 'development' && apiKey === 'dev-bypass') {
    (req as any).merchant = { id: 'dev-merchant', walletAddress: process.env.MERCHANT_WALLET };
    return next();
  }

  const merchant = await MerchantService.getByApiKey(apiKey);
  
  if (!merchant) {
    logger.warn('❌ Unauthorized merchant access', { 
      ip: req.ip,
      attemptedKey: apiKey.slice(-4)
    });
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'INVALID_API_KEY' 
    });
  }

  if (!merchant.isActive) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      code: 'ACCOUNT_DISABLED' 
    });
  }

  (req as any).merchant = merchant;
  logger.info('✅ Merchant authenticated', { merchantId: merchant.id });
  next();
};