// In your main page component
'use client';


import { AgentChat } from '@/components/custom/agent-chat';
import { AgentFeed } from '@/components/custom/agent-feed';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export default function Home() {
  const { publicKey } = useWallet();
  const [intentId, setIntentId] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">PayPerCompute AI Agent</h1>
      
      <AgentChat onIntentCreated={setIntentId} />
      
      {intentId && publicKey && (
        <AgentFeed intentId={intentId} userWallet={publicKey.toString()} />
      )}
    </div>
  );
}