import { Router } from 'express';
import { createAssetPaymentMiddleware } from '../../middleware/x402Wrapper';
import { PaymentController } from '../../controllers/payment-controller';
import { SessionService } from '../../services/session-service';
import { paymentLimiter } from '../../middleware/rate-limitier';

const router = Router();

// Cache middleware instances per asset
const assetMiddlewareCache = new Map<string, ReturnType<typeof createAssetPaymentMiddleware>>();

const getAssetMiddleware = async (assetId: string) => {
  if (!assetMiddlewareCache.has(assetId)) {
    const asset = await SessionService.getAsset(assetId);
    if (!asset) return null;
    const middleware = createAssetPaymentMiddleware(asset);
    assetMiddlewareCache.set(assetId, middleware);
  }
  return assetMiddlewareCache.get(assetId);
};

router.post('/:assetId', 
  paymentLimiter,
  async (req, res, next) => {
    const middleware = await getAssetMiddleware(req.params.assetId);
    if (!middleware) return res.status(404).json({ error: 'Asset not found' });
    middleware(req, res, next);
  },
  PaymentController.access
);

router.get('/:assetId/status', paymentLimiter, PaymentController.status);

router.post('/sessions/:token/extend', 
  paymentLimiter,
  async (req, res, next) => {
    const session = await SessionService.getSession(req.params.token);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const middleware = await getAssetMiddleware(session.asset.id);
    if (!middleware) return res.status(404).json({ error: 'Asset not found' });
    
    middleware(req, res, next);
  },
  PaymentController.extend
);

export default router;