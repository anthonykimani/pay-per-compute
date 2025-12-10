'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Bot } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <h1 className="text-xl font-bold">PayPerCompute</h1>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}