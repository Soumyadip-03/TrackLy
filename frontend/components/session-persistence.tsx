'use client';

import { useSessionPersistence } from '@/lib/hooks/useSessionPersistence';

/**
 * Component that ensures session persistence across the application
 * This helps solve the issue of users being redirected to login page
 * even when they have a valid session
 */
export function SessionPersistenceProvider({ children }: { children: React.ReactNode }) {
  // Use the session persistence hook
  useSessionPersistence();
  
  // Simply render children, the hook does all the work
  return <>{children}</>;
}
