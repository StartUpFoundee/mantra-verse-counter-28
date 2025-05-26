
export interface SimpleUserIdentity {
  uniqueId: string;
  name: string;
  dob: string;
  createdAt: string;
  lastLogin: string;
}

// Generate unique ID based on name, DOB, and timestamp
export const generateUniqueId = (name: string, dob: string): string => {
  const timestamp = Date.now();
  const nameHash = name.toLowerCase().replace(/\s+/g, '').slice(0, 3);
  const dobHash = dob.replace(/-/g, '').slice(-4);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${nameHash}${dobHash}${timestamp.toString().slice(-4)}${randomSuffix}`;
};

// Save user identity to localStorage
export const saveSimpleUserIdentity = (identity: SimpleUserIdentity): void => {
  localStorage.setItem('simpleUserIdentity', JSON.stringify(identity));
};

// Get current user identity
export const getCurrentSimpleUserIdentity = (): SimpleUserIdentity | null => {
  const stored = localStorage.getItem('simpleUserIdentity');
  if (stored) {
    try {
      return JSON.parse(stored);
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
export const createSimpleUserIdentity = (name: string, dob: string): SimpleUserIdentity => {
  const uniqueId = generateUniqueId(name, dob);
  const now = new Date().toISOString();
  
  return {
    uniqueId,
    name,
    dob,
    createdAt: now,
    lastLogin: now
  };
};
