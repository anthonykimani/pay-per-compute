import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Merchant } from '../models/merchant.entity';
import logger from '../utils/logger';


const merchantRepository = AppDataSource.getRepository(Merchant);

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_API_KEY' });
  }

  const merchant = await merchantRepository.findOne({ where: { apiKey } });
  
  if (!merchant) {
    logger.warn('❌ Unauthorized merchant access', { 
      ip: req.ip,
      attemptedKey: apiKey.slice(-4)
    });
    return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_API_KEY' });
  }

  if (!merchant.isActive) {
    return res.status(403).json({ error: 'Merchant account disabled' });
  }

  (req as any).merchant = merchant; // ✅ Attach merchant to request
  logger.info('✅ Merchant authenticated', { merchantId: merchant.id });
  next();
};