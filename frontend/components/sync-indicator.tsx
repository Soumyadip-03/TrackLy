'use client';

import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import useDataSync from '@/hooks/use-data-sync';
import { toast } from '@/components/ui/use-toast';

interface SyncIndicatorProps {
  compact?: boolean;
}

export function SyncIndicator({ compact = false }: SyncIndicatorProps) {
  const { user } = useAuth();
  const { syncInitialized, isSyncing, lastSyncTime, performFullSync } = useDataSync();
  const [isHovered, setIsHovered] = useState(false);
  
  if (!user) return null; // Don't show for unauthenticated users
  
  const handleSync = async () => {
    const success = await performFullSync();
    if (success) {
      toast({
        title: "Sync Complete",
        description: "Your data has been successfully synced with the cloud.",
      });
    } else {
      toast({
        title: "Sync Failed",
        description: "There was an error syncing your data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {compact ? (
            <Button
              variant="ghost"
              size="sm"
              className="relative flex items-center gap-1 h-8 px-2"
              onClick={handleSync}
              disabled={isSyncing}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {syncInitialized ? (
                <Cloud 
                  className={`h-3 w-3 ${isHovered ? 'text-primary' : 'text-muted-foreground'}`} 
                />
              ) : (
                <CloudOff className="h-3 w-3 text-yellow-500" />
              )}
              
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 text-primary animate-spin" />
              ) : (
                <span className="text-xs">{lastSyncTime ? 'Synced' : 'Sync'}</span>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleSync}
              disabled={isSyncing}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {syncInitialized ? (
                <Cloud 
                  className={`h-4 w-4 ${isHovered ? 'text-primary' : 'text-muted-foreground'}`} 
                />
              ) : (
                <CloudOff className="h-4 w-4 text-yellow-500" />
              )}
              
              {isSyncing && (
                <RefreshCw className="h-3 w-3 text-primary absolute top-0.5 right-0.5 animate-spin" />
              )}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-semibold mb-1">
              {syncInitialized ? 'Data is synced with cloud' : 'Offline mode'}
            </p>
            {syncInitialized && (
              <p className="text-muted-foreground">Last sync: {formatLastSyncTime()}</p>
            )}
            <p className="mt-1">
              {isSyncing ? 'Syncing...' : 'Click to sync now'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
