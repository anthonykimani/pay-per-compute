// packages/backend/src/routes/v1/index.agent.ts
import { Router } from 'express';
import { AgentController } from '../../controllers/agent-controller';
import { verifyApiKey } from '../../middleware/api-key';

const router = Router();

// Public routes (wallet auth via signature)
router.post('/intents', AgentController.createIntent);
router.get('/intents/:id', AgentController.getIntentStatus);
router.post('/intents/:id/approve', AgentController.approveIntentPayment);

export default router;