import { Router } from 'express';
import { createAssetPaymentMiddleware } from '../../middleware/x402Wrapper';
import { SessionService } from '../../services/session-service'; // For extension
import { paymentLimiter } from '../../middleware/rate-limitier';
import { PaymentController } from '../../controllers/payment-controller';

const router = Router();

// Payment attempt for asset access
router.post('/:assetId', 
  paymentLimiter,
  async (req, res, next) => {
    // Fetch asset to create dynamic payment middleware
    const asset = await SessionService.getAsset(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Create middleware with asset-specific price
    const assetPaymentGate = createAssetPaymentMiddleware(asset);
    assetPaymentGate(req, res, next);
  },
  PaymentController.access
);

// Check payment/session status for an asset
router.get('/:assetId/status', paymentLimiter, PaymentController.status);

// Extend an existing session with additional payment
router.post('/sessions/:token/extend', 
  paymentLimiter,
  async (req, res, next) => {
    // Verify session exists before allowing extension payment
    const session = await SessionService.getSession(req.params.token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const assetPaymentGate = createAssetPaymentMiddleware(session.asset);
    assetPaymentGate(req, res, next);
  },
  PaymentController.extend
);

export default router;