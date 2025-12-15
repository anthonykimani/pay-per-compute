'use client';

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Clock, DollarSign, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AgentLog } from '@/types';
import { useSocket } from '@/provider/socket-provider';

interface AgentFeedProps {
  intentId: string;
  userWallet: string;
}

export function AgentFeed({ intentId, userWallet }: AgentFeedProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const { subscribeToWallet, onAgentLog, connected } = useSocket();

  useEffect(() => {
    if (!connected) return;
    
    const unsubscribe = onAgentLog((log) => {
      if (log.intentId === intentId) {
        setLogs(prev => [log, ...prev]);
      }
    });

    subscribeToWallet(userWallet);

    return () => {
      unsubscribe();
    };
  }, [intentId, userWallet, subscribeToWallet, onAgentLog, connected]);

  const getIcon = (level: AgentLog['level']) => {
    const icons = {
      info: Loader2,
      success: CheckCircle,
      error: AlertCircle,
      warning: Clock,
    };
    return icons[level];
  };

  const getColor = (level: AgentLog['level']) => {
    const colors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
    };
    return colors[level];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {!connected ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to agent...
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for agent updates...</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => {
                const Icon = getIcon(log.level);
                const color = getColor(log.level);
                return (
                  <div key={`${log.timestamp.toISOString()}-${i}`} className="p-3 rounded-lg border bg-secondary/50">
                    <div className="flex items-start gap-2">
                      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0 animate-pulse', color)} />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.asset && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {log.asset.name} @ ${log.asset.pricePerUnit}/{log.asset.unit}
                          </p>
                        )}
                        {log.totalCost && (
                          <p className="text-xs font-medium text-primary flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Total: ${log.totalCost}
                          </p>
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