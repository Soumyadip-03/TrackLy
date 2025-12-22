'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import useToastNotification from '@/hooks/use-toast-notification';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConnectionStatusProps {
  compact?: boolean;
}

export function ConnectionStatus({ compact = false }: ConnectionStatusProps) {
  const { 
    backendAvailable, 
    connectionError, 
    isOfflineMode,
    checkConnection, 
    enableOfflineMode, 
    disableOfflineMode 
  } = useAuth();
  const { success, error, info } = useToastNotification();
  const [isChecking, setIsChecking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const isConnected = backendAvailable;
  
  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await checkConnection();
      if (connected) {
        success("Connection Restored", "Successfully connected to all services.");
      } else {
        error("Connection Issues", connectionError || "Unable to connect to one or more services.");
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      error("Connection Check Failed", "There was an error checking your connection status.");
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleToggleOfflineMode = async (checked: boolean) => {
    if (isToggling) return;
    setIsToggling(true);
    
    try {
      if (checked) {
        enableOfflineMode();
        info("Offline Mode Enabled", "You can now use the app without an internet connection. Data will be cached locally.");
      } else {
        const result = await disableOfflineMode();
        if (result) {
          success("Online Mode Restored", "Connected to all services.");
        } else {
          error("Cannot Disable Offline Mode", "Connection issues persist. Please check your internet connection.");
        }
      }
    } catch (err) {
      console.error('Error toggling offline mode:', err);
      error("Toggle Failed", "There was an error changing the offline mode.");
    } finally {
      setIsToggling(false);
    }
  };
  
  const getStatusText = () => {
    if (isOfflineMode) return 'Offline Mode';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };
  
  const getStatusColor = () => {
    if (isOfflineMode) return 'text-yellow-500';
    if (isConnected) return isHovered ? 'text-primary' : 'text-green-500';
    return 'text-red-500';
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setDialogOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isConnected || isOfflineMode ? (
                <Wifi className={`h-4 w-4 ${getStatusColor()}`} />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              
              {isChecking && (
                <RefreshCw className="h-3 w-3 text-primary absolute top-0.5 right-0.5 animate-spin" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">
              <p className="font-semibold mb-1">{getStatusText()}</p>
              <p className="text-muted-foreground">
                {isOfflineMode ? 'Using locally stored data' : isConnected ? 'Connected to all services' : 'Connection issues detected'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Status</DialogTitle>
            <DialogDescription>Manage your connection to TrackLy services</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Backend API</h4>
                <p className="text-sm text-muted-foreground">TrackLy API Services</p>
              </div>
              <Badge variant={backendAvailable ? "outline" : "destructive"}>
                {backendAvailable ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {connectionError && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-sm text-red-700">{connectionError}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="font-medium">Enable Offline Mode</h4>
                <p className="text-sm text-muted-foreground">Offline mode allows you to use the app with limited functionality when connection issues occur. Your data will be stored locally and synchronized when connection is restored.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={isOfflineMode}
                  onCheckedChange={handleToggleOfflineMode}
                  disabled={isToggling}
                  aria-label="Toggle offline mode"
                />
                <span className="text-sm text-muted-foreground min-w-[30px]">
                  {isOfflineMode ? "On" : "Off"}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Offline mode allows you to use the app with limited functionality. Your data will be stored locally.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleCheckConnection} 
              disabled={isChecking}
              className="w-full sm:w-auto"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Connection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
