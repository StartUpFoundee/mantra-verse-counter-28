
export interface SimpleUserIdentity {
  uniqueId: string;
  name: string;
  email: string;
  dob: string;
  createdAt: string;
  lastLogin: string;
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

// Save user identity to localStorage
export const saveSimpleUserIdentity = (identity: SimpleUserIdentity): void => {
  localStorage.setItem('simpleUserIdentity', JSON.stringify(identity));
  // Also save with email key for login functionality
  localStorage.setItem(`user_${identity.email}`, JSON.stringify(identity));
};

// Get current user identity
export const getCurrentSimpleUserIdentity = (): SimpleUserIdentity | null => {
  const stored = localStorage.getItem('simpleUserIdentity');
  if (stored) {
    try {
      const identity = JSON.parse(stored);
      // Update last login time
      identity.lastLogin = new Date().toISOString();
      localStorage.setItem('simpleUserIdentity', JSON.stringify(identity));
      if (identity.email) {
        localStorage.setItem(`user_${identity.email}`, JSON.stringify(identity));
      }
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

// Create new identity with email
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

// Get user by email
export const getUserByEmail = (email: string): SimpleUserIdentity | null => {
  const stored = localStorage.getItem(`user_${email.toLowerCase()}`);
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
