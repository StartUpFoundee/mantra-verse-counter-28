
/**
 * Legacy compatibility utilities for spiritual ID functionality
 * Now integrated with WebAuthn identity system
 */

import { webAuthnIdentity } from './webauthn-identity';
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

export { getUserData, saveUserData, logoutUser };
