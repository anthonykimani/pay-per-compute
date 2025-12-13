// src/components/agent/agent-chat.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot, Send } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useCreateIntent } from '@/hooks/use-agent-intent';

const formSchema = z.object({
  message: z.string().min(10, 'Be more specific about your compute needs'),
});

type FormValues = z.infer<typeof formSchema>;

export function AgentChat({ onIntentCreated }: { onIntentCreated: (id: string) => void }) {
  const wallet = useWallet();
  const { toast } = useToast();
  const createIntent = useCreateIntent();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });

  const examples = [
    "RTX 4090 for 1 hour under $0.10/min",
    "GPU for AI inference, 30 min budget $5",
    "3D printer in Nairobi for 2 hours",
  ];

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createIntent.mutateAsync(values.message);
      form.reset();
      onIntentCreated(result.intentId);
      toast({
        title: 'Intent Created',
        description: 'Agent is now scanning the marketplace...',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create intent',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Compute Finder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g., Find me a 3090 for 30 min under $0.08"
                      disabled={!wallet.connected || createIntent.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <Button
                  key={ex}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('message', ex)}
                  disabled={!wallet.connected || createIntent.isPending}
                  className="text-xs"
                >
                  {ex}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <WalletMultiButton className="w-full justify-center" />
              </div>
              <Button
                type="submit"
                disabled={!wallet.connected || createIntent.isPending || !form.formState.isValid}
                className="flex-1"
              >
                {createIntent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}