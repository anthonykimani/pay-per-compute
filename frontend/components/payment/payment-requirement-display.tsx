'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Wallet, Clock, Network } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';
import { PaymentRequirement } from '@/types';

interface PaymentRequirementDisplayProps {
  requirement: PaymentRequirement;
  onPay: () => void;
  isProcessing?: boolean;
}

export function PaymentRequirementDisplay({
  requirement,
  onPay,
  isProcessing = false,
}: PaymentRequirementDisplayProps) {
  const wallet = useWallet();

  return (
    <Card className="border-orange-500/50 bg-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <DollarSign className="h-5 w-5" />
          Payment Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 p-4 rounded-lg bg-background">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Cost</span>
            <span className="font-bold text-lg">${requirement.cost}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Network</span>
            <span className="font-mono text-sm">{requirement.network}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Merchant</span>
            <span className="font-mono text-xs">{requirement.address}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Billing Unit</span>
            <span className="capitalize">{requirement.unit}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!wallet.connected ? (
            <WalletMultiButton className="w-full" />
          ) : (
            <Button
              onClick={onPay}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Pay & Access Asset
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}