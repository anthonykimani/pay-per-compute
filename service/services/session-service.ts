import { AppDataSource } from '../config/database';
import { Asset } from '../models/asset.entity';
import { Session } from '../models/session.entity';

import { AssetStatus } from '../enums/asset-status.enum';
import { ENV } from '../config/env';
import { UnitType } from '../enums/unit-type.enum';
import { MoreThan } from 'typeorm'; // ✅ For date comparisons
import logger from '../utils/logger';

const sessionRepository = AppDataSource.getRepository(Session);
const assetRepository = AppDataSource.getRepository(Asset);

export class SessionService {
  private static expiryTimers = new Map<string, NodeJS.Timeout>();

  // ✅ NEW: Fetch asset by ID (needed for dynamic payment middleware)
  static async getAsset(assetId: string): Promise<Asset | null> {
    return assetRepository.findOne({
      where: { id: assetId }
    });
  }

  // ✅ FIXED: Use MoreThan for date comparison
  static async getActiveSession(assetId: string): Promise<Session | null> {
    return sessionRepository.findOne({
      where: {
        assetId,
        expiresAt: MoreThan(new Date()) // ✅ Correct: expiresAt > now
      },
      relations: ['asset'],
      order: { createdAt: 'DESC' }
    });
  }

  // ✅ FIXED: Use MoreThan for date comparison
  static async isSessionActive(assetId: string): Promise<boolean> {
    const session = await sessionRepository.findOne({
      where: {
        assetId,
        expiresAt: MoreThan(new Date())
      }
    });
    return !!session;
  }

  // ✅ BETTER: Query builder approach (more flexible)
  static async hasActiveSession(assetId: string): Promise<boolean> {
    const count = await sessionRepository
      .createQueryBuilder('session')
      .where('session.assetId = :assetId', { assetId })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .getCount();
    
    return count > 0;
  }

  static async createSession(assetId: string, amount: string, payer: string) {
    const asset = await assetRepository.findOneBy({ id: assetId });
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new Error(`Asset ${assetId} is not available`);
    }

    const pricePerUnit = parseFloat(asset.pricePerUnit);
    const amountPaid = parseFloat(amount);
    const baseMinutes = amountPaid / pricePerUnit;
    const durationMs = this.calculateDurationMs(baseMinutes, asset.unit);

    const token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + durationMs);

    const session = sessionRepository.create({
      token,
      assetId,
      payerWallet: payer,
      amountPaid: amount,
      expiresAt,
      startedAt: new Date()
    });

    await sessionRepository.save(session);

    const timer = setTimeout(async () => {
      await this.expireSession(token);
    }, durationMs);
    
    this.expiryTimers.set(token, timer);

    logger.info('✅ Session created', { token, assetId, durationMs, expiresAt });

    return session;
  }

  static async getSession(token: string) {
    return sessionRepository.findOne({
      where: { token },
      relations: ['asset']
    });
  }

  static async extendSession(token: string, additionalAmount: string) {
    const session = await this.getSession(token);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session already expired');
    }

    const asset = await assetRepository.findOneBy({ id: session.assetId });
    if (!asset) {
      throw new Error('Associated asset not found');
    }

    const additionalMinutes = parseFloat(additionalAmount) / parseFloat(asset.pricePerUnit);
    const additionalMs = this.calculateDurationMs(additionalMinutes, asset.unit);
    const newExpiry = new Date(session.expiresAt.getTime() + additionalMs);

    const existingTimer = this.expiryTimers.get(token);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    session.expiresAt = newExpiry;
    session.isExtended = true;
    await sessionRepository.save(session);

    const timer = setTimeout(async () => {
      await this.expireSession(token);
    }, additionalMs);
    
    this.expiryTimers.set(token, timer);

    logger.info('✅ Session extended', { token, newExpiry });

    return session;
  }

  private static calculateDurationMs(minutes: number, unit: UnitType): number {
    switch (unit) {
      case 'hour':
        return minutes * 60 * 60 * 1000;
      case 'day':
        return minutes * 24 * 60 * 60 * 1000;
      case 'session':
        return minutes * 60 * 60 * 1000;
      case 'minute':
      default:
        return minutes * 60 * 1000;
    }
  }

  static async expireSession(token: string) {
    const timer = this.expiryTimers.get(token);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(token);
    }

    const session = await this.getSession(token);
    if (!session) return;

    await assetRepository.update(session.assetId, {
      status: AssetStatus.AVAILABLE,
      currentSession: null
    });

    await sessionRepository.delete({ token });

    logger.info('⏰ Session expired', { token, assetId: session.assetId });
  }
}