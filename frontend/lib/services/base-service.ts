import { toast } from 'sonner';
import { fetchWithAuth } from '../api';

/**
 * Base service class for handling common backend operations
 * Provides error handling, logging, and utility methods
 */
export class BaseService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get the current user ID from the session
   * @returns Promise with the user ID or null if not authenticated
   */
  protected async getCurrentUserId(): Promise<string | null> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('trackly_token') : null;
      if (!token) return null;
      
      const response = await fetchWithAuth('/auth/me');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.user?.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Handle errors from backend operations
   * @param error The error object
   * @param operation Description of the operation that failed
   * @param showToast Whether to show a toast notification
   */
  protected handleError(error: any, operation: string, showToast = true): void {
    console.error(`Error ${operation}:`, error);
    
    if (showToast) {
      toast.error(`Failed to ${operation.toLowerCase()}. Please try again.`);
    }
  }

  /**
   * Log success messages and optionally show toast notifications
   * @param message Success message
   * @param showToast Whether to show a toast notification
   */
  protected logSuccess(message: string, showToast = true): void {
    console.log(message);
    
    if (showToast) {
      toast.success(message);
    }
  }

  /**
   * Check if the user is authenticated
   * @param showToast Whether to show a toast notification if not authenticated
   * @returns Boolean indicating if the user is authenticated
   */
  protected async isAuthenticated(showToast = true): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    
    if (!userId) {
      if (showToast) {
        toast.error('You must be logged in to perform this action');
      }
      return false;
    }
    
    return true;
  }
}
