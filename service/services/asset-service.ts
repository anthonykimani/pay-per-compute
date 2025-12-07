import { AppDataSource } from '../config/database';
import { AssetStatus } from '../enums/asset-status.enum';
import { UnitType } from '../enums/unit-type.enum';
import { Asset } from '../models/asset.entity';
import { Session } from '../models/session.entity';
import logger from '../utils/logger';

const assetRepository = AppDataSource.getRepository(Asset);

export class AssetService {
    static async getAll() {
        return assetRepository.find({
            relations: ['currentSession'],
            order: { createdAt: 'DESC' }
        });
    }

    static async getById(id: string) {
        return assetRepository.findOne({
            where: { id },
            relations: ['currentSession']
        });
    }

    static async getStatus(assetId: string) {
        const asset = await this.getById(assetId);
        if (!asset) {
            throw new Error(`Asset ${assetId} not found`);
        }

        return {
            id: asset.id,
            name: asset.name,
            status: asset.status,
            type: asset.type,
            currentSession: asset.currentSession
        };
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
            status: AssetStatus.OCCUPIED,
            currentSession: { token: sessionToken } as Partial<Session> // Type assertion for safety
        });

        if (result.affected === 0) {
            throw new Error(`Failed to unlock asset ${assetId}`);
        }

        logger.info('🔓 Asset unlocked', { assetId, sessionToken });
    }

    static async lock(assetId: string) {
        const result = await assetRepository.update(assetId, {
            status: AssetStatus.AVAILABLE,
            currentSession: null
        });

        if (result.affected === 0) {
            throw new Error(`Failed to lock asset ${assetId}`);
        }

        logger.info('🔒 Asset locked', { assetId });
    }

    static async updatePrice(assetId: string, pricePerUnit: string, unit: UnitType) {
        const result = await assetRepository.update(assetId, {
            pricePerUnit,
            unit // ✅ Already typed as UnitType enum
        });

        if (result.affected === 0) {
            throw new Error(`Asset ${assetId} not found`);
        }

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