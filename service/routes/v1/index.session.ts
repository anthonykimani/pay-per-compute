import { Router, Request, Response } from 'express';
import { SessionService } from '../../services/session-service';
import logger from '../../utils/logger';


const router = Router();

router.get('/:token/status', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const session = await SessionService.getSession(token);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const isActive = session.expiresAt > new Date();
    const minutesLeft = isActive 
      ? Math.ceil((session.expiresAt.getTime() - Date.now()) / 60000)
      : 0;

    res.json({
      status: isActive ? 'active' : 'expired',
      data: {
        token: session.token,
        assetId: session.assetId,
        payerWallet: session.payerWallet,
        expiresAt: session.expiresAt,
        minutesLeft
      }
    });
  } catch (error) {
    logger.error('❌ Failed to get session status', { error, token: req.params.token });
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

export default router;