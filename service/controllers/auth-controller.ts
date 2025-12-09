import { Request, Response } from 'express';
import { MerchantService } from '../services/merchant-service';
import logger from '../utils/logger';


export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new merchant
   */
  static async register(req: Request, res: Response) {
    try {
      const { name, walletAddress, platformFeePercent } = req.body;

      if (!name || !walletAddress) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, walletAddress' 
        });
      }

      const merchant = await MerchantService.create({
        name,
        walletAddress,
        platformFeePercent
      });

      
      res.status(201).json({
        status: 'success',
        data: {
          merchantId: merchant.id,
          apiKey: merchant.apiKey, 
          walletAddress: merchant.walletAddress,
          platformFeePercent: merchant.platformFeePercent,
          createdAt: merchant.createdAt
        },
        message: 'Save your API key - it will not be shown again!'
      });
    } catch (error) {
      logger.error('❌ Merchant registration failed', { error });
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  }

  /**
   * POST /api/v1/auth/regenerate-key
   * Regenerate API key (requires old key)
   */
  static async regenerateKey(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as any;
      const newKey = await MerchantService.regenerateApiKey(merchant.id);

      res.json({
        status: 'success',
        data: { apiKey: newKey },
        message: 'API key regenerated. Save it securely!'
      });
    } catch (error) {
      logger.error('❌ API key regeneration failed', { error });
      res.status(500).json({ error: 'Failed to regenerate key' });
    }
  }

  /**
   * DELETE /api/v1/auth/deactivate
   * Deactivate merchant account
   */
  static async deactivate(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as any;
      await MerchantService.deactivate(merchant.id);

      res.json({
        status: 'success',
        message: 'Merchant account deactivated'
      });
    } catch (error) {
      logger.error('❌ Deactivation failed', { error });
      res.status(500).json({ error: 'Failed to deactivate' });
    }
  }
}