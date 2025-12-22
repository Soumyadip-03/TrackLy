"use client"

import { addNotification } from './notification-utils';

/**
 * Add a login notification
 */
export async function addLoginNotification(device: string, browser: string): Promise<string> {
  return addNotification({
    type: "info",
    title: "New Login",
    message: `Successfully logged in from ${browser} on ${device}`,
    category: "login",
    priority: "low",
    details: { device, browser }
  });
}

/**
 * Add a security alert notification
 */
export async function addSecurityAlertNotification(message: string, details: any): Promise<string> {
  return addNotification({
    type: "alert",
    title: "Security Alert",
    message,
    category: "security",
    priority: "high",
    details
  });
} 