import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_PAY_PER_COMPUTE_URL: z.string().url(),
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_SOLANA_NETWORK: z.enum(['devnet', 'mainnet-beta']).default('devnet'),
  NEXT_PUBLIC_PAYAI_FACILITATOR_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_PAY_PER_COMPUTE_URL: process.env.NEXT_PUBLIC_PAY_PER_COMPUTE_URL,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_PAYAI_FACILITATOR_URL: process.env.NEXT_PUBLIC_PAYAI_FACILITATOR_URL,
});