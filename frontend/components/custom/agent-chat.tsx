// packages/dashboard/src/components/AgentChat.tsx
'use client';

import { useState } from 'react';
import { useWallet, useConnection,  ConnectionProvider,
  WalletProvider } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletModalProvider} from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Send, Bot, User } from 'lucide-react';
import bs58 from 'bs58';

interface AgentChatProps {
  onIntentCreated: (intentId: string) => void;
}

export function AgentChat({ onIntentCreated }: AgentChatProps) {
  const { publicKey, signMessage } = useWallet();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const examples = [
    "Find me a 3090 for 30 min under $0.08",
    "GPU for 1 hour under $0.15", 
    "Printer for 2 hours"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signMessage) {
      setError('Connect wallet first');
      return;
    }
    if (!message.trim()) {
      setError('Enter a request');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/agent/intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-wallet': publicKey.toString(),
        },
        body: JSON.stringify({
          message,
          signature: bs58.encode(signature),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage('');
      onIntentCreated(data.intentId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Agent Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!publicKey ? (
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">What compute do you need?</Label>
            <Input
              id="message"
              placeholder="e.g., RTX 4090 for 1 hour under $0.10"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!publicKey || loading}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <Button
                key={ex}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage(ex)}
                disabled={!publicKey || loading}
              >
                {ex}
              </Button>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!publicKey || loading || !message.trim()}
          >
            {loading ? 'Agent is thinking...' : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send to Agent
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}