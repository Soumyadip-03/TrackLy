/**
 * Utilities for saving and retrieving application data from localStorage
 */

// Types for semester-specific attendance data
export interface AttendanceRecord {
  date: string;
  subject: string;
  status: "present" | "absent";
  time?: string;
  room?: string;
  classType?: string;
  semester?: string;
}

export interface SemesterPeriod {
  semester: string;
  startDate: string; // ISO string date
  endDate: string; // ISO string date
}

/**
 * Get the current user's ID for storage separation
 * This creates a user-specific database in localStorage
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'guest';
  
  // Try to get user from token or localStorage
  try {
    // First check for logged-in user ID
    const userToken = localStorage.getItem('trackly_token');
    if (userToken) {
      // Extract user ID from token if possible
      try {
        // Simple token parsing (in a real app, you'd use a proper JWT decoder)
        const base64Url = userToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        if (payload.id) return payload.id;
      } catch (e) {
        console.error('Error parsing user token:', e);
      }
    }
    
    // Fall back to email if logged in but no ID available
    const userEmail = localStorage.getItem('trackly_user_email');
    if (userEmail) {
      return userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    // Check if we have a specific user ID saved
    const userId = localStorage.getItem('trackly_user_id');
    if (userId) return userId;
    
    // If no user ID exists yet, create one and save it
    const newUserId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('trackly_user_id', newUserId);
    return newUserId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'guest';
  }
}

/**
 * Save data to localStorage with a namespace and user-specific prefix
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined') return;
    const userId = getCurrentUserId();
    const storageKey = `trackly_${userId}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
  }
}

/**
 * Retrieve data from localStorage with a namespace and user-specific prefix
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const userId = getCurrentUserId();
    const storageKey = `trackly_${userId}_${key}`;
    const storedData = localStorage.getItem(storageKey);
    
    // Try fallback to non-user-specific data if not found (for backward compatibility)
    if (!storedData) {
      const legacyKey = `trackly_${key}`;
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        // Migrate legacy data to user-specific storage
        const parsedData = JSON.parse(legacyData);
        saveToLocalStorage(key, parsedData);
        return parsedData;
      }
    }
    
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage with a namespace and user-specific prefix
 */
export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    const userId = getCurrentUserId();
    const storageKey = `trackly_${userId}_${key}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
}

/**
 * Clear all data for the current user
 */
export function clearUserData(): void {
  try {
    if (typeof window === 'undefined') return;
    const userId = getCurrentUserId();
    const prefix = `trackly_${userId}_`;
    
    // Find and remove all items that start with the user prefix
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

/**
 * Get attendance records for a specific semester
 */
export function getAttendanceRecordsBySemester(semester: string): AttendanceRecord[] {
  const allRecords = getFromLocalStorage<AttendanceRecord[]>('attendance', []);
  return allRecords.filter(record => !record.semester || record.semester === semester);
}

/**
 * Save new attendance record while maintaining semester information
 */
export function saveAttendanceRecord(record: AttendanceRecord): void {
  const allRecords = getFromLocalStorage<AttendanceRecord[]>('attendance', []);
  
  // Check if record already exists for this date and subject in any semester
  const existingIndex = allRecords.findIndex(r => 
    r.date === record.date && 
    r.subject === record.subject && 
    (!r.semester || r.semester === record.semester)
  );
  
  if (existingIndex >= 0) {
    // Update existing record
    allRecords[existingIndex] = { ...record };
  } else {
    // Add new record
    allRecords.push(record);
  }
  
  saveToLocalStorage('attendance', allRecords);
}

/**
 * Get academic period dates for a specific semester
 */
export function getSemesterPeriod(semester: string): SemesterPeriod | null {
  const periods = getFromLocalStorage<SemesterPeriod[]>('semesterPeriods', []);
  return periods.find(p => p.semester === semester) || null;
}

/**
 * Save academic period for a semester
 */
export function saveSemesterPeriod(period: SemesterPeriod): void {
  const periods = getFromLocalStorage<SemesterPeriod[]>('semesterPeriods', []);
  
  // Check if this semester already has a period defined
  const existingIndex = periods.findIndex(p => p.semester === period.semester);
  
  if (existingIndex >= 0) {
    // Update existing period
    periods[existingIndex] = { ...period };
  } else {
    // Add new period
    periods.push(period);
  }
  
  saveToLocalStorage('semesterPeriods', periods);
}

/**
 * Example usage for app settings
 */
export const AppSettings = {
  saveThemePreference: (theme: string) => saveToLocalStorage('theme', theme),
  getThemePreference: () => getFromLocalStorage<string>('theme', 'system'),
  saveSidebarState: (collapsed: boolean) => saveToLocalStorage('sidebar_collapsed', collapsed),
  getSidebarState: () => getFromLocalStorage<boolean>('sidebar_collapsed', false)
}; 