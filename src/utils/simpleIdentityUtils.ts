
export interface SimpleUserIdentity {
  uniqueId: string;
  name: string;
  email: string;
  dob: string;
  createdAt: string;
  lastLogin: string;
  qrCode?: string;
}

// Generate unique ID based on email, name, DOB, and timestamp
export const generateUniqueId = (name: string, dob: string, email: string): string => {
  const timestamp = Date.now();
  const emailHash = email.toLowerCase().replace(/[@\.]/g, '').slice(0, 4);
  const nameHash = name.toLowerCase().replace(/\s+/g, '').slice(0, 3);
  const dobHash = dob.replace(/-/g, '').slice(-4);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${emailHash}${nameHash}${dobHash}${timestamp.toString().slice(-4)}${randomSuffix}`;
};

// Check if email already has an account
export const emailHasAccount = (email: string): boolean => {
  const userKey = `user_${email.toLowerCase()}`;
  return localStorage.getItem(userKey) !== null;
};

// Get user by email
export const getUserByEmail = (email: string): SimpleUserIdentity | null => {
  const userKey = `user_${email.toLowerCase()}`;
  const stored = localStorage.getItem(userKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing user data for email:', email, error);
      return null;
    }
  }
  return null;
};

// Save user identity with email-based storage
export const saveSimpleUserIdentity = (identity: SimpleUserIdentity): void => {
  // Save as current user
  localStorage.setItem('simpleUserIdentity', JSON.stringify(identity));
  // Save with email key for future recognition
  const userKey = `user_${identity.email.toLowerCase()}`;
  localStorage.setItem(userKey, JSON.stringify(identity));
};

// Get current user identity
export const getCurrentSimpleUserIdentity = (): SimpleUserIdentity | null => {
  const stored = localStorage.getItem('simpleUserIdentity');
  if (stored) {
    try {
      const identity = JSON.parse(stored);
      // Update last login time
      identity.lastLogin = new Date().toISOString();
      saveSimpleUserIdentity(identity);
      return identity;
    } catch (error) {
      console.error('Error parsing user identity:', error);
      return null;
    }
  }
  return null;
};

// Logout user
export const logoutSimpleUser = (): void => {
  localStorage.removeItem('simpleUserIdentity');
};

// Create new identity
export const createSimpleUserIdentity = (name: string, dob: string, email: string): SimpleUserIdentity => {
  const uniqueId = generateUniqueId(name, dob, email);
  const now = new Date().toISOString();
  
  return {
    uniqueId,
    name,
    email,
    dob,
    createdAt: now,
    lastLogin: now
  };
};

// Generate QR code data
export const generateQRCodeData = (identity: SimpleUserIdentity): string => {
  const qrData = {
    id: identity.uniqueId,
    name: identity.name,
    email: identity.email,
    dob: identity.dob,
    timestamp: identity.createdAt,
    type: 'MANTRA_COUNTER_ACCOUNT'
  };
  return JSON.stringify(qrData);
};

// Parse QR code data and create account
export const createAccountFromQRCode = (qrData: string, currentEmail: string): SimpleUserIdentity | null => {
  try {
    const data = JSON.parse(qrData);
    if (data.type !== 'MANTRA_COUNTER_ACCOUNT') {
      throw new Error('Invalid QR code type');
    }
    
    // Create new identity with current email but original data
    const identity: SimpleUserIdentity = {
      uniqueId: data.id,
      name: data.name,
      email: currentEmail, // Use current email for this device
      dob: data.dob,
      createdAt: data.timestamp,
      lastLogin: new Date().toISOString()
    };
    
    return identity;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

// Auto-detect and login user by email
export const autoDetectAndLogin = (email: string): SimpleUserIdentity | null => {
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    // Auto-login the user
    existingUser.lastLogin = new Date().toISOString();
    saveSimpleUserIdentity(existingUser);
    return existingUser;
  }
  return null;
};
