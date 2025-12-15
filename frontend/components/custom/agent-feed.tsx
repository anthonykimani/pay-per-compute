// packages/dashboard/src/components/AgentFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AgentLog {
  intentId: string;
  message: string;
  timestamp: Date;
  requiresApproval?: boolean;
  asset?: { id: string; name: string; pricePerUnit: string };
  totalCost?: string;
}

interface AgentFeedProps {
  intentId: string;
  userWallet: string;
}

export function AgentFeed({ intentId, userWallet }: AgentFeedProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);

  useEffect(() => {
    // Create socket connection
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!);
    
    // Subscribe to user events
    socket.emit('subscribe:user', userWallet);
    
    // Listen for agent logs
    socket.on('agent:log', (log: AgentLog) => {
      if (log.intentId === intentId) {
        setLogs(prev => [log, ...prev]);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [intentId, userWallet]);

  const getIcon = (message: string) => {
    if (message.includes('❌')) return <AlertCircle className="text-red-500" />;
    if (message.includes('✅') || message.includes('🎉')) return <CheckCircle className="text-green-500" />;
    return <Loader2 className="animate-spin text-blue-500" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Agent Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for agent updates...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-3 p-3 rounded-lg bg-secondary">
                <div className="flex items-start gap-2">
                  {getIcon(log.message)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{log.message}</p>
                    {log.asset && (
                      <p className="text-xs text-muted-foreground">
                        📦 {log.asset.name} @ ${log.asset.pricePerUnit}/min
                      </p>
                    )}
                    {log.totalCost && (
                      <p className="text-xs font-medium text-primary">
                        💰 Total: ${log.totalCost}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Agent is scanning every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}