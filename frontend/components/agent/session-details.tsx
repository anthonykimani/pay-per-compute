'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Wifi, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types';

interface SessionDetailsProps {
  session: Session;
  onExtend?: () => void;
}

export function SessionDetails({ session, onExtend }: SessionDetailsProps) {
  const { toast } = useToast();
  
  const handleConnect = () => {
    if (!session.websocketUrl) {
      toast({
        title: 'Error',
        description: 'No WebSocket URL available',
        variant: 'destructive',
      });
      return;
    }
    window.open(session.websocketUrl, '_blank');
  };

  return (
    <Card className="border-green-500/50 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <CheckCircle className="h-5 w-5" />
          Session Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 p-4 rounded-lg bg-background">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Session Token</span>
            <span className="font-mono text-xs">{session.token}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Expires</span>
            <span className="font-medium">{formatDistanceToNow(new Date(session.expiresAt))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-bold">${session.amountPaid}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Extended</span>
            <span>{session.isExtended ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleConnect} className="flex-1">
            <Wifi className="mr-2 h-4 w-4" />
            Connect
          </Button>
          <Button onClick={onExtend} variant="outline" className="flex-1">
            <DollarSign className="mr-2 h-4 w-4" />
            Extend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}