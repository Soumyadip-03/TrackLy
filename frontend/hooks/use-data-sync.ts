'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { dataSyncService } from '@/lib/services/data-sync-service';

/**
 * Hook to handle data synchronization between localStorage and Supabase
 * Ensures data is available locally for performance while being securely stored in Supabase
 */
export default function useDataSync() {
  const { user } = useAuth();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize data sync when user is authenticated
  useEffect(() => {
    const initializeSync = async () => {
      if (user && !syncInitialized) {
        setIsSyncing(true);
        try {
          const success = await dataSyncService.initialize(user.id);
          if (success) {
            setSyncInitialized(true);
            setLastSyncTime(new Date());
          }
        } catch (error) {
          console.error('Failed to initialize data sync:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    initializeSync();
  }, [user, syncInitialized]);

  // Function to manually trigger a full sync
  const performFullSync = async () => {
    if (!user) return false;
    
    setIsSyncing(true);
    try {
      const success = await dataSyncService.performFullSync(user.id);
      if (success) {
        setLastSyncTime(new Date());
      }
      return success;
    } catch (error) {
      console.error('Failed to perform full sync:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncInitialized,
    isSyncing,
    lastSyncTime,
    performFullSync
  };
}
