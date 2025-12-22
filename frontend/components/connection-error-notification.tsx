'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import useToastNotification from '@/hooks/use-toast-notification';
import useConnectionMonitor from '@/hooks/use-connection-monitor';

export function ConnectionErrorNotification() {
  const { supabaseAvailable, connectionError, isOfflineMode } = useAuth();
  const { error, info, success } = useToastNotification();
  const [hasShownError, setHasShownError] = useState(false);
  const [hasShownOfflineMode, setHasShownOfflineMode] = useState(false);
  const [hasShownReconnected, setHasShownReconnected] = useState(false);
  
  // Initialize connection monitor with default settings
  const { isConnected, failedAttempts } = useConnectionMonitor({
    checkInterval: 30000, // Check every 30 seconds
    autoEnableOfflineMode: true,
    failedAttemptsThreshold: 3,
    autoReconnect: true,
    reconnectInterval: 60000, // Try to reconnect every minute when in offline mode
  });
  
  useEffect(() => {
    // Only show connection error notification if we're not in offline mode
    // and there's a connection error and we haven't shown it yet
    if (!isOfflineMode && connectionError && !hasShownError && supabaseAvailable === false) {
      error(
        'Connection Issue Detected',
        `${connectionError} Some features may be limited. You can enable offline mode from the connection status indicator.`,
        { duration: 10000 }
      );
      setHasShownError(true);
    }
    
    // Reset the flag when connection is restored
    if (supabaseAvailable === true && hasShownError) {
      setHasShownError(false);
    }
  }, [supabaseAvailable, connectionError, isOfflineMode, hasShownError, error]);
  
  // Show notification when connection is restored after being offline
  useEffect(() => {
    // If we're connected and we previously had an error or were in offline mode
    // and we haven't shown the reconnected notification yet
    if (isConnected && !hasShownReconnected && (hasShownError || hasShownOfflineMode)) {
      success(
        'Connection Restored',
        'Your connection has been restored. Your data will now be synchronized with the cloud.',
        { duration: 5000 }
      );
      setHasShownReconnected(true);
      // Reset error and offline mode notification flags
      setHasShownError(false);
      setHasShownOfflineMode(false);
    } else if (!isConnected) {
      // Reset the reconnected notification flag when connection is lost
      setHasShownReconnected(false);
    }
  }, [isConnected, hasShownError, hasShownOfflineMode, hasShownReconnected, success]);
  
  useEffect(() => {
    // Show notification when offline mode is enabled
    if (isOfflineMode && !hasShownOfflineMode) {
      info(
        'Offline Mode Enabled',
        'You are now using the app in offline mode. Your data will be stored locally and synchronized when connection is restored.',
        { duration: 8000 }
      );
      setHasShownOfflineMode(true);
    }
    
    // Reset the flag when offline mode is disabled
    if (!isOfflineMode && hasShownOfflineMode) {
      setHasShownOfflineMode(false);
    }
  }, [isOfflineMode, hasShownOfflineMode, info]);
  
  // This is a notification-only component, so it doesn't render anything
  return null;
}