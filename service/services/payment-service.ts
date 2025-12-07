import axios from 'axios';
import { ENV } from '../config/env';
import logger from '../utils/logger';

export class PaymentService {
  static async verifyPayment(signature: string, expectedAmount: string) {
    try {
      const response = await axios.post(
        `${ENV.PAYAI_FACILITATOR_URL}/verify`,
        {
          signature,
          network: ENV.SOLANA_NETWORK,
          expectedAmount,
          merchantWallet: ENV.MERCHANT_WALLET
        },
        {
          headers: {
            'Authorization': `Bearer ${ENV.PAYAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('✅ Payment verified by PayAI', { signature });

      return {
        valid: true,
        amount: response.data.amount,
        payer: response.data.payer,
        signature: response.data.signature,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('❌ PayAI verification failed', { signature, error });
      throw error;
    }
  }

  static async getPaymentStatus(signature: string) {
    const response = await axios.get(
      `${ENV.PAYAI_FACILITATOR_URL}/status/${signature}`,
      {
        headers: {
          'Authorization': `Bearer ${ENV.PAYAI_API_KEY}`
        }
      }
    );

    return response.data;
  }
}