
import { Request, Response } from 'express';
import { IntentParserService } from '../services/intent-parser-service';
import { AgentExecutionService } from '../services/agent-execution-service';
import { AgentIntent } from '../models/agent-intent.entity';
import { AppDataSource } from '../config/database';
import logger from '../utils/logger';
import { verifySignature } from '../utils/solana';

const agentIntentRepository = AppDataSource.getRepository(AgentIntent);

export class AgentController {
  static async createIntent(req: Request, res: Response) {
    try {
      const { message, signature } = req.body;
      const userWallet = req.headers['x-user-wallet'] as string;

      if (!message || !signature || !userWallet) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const isValid = await verifySignature(message, signature, userWallet);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const parsedIntent = await IntentParserService.parse(message, userWallet);
      IntentParserService.validate(parsedIntent);

      // ✅ FIX: Omit nullable fields entirely when not needed
      const intentData = {
        userWallet,
        assetType: parsedIntent.assetType,
        assetName: parsedIntent.assetName,
        durationMinutes: parsedIntent.durationMinutes,
        maxPricePerUnit: parsedIntent.maxPricePerUnit,
        action: parsedIntent.action,
        isFulfilled: false,
        // selectedAssetId is omitted completely (not null, not undefined)
      };

      const insertResult = await agentIntentRepository.insert(intentData as any);

      const intentId = insertResult.identifiers[0].id as string;
      const intent = await agentIntentRepository.findOne({ where: { id: intentId } });

      if (!intent) {
        throw new Error('Failed to retrieve created intent');
      }

      AgentExecutionService.executeIntents();

      res.status(201).json({
        intentId: intent.id,
        status: 'created',
        parsed: parsedIntent
      });

    } catch (error) {
      logger.error('❌ Failed to create intent', { error });
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getIntentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userWallet } = req.query;

      const intent = await agentIntentRepository.findOne({ 
        where: { id: id as string },
        relations: ['selectedAsset']
      });

      if (!intent) {
        return res.status(404).json({ error: 'Intent not found' });
      }

      if (userWallet && intent.userWallet !== userWallet) {
        return res.status(403).json({ error: 'Not your intent' });
      }

      res.json({
        id: intent.id,
        status: intent.isFulfilled ? 'fulfilled' : 'scanning',
        createdAt: intent.createdAt,
        selectedAsset: intent.selectedAsset,
        requiresApproval: !!intent.selectedAssetId && !intent.isFulfilled,
        totalCost: intent.selectedAsset ? 
          (parseFloat(intent.selectedAsset.pricePerUnit) * intent.durationMinutes).toFixed(6) 
          : null
      });

    } catch (error) {
      logger.error('❌ Failed to get status', { error });
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  }

  static async approveIntentPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { signature } = req.body;
      const userWallet = req.headers['x-user-wallet'] as string;

      const intent = await agentIntentRepository.findOne({ 
        where: { id: id as string },
        relations: ['selectedAsset']
      });

      if (!intent?.selectedAsset) {
        return res.status(400).json({ error: 'No asset selected' });
      }

      const approvalMessage = `Approve payment for ${intent.selectedAsset.id}`;
      const isValid = await verifySignature(approvalMessage, signature, userWallet);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid approval signature' });
      }

      res.json({
        asset: intent.selectedAsset,
        durationMinutes: intent.durationMinutes,
        totalCost: (parseFloat(intent.selectedAsset.pricePerUnit) * intent.durationMinutes).toFixed(6)
      });

    } catch (error) {
      logger.error('❌ Approval failed', { error });
      res.status(500).json({ error: 'Approval failed' });
    }
  }
}