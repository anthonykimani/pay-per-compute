'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Plus, Shield, Wallet, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { apiClient } from '@/shared/api.config';
import { ApiError } from '@/types';

export default function MerchantRegister() {
  const { publicKey, connected } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    walletAddress: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null); // Store API key
  const [copied, setCopied] = useState(false); // Copy feedback
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (connected && publicKey) {
      setFormData(prev => ({
        ...prev,
        walletAddress: publicKey.toString()
      }));
    }
  }, [connected, publicKey]);

  const handleRegister = async () => {
    if (!formData.name || !formData.walletAddress) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!connected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your Solana wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiClient.post<{
        data: { apiKey: string; walletAddress: string };
        message: string;
      }>('/api/auth/register', formData);

      // ✅ Store API key in state to show copy UI
      setApiKey(data.data.apiKey);
      
      toast({
        title: 'Registration Successful! 🎉',
        description: 'Your API key is ready. Copy it now - you won\'t see it again!',
        variant: 'success',
      });

      // Auto-save to cookie
      document.cookie = `merchant_api_key=${data.data.apiKey}; path=/; max-age=2592000`;

    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: 'Registration Failed',
        description: apiError.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKey) return;
    
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
        variant: 'success',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy API key',
        variant: 'destructive',
      });
    }
  };

  const handleGoToDashboard = () => {
    router.push('/merchant/dashboard');
  };

  // ✅ Show API key screen after registration
  if (apiKey) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg border-green-500/50 bg-green-950/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-green-400">Registration Complete!</CardTitle>
            <CardDescription>
              Save your API key - it won't be shown again
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Your API Key</label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  disabled={true}
                  className="bg-black border-green-500 text-green-400 font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyApiKey}
                  className="border-green-500 hover:bg-green-500/10"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-green-400" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Click the button to copy to clipboard
              </p>
            </div>

            <Button 
              onClick={handleGoToDashboard} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>

            <p className="text-xs text-yellow-500 text-center mt-2">
              ⚠️ Store this key securely. If lost, you'll need to regenerate it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Registration form (original JSX)
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-lg border-cyan-500/50">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-6 w-6 text-cyan-500" />
          </div>
          <CardTitle>Merchant Registration</CardTitle>
          <CardDescription>
            Connect your wallet and register your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Business Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Solana Wallet</label>
            {connected && publicKey ? (
              <Input
                value={formData.walletAddress}
                disabled={true}
                className="bg-green-900/20 border-green-500 text-green-400 font-mono"
              />
            ) : (
              <WalletMultiButton className="w-full justify-center" />
            )}
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={isLoading || !connected || !formData.walletAddress}
            className="w-full"
          >
            {isLoading ? 'Registering...' : 'Register & Get API Key'}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Already have an API key?{' '}
            <a href="/merchant/login" className="text-cyan-500 hover:underline">
              Login here
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}