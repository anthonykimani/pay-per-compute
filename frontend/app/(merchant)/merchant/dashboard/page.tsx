'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Package, TrendingUp } from 'lucide-react';
import { EarningsChart } from '@/components/merchant/earnings-chart';
import { useToast } from '@/hooks/use-toast';
import { useMerchantAssets, useMerchantEarnings } from '@/hooks/use-merchant';

export default function MerchantDashboard() {
  const { data: assets, isLoading: assetsLoading } = useMerchantAssets();
  const { data: earnings, isLoading: earningsLoading } = useMerchantEarnings();
  const { toast } = useToast();

  if (assetsLoading || earningsLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalEarnings = Array.isArray(earnings)
    ? earnings.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    : 0;

  const totalSessions = Array.isArray(earnings) ? earnings.length : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Assets</p>
              <p className="text-2xl font-bold">{assets?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EarningsChart />
    </div>
  );
}