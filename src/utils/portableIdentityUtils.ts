
import { generateUniqueId, encodeUserData, decodeUserData } from './identityCore';
import { getUserData, saveUserData, logoutUser } from './indexedDBUtils';

export interface UserIdentity {
  uniqueId: string;
  name: string;
  dob: string;
  email: string;
  createdAt: string;
  lastBackup?: string;
  emailBackupEnabled: boolean;
  googleDriveEnabled: boolean;
  symbol?: string;
  symbolImage?: string;
  chantingStats?: any;
}

/**
 * Creates a new user identity with enhanced unique ID generation
 */
export const createUserIdentity = async (name: string, dob: string, email: string, symbol: string = "om"): Promise<UserIdentity> => {
  // Generate truly unique ID using name, DOB, and timestamp
  const uniqueId = await generateUniqueId(name, dob, Date.now());
  
  const identity: UserIdentity = {
    uniqueId,
    name: name.trim(),
    dob,
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    emailBackupEnabled: false,
    googleDriveEnabled: false,
    symbol,
    symbolImage: "🕉️",
    chantingStats: {}
  };

  return identity;
};

/**
 * Saves user identity to storage
 */
export const saveUserIdentity = async (identity: UserIdentity): Promise<void> => {
  // Convert to format compatible with existing system
  const userData = {
    id: identity.uniqueId,
    name: identity.name,
    dob: identity.dob,
    email: identity.email,
    symbol: identity.symbol,
    symbolImage: identity.symbolImage,
    createdAt: identity.createdAt,
    lastLogin: new Date().toISOString(),
    emailBackupEnabled: identity.emailBackupEnabled,
    googleDriveEnabled: identity.googleDriveEnabled,
    lastBackup: identity.lastBackup,
    chantingStats: identity.chantingStats || {}
  };
  
  // Save to IndexedDB
  await saveUserData(userData);
};

/**
 * Gets the current user identity from storage
 */
export const getCurrentUserIdentity = (): UserIdentity | null => {
  // Get user data from IndexedDB (synchronous fallback)
  const userData = localStorage.getItem('chantTrackerUserData');
  
  if (!userData) return null;
  
  // Decode user data
  try {
    const parsed = JSON.parse(userData);
    return {
      uniqueId: parsed.id || parsed.uniqueId,
      name: parsed.name,
      dob: parsed.dob,
      email: parsed.email,
      createdAt: parsed.createdAt,
      lastBackup: parsed.lastBackup,
      emailBackupEnabled: parsed.emailBackupEnabled || false,
      googleDriveEnabled: parsed.googleDriveEnabled || false,
      symbol: parsed.symbol,
      symbolImage: parsed.symbolImage,
      chantingStats: parsed.chantingStats || {}
    };
  } catch (error) {
    console.error('Failed to decode user identity:', error);
    return null;
  }
};

/**
 * Logs out the current user by clearing storage
 */
export const logoutCurrentUser = async (): Promise<void> => {
  await logoutUser();
};

/**
 * Updates email backup preference
 */
export const updateEmailBackupPreference = async (enabled: boolean): Promise<void> => {
  const identity = getCurrentUserIdentity();
  if (!identity) return;

  const updatedIdentity = { ...identity, emailBackupEnabled: enabled };
  await saveUserIdentity(updatedIdentity);
};

/**
 * Updates Google Drive backup preference
 */
export const updateGoogleDrivePreference = async (enabled: boolean): Promise<void> => {
  const identity = getCurrentUserIdentity();
  if (!identity) return;

  const updatedIdentity = { ...identity, googleDriveEnabled: enabled };
  await saveUserIdentity(updatedIdentity);
};

/**
 * Recovers user identity from QR code or backup file
 */
export const recoverUserIdentity = async (data: string): Promise<UserIdentity | null> => {
  try {
    // Decode the data
    const identity = decodeUserData(data);
    
    // Validate the unique ID
    if (!identity.uniqueId) {
      throw new Error('Invalid identity data: Missing unique ID');
    }
    
    // Save the recovered identity
    await saveUserIdentity(identity);
    
    return identity;
  } catch (error) {
    console.error('Failed to recover user identity:', error);
    return null;
  }
};

export default {
  createUserIdentity,
  saveUserIdentity,
  getCurrentUserIdentity,
  logoutCurrentUser,
  updateEmailBackupPreference,
  updateGoogleDrivePreference,
  recoverUserIdentity
};
