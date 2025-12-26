"use client"

/**
 * Sound utility functions for the application
 */

import { getFromLocalStorage, saveToLocalStorage } from './storage-utils';

// Define settings type
interface SoundSettings {
  notificationSound?: boolean;
  [key: string]: any;
}

// Create an audio context for playing sounds
let audioContext: AudioContext | null = null;

// Initialize audio context on user interaction
export function initializeAudio() {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new AudioContext();
  }
}

/**
 * Check if we're in a browser environment that supports audio
 */
const isBrowserWithAudio = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.AudioContext !== 'undefined' || 
         typeof (window as any).webkitAudioContext !== 'undefined';
}

// Get notification sound preference
export function getNotificationSoundPreference(): boolean {
  try {
    return localStorage.getItem('notification_sound_enabled') === 'true';
  } catch (error) {
    console.error('Error getting notification sound preference:', error);
    return true; // Default to enabled
  }
}

// Set notification sound preference
export function setNotificationSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem('notification_sound_enabled', enabled.toString());
  } catch (error) {
    console.error('Error setting notification sound preference:', error);
  }
}

/**
 * Play the notification sound with fallbacks
 * @returns Promise that resolves when sound is played (or fails)
 */
export async function playNotificationSound(type: 'success' | 'warning' | 'alert' = 'success') {
  // Check if notification sound is enabled
  const settings = getFromLocalStorage<SoundSettings>('notification_settings', {});
  if (settings.notificationSound === false) return;

  if (!audioContext) {
    initializeAudio();
  }

  if (!audioContext) return; // Exit if audio context still not available

  try {
    // Create oscillator for the notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure sound based on notification type
    switch (type) {
      case 'success':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        break;
      case 'warning':
        oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime); // C#5 note
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        break;
      case 'alert':
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5 note
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        break;
    }

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop the sound
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);

  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Toggle notification sound setting
 * @param enable - Whether to enable notification sounds
 */
export const toggleNotificationSound = (enable: boolean): void => {
  try {
    // Get existing settings
    const settings = getFromLocalStorage<SoundSettings>('notification_settings', {});
    
    // Update notification sound setting
    settings.notificationSound = enable;
    
    // Save with proper namespace
    saveToLocalStorage('notification_settings', settings);
    
    // For debugging
    console.log(`Notification sound ${enable ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error toggling notification sound setting:', error);
  }
};

// Function to check if notification sounds are supported
export function isNotificationSoundSupported(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window;
}