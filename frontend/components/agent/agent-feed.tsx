// src/components/agent/agent-feed.tsx
'use client';

import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Clock, DollarSign, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import { AgentLog } from '@/types/common';
import { useSocket } from '@/provider/socket-provider';

interface AgentFeedProps {
  intentId: string;
  userWallet: string;
  className?: string;
}

const logStyles = {
  info: 'text-blue-500',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
} as const;

const logIcons = {
  info: Loader2,
  success: CheckCircle,
  error: AlertCircle,
  warning: Clock,
} as const;

export function AgentFeed({ intentId, userWallet, className }: AgentFeedProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const { subscribeToWallet, onAgentLog } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    subscribeToWallet(userWallet);
    
    const unsubscribe = onAgentLog((log) => {
      if (log.intentId === intentId) {
        setLogs((prev) => [log, ...prev]);
        
        // If a successful match, invalidate asset queries
        if (log.level === 'success' && log.asset) {
          queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
      }
    });

    return unsubscribe;
  }, [intentId, userWallet, subscribeToWallet, onAgentLog, queryClient]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Agent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {logs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for agent updates...
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => {
                const Icon = logIcons[log.level];
                return (
                  <div
                    key={`${log.timestamp.toISOString()}-${index}`}
                    className="p-3 rounded-lg border bg-secondary/50"
                  >
                    <div className="flex gap-3">
                      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', logStyles[log.level])} />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">{log.message}</p>
                        
                        {log.asset && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span>{log.asset.name}</span>
                            <span>•</span>
                            <span>${log.asset.pricePerUnit}/{log.asset.unit}</span>
                          </div>
                        )}
                        
                        {log.totalCost && (
                          <div className="flex items-center gap-2 text-xs font-medium text-primary">
                            <DollarSign className="h-3 w-3" />
                            Total: ${log.totalCost}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(log.timestamp)} ago
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}