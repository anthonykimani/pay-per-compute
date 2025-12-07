import { Request, Response } from 'express';
import { SessionService } from '../services/session-service';

import { Asset } from '../models/asset.entity';
import { ENV } from '../config/env';
import logger from '../utils/logger';

export class PaymentController {
  static async access(req: Request, res: Response) {
    const { assetId } = req.params;
    const session = (req as any).session; // From postPaymentProcessor

    logger.info('🎉 Access granted', {
      assetId,
      sessionToken: session.token,
      payer: session.payerWallet
    });

    res.json({
      status: 'granted',
      sessionToken: session.token,
      minutesPurchased: calculateMinutes(session.amountPaid, session.asset),
      expiresAt: session.expiresAt,
      accessUrl: `/api/v1/assets/${assetId}/use`,
      websocketUrl: `ws://localhost:${ENV.PORT}?token=${session.token}`
    });
  }

  static async status(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const session = await SessionService.getActiveSession(assetId);

      if (!session) {
        return res.status(402).json({
          error: 'No active session',
          code: 'SESSION_REQUIRED'
        });
      }

      const minutesLeft = Math.ceil((session.expiresAt.getTime() - Date.now()) / 60000);

      res.json({
        status: 'active',
        minutesLeft,
        paidBy: session.payerWallet,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      logger.error('❌ Failed to get session status', { error });
      res.status(500).json({ error: 'Failed to check status' });
    }
  }

  static async extend(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { additionalAmount } = req.body; // ✅ Get amount from body, not req.session

      const extendedSession = await SessionService.extendSession(token, additionalAmount);

      res.json({
        status: 'extended',
        newExpiryAt: extendedSession.expiresAt
      });
    } catch (error) {
      logger.error('❌ Failed to extend session', { error });
      res.status(400).json({ error: 'Session extension failed' });
    }
  }
}

// ✅ Fixed to respect unit type (hour/day/session)
function calculateMinutes(amountPaid: string, asset: Asset): number {
  const amount = parseFloat(amountPaid);
  const price = parseFloat(asset.pricePerUnit);
  const baseMinutes = amount / price;

  switch (asset.unit) {
    case 'hour':
      return baseMinutes * 60;
    case 'day':
      return baseMinutes * 60 * 24;
    case 'session':
      return baseMinutes; // Session-based assets don't convert
    case 'minute':
    default:
      return baseMinutes;
  }
}