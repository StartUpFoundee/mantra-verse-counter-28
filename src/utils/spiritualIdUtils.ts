
/**
 * Legacy compatibility utilities for spiritual ID functionality
 * Now integrated with Crypto identity system
 */

import { cryptoIdentity } from './crypto-identity';
import { getUserData, saveUserData, logoutUser, getLifetimeCount, getTodayCount } from './indexedDBUtils';

/**
 * Spiritual icons available for profile selection
 */
export const spiritualIcons = [
  { id: "om", symbol: "🕉️", name: "Om" },
  { id: "lotus", symbol: "🪷", name: "Lotus" },
  { id: "namaste", symbol: "🙏", name: "Namaste" },
  { id: "peace", symbol: "☮️", name: "Peace" },
  { id: "chakra", symbol: "⚛️", name: "Chakra" },
  { id: "star", symbol: "✨", name: "Star" },
  { id: "moon", symbol: "🌙", name: "Moon" },
  { id: "sun", symbol: "☀️", name: "Sun" },
  { id: "bell", symbol: "🔔", name: "Bell" },
  { id: "incense", symbol: "🧘", name: "Meditation" },
  { id: "mandala", symbol: "🔯", name: "Mandala" },
];

/**
 * Legacy functions for backward compatibility
 */
export const isUserLoggedIn = (): boolean => {
  return localStorage.getItem('chantTrackerUserData') !== null;
};

/**
 * Generate QR data for spiritual ID (legacy compatibility)
 */
export const generateIdQRData = (spiritualId: string): string => {
  return `https://mantra-counter.app/id/${spiritualId}`;
};

export { getUserData, saveUserData, logoutUser };
