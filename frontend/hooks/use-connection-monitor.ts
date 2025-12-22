'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ConnectionMonitorOptions {
  /**
   * Interval in milliseconds to check connection status
   * @default 30000 (30 seconds)
   */
  checkInterval?: number;
  
  /**
   * Whether to automatically enable offline mode after a certain number of failed attempts
   * @default true
   */
  autoEnableOfflineMode?: boolean;
  
  /**
   * Number of consecutive failed connection attempts before enabling offline mode
   * @default 3
   */
  failedAttemptsThreshold?: number;
  
  /**
   * Whether to automatically attempt to reconnect periodically when in offline mode
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Interval in milliseconds to attempt reconnection when in offline mode
   * @default 60000 (1 minute)
   */
  reconnectInterval?: number;
}

/**
 * Hook to monitor connection status and handle reconnection attempts
 */
function useConnectionMonitor(options: ConnectionMonitorOptions = {}) {
  const {
    checkInterval = 30000, // 30 seconds
    autoEnableOfflineMode = true,
    failedAttemptsThreshold = 3,
    autoReconnect = true,
    reconnectInterval = 60000, // 1 minute
  } = options;
  
  const { 
    checkConnection, 
    supabaseAvailable, 
    backendAvailable, 
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode
  } = useAuth();
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  // Function to check connection status
  const checkConnectionStatus = useCallback(async () => {
    if (!isMonitoring) return;
    
    const isConnected = await checkConnection();
    
    if (isConnected) {
      // Reset failed attempts counter if connection is successful
      setFailedAttempts(0);
      
      // If we're in offline mode and connection is restored, attempt to disable offline mode
      if (isOfflineMode && autoReconnect) {
        await disableOfflineMode();
      }
    } else {
      // Increment failed attempts counter
      setFailedAttempts(prev => prev + 1);
      
      // If we've reached the threshold and auto-enable offline mode is enabled,
      // enable offline mode
      if (autoEnableOfflineMode && failedAttempts >= failedAttemptsThreshold && !isOfflineMode) {
        enableOfflineMode();
      }
    }
  }, [checkConnection, isMonitoring, isOfflineMode, autoReconnect, autoEnableOfflineMode, failedAttempts, failedAttemptsThreshold, disableOfflineMode, enableOfflineMode]);
  
  // Set up interval to check connection status
  useEffect(() => {
    // Initial check
    checkConnectionStatus();
    
    // Set up interval for regular connection checks
    const intervalId = setInterval(() => {
      // If we're in offline mode, use the reconnect interval
      // Otherwise, use the regular check interval
      if (isOfflineMode && !autoReconnect) {
        // Skip checking if we're in offline mode and auto-reconnect is disabled
        return;
      }
      
      checkConnectionStatus();
    }, isOfflineMode ? reconnectInterval : checkInterval);
    
    return () => clearInterval(intervalId);
  }, [checkConnectionStatus, checkInterval, reconnectInterval, isOfflineMode, autoReconnect]);
  
  // Function to manually check connection status
  const manualCheck = async () => {
    return await checkConnectionStatus();
  };
  
  // Function to pause monitoring
  const pauseMonitoring = () => {
    setIsMonitoring(false);
  };
  
  // Function to resume monitoring
  const resumeMonitoring = () => {
    setIsMonitoring(true);
  };
  
  return {
    isConnected: supabaseAvailable && backendAvailable,
    failedAttempts,
    isMonitoring,
    manualCheck,
    pauseMonitoring,
    resumeMonitoring
  };
}

export default useConnectionMonitor;