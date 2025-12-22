/**
 * Auth utilities for the application
 */

import { getFromLocalStorage, saveToLocalStorage } from './storage-utils';
import { playNotificationSound } from './sound-utils';
import { toast } from '@/components/ui/use-toast';
import { addLoginNotification, addSecurityAlertNotification } from './notification-handlers';

// Define login record type
export interface LoginRecord {
  timestamp: string;
  device: string;
  browser: string;
  ip?: string;
  location?: string;
}

// Max number of login records to keep
const MAX_LOGIN_RECORDS = 10;

/**
 * Record a successful login with the current date and device info
 * @returns The login record
 */
export const recordSuccessfulLogin = async (): Promise<LoginRecord> => {
  try {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return {
        timestamp: new Date().toISOString(),
        device: 'Unknown',
        browser: 'Unknown'
      };
    }
    
    // Create login record with current time and device info
    const loginRecord: LoginRecord = {
      timestamp: new Date().toISOString(),
      device: detectDevice(),
      browser: detectBrowser(),
    };
    
    try {
      // Save to localStorage
      saveLoginRecord(loginRecord);
      
      // Add login notification using the centralized utility
      addLoginNotification(loginRecord.device, loginRecord.browser);
      
      // Simulate sending email notification
      await simulateSendLoginEmail(loginRecord);
      
      // Dispatch an event so components can update
      if (typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('userLoggedIn', { 
          detail: { timestamp: loginRecord.timestamp } 
        }));
      }
    } catch (innerError) {
      console.error("Error during login record operations:", innerError);
    }
    
    return loginRecord;
  } catch (error) {
    console.error("Error in recordSuccessfulLogin:", error);
    // Return a fallback record
    return {
      timestamp: new Date().toISOString(),
      device: 'Unknown',
      browser: 'Unknown'
    };
  }
};

/**
 * Detect user's device type
 */
const detectDevice = (): string => {
  try {
    if (typeof window === 'undefined' || !navigator || !navigator.userAgent) {
      return 'Unknown';
    }
    
    const userAgent = navigator.userAgent;
    
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux';
    
    return 'Unknown';
  } catch (error) {
    console.error("Error detecting device:", error);
    return 'Unknown';
  }
};

/**
 * Detect user's browser
 */
const detectBrowser = (): string => {
  try {
    if (typeof window === 'undefined' || !navigator || !navigator.userAgent) {
      return 'Unknown';
    }
    
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) return 'Internet Explorer';
    
    return 'Unknown';
  } catch (error) {
    console.error("Error detecting browser:", error);
    return 'Unknown';
  }
};

/**
 * Save login record to localStorage
 */
const saveLoginRecord = (record: LoginRecord): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Get existing records
    const existingRecords = getFromLocalStorage<LoginRecord[]>('login_records', []);
    
    // Add new record at the beginning
    const updatedRecords = [record, ...existingRecords];
    
    // Keep only the most recent records
    const trimmedRecords = updatedRecords.slice(0, MAX_LOGIN_RECORDS);
    
    // Save back to localStorage
    saveToLocalStorage('login_records', trimmedRecords);
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Login record saved:', record);
    }
  } catch (error) {
    console.error('Error saving login record:', error);
  }
};

/**
 * Simulate sending login notification email
 * In a real implementation, this would call a server API
 */
const simulateSendLoginEmail = async (record: LoginRecord): Promise<void> => {
  try {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    
    // Get user settings - with safety
    let userEmail = '';
    try {
      userEmail = getFromLocalStorage<string>('user_email', '');
    } catch (err) {
      console.error('Failed to get user email:', err);
    }
    
    // Skip if no email
    if (!userEmail) {
      return Promise.resolve();
    }
    
    // Format date for display
    const date = new Date(record.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    
    // Show toast (with safety)
    try {
      toast({
        title: "Email Notification (Simulation)",
        description: `In a production environment, a security alert would be sent to ${userEmail}`,
        duration: 5000,
      });
    } catch (toastError) {
      console.error('Toast error:', toastError);
    }
    
    // Add security notification (with safety)
    try {
      addSecurityAlertNotification(
        `Your account was accessed from ${record.browser} on ${record.device} at ${formattedTime}.`, 
        {
          emailSent: true,
          emailTo: userEmail,
          device: record.device,
          browser: record.browser,
          timestamp: record.timestamp
        }
      );
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }
    
    // Only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SIMULATED EMAIL] Login notification to: ${userEmail}`);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error sending email notification:', error);
    return Promise.resolve(); // Always resolve to prevent chain breaking
  }
};

/**
 * Get all login records
 */
export const getLoginRecords = (): LoginRecord[] => {
  return getFromLocalStorage<LoginRecord[]>('login_records', []);
}; 