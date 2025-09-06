import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useToast } from '@/hooks/use-toast';
import { useSyncManager } from '@/hooks/useSyncManager';
import { LocalStorageService } from '@/utils/localStorageService';
import { 
  Cloud, 
  CloudOff, 
  Smartphone, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Database,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const { syncStatus, forcSync, clearLocalData } = useSyncManager();
  const { toast } = useToast();

  const handleForceSync = async () => {
    const success = await forcSync();
    if (success) {
      toast({
        title: "Sync Complete",
        description: "All tasks are now synchronized",
      });
    }
  };

  const handleClearLocal = () => {
    clearLocalData();
    toast({
      title: "Local Data Cleared",
      description: "All local data has been removed",
    });
  };

  const storageInfo = LocalStorageService.getStorageInfo();
  const localTasks = LocalStorageService.getTasks();

  return (
    <div className="space-y-4">
      {/* Offline-First Capabilities */}
      <OfflineIndicator />
      
      {/* Detailed Sync Status */}
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Detailed Sync Status
          </CardTitle>
          <CardDescription>
            Advanced sync and storage management
          </CardDescription>
        </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm font-medium">
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
            {syncStatus.isOnline ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sync Status</span>
            {syncStatus.isSyncing ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {syncStatus.pendingChanges === 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">Up to date</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning">
                      {syncStatus.pendingChanges} pending
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {syncStatus.lastSync > 0 && (
            <div className="text-xs text-muted-foreground">
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}
        </div>

        {/* Local Storage Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-medium">Local Storage</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {localTasks.length} tasks
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Storage Used</span>
              <span>{(storageInfo.used / 1024).toFixed(1)}KB</span>
            </div>
            <Progress value={Math.min(storageInfo.percentage, 100)} className="h-2" />
          </div>
        </div>

        {/* Pending Changes */}
        {syncStatus.pendingChanges > 0 && (
          <div className="bg-warning/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Pending Changes</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              You have {syncStatus.pendingChanges} changes waiting to sync to the cloud.
            </p>
            {syncStatus.isOnline && (
              <Button 
                onClick={handleForceSync}
                size="sm" 
                variant="outline"
                disabled={syncStatus.isSyncing}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            )}
          </div>
        )}

        {/* Cloud Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Cloud className="h-4 w-4 text-primary" />
            ) : (
              <CloudOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">Cloud Backup</span>
          </div>
          
          <Badge variant={syncStatus.isOnline ? 'default' : 'secondary'}>
            {syncStatus.isOnline ? 'Active' : 'Unavailable'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {syncStatus.isOnline && !syncStatus.isSyncing && (
            <Button 
              onClick={handleForceSync}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync
            </Button>
          )}
          
          <Button 
            onClick={handleClearLocal}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            Clear Local Data
          </Button>
        </div>

        {/* Offline Notice */}
        {!syncStatus.isOnline && (
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Offline Mode Active</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Full functionality available offline. All changes saved locally and will sync when online.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};