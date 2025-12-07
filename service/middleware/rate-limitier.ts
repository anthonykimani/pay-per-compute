import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express'; 

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    error: 'Too many payment attempts',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request, res: Response) => req.path.includes('/status') || req.path.includes('/merchant')
});

export const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'API rate limit exceeded',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  skip: (req: Request, res: Response) => !req.headers['x-api-key']
});