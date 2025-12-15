import { apiClient } from '@/shared/api.config';
import { PaymentAuthorization, Session } from '../types';

export const paymentsApi = {
  initiate: (assetId: string) =>
    apiClient.post<never>(`/api/v1/access/${assetId}`),

  access: (assetId: string, auth: PaymentAuthorization) =>
    apiClient.post<Session>(
      `/api/v1/access/${assetId}`,
      undefined,
      {
        'x-payment-authorization': `PAY2 ${btoa(JSON.stringify(auth))}`,
      }
    ),

  extend: (token: string, additionalAmount: string) =>
    apiClient.post<Session>(`/api/v1/access/sessions/${token}/extend`, {
      additionalAmount,
    }),

  getSessionStatus: (token: string) =>
    apiClient.get<Session & { minutesLeft: number }>(
      `/api/v1/sessions/${token}/status`
    ),
};