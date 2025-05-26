
/**
 * Core identity generation and data encoding utilities - Email-specific system
 */

/**
 * Generates a unique identity ID using email and timestamp
 */
export const generateUniqueId = async (email: string, name: string, dob: string): Promise<string> => {
  const data = `${email.toLowerCase().trim()}_${name.toLowerCase().trim()}_${dob}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Take first 12 characters and format as XXXX-XXXX-XXXX
  const shortHash = hashHex.substring(0, 12).toUpperCase();
  return `${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}-${shortHash.substring(8, 12)}`;
};

/**
 * Encodes user data to base64 for QR code transmission
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
  const idRegex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return idRegex.test(id);
};

/**
 * Generate QR code data for account transfer
 */
export const generateAccountQRData = (userData: any): string => {
  const qrData = {
    type: 'account_transfer',
    email: userData.email,
    data: encodeUserData(userData),
    timestamp: Date.now()
  };
  return JSON.stringify(qrData);
};
