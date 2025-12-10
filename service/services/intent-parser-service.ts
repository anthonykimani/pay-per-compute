// packages/backend/src/services/intent-parser-service.ts
import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { ENV } from '../config/env';
import logger from '../utils/logger';

/**
 * Zod schema for structed compute intent extraction
 */
export const ComputeIntentSchema = z.object({
  assetType: z.enum(['gpu', 'cpu', 'printer', 'iot'])
    .describe('Type of compute asset user wants to rent'),
  
  assetName: z.string().optional()
    .describe('Specific model name if mentioned (e.g., "RTX 4090", "3090")'),
  
  durationMinutes: z.number().int().min(1).max(480).default(30)
    .describe('Duration in minutes (default: 30 if not specified)'),
  
  maxPricePerUnit: z.string().regex(/^\d+\.\d{6}$/)
    .describe('Maximum price in USDC with 6 decimals (e.g., "0.080000")'),
  
  action: z.enum(['buy', 'extend', 'cancel']).default('buy')
    .describe('Action type: buy new session, extend existing, or cancel')
});

export type ComputeIntent = z.infer<typeof ComputeIntentSchema>;

export class IntentParserService {
  /**
   * Parse natural language message into structured intent
   * @param userMessage Raw user input (e.g., "RTX 4090 for 30 min under $0.08")
   * @param userWallet Solana wallet address for context/logging
   * @returns Structured ComputeIntent object
   */
  static async parse(userMessage: string, userWallet: string): Promise<ComputeIntent> {
    try {
      logger.info('🤖 Parsing intent', { userWallet, message: userMessage });
      
      // ✅ FIX: Create agent fresh each time - no static property needed
      const agent = Agent.create({
        name: 'ComputeIntentParser',
        model: 'gpt-4o-mini',
        instructions: `You are a precise intent extraction agent. 
          Extract compute rental requests into structured data.
          
          RULES:
          1. assetType: Infer from context (gpu/cpu/printer/iot). Default to "gpu" if unclear.
          2. assetName: Extract specific model names (RTX 4090, 3090, A100). Omit if generic.
          3. durationMinutes: Extract minutes, hours (multiply by 60), or sessions. Default to 30.
          4. maxPricePerUnit: USDC format with exactly 6 decimals. If user says "8 cents", use "0.080000".
          5. action: Default to "buy". Only set "extend" if user mentions "extend" or "longer".
          
          EXAMPLES:
          - "Find me a 3090 for 30 min under $0.08" → {assetType: "gpu", assetName: "3090", durationMinutes: 30, maxPricePerUnit: "0.080000", action: "buy"}
          - "Extend my session by 15 minutes" → {action: "extend", durationMinutes: 15}
          - "Printer for 1 hour under $0.50" → {assetType: "printer", durationMinutes: 60, maxPricePerUnit: "0.500000"}
          
          RETURN ONLY VALID JSON. NO EXTRA TEXT.`,
        outputType: ComputeIntentSchema,
      });
      
      const result = await run(agent, userMessage);
      
      if (!result.finalOutput) {
        throw new Error('Agent returned empty output');
      }

      logger.info('✅ Intent parsed', { 
        userWallet, 
        parsed: result.finalOutput 
      });

      return result.finalOutput;

    } catch (error) {
      logger.error('❌ Intent parsing failed', { 
        error, 
        userWallet, 
        message: userMessage 
      });
      
      throw new Error(
        `Could not understand request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static validate(intent: ComputeIntent): void {
    if (parseFloat(intent.maxPricePerUnit) <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (intent.durationMinutes < 1 || intent.durationMinutes > 480) {
      throw new Error('Duration must be between 1 and 480 minutes');
    }
    logger.debug('✅ Intent validated', { intent });
  }
}