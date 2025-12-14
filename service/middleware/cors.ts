import { CORS_ORIGINS } from "../config/env";

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Normalize origin (remove trailing slashes)
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    if (CORS_ORIGINS.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(null, false); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'], 
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x402-payment', 
    'x-api-key',
    'x-user-wallet',
    'x-payment-authorization'
  ],
  exposedHeaders: [
    'x-cost', 
    'x-address', 
    'x-facilitator', 
    'x-network',
    'x-unit', 
    'x-asset-id'
  ],
  maxAge: 86400 
};