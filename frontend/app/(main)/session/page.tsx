'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionDetails } from '@/components/agent/session-details';
import { Loader2 } from 'lucide-react';
import { useSessionStatus } from '@/hooks/use-payment-flow';


export default function SessionPage() {
  const [sessionToken, setSessionToken] = useState('');
  const [submittedToken, setSubmittedToken] = useState('');

  const { data: session, isLoading } = useSessionStatus(submittedToken);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedToken(sessionToken);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Session Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Lookup Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Enter session token"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
            />
            <Button type="submit">Check Status</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {session && <SessionDetails session={session} />}
    </div>
  );
}