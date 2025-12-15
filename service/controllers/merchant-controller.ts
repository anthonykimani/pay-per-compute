// packages/backend/src/controllers/merchant-controller.ts
import { Request, Response } from 'express';
import { AssetService } from '../services/asset-service';
import { Merchant } from '../models/merchant.entity';
import logger from '../utils/logger';
import { Asset } from '../models/asset.entity';
import { PaymentLogService } from '../services/payment-log-service';
import { AppDataSource } from '../config/database';
import { PaymentLog } from '../models/paymentlog.entity';
import { Between, In } from 'typeorm';

const paymentLogRepository = AppDataSource.getRepository(PaymentLog);

export class MerchantController {
  static async getAssets(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as Merchant;

      // Fetch assets with their session counts and earnings
      const assets = await AssetService.getByMerchant(merchant.id);

      // Enhance assets with earnings data
      const assetsWithEarnings = await Promise.all(
        assets.map(async (asset) => {
          const earnings = await paymentLogRepository.find({
            where: { assetId: asset.id, success: true },
          });

          const totalEarnings = earnings.reduce(
            (sum, log) => sum + parseFloat(log.amount || '0'),
            0
          );

          return {
            ...asset,
            totalEarnings: totalEarnings.toFixed(6),
            totalSessions: earnings.length,
          };
        })
      );

      res.json({
        status: 'success',
        data: assetsWithEarnings,
      });
    } catch (error) {
      logger.error('❌ Failed to fetch merchant assets', { error });
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  }

  static async getEarnings(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as Merchant;
      const { startDate, endDate } = req.query;

      // Get all merchant assets first
      const assets = await AssetService.getByMerchant(merchant.id);
      const assetIds = assets.map(a => a.id);

      // Build query for all merchant's assets
      const whereClause: any = {
        success: true,
        assetId: In(assetIds),
      };

      if (startDate && endDate) {
        whereClause.timestamp = Between(new Date(startDate as string), new Date(endDate as string));
      }

      const payments = await paymentLogRepository.find({
        where: whereClause,
        order: { timestamp: 'DESC' },
        relations: ['asset'],
      });

      const totalEarnings = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount || '0'),
        0
      );

      res.json({
        status: 'success',
        data: {
          totalEarnings: totalEarnings.toFixed(6),
          paymentCount: payments.length,
          payments,
        },
      });
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
      if (!asset || asset.merchantId !== merchant.id) {
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

  // ✅ NEW: Create asset for merchant
  static async createAsset(req: Request, res: Response) {
    try {
      const merchant = (req as any).merchant as Merchant;
      const { name, pricePerUnit, unit, type, metadata } = req.body;

      const asset = await AssetService.create({
        name,
        pricePerUnit,
        unit,
        type,
        metadata,
        merchantWallet: merchant.walletAddress,
        merchantId: merchant.id,
      });

      res.status(201).json({
        status: 'success',
        data: asset,
        message: 'Asset created successfully',
      });
    } catch (error) {
      logger.error('❌ Failed to create merchant asset', { error });
      res.status(400).json({ error: 'Invalid asset data' });
    }
  }
}