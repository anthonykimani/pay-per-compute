'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package, DollarSign, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/use-assets';

export default function AssetsPage() {
    const { data, isLoading } = useAssets();
    const router = useRouter();
    const { toast } = useToast();

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Compute Marketplace</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.data.map((asset) => (
                    <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-cyan-500" />
                                    {asset.name}
                                </CardTitle>
                                <Badge
                                    variant={asset.status === 'available' ? 'default' : 'secondary'}
                                    className={cn(
                                        asset.status === 'available' && 'bg-green-500',
                                        asset.status === 'occupied' && 'bg-yellow-500',
                                        asset.status === 'maintenance' && 'bg-red-500',
                                    )}
                                >
                                    {asset.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Type</span>
                                <span className="capitalize font-medium">{asset.type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-bold">
                                    ${asset.pricePerUnit}/{asset.unit}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Merchant</span>
                                <span className="font-mono text-xs">
                                    {asset.merchantWallet.slice(0, 6)}...{asset.merchantWallet.slice(-4)}
                                </span>
                            </div>
                            {asset.metadata?.location ? (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Location</span>
                                    <span>{String(asset.metadata.location)}</span>
                                </div>
                            ) : null}
                            <Button
                                className="w-full mt-4"
                                disabled={asset.status !== 'available'}
                                onClick={() => router.push(`/agent?asset=${asset.id}`)}
                            >
                                {asset.status === 'available' ? 'Access via Agent' : 'Unavailable'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}