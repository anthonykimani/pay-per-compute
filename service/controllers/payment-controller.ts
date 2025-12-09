import { Request, Response } from 'express';
import { SessionService } from '../services/session-service';
import { ENV } from '../config/env';
import logger from '../utils/logger';
import { Session } from '../models/session.entity';

export class PaymentController {
  static async access(req: Request, res: Response) {
    const { assetId } = req.params;
    const session = (req as any).session as Session; // From postPaymentProcessor

    logger.info('🎉 Access granted', {
      assetId,
      sessionToken: session.token,
      payer: session.payerWallet
    });

    res.json({
      status: 'granted',
      sessionToken: session.token,
      minutesPurchased: SessionService.calculateMinutes(session.amountPaid, session.asset.pricePerUnit, session.asset.unit),
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

      const minutesLeft = SessionService.calculateMinutesLeft(session.expiresAt);

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
      const { additionalAmount } = req.body;

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