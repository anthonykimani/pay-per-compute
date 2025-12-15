'use client';

import { useState, useEffect } from 'react';
import { AgentChat } from './agent-chat';
import { AgentFeed } from './agent-feed';
import { SessionDetails } from './session-details';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '../ui/card';
import { Bot } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { usePaymentFlow } from '@/hooks/use-payment-flow';
import { useAgentIntent } from '@/hooks/use-agent-intent';
import { parseError } from '@/lib/error';
import { PaymentRequirementDisplay } from '../payment/payment-requirement-display';

export function AgentInterface() {
    const wallet = useWallet();
    const [intentId, setIntentId] = useState<string | null>(null);
    const { paymentRequirement, session, initiate, complete, reset, isLoading } = usePaymentFlow();
    const { data: intent } = useAgentIntent(intentId || '');
    const { toast } = useToast();

    useEffect(() => {
        if (intent?.result?.recommendedAsset && !session) {
            initiate(intent.result.recommendedAsset.id);
        }
    }, [intent, session, initiate]);

    const handlePay = async () => {
        if (!wallet.publicKey || !paymentRequirement) return;

        try {
            await complete(paymentRequirement.assetId, wallet);
        } catch (error) {
            const parsedError = parseError(error);
            toast({
                title: 'Payment Error',
                description: parsedError.message,
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
                <AgentChat onIntentCreated={setIntentId} />

                {paymentRequirement && !session && (
                    <PaymentRequirementDisplay
                        requirement={paymentRequirement}
                        onPay={handlePay}
                        isProcessing={isLoading}
                    />
                )}

                {session && (
                    <SessionDetails session={session} />
                )}
            </div>

            <div className="space-y-4">
                {intentId && wallet.publicKey ? (
                    <AgentFeed intentId={intentId} userWallet={wallet.publicKey.toString()} />
                ) : (
                    <Card className="p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">Agent Feed</h3>
                            <p className="text-muted-foreground">
                                Send a message to the AI agent to see activity here
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}