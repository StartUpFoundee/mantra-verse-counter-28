
import QRCode from 'qrcode';

/**
 * QR Code generation service for identity backup
 */

export interface QRCodeData {
  id: string;
  name: string;
  dob: string;
  timestamp: number;
  app: string;
  data: string; // Base64 encoded user data
}

/**
 * Generates QR code data from user identity
 */
export const generateQRCodeData = (userData: any): QRCodeData => {
  const qrData: QRCodeData = {
    id: userData.uniqueId || userData.id,
    name: userData.name,
    dob: userData.dob,
    timestamp: Date.now(),
    app: 'MantraCounter-v1.0',
    data: btoa(JSON.stringify(userData))
  };

  return qrData;
};

/**
 * Generates QR code as data URL
 */
export const generateQRCodeDataURL = async (userData: any): Promise<string> => {
  try {
    const qrData = generateQRCodeData(userData);
    const qrString = JSON.stringify(qrData);
    
    const dataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return dataURL;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
};

/**
 * Generates QR code as canvas element
 */
export const generateQRCodeCanvas = async (userData: any, canvasElement: HTMLCanvasElement): Promise<void> => {
  try {
    const qrData = generateQRCodeData(userData);
    const qrString = JSON.stringify(qrData);
    
    await QRCode.toCanvas(canvasElement, qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Failed to generate QR code canvas:', error);
    throw new Error('QR code generation failed');
  }
};

/**
 * Downloads QR code as PNG
 */
export const downloadQRCodePNG = async (userData: any, filename?: string): Promise<void> => {
  try {
    const dataURL = await generateQRCodeDataURL(userData);
    
    const link = document.createElement('a');
    link.download = filename || `mantra-counter-qr-${userData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw new Error('QR code download failed');
  }
};

/**
 * Decodes QR code data
 */
export const decodeQRCodeData = (qrString: string): any => {
  try {
    const qrData: QRCodeData = JSON.parse(qrString);
    
    // Validate QR code data
    if (!qrData.id || !qrData.data || qrData.app !== 'MantraCounter-v1.0') {
      throw new Error('Invalid QR code format');
    }
    
    // Decode the user data
    const userData = JSON.parse(atob(qrData.data));
    return userData;
  } catch (error) {
    console.error('Failed to decode QR code data:', error);
    throw new Error('Invalid QR code data');
  }
};
