'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function MerchantLogin() {
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!apiKey.startsWith('sk_')) {
      toast({
        title: 'Invalid API Key',
        description: 'API key must start with sk_',
        variant: 'destructive',
      });
      return;
    }

    document.cookie = `merchant_api_key=${apiKey}; path=/; max-age=2592000`;
    router.push('/merchant/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md border-cyan-500/50">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-cyan-500" />
          </div>
          <CardTitle>Merchant Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="sk_live_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={handleLogin} className="w-full">
            Access Dashboard
          </Button>
        </CardContent>
        <p className="text-xs text-gray-500 text-center mt-4">
          Don't have an API key?
          <Link href="/merchant/register" className="text-cyan-500 hover:underline">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}