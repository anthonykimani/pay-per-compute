import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),

    DATABASE_URL: z.string(),
    PAYAI_FACILITATOR_URL: z.string().url(),
    PAYAI_API_KEY: z.string().min(1),
    PAYAI_VERSION: z.string().default('2024-01-24'),
    PAYAI_NETWORK: z.enum(['base-sepolia', 'base', 'solana-devnet', 'solana']).default('solana-devnet'),

    SOLANA_RPC: z.string().url(),
    MERCHANT_WALLET: z.string().min(32),

    FRONTEND_URL: z.string().url(),
    ALLOWED_ORIGINS: z.string(),

    PAYMENT_TIMEOUT: z.coerce.number().default(300),
    UNIT_TYPE: z.enum(['minute', 'hour', 'day', 'session']).default('minute'),
    ACCEPTED_TOKENS: z.string().default('USDC'),
});

export const ENV = envSchema.parse(process.env);

export const CORS_ORIGINS = ENV.ALLOWED_ORIGINS.split(',');