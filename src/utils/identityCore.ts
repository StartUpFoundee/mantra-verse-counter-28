
/**
 * Core identity generation and data encoding utilities
 */

/**
 * Generates a unique identity ID using SHA-256 hash
 */
export const generateUniqueId = async (name: string, dob: string, timestamp: number): Promise<string> => {
  const data = `${name.toLowerCase().trim()}_${dob}_${timestamp}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Take first 16 characters and format as XXXX-XXXX-XXXX-XXXX
  const shortHash = hashHex.substring(0, 16).toUpperCase();
  return `${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}-${shortHash.substring(8, 12)}-${shortHash.substring(12, 16)}`;
};

/**
 * Encodes user data to base64 for email transmission
 */
export const encodeUserData = (userData: any): string => {
  const jsonString = JSON.stringify(userData);
  return btoa(jsonString);
};

/**
 * Decodes base64 encoded user data
 */
export const decodeUserData = (encodedData: string): any => {
  try {
    const decodedString = atob(encodedData);
    return JSON.parse(decodedString);
  } catch (error) {
    throw new Error('Invalid encoded data format');
  }
};

/**
 * Validates unique ID format
 */
export const validateUniqueId = (id: string): boolean => {
  const idRegex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return idRegex.test(id);
};
