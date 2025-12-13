'use client';


import { Toaster } from '@/components/ui/sonner'; 
import { WalletProviders } from './wallet-providers';
import { SocketProvider } from './socket-provider';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProviders>
      <QueryProvider>
        <SocketProvider>
          {children}
          <Toaster position="top-right" expand={false} />
        </SocketProvider>
      </QueryProvider>
    </WalletProviders>
  );
}