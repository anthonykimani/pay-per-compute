import axios from 'axios';
import { AppDataSource } from '../config/database';
import { PaymentLog } from '../models/paymentlog.entity';
import { Between } from 'typeorm';
import { ENV } from '../config/env';
import logger from '../utils/logger';

const paymentLogRepository = AppDataSource.getRepository(PaymentLog);

export class PaymentLogService {
  static async logPayment(data: Partial<PaymentLog>) {
    const log = paymentLogRepository.create(data);
    return paymentLogRepository.save(log);
  }

  static async getEarningsByMerchant(merchantId: string, startDate?: string, endDate?: string) {
    const whereClause: any = { 
      success: true,
      // asset: { merchantId } // ✅ When you add merchant relation
    };

    if (startDate && endDate) {
      whereClause.timestamp = Between(new Date(startDate), new Date(endDate));
    }

    return paymentLogRepository.find({
      where: whereClause,
      order: { timestamp: 'DESC' }
    });
  }

  static async getEarningsReport(merchantId: string, startDate?: string, endDate?: string) {
    const payments = await this.getEarningsByMerchant(merchantId, startDate, endDate);
    
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      totalEarnings: total.toFixed(6),
      paymentCount: payments.length,
      payments
    };
  }

  static async verifyPayment(signature: string, expectedAmount: string, data: Partial<PaymentLog>) {
    try {
      const response = await axios.post(
        `${ENV.PAYAI_FACILITATOR_URL}/verify`,
        {
          signature,
          network: ENV.PAYAI_NETWORK,
          expectedAmount,
          merchantWallet: data.payerWallet
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