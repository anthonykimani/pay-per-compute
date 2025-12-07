import { Request, Response } from 'express';

import { AppDataSource } from '../config/database';
import { Asset } from '../models/asset.entity';
import { AssetService } from '../services/asset-service';
import logger from '../utils/logger';

const assetRepository = AppDataSource.getRepository(Asset);

export class AssetController {
    static async list(req: Request, res: Response) {
        try {
            const assets = await AssetService.getAll();
            res.json({
                status: 'success',
                count: assets.length,
                data: assets
            });
        } catch (error) {
            logger.error('❌ Failed to list assets', { error });
            res.status(500).json({ error: 'Failed to fetch assets' });
        }
    }

    static async getStatus(req: Request, res: Response) {
        try {
            const { assetId } = req.params;
            const status = await AssetService.getStatus(assetId);
            res.json({ status: 'success', data: status });
        } catch (error) {
            logger.error('❌ Failed to get asset status', { error });
            res.status(404).json({ error: 'Asset not found' });
        }
    }

    static async updatePrice(req: Request, res: Response) {
        try {
            const { assetId } = req.params;
            const { pricePerUnit, unit } = req.body;

            await AssetService.updatePrice(assetId, pricePerUnit, unit);
            res.json({ status: 'success', message: 'Price updated' });
        } catch (error) {
            logger.error('❌ Failed to update price', { error });
            res.status(500).json({ error: 'Failed to update price' });
        }
    }

    static async updateAsset(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // ✅ Whitelist allowed fields
            const allowedFields: (keyof Asset)[] = ['name', 'pricePerUnit', 'unit', 'status', 'metadata'];
            const updateData: Partial<Asset> = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }

            await AssetService.updateAsset(id, updateData);
            res.json({ status: 'success', message: 'Asset updated successfully' });
        } catch (error) {
            logger.error('❌ Failed to update asset', { error });
            res.status(400).json({ error: error || 'Invalid update data' });
        }
    }


    static async create(req: Request, res: Response) {
        try {
            const asset = assetRepository.create(req.body);
            await assetRepository.save(asset);
            res.status(201).json({ status: 'success', data: asset });
        } catch (error) {
            logger.error('❌ Failed to create asset', { error });
            res.status(400).json({ error: 'Invalid asset data' });
        }
    }
}