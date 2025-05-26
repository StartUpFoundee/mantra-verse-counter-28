
import { generateUniqueId, encodeUserData, decodeUserData, generateAccountQRData } from './identityCore';
import { getUserData, saveUserData, logoutUser, getLifetimeCount, getTodayCount } from './indexedDBUtils';

export interface UserIdentity {
  uniqueId: string;
  name: string;
  dob: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  symbol?: string;
  symbolImage?: string;
  lifetimeCount?: number;
  todayCount?: number;
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Creates a new user identity with email-specific ID
 */
export const createUserIdentity = async (name: string, dob: string, email: string, symbol: string = "om"): Promise<UserIdentity> => {
  const uniqueId = await generateUniqueId(email, name, dob);
  
  const identity: UserIdentity = {
    uniqueId,
    name: name.trim(),
    dob,
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    symbol,
    symbolImage: "🕉️",
    lifetimeCount: 0,
    todayCount: 0
  };

  return identity;
};

/**
 * Saves user identity to email-specific storage
 */
export const saveUserIdentity = async (identity: UserIdentity): Promise<void> => {
  const userData = {
    id: identity.uniqueId,
    email: identity.email,
    name: identity.name,
    dob: identity.dob,
    symbol: identity.symbol,
    symbolImage: identity.symbolImage,
    createdAt: identity.createdAt,
    lastLogin: new Date().toISOString(),
    lifetimeCount: identity.lifetimeCount || 0,
    todayCount: identity.todayCount || 0
  };
  
  // Save with email as key prefix for multiple accounts
  const emailKey = `chantTrackerUserData_${identity.email}`;
  localStorage.setItem(emailKey, JSON.stringify(userData));
  localStorage.setItem('chantTrackerUserData', JSON.stringify(userData)); // Current active user
  
  await saveUserData(userData);
};

/**
 * Gets the current user identity from storage
 */
export const getCurrentUserIdentity = (): UserIdentity | null => {
  const userData = localStorage.getItem('chantTrackerUserData');
  
  if (!userData) return null;
  
  try {
    const parsed = JSON.parse(userData);
    return {
      uniqueId: parsed.id || parsed.uniqueId,
      name: parsed.name,
      dob: parsed.dob,
      email: parsed.email,
      createdAt: parsed.createdAt,
      lastLogin: parsed.lastLogin,
      symbol: parsed.symbol,
      symbolImage: parsed.symbolImage,
      lifetimeCount: parsed.lifetimeCount || 0,
      todayCount: parsed.todayCount || 0
    };
  } catch (error) {
    console.error('Failed to decode user identity:', error);
    return null;
  }
};

/**
 * Gets user identity by email
 */
export const getUserIdentityByEmail = (email: string): UserIdentity | null => {
  const emailKey = `chantTrackerUserData_${email.toLowerCase()}`;
  const userData = localStorage.getItem(emailKey);
  
  if (!userData) return null;
  
  try {
    const parsed = JSON.parse(userData);
    return {
      uniqueId: parsed.id || parsed.uniqueId,
      name: parsed.name,
      dob: parsed.dob,
      email: parsed.email,
      createdAt: parsed.createdAt,
      lastLogin: parsed.lastLogin,
      symbol: parsed.symbol,
      symbolImage: parsed.symbolImage,
      lifetimeCount: parsed.lifetimeCount || 0,
      todayCount: parsed.todayCount || 0
    };
  } catch (error) {
    console.error('Failed to decode user identity:', error);
    return null;
  }
};

/**
 * Logs out the current user
 */
export const logoutCurrentUser = async (): Promise<void> => {
  await logoutUser();
};

/**
 * Recovers user identity from QR code
 */
export const recoverUserIdentity = async (data: string): Promise<UserIdentity | null> => {
  try {
    const qrData = JSON.parse(data);
    
    if (qrData.type === 'account_transfer' && qrData.data) {
      const identity = decodeUserData(qrData.data);
      
      if (!identity.email) {
        throw new Error('Invalid identity data: Missing email');
      }
      
      await saveUserIdentity(identity);
      return identity;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to recover user identity:', error);
    return null;
  }
};

/**
 * Generate QR code for account transfer
 */
export const generateAccountTransferQR = async (): Promise<string> => {
  const identity = getCurrentUserIdentity();
  if (!identity) throw new Error('No active user identity');
  
  // Get latest counts
  const [lifetimeCount, todayCount] = await Promise.all([
    getLifetimeCount(),
    getTodayCount()
  ]);
  
  const updatedIdentity = {
    ...identity,
    lifetimeCount,
    todayCount,
    lastUpdated: new Date().toISOString()
  };
  
  return generateAccountQRData(updatedIdentity);
};

export default {
  createUserIdentity,
  saveUserIdentity,
  getCurrentUserIdentity,
  getUserIdentityByEmail,
  logoutCurrentUser,
  recoverUserIdentity,
  generateAccountTransferQR,
  validateEmail
};
