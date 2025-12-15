'use client';

import { AgentInterface } from '@/components/agent/agent-interface';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot } from 'lucide-react';

export default function AgentPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Compute Agent
          </h1>
          <p className="text-muted-foreground mt-2">Chat with AI to find and access compute resources instantly</p>
        </div>
        <WalletMultiButton />
      </div>
      <AgentInterface />
    </div>
  );
}