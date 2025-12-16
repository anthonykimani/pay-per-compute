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
      logger.info('⏰ Agent execution loop STARTED'); // ✅  Debug log
      
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
      logger.error('❌ Agent execution loop FAILED', { error }); // ✅ UPDATED: More descriptive error
    }
  }

  /**
   * Process a single intent: find best asset, notify user
   */
  static async processIntent(intent: AgentIntent): Promise<void> {
    try {
      // ✅ Check if relation exists instead of checking ID
      if (intent.selectedAsset) {
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

      // ✅ Set the relation directly instead of setting ID
      intent.selectedAsset = bestAsset;
      
      await agentIntentRepository.save(intent);

      // ✅ Access asset properties via the relation
      const totalCost = (
        parseFloat(intent.selectedAsset.pricePerUnit) * intent.durationMinutes
      ).toFixed(6);

      // Notify user via WebSocket
      broadcastAgentLog({
        intentId: intent.id,
        userWallet: intent.userWallet,
        timestamp: new Date(),
        message: `🎉 Found ${intent.selectedAsset.name} at $${intent.selectedAsset.pricePerUnit}/min`,
        asset: {
          id: intent.selectedAsset.id,
          name: intent.selectedAsset.name,
          pricePerUnit: intent.selectedAsset.pricePerUnit
        },
        totalCost,
        requiresApproval: true,
        action: 'PAYMENT_READY'
      });

      logger.info(`✅ Intent marked as fulfilled after broadcasting`, { intentId: intent.id });

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
    const intent = await agentIntentRepository.findOne({ 
      where: { id: intentId },
      relations: ['selectedAsset'] 
    });
    if (!intent) return;

    intent.isFulfilled = true;
    await agentIntentRepository.save(intent);

    logger.info(`✅ Intent marked as fulfilled`, { intentId });
  }
}