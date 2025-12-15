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
  
  // ✅  Make optional with fallback - AGENT MUST PROVIDE THIS
  maxPricePerUnit: z.string().regex(/^\d+\.\d{6}$/).optional()
    .describe('Maximum price in USDC with 6 decimals. Default: "0.100000" if not mentioned'),
  
  action: z.enum(['buy', 'extend', 'cancel']).default('buy')
    .describe('Action type: buy new session, extend existing, or cancel')
});

export type ComputeIntent = z.infer<typeof ComputeIntentSchema>;

export class IntentParserService {
  /**
   * Parse natural language message into structured intent
   */
  static async parse(userMessage: string, userWallet: string): Promise<ComputeIntent> {
    try {
      logger.info('🤖 Parsing intent', { userWallet, message: userMessage });
      
      if (!ENV.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // ✅  CRITICAL - Give explicit DEFAULT behavior instructions
      const agent = Agent.create({
        name: 'ComputeIntentParser',
        model: 'gpt-4o-mini',
        instructions: `You are a precise intent extraction agent for compute rentals.
          
          CRITICAL RULES - Never skip maxPricePerUnit:
          1. ALWAYS extract maxPricePerUnit with 6 decimals
          2. If user mentions ANY price, use that price
          3. If user does NOT mention price, use DEFAULT: "0.100000"
          4. Calculation examples:
             - "$5 for 30 min" → "0.166667" (5/30 = 0.166667)
             - "under 10 cents" → "0.100000"
             - "budget $5" for 30 min → "0.166667"
             - "3D printer for 2 hours" → "0.100000" (no price = default)
          
          DURATION:
          - "30 min" → 30
          - "1 hour" → 60
          - "2 hours → 120
          - Default: 30
          
          YOU MUST RETURN maxPricePerUnit. Never omit it.
          
          EXAMPLES:
          - "RTX 4090 for 30 min under $0.08" → {"assetType":"gpu","assetName":"RTX 4090","durationMinutes":30,"maxPricePerUnit":"0.080000","action":"buy"}
          - "3D printer for 2 hours" → {"assetType":"printer","durationMinutes":120,"maxPricePerUnit":"0.100000","action":"buy"}`,
        outputType: ComputeIntentSchema,
      });
      
      const result = await run(agent, userMessage);
      
      if (!result.finalOutput) {
        throw new Error('Agent returned empty output');
      }

      // ✅  Enforce default if agent somehow still doesn't provide it
      const parsedIntent = {
        ...result.finalOutput,
        maxPricePerUnit: result.finalOutput.maxPricePerUnit || '0.100000',
      };

      logger.info('✅ Intent parsed successfully', { 
        userWallet, 
        parsed: parsedIntent 
      });

      return parsedIntent;

    } catch (error) {
      logger.error('❌ Intent parsing failed', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userWallet, 
        message: userMessage 
      });
      
      throw new Error(
        `Could not understand request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static validate(intent: ComputeIntent): void {
    if (parseFloat(intent.maxPricePerUnit || '0.100000') <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (intent.durationMinutes < 1 || intent.durationMinutes > 480) {
      throw new Error('Duration must be between 1 and 480 minutes');
    }
    logger.debug('✅ Intent validated', { intent });
  }
}