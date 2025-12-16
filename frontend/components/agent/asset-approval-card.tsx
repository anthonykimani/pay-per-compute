'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Asset } from '@/types';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, DollarSign, Clock, Package } from 'lucide-react';

interface Props {
    asset: Asset; // ✅ Now required, not optional
    durationMinutes: number;
    totalCost: string;
    onApprove: () => void;
    onReject: () => void;
}

export function AssetApprovalCard({ asset, durationMinutes, totalCost, onApprove, onReject }: Props) {
    return (
        <Card className="border-yellow-500/50 bg-yellow-500/5 animate-in fade-in zoom-in-95">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                    <CheckCircle className="h-5 w-5" />
                    Agent Found a Match!
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 p-4 rounded-lg bg-background">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Asset
                        </span>
                        <span className="font-bold">{asset.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration
                        </span>
                        <span className="font-bold">{durationMinutes} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Cost
                        </span>
                        <span className="font-bold text-lg text-yellow-400">${totalCost}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve & Pay
                    </Button>
                    <Button onClick={onReject} variant="outline" className="flex-1 hover:bg-red-500/10">
                        <XCircle className="mr-2 h-4 w-4" />
                        Find Another
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}