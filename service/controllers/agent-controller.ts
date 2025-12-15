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

      // ✅ Add detailed validation logging
      logger.debug('🔍 Validating signature', { userWallet, message: message.slice(0, 50) });
      const isValid = await verifySignature(message, signature, userWallet);
      if (!isValid) {
        logger.warn('❌ Invalid signature', { userWallet });
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // ✅ Parse intent
      logger.debug('🤖 Parsing intent', { message: message.slice(0, 100) });
      const parsedIntent = await IntentParserService.parse(message, userWallet);
      IntentParserService.validate(parsedIntent);
      logger.debug('✅ Intent validation passed', { parsedIntent });

      // ✅ Ensure data is properly typed and sanitized
      const intentData = {
        userWallet,
        assetType: parsedIntent.assetType,
        assetName: parsedIntent.assetName || null, // Use null instead of undefined
        durationMinutes: parsedIntent.durationMinutes,
        maxPricePerUnit: parsedIntent.maxPricePerUnit,
        action: parsedIntent.action,
        isFulfilled: false,
        selectedAssetId: null, // Explicitly set to null
      };

      // ✅ Add error handling around database insert
      logger.debug('💾 Inserting intent to database');
      const insertResult = await agentIntentRepository.insert(intentData as any);
      logger.debug('✅ Insert result', { insertResult });

      // ✅ Null check for identifiers
      if (!insertResult.identifiers || !insertResult.identifiers[0]) {
        throw new Error('Failed to get inserted intent ID');
      }

      const intentId = insertResult.identifiers[0].id as string;
      
      // ✅ Use findOne with proper error handling
      const intent = await agentIntentRepository.findOne({ 
        where: { id: intentId },
        relations: ['selectedAsset']
      });

      if (!intent) {
        throw new Error('Failed to retrieve created intent from database');
      }

      // ✅ Verify intent has required fields
      if (!intent.id || !intent.userWallet) {
        throw new Error('Created intent is missing required fields');
      }

      logger.info('✅ Intent created successfully', { 
        intentId: intent.id,
        userWallet: intent.userWallet 
      });

      // ✅ Start execution AFTER successful save
      AgentExecutionService.executeIntents();

      res.status(201).json({
        success: true,
        intentId: intent.id,
        status: 'created',
        parsed: parsedIntent
      });

    } catch (error) {
      // ✅ Proper error serialization
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
      };
      
      logger.error('❌ Failed to create intent', { 
        error: errorDetails,
        body: req.body,
        userWallet: req.headers['x-user-wallet'],
      });
      
      res.status(400).json({ 
        error: errorDetails.message 
      });
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
      logger.error('❌ Failed to get status', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        intentId: req.params.id
      });
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
      logger.error('❌ Approval failed', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        intentId: req.params.id
      });
      res.status(500).json({ error: 'Approval failed' });
    }
  }
}