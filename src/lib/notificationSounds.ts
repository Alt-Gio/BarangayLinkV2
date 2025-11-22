"use client";

/**
 * Notification Sound System
 * Plays different sounds based on notification priority
 * Includes vibration support for mobile devices
 */

// Simple sound system without external dependencies (will add Howler later)
let soundEnabled = typeof window !== 'undefined' ? true : false;

// Web Audio API for playing sounds
const playAudioFile = (filename: string, volume: number = 0.5) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  
  try {
    const audio = new Audio(`/sounds/${filename}`);
    audio.volume = volume;
    audio.play().catch(err => {
      console.log('Sound play prevented:', err.message);
    });
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

export function playNotificationSound(
  type: 'critical' | 'urgent' | 'high' | 'medium' | 'low' | 'success' | 'message' = 'medium'
) {
  if (!soundEnabled) return;
  
  const soundMap: Record<string, { file: string; volume: number }> = {
    critical: { file: 'critical.wav', volume: 0.8 },
    urgent: { file: 'critical.wav', volume: 0.8 },
    high: { file: 'high.wav', volume: 0.6 },
    medium: { file: 'medium.wav', volume: 0.4 },
    low: { file: 'low.wav', volume: 0.2 },
    success: { file: 'success.wav', volume: 0.5 },
    message: { file: 'message.wav', volume: 0.5 },
  };

  const sound = soundMap[type] || soundMap.medium;
  playAudioFile(sound.file, sound.volume);
  
  // Vibrate on mobile
  vibrateDevice(vibrationPatterns[type] || vibrationPatterns.medium);
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('notificationSoundEnabled', enabled.toString());
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('notificationSoundEnabled');
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

// Initialize sound state from localStorage (client-side only)
if (typeof window !== 'undefined') {
  try {
    soundEnabled = isSoundEnabled();
  } catch {
    soundEnabled = true;
  }
}

// Vibration patterns for mobile devices
export const vibrationPatterns: Record<string, number[]> = {
  critical: [200, 100, 200, 100, 200],
  urgent: [200, 100, 200, 100, 200],
  high: [100, 50, 100],
  medium: [100],
  low: [50],
  success: [100, 50, 100],
  message: [50],
};

/**
 * Vibrate device (mobile only)
 */
export function vibrateDevice(pattern: number[] = [100]) {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Vibration not supported, fail silently
  }
}

/**
 * Request notification permission and play test sound
 */
export async function testNotificationSound() {
  // Request permission first
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  
  playNotificationSound('medium');
}
