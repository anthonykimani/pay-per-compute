import { Request, Response } from 'express';
import { AssetService } from '../services/asset-service';
import { Merchant } from '../models/merchant.entity';
import logger from '../utils/logger';
import { Asset } from '../models/asset.entity';
import { PaymentLogService } from '../services/payment-log-service';

export class MerchantController {
  static async getAssets(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as Merchant;
      const assets = await AssetService.getByMerchant(merchant.id);
      const earnings = await PaymentLogService.getEarningsByMerchant(merchant.id);
      
      res.json({ status: 'success', data: assets });
    } catch (error) {
      logger.error('❌ Failed to fetch merchant assets', { error });
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  }

  static async getEarnings(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as Merchant;
      const { startDate, endDate } = req.query;
      
      const earnings = await PaymentLogService.getEarningsReport(
        merchant.id,
        startDate as string,
        endDate as string
      );
      
      res.json({ status: 'success', data: earnings });
    } catch (error) {
      logger.error('❌ Failed to fetch earnings', { error });
      res.status(500).json({ error: 'Failed to fetch earnings' });
    }
  }

  static async updateAsset(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const merchant = (req as any).merchant as Merchant;
      
      // Verify asset belongs to merchant
      const asset = await AssetService.getById(id);
      if (!asset) {
        return res.status(403).json({ error: 'Not your asset' });
      }

      const allowedFields: (keyof Asset)[] = ['name', 'pricePerUnit', 'unit', 'status', 'metadata'];
      const updateData: Partial<Asset> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      await AssetService.updateAsset(id, updateData);
      res.json({ status: 'success', message: 'Asset updated' });
    } catch (error) {
      logger.error('❌ Failed to update asset', { error });
      res.status(400).json({ error: 'Invalid update data' });
    }
  }
}