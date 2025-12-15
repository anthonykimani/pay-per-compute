import { AppDataSource } from '../config/database';
import { Merchant } from '../models/merchant.entity';
import crypto from 'crypto';
import logger from '../utils/logger';

const merchantRepository = AppDataSource.getRepository(Merchant);

export class MerchantService {
  /**
   * Generates a cryptographically secure API key
   * Format: sk_live_ + 48 random hex chars
   */
  static generateApiKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex').slice(0, 48)}`;
  }

  /**
   * Register a new merchant
   */
  static async create(data: {
    name: string;
    walletAddress: string;
    platformFeePercent?: number;
  }): Promise<Merchant> {
    // Ensure wallet is valid Solana address
    if (!this.isValidSolanaAddress(data.walletAddress)) {
      throw new Error('Invalid Solana wallet address');
    }

    const existing = await merchantRepository.findOne({
      where: [
        { walletAddress: data.walletAddress },
        { apiKey: this.generateApiKey() }
      ]
    });
    
    if (existing) {
      throw new Error('Merchant already exists');
    }

    const merchant = merchantRepository.create({
      name: data.name,
      walletAddress: data.walletAddress,
      apiKey: this.generateApiKey(),
      platformFeePercent: data.platformFeePercent || 2, // Default 2% fee
      isActive: true
    });

    await merchantRepository.save(merchant);

    logger.info('🎉 Merchant registered', { 
      merchantId: merchant.id, 
      wallet: merchant.walletAddress 
    });

    return merchant;
  }

  /**
   * Get merchant by API key for auth
   */
  static async getByApiKey(apiKey: string): Promise<Merchant | null> {
    return merchantRepository.findOne({ where: { apiKey } });
  }

  /**
   * Deactivate merchant
   */
  static async deactivate(merchantId: string): Promise<void> {
    await merchantRepository.update(merchantId, { isActive: false });
    logger.info('🚫 Merchant deactivated', { merchantId });
  }

  /**
   * Regenerate API key
   */
  static async regenerateApiKey(merchantId: string): Promise<string> {
    const newKey = this.generateApiKey();
    await merchantRepository.update(merchantId, { apiKey: newKey });
    logger.info('🔄 API key regenerated', { merchantId });
    return newKey;
  }

  static isValidSolanaAddress(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
}