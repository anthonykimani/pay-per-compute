'use client';

import { useEffect, useState } from 'react';
import { AgentChat } from './agent-chat';
import { AgentFeed } from './agent-feed';
import { SessionDetails } from './session-details';
import { AssetApprovalCard } from './asset-approval-card';
import { PaymentRequirementDisplay } from '../payment/payment-requirement-display';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePaymentFlow } from '@/hooks/use-payment-flow';
import { useAgentIntent } from '@/hooks/use-agent-intent';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { parseError } from '@/lib/error';
import { useSocket } from '@/provider/socket-provider';
import { Asset } from '@/types';

export function AgentInterface() {
    const wallet = useWallet();
    const [intentId, setIntentId] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState<number>(30);
    const { paymentRequirement, session, initiate, complete, reset, isLoading } = usePaymentFlow();
    const { data: intent } = useAgentIntent(intentId || '');
    const { toast } = useToast();
    const { emitWalletSubscription, connected } = useSocket();

    const normalizedWallet = wallet.publicKey?.toString().toLowerCase();

    useEffect(() => {
        if (wallet.connected && normalizedWallet && connected) {
            emitWalletSubscription(normalizedWallet);
        }
    }, [wallet.connected, normalizedWallet, connected, emitWalletSubscription]);

    // ✅ WORKAROUND: Show approval if asset found but no payment started
    // This bypasses the broken backend isFulfilled flag
    const showApproval = intent?.selectedAsset && 
                         intent.totalCost && // Additional check for data presence
                         !paymentRequirement && 
                         !session;

    const handleApprove = () => {
        if (intent?.selectedAsset) {
            initiate(intent.selectedAsset.id);
        }
    };

    const handleReject = () => {
        toast({
            title: 'Asset Rejected',
            description: 'Agent will continue scanning...',
            variant: 'destructive',
        });
        reset();
    };

    const handlePay = async () => {
        if (!normalizedWallet || !paymentRequirement) return;
        try {
            await complete(paymentRequirement.assetId, wallet);
        } catch (error) {
            toast({
                title: 'Payment Error',
                description: parseError(error).message,
                variant: 'destructive',
            });
        }
    };

    if (!wallet.connected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8">Connect your Solana wallet to start chatting with the AI agent</p>
                <WalletMultiButton />
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <AgentChat onIntentCreated={(id, duration) => {
                    setIntentId(id);
                    setDurationMinutes(duration);
                    reset();
                }} />

                {showApproval && intent.selectedAsset && (
                    <AssetApprovalCard
                        asset={intent.selectedAsset}
                        durationMinutes={durationMinutes}
                        totalCost={intent.totalCost || '0.000000'}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}

                {paymentRequirement && !session && (
                    <PaymentRequirementDisplay
                        requirement={paymentRequirement}
                        onPay={handlePay}
                        isProcessing={isLoading}
                    />
                )}

                {session && <SessionDetails session={session} />}
            </div>

            <div className="space-y-4">
                {intentId && normalizedWallet && (
                    <AgentFeed
                        key={`${intentId}-${normalizedWallet}`}
                        intentId={intentId}
                        userWallet={normalizedWallet}
                    />
                )}
            </div>
        </div>
    );
}