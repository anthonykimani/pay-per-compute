import { apiClient } from "@/shared/api.config";
import { PaymentAuthorization, PaymentRequirement, Session } from "@/types/common";

export const paymentsApi = {
  initiate: (assetId: string) =>
    apiClient.post<PaymentRequirement>(`/api/v1/access/${assetId}`, undefined, {
      // This will return 402 with payment requirements
      // We'll handle this specially in the hook
    }),

  access: (assetId: string, paymentAuth: PaymentAuthorization) =>
    apiClient.post<Session>(`/api/v1/access/${assetId}`, undefined, {
      'x-payment-authorization': `PAY2 ${btoa(JSON.stringify(paymentAuth))}`,
    }),

  extend: (token: string, additionalAmount: string) =>
    apiClient.post<Session>(`/api/v1/access/sessions/${token}/extend`, {
      additionalAmount,
    }),

  getSessionStatus: (token: string) =>
    apiClient.get<Session & { minutesLeft: number }>(
      `/api/v1/sessions/${token}/status`
    ),
};
