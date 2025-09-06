import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, Download, Upload, HardDrive } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export const OfflineIndicator = () => {
  const { capabilities, exportData } = useOfflineStorage();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {capabilities.isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              Online Mode
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              Offline Mode
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Status</p>
            <Badge variant={capabilities.canWorkOffline ? "secondary" : "destructive"}>
              {capabilities.canWorkOffline ? "Fully Functional" : "Limited"}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-muted-foreground">Local Data</p>
            <Badge variant={capabilities.hasData ? "secondary" : "outline"}>
              {capabilities.hasData ? "Available" : "Empty"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Storage Usage</span>
            <span className="text-sm">
              {(capabilities.storageQuota.used / 1024).toFixed(1)}KB
            </span>
          </div>
          <div className="bg-secondary rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min(capabilities.storageQuota.percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            ✓ Create and manage tasks without internet
            <br />
            ✓ All data saved locally on your device
            <br />
            ✓ Auto-sync when connection restored
          </p>
          
          <Button 
            onClick={exportData} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Backup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};