import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, Cloud, Loader2, CheckCircle } from 'lucide-react';
import { useOfflineServiceRecords } from '@/hooks/useTechnicianAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const OfflineSyncBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const { getQueue, removeFromQueue, clearQueue } = useOfflineServiceRecords();
  const { toast } = useToast();
  
  const pendingRecords = getQueue();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncComplete(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncComplete(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingRecords = async () => {
    if (pendingRecords.length === 0) return;
    
    setSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const record of pendingRecords) {
      try {
        const { id, queuedAt, photos, ...serviceRecord } = record;
        
        const { error } = await supabase
          .from('service_records')
          .insert(serviceRecord);

        if (error) throw error;
        
        removeFromQueue(id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync record:', error);
        errorCount++;
      }
    }

    setSyncing(false);

    if (successCount > 0) {
      setSyncComplete(true);
      toast({
        title: 'Sync Complete',
        description: `${successCount} record(s) synced successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => setSyncComplete(false), 3000);
    } else if (errorCount > 0) {
      toast({
        title: 'Sync Failed',
        description: `Failed to sync ${errorCount} record(s)`,
        variant: 'destructive',
      });
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingRecords.length > 0) {
      syncPendingRecords();
    }
  }, [isOnline]);

  if (syncComplete) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10 mb-4">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="flex items-center gap-2 text-green-700 dark:text-green-400">
          All records synced successfully!
        </AlertDescription>
      </Alert>
    );
  }

  if (!isOnline) {
    return (
      <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-4">
        <WifiOff className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between gap-2">
          <span className="text-yellow-700 dark:text-yellow-400">
            You're offline. Changes will sync when connected.
            {pendingRecords.length > 0 && ` (${pendingRecords.length} pending)`}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (pendingRecords.length > 0) {
    return (
      <Alert className="border-primary/50 bg-primary/5 mb-4">
        <Cloud className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-2 w-full">
          <span>{pendingRecords.length} record(s) pending sync</span>
          <Button 
            size="sm" 
            onClick={syncPendingRecords}
            disabled={syncing}
            className="gap-1.5"
          >
            {syncing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3" />
                Sync Now
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
