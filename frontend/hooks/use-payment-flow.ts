import { paymentsApi } from '@/services/payments-service';
import { PaymentAuthorization, PaymentRequirement, Session } from '@/types';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import { useState } from 'react';
import { useToast } from './use-toast';
import { AppError, handlePaymentError, parseError } from '@/lib/error';

interface UsePaymentFlowParams {
  onPaymentRequired?: (req: PaymentRequirement) => void;
  onSuccess?: (session: Session) => void;
  onError?: (error: AppError) => void;
}

interface UsePaymentFlowReturn {
  paymentRequirement: PaymentRequirement | null;
  session: Session | null;
  initiate: (assetId: string) => void;
  complete: (assetId: string, wallet: WalletContextState) => Promise<void>;
  reset: () => void;
  isLoading: boolean;
  isSuccess: boolean;
}

export function usePaymentFlow(
  params: UsePaymentFlowParams = {}
): UsePaymentFlowReturn {
  const { onPaymentRequired, onSuccess, onError } = params;
  const [paymentRequirement, setPaymentRequirement] = useState<PaymentRequirement | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ✅ INITIATE PAYMENT - EXPECTS 402
  const initiateMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await paymentsApi.initiate(assetId);
    },
    onError: (error: any) => {
      // ✅ 402 IS EXPECTED - EXTRACT PAYMENT REQUIREMENT
      if (error.status === 402 && error.details) {
        const req = error.details as PaymentRequirement;
        setPaymentRequirement(req);
        onPaymentRequired?.(req);
        // ✅ DON'T SHOW TOAST - THIS IS THE SUCCESS FLOW
        return;
      }
      
      // ❌ ONLY TOAST FOR REAL ERRORS
      const parsedError = parseError(error);
      onError?.(parsedError);
      toast({
        title: 'Payment Error',
        description: handlePaymentError(parsedError),
        variant: 'destructive',
      });
    },
  });

  const createPaymentAuthorization = async (
    wallet: WalletContextState,
    requirement: PaymentRequirement
  ): Promise<PaymentAuthorization> => {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new AppError(
        'Wallet not connected or does not support signing',
        'WALLET_ERROR',
        400
      );
    }

    const paymentMessage = JSON.stringify({
      type: 'x402_payment',
      network: requirement.network,
      payer: wallet.publicKey.toString(),
      payee: requirement.address,
      amount: requirement.cost,
      token: 'USDC',
      unit: requirement.unit,
      asset_id: requirement.assetId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    });

    const messageBytes = new TextEncoder().encode(paymentMessage);
    const signatureUint8 = await wallet.signMessage(messageBytes);
    const signature = bs58.encode(signatureUint8);

    return { signature, message: paymentMessage };
  };

  // ✅ COMPLETE PAYMENT WITH SIGNATURE
  const completeMutation = useMutation({
    mutationFn: async ({
      assetId,
      wallet,
    }: {
      assetId: string;
      wallet: WalletContextState;
    }) => {
      if (!paymentRequirement) {
        throw new AppError(
          'No payment requirement available',
          'NO_PAYMENT_REQUIREMENT',
          400
        );
      }

      setIsProcessing(true);

      const auth = await createPaymentAuthorization(wallet, paymentRequirement);
      const session = await paymentsApi.access(assetId, auth);

      return session;
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onSuccess?.(session);
      toast({
        title: 'Payment Successful',
        description: 'Access granted! Your session is active.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const parsedError = parseError(error);
      onError?.(parsedError);
      toast({
        title: 'Payment Failed',
        description: handlePaymentError(parsedError),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const initiate = (assetId: string) => {
    setSession(null);
    initiateMutation.mutate(assetId);
  };

  const complete = async (assetId: string, wallet: WalletContextState) => {
    if (!wallet.connected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to complete payment',
        variant: 'destructive',
      });
      return;
    }

    try {
      await completeMutation.mutateAsync({ assetId, wallet });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  const reset = () => {
    setPaymentRequirement(null);
    setSession(null);
    initiateMutation.reset();
    completeMutation.reset();
  };

  return {
    paymentRequirement,
    session: session || completeMutation.data || null,
    initiate,
    complete,
    reset,
    isLoading: initiateMutation.isPending || completeMutation.isPending || isProcessing,
    isSuccess: completeMutation.isSuccess,
  };
}

export function useSessionStatus(token: string) {
  return useQuery({
    queryKey: ['session', token],
    queryFn: () => paymentsApi.getSessionStatus(token),
    enabled: !!token && token.length > 0,
    refetchInterval: 30000,
    staleTime: 1000 * 30,
  });
}