import { Router } from 'express';
import { AuthController } from '../../controllers/auth-controller';
import { apiKeyLimiter } from '../../middleware/rate-limitier';


const router = Router();

// Public routes
router.post('/register', AuthController.register);

// Protected routes (require API key)
router.post('/regenerate-key', apiKeyLimiter, AuthController.regenerateKey);
router.delete('/deactivate', apiKeyLimiter, AuthController.deactivate);

export default router;