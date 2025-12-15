
import { Asset } from '../models/asset.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { AppDataSource } from '../config/database';
import logger from '../utils/logger';
import { broadcastAgentLog } from '../websocket';
import { LessThanOrEqual } from 'typeorm';
import { AgentIntent } from '../models/agent-intent.entity';
import { AssetType } from '../enums/asset-type.enum';

const agentIntentRepository = AppDataSource.getRepository(AgentIntent);
const assetRepository = AppDataSource.getRepository(Asset);

export class AgentExecutionService {
  /**
   * Main execution loop: processes all pending agent intents
   * Called every 30 seconds via setInterval
   */
  static async executeIntents(): Promise<void> {
    try {
      // Fetch all unfulfilled intents
      const pendingIntents = await agentIntentRepository.find({
        where: { isFulfilled: false },
        relations: ['selectedAsset']
      });

      if (pendingIntents.length === 0) {
        logger.debug('No pending agent intents to process');
        return;
      }

      logger.info(`🤖 Processing ${pendingIntents.length} agent intents`);

      for (const intent of pendingIntents) {
        await this.processIntent(intent);
      }
    } catch (error) {
      logger.error('❌ Agent execution loop failed', { error });
    }
  }

  /**
   * Process a single intent: find best asset, notify user
   */
  static async processIntent(intent: AgentIntent): Promise<void> {
    try {
      // Skip if we already found an asset but waiting for approval
      if (intent.selectedAssetId) {
        logger.debug(`Intent ${intent.id} already has selected asset, waiting for approval`);
        return;
      }

      logger.info(`🔍 Agent scanning for ${intent.assetType}`, {
        intentId: intent.id,
        userWallet: intent.userWallet,
        maxPrice: intent.maxPricePerUnit
      });

      // Find matching available assets
      const availableAssets = await assetRepository.find({
        where: {
          status: AssetStatus.AVAILABLE,
          pricePerUnit: LessThanOrEqual(intent.maxPricePerUnit)
        },
        order: { pricePerUnit: 'ASC' }
      });

      if (availableAssets.length === 0) {
        await this.broadcastNoAssetsFound(intent);
        return;
      }

      // Select cheapest asset (best deal)
      const bestAsset = availableAssets[0];
      
      logger.info(`✅ Agent found asset`, {
        intentId: intent.id,
        assetId: bestAsset.id,
        assetName: bestAsset.name,
        price: bestAsset.pricePerUnit
      });

      // Update intent with selection
      intent.selectedAssetId = bestAsset.id;
      await agentIntentRepository.save(intent);

      // Calculate total cost
      const totalCost = (
        parseFloat(bestAsset.pricePerUnit) * intent.durationMinutes
      ).toFixed(6);

      // Notify user via WebSocket
      broadcastAgentLog({
        intentId: intent.id,
        userWallet: intent.userWallet,
        timestamp: new Date(),
        message: `🎉 Found ${bestAsset.name} at $${bestAsset.pricePerUnit}/min`,
        asset: {
          id: bestAsset.id,
          name: bestAsset.name,
          pricePerUnit: bestAsset.pricePerUnit
        },
        totalCost,
        requiresApproval: true,
        action: 'PAYMENT_READY'
      });

    } catch (error) {
      logger.error(`❌ Failed to process intent ${intent.id}`, { error });
      
      broadcastAgentLog({
        intentId: intent.id,
        userWallet: intent.userWallet,
        timestamp: new Date(),
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        action: 'ERROR'
      });
    }
  }

  /**
   * Broadcast when no assets match the criteria
   */
  private static async broadcastNoAssetsFound(intent: AgentIntent): Promise<void> {
    logger.info(`❌ No assets found for intent`, {
      intentId: intent.id,
      assetType: intent.assetType,
      maxPrice: intent.maxPricePerUnit
    });

    broadcastAgentLog({
      intentId: intent.id,
      userWallet: intent.userWallet,
      timestamp: new Date(),
      message: `❌ No ${intent.assetType} assets available under $${intent.maxPricePerUnit}`,
      action: 'NO_ASSETS_FOUND'
    });

    // Optionally mark as fulfilled to stop scanning
    // intent.isFulfilled = true;
    // await agentIntentRepository.save(intent);
  }

  /**
   * Mark an intent as fulfilled after successful payment
   */
  static async markIntentFulfilled(intentId: string): Promise<void> {
    const intent = await agentIntentRepository.findOne({ where: { id: intentId } });
    if (!intent) return;

    intent.isFulfilled = true;
    await agentIntentRepository.save(intent);

    logger.info(`✅ Intent marked as fulfilled`, { intentId });
  }
}