'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Package, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EarningsChart } from '@/components/merchant/earnings-chart';
import { useToast } from '@/hooks/use-toast';
import { 
  useMerchantAssets, 
  useMerchantEarnings,
  useCreateAsset,
  useUpdateAsset 
} from '@/hooks/use-merchant';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Asset, EnhancedAsset, CreateAssetPayload } from '@/types'; // ✅ Updated imports
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

export default function MerchantDashboard() {
  const { data: assets, isLoading: assetsLoading } = useMerchantAssets();
  const { data: earningsData, isLoading: earningsLoading } = useMerchantEarnings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create asset modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createAsset = useCreateAsset();

  // Edit asset modal
  const [editingAsset, setEditingAsset] = useState<EnhancedAsset | null>(null);
  const updateAsset = useUpdateAsset(editingAsset?.id || '');

  // ✅  Include all required fields
  const [formData, setFormData] = useState<CreateAssetPayload>({
    name: '',
    pricePerUnit: '0.10',
    unit: 'minute' as const,
    type: 'gpu' as const,
    metadata: {},
  });

  const totalEarnings = parseFloat(earningsData?.totalEarnings || '0');
  const totalSessions = earningsData?.paymentCount || 0;

  if (assetsLoading || earningsLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleCreateAsset = async () => {
    try {
      await createAsset.mutateAsync(formData);
      setShowCreateModal(false);
      // ✅  Reset with all required fields
      setFormData({
        name: '',
        pricePerUnit: '0.10',
        unit: 'minute',
        type: 'gpu',
        metadata: {},
      });
      toast({
        title: 'Asset Created',
        description: 'Your compute asset is now live!',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Failed to create asset',
        description: 'Please check your inputs',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    try {
      // ✅  Include metadata to match Asset type
      await updateAsset.mutateAsync({
        name: editingAsset.name,
        pricePerUnit: editingAsset.pricePerUnit,
        unit: editingAsset.unit,
        type: editingAsset.type,
        status: editingAsset.status,
        metadata: editingAsset.metadata || {},
      });
      setEditingAsset(null);
      toast({
        title: 'Asset Updated',
        description: 'Changes saved successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update asset',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    toast({
      title: 'Delete Not Implemented',
      description: 'Add DELETE /api/v1/merchant/assets/:id to backend',
      variant: 'destructive',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Asset
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Earnings Chart */}
      <EarningsChart earnings={earningsData?.payments || []} />

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assets?.map((asset: EnhancedAsset) => ( 
              <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{asset.name}</h3>
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>${asset.pricePerUnit}/{asset.unit}</span>
                    <span>{asset.totalSessions || 0} sessions</span>
                    <span>${asset.totalEarnings || '0'} earned</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAsset(asset)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAsset(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Asset Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="RTX 4090 Gaming Rig #1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per Unit (USDC)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: any) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Minute</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpu">GPU</SelectItem>
                  <SelectItem value="printer">3D Printer</SelectItem>
                  <SelectItem value="iot">IoT Device</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleCreateAsset}
            disabled={!formData.name || createAsset.isPending}
            className="w-full"
          >
            {createAsset.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Create Asset
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price per Unit (USDC)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingAsset.pricePerUnit}
                    onChange={(e) => setEditingAsset({ ...editingAsset, pricePerUnit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={editingAsset.unit}
                    onValueChange={(value: any) => setEditingAsset({ ...editingAsset, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Minute</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingAsset.status}
                  onValueChange={(value: any) => setEditingAsset({ ...editingAsset, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button
            onClick={handleUpdateAsset}
            disabled={!editingAsset || updateAsset.isPending}
            className="w-full"
          >
            {updateAsset.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}