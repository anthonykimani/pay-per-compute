import { Request, Response, NextFunction } from 'express';
// @ts-expect-error
import { paymentMiddleware, Resource } from 'x402-express';
import { AppDataSource } from '../config/database';
import { Asset } from '../models/asset.entity';
import { PaymentLog } from '../models/paymentlog.entity';

import { ENV } from '../config/env';
import { SessionService } from '../services/session-service';
import { AssetService } from '../services/asset-service';
import logger from '../utils/logger';

const paymentLogRepository = AppDataSource.getRepository(PaymentLog);

/**
 * Creates a payment middleware configured for a specific asset
 * Uses the asset's pricePerUnit and name from the database
 */
export const createAssetPaymentMiddleware = (asset: Asset) => {
  return paymentMiddleware(
    ENV.MERCHANT_WALLET,
    {
      "*": {
        price: asset.pricePerUnit, 
        network: ENV.PAYAI_NETWORK as any,
        config: {
          description: `Access to ${asset.name}`,
          maxTimeoutSeconds: ENV.PAYMENT_TIMEOUT
        }
      }
    },
    {
      url: ENV.PAYAI_FACILITATOR_URL as Resource,
      createAuthHeaders: async () => ({
        verify: { Authorization: `Bearer ${ENV.PAYAI_API_KEY}` },
        settle: { Authorization: `Bearer ${ENV.PAYAI_API_KEY}` },
        supported: { Authorization: `Bearer ${ENV.PAYAI_API_KEY}` }
      })
    }
  );
};

/**
 * Post-payment processing middleware
 * Parses verified payment header, logs transaction, creates session
 */
export const postPaymentProcessor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { assetId } = req.params;
    
    // Extract payment details from verified authorization header
    const authHeader = req.headers['x-payment-authorization'] as string;
    if (!authHeader) {
      logger.error('Missing payment authorization header');
      return res.status(402).json({ error: 'Payment required' });
    }

    const paymentData = parsePaymentHeader(authHeader);
    
    logger.info('✅ Payment verified', {
      assetId,
      amount: paymentData.amount,
      payer: paymentData.payer,
      signature: paymentData.signature
    });

    // Log payment to database
    await paymentLogRepository.save({
      signature: paymentData.signature,
      amount: paymentData.amount,
      payerWallet: paymentData.payer,
      assetId: assetId,
      sessionToken: null, // Updated after session creation
      success: true,
      facilitatorResponse: { authHeader }
    });

    // Create session and unlock asset
    const session = await SessionService.createSession(
      assetId,
      paymentData.amount,
      paymentData.payer
    );
    
    await AssetService.unlock(assetId, session.token);
    
    // Attach session to request for downstream controllers
    (req as any).session = session;
    next();
    
  } catch (error) {
    logger.error('❌ Post-payment processing failed', { 
      error, 
      assetId: req.params.assetId 
    });
    res.status(500).json({ 
      error: 'Payment processed but session creation failed',
      code: 'SESSION_CREATION_ERROR'
    });
  }
};

/**
 * Error handling middleware for payment failures
 */
export const paymentErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.warn('❌ Payment verification failed', { 
    error: error.message,
    assetId: req.params.assetId 
  });

  if (error.code === 'PAYMENT_REQUIRED') {
    res.status(402).json({
      error: 'Payment Required',
      'x-cost': error.expectedPrice,
      'x-address': ENV.MERCHANT_WALLET,
      'x-facilitator': ENV.PAYAI_FACILITATOR_URL,
      'x-network': ENV.PAYAI_NETWORK,
      'x-unit': ENV.UNIT_TYPE,
      'x-asset-id': req.params.assetId
    });
  } else {
    res.status(400).json({
      error: 'Payment verification failed',
      message: error.message,
      code: error.code
    });
  }
};

/**
 * Helper to parse x402 payment header (PAY2 <base64url-encoded-json>)
 */
function parsePaymentHeader(authHeader: string): {
  signature: string;
  amount: string;
  payer: string;
  network: string;
} {
  try {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme !== 'PAY2' || !encoded) {
      throw new Error('Invalid payment scheme');
    }
    
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    const data = JSON.parse(json);
    
    return {
      signature: data.signature,
      amount: data.amount,
      payer: data.payer,
      network: data.network
    };
  } catch (error) {
    logger.error('Failed to parse payment header', { error, authHeader });
    throw new Error('Invalid payment format in header');
  }
}