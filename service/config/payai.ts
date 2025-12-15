import { ENV } from './env';

export const payaiConfig = {
  facilitator: {
    url: ENV.PAYAI_FACILITATOR_URL,
    version: ENV.PAYAI_VERSION,
    apiKey: ENV.PAYAI_API_KEY,
  },
  acceptedTokens: ENV.ACCEPTED_TOKENS.split(','),
  paymentTimeout: ENV.PAYMENT_TIMEOUT,
  targetNetwork: ENV.PAYAI_NETWORK,
  
  // PayAI middleware options
  middleware: {
    autoRespond402: true,
    includeAssetDetails: true,
  }
};