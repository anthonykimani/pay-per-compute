import { Router, Request, Response } from 'express';
import assetsRoutes from '../v1/index.asset';
import paymentsRoutes from '../v1/index.payments';
import merchantRoutes from '../v1/index.merchant';
import sessionsRoutes from '../v1/index.session';

const router = Router();

// Versioned API routes
router.use('/v1/assets', assetsRoutes);
router.use('/v1/access', paymentsRoutes);
router.use('/v1/merchant', merchantRoutes);
router.use('/v1/sessions', sessionsRoutes);

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    PayAI: 'integrated'
  });
});

// 404 handler
router.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

export default router;