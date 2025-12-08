import { Router } from 'express';
import { AssetController } from '../../controllers/asset-controller';
import { verifyApiKey } from '../../middleware/api-key'; 
import { paymentLimiter } from '../../middleware/rate-limitier';

const router = Router();

router.get('/', paymentLimiter, AssetController.list);
router.get('/:assetId/status', paymentLimiter, AssetController.getStatus);

router.post('/', verifyApiKey, paymentLimiter, AssetController.create);
router.patch('/:id/price', verifyApiKey, paymentLimiter, AssetController.updatePrice);
router.patch('/:id', verifyApiKey, paymentLimiter, AssetController.updateAsset);

export default router;