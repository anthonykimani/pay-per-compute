'use client';

import { useEffect, useState, useRef } from 'react';
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
  const mountedRef = useRef(false);

  // ✅ Normalize wallet
  const normalizedWallet = userWallet.toLowerCase();

  useEffect(() => {
    // ✅ Prevent duplicate subscriptions on hot reload
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (!connected) {
      console.log('🐞 AGENT FEED: Socket not connected yet');
      return;
    }
    
    if (!intentId || !normalizedWallet) {
      console.warn('🐞 AGENT FEED: Missing intentId or wallet', { intentId, normalizedWallet });
      return;
    }
    
    console.log('🐞 AGENT FEED: Mounting component, subscribing to agent updates...');

    // ✅ CRITICAL: Subscribe FIRST, then attach listener
    console.log('🐞 AGENT FEED: Subscribing to wallet:', normalizedWallet);
    subscribeToWallet(normalizedWallet);

    const unsubscribe = onAgentLog((log) => {
      console.log('🐞 AGENT FEED: Received log', {
        logIntentId: log.intentId,
        componentIntentId: intentId,
        matches: log.intentId === intentId,
        logMessage: log.message
      });
      
      if (log.intentId === intentId) {
        console.log('🐞 AGENT FEED: ✅ Log matches intent, adding to state');
        setLogs(prev => {
          const newLogs = [log, ...prev];
          console.log('🐞 AGENT FEED: New logs count:', newLogs.length);
          return newLogs;
        });
      } else {
        console.log('🐞 AGENT FEED: ❌ Log ignored (different intent)');
      }
    });

    return () => {
      console.log('🐞 AGENT FEED: Unmounting, cleaning up...');
      unsubscribe();
      mountedRef.current = false;
    };
  }, [intentId, normalizedWallet, subscribeToWallet, onAgentLog, connected]);

  const getIcon = (level: AgentLog['level']) => {
    const icons = {
      info: Loader2,
      success: CheckCircle,
      error: AlertCircle,
      warning: Clock,
    };
    return icons[level] || Loader2;
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

  // ✅ Debug: Log render with current state
  console.log('🐞 AGENT FEED: Rendering', {
    intentId,
    userWallet: normalizedWallet,
    connected,
    logsCount: logs.length,
  });

  if (!connected) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting to agent...
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Waiting for agent updates...</p>
              <p className="text-xs">Intent: {intentId}</p>
              <p className="text-xs">Wallet: {normalizedWallet.slice(0, 8)}...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => {
                const Icon = getIcon(log.level);
                const color = getColor(log.level);
                return (
                  <div key={`${log.intentId}-${i}-${log.timestamp}`} className="p-3 rounded-lg border bg-secondary/50">
                    <div className="flex items-start gap-2">
                      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', color)} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.asset && (
                          <p className="text-xs text-muted-foreground">
                            <Package className="inline h-3 w-3 mr-1" />
                            {log.asset.name} @ ${log.asset.pricePerUnit}/{log.asset.unit}
                          </p>
                        )}
                        {log.totalCost && (
                          <p className="text-xs font-medium text-primary">
                            <DollarSign className="inline h-3 w-3 mr-1" />
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