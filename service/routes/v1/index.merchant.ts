import { Router } from 'express';
import { MerchantController } from '../../controllers/merchant-controller';
import { verifyApiKey } from '../../middleware/api-key';
import { apiKeyLimiter } from '../../middleware/rate-limitier';

const router = Router();

router.use(verifyApiKey); // ✅ Apply to all routes

router.get('/assets', apiKeyLimiter, MerchantController.getAssets);
router.get('/earnings', apiKeyLimiter, MerchantController.getEarnings);
router.post('/assets', apiKeyLimiter, MerchantController.createAsset);
router.patch('/assets/:id', apiKeyLimiter, MerchantController.updateAsset);


export default router;