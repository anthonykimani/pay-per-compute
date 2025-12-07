import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Asset } from '../models/asset.entity';
import { PaymentLog } from '../models/paymentlog.entity';
import { AssetService } from '../services/asset-service';

import { AssetStatus } from '../enums/asset-status.enum';
import { UnitType } from '../enums/unit-type.enum';
import { Between } from 'typeorm';
import logger from '../utils/logger';

const paymentLogRepository = AppDataSource.getRepository(PaymentLog);

export class MerchantController {
    static async getAssets(req: Request, res: Response) {
        try {
            // ✅ Use service layer for consistency
            const assets = await AssetService.getAll();

            // ✅ Calculate earnings with proper typing
            const earnings = await paymentLogRepository
                .createQueryBuilder('log')
                .select(['log.assetId', 'SUM(log.amount) as totalEarnings'])
                .where('log.success = :success', { success: true })
                .groupBy('log.assetId')
                .getRawMany();

            const earningsMap = new Map<string, string>(
                earnings.map(e => [e.log_assetId, e.totalEarnings])
            );

            const assetsWithEarnings = assets.map(asset => ({
                ...asset,
                totalEarnings: earningsMap.get(asset.id) || '0'
            }));

            res.json({
                status: 'success',
                data: assetsWithEarnings
            });
        } catch (error) {
            logger.error('❌ Failed to fetch merchant assets', { error });
            res.status(500).json({ error: 'Failed to fetch assets' });
        }
    }

    static async getEarnings(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            // ✅ Build query safely with parameterized dates
            const whereClause: any = { success: true };

            if (startDate && endDate) {
                whereClause.timestamp = Between(
                    new Date(startDate as string),
                    new Date(endDate as string)
                );
            }

            const payments = await paymentLogRepository.find({
                where: whereClause,
                order: { timestamp: 'DESC' }
            });

            const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

            res.json({
                status: 'success',
                data: {
                    totalEarnings: total.toFixed(6), // ✅ Consistent decimal precision
                    paymentCount: payments.length,
                    payments
                }
            });
        } catch (error) {
            logger.error('❌ Failed to fetch earnings', { error });
            res.status(500).json({ error: 'Failed to fetch earnings' });
        }
    }

    static async updateAsset(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // ✅ Type the array
            const allowedFields: (keyof Asset)[] = ['name', 'pricePerUnit', 'unit', 'status', 'metadata'];
            const updateData: Partial<Asset> = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }

            // ✅ Validate enum values
            if (updateData.status && !Object.values(AssetStatus).includes(updateData.status)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            if (updateData.unit && !Object.values(UnitType).includes(updateData.unit)) {
                return res.status(400).json({ error: 'Invalid unit value' });
            }

            const result = await AssetService.updateAsset(id, updateData);

            res.json({
                status: 'success',
                message: 'Asset updated'
            });
        } catch (error) {
            logger.error('❌ Failed to update asset', { error });
            res.status(400).json({ error: error || 'Invalid update data' });
        }
    }
}