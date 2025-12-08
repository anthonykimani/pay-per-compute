import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AssetStatus } from '../enums/asset-status.enum';
import { UnitType } from '../enums/unit-type.enum';
import { Asset } from '../models/asset.entity';
import { Session } from '../models/session.entity';
import logger from '../utils/logger';

const assetRepository = AppDataSource.getRepository(Asset);
const sessionRepository = AppDataSource.getRepository(Session)

export class AssetService {
    static async getAll() {
        return assetRepository.find({
            relations: ['merchant'],
            order: { createdAt: 'DESC' }
        });
    }

    static async getById(id: string) {
        return assetRepository.findOne({
            relations: ['merchant'],
            where: { id },
        });
    }

    static async getByMerchant(merchantId: string) {
        return assetRepository.find({
            where: { merchantId },
            relations: ['merchant']
        });
    }

    static async getStatus(assetId: string) {
        const asset = await this.getById(assetId);
        if (!asset) {
            throw new Error(`Asset ${assetId} not found`);
        }

        const currentSession = await this.getCurrentSession(assetId);

        return {
            id: asset.id,
            name: asset.name,
            status: asset.status,
            type: asset.type,
            currentSession: currentSession || null
        };
    }

    static async getCurrentSession(assetId: string) {
        return sessionRepository.findOne({
            where: { asset: { id: assetId }, expiresAt: MoreThan(new Date()) },
            relations: ['asset'],
            order: { createdAt: 'DESC' }
        });
    }

    static async create(data: Partial<Asset>) {
        const asset = assetRepository.create({
            name: data.name!,
            pricePerUnit: data.pricePerUnit!,
            unit: data.unit as UnitType,
            type: data.type!,
            status: AssetStatus.AVAILABLE,
            merchantWallet: data.merchantWallet!,
            metadata: data.metadata || {}
        });

        return assetRepository.save(asset);
    }

    static async unlock(assetId: string, sessionToken: string) {
        // ✅ Pass a partial Session object with the token (primary key)
        const result = await assetRepository.update(assetId, {
            status: AssetStatus.OCCUPIED
        });

        if (result.affected === 0) {
            throw new Error(`Failed to unlock asset ${assetId}`);
        }

        logger.info('🔓 Asset unlocked', { assetId, sessionToken });
    }

    static async lock(assetId: string) {
        const result = await assetRepository.update(assetId, {
            status: AssetStatus.AVAILABLE
        });

        if (result.affected === 0) {
            throw new Error(`Failed to lock asset ${assetId}`);
        }

        logger.info('🔒 Asset locked', { assetId });
    }

    static async updatePrice(assetId: string, pricePerUnit: string, unit: UnitType) {
        await this.updateAsset(assetId, { pricePerUnit, unit });
        logger.info('💰 Asset price updated', { assetId, pricePerUnit, unit });
    }
    
    // Add this method to your existing AssetService class
    static async updateAsset(id: string, updateData: Partial<Asset>) {
        const result = await assetRepository.update(id, updateData);

        if (result.affected === 0) {
            throw new Error(`Asset ${id} not found`);
        }

        logger.info('📝 Asset updated', { id, ...updateData });
    }
}