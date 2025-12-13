import { paymentsApi } from '@/services/payments-service';
import { ApiError, PaymentAuthorization, PaymentRequirement, Session } from '@/types/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

interface PaymentFlowParams {
  onPaymentRequired?: (req: PaymentRequirement) => void;
  onSuccess?: (session: Session) => void;
}

export function usePaymentFlow({ onPaymentRequired, onSuccess }: PaymentFlowParams) {
  const [paymentReq, setPaymentReq] = useState<PaymentRequirement | null>(null);
  const queryClient = useQueryClient();

  const initiateMutation = useMutation({
    mutationFn: paymentsApi.initiate,
    onError: (error: ApiError) => {
      if (error.status === 402 && error.details) {
        setPaymentReq(error.details as PaymentRequirement);
        onPaymentRequired?.(error.details as PaymentRequirement);
      }
    },
  });

  const accessMutation = useMutation({
    mutationFn: ({ assetId, auth }: { assetId: string; auth: PaymentAuthorization }) =>
      paymentsApi.access(assetId, auth),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onSuccess?.(session);
    },
  });

  const reset = () => setPaymentReq(null);

  return {
    paymentRequirement: paymentReq,
    initiate: initiateMutation.mutate,
    access: accessMutation.mutate,
    isLoading: initiateMutation.isPending || accessMutation.isPending,
    reset,
  };
}
