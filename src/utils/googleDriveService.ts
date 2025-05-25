
/**
 * Google Drive API integration for frontend-only backup system
 */

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  discoveryDoc: string;
  scopes: string;
}

// Configure these with your Google Cloud Console credentials
const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com', // Replace with your client ID
  apiKey: 'AIzaSyABC123DEF456GHI789JKL012MNO345PQR', // Replace with your API key
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  scopes: 'https://www.googleapis.com/auth/drive.file'
};

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

class GoogleDriveService {
  private isInitialized = false;
  private isAuthorized = false;
  private tokenClient: any = null;

  async initialize(): Promise<boolean> {
    try {
      // Load Google APIs
      await this.loadGoogleAPIs();
      
      // Initialize gapi
      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
          discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc],
        });
      });

      // Initialize Google Identity Services
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: GOOGLE_DRIVE_CONFIG.scopes,
        callback: (tokenResponse: any) => {
          this.isAuthorized = true;
          this.saveAuthToken(tokenResponse.access_token);
        },
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      return false;
    }
  }

  private async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = () => resolve();
        script2.onerror = reject;
        document.head.appendChild(script2);
      };
      script1.onerror = reject;
      document.head.appendChild(script1);
    });
  }

  async requestAuthorization(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          resolve(false);
          return;
        }
        this.isAuthorized = true;
        this.saveAuthToken(response.access_token);
        resolve(true);
      };
      
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  private saveAuthToken(token: string): void {
    window.gapi.client.setToken({ access_token: token });
    localStorage.setItem('googleDriveToken', token);
    localStorage.setItem('googleDriveTokenExpiry', (Date.now() + 3600 * 1000).toString());
  }

  private getStoredToken(): string | null {
    const token = localStorage.getItem('googleDriveToken');
    const expiry = localStorage.getItem('googleDriveTokenExpiry');
    
    if (!token || !expiry) return null;
    
    if (Date.now() > parseInt(expiry)) {
      this.revokeAuthorization();
      return null;
    }
    
    return token;
  }

  isUserAuthorized(): boolean {
    const token = this.getStoredToken();
    if (token) {
      window.gapi.client.setToken({ access_token: token });
      this.isAuthorized = true;
    }
    return this.isAuthorized;
  }

  async revokeAuthorization(): Promise<void> {
    localStorage.removeItem('googleDriveToken');
    localStorage.removeItem('googleDriveTokenExpiry');
    this.isAuthorized = false;
    
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
    }
  }

  async createBackupFolder(): Promise<string | null> {
    try {
      // Check if folder exists
      const response = await window.gapi.client.drive.files.list({
        q: "name='MantraCounter_Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces: 'drive'
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new folder
      const folderResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: 'MantraCounter_Backups',
          mimeType: 'application/vnd.google-apps.folder'
        }
      });

      return folderResponse.result.id;
    } catch (error) {
      console.error('Failed to create backup folder:', error);
      return null;
    }
  }

  async uploadBackup(userData: any, isReplacementBackup: boolean = false): Promise<boolean> {
    try {
      if (!this.isUserAuthorized()) {
        throw new Error('User not authorized');
      }

      const folderId = await this.createBackupFolder();
      if (!folderId) {
        throw new Error('Failed to create backup folder');
      }

      // If this is a replacement backup (28th), delete old file first
      if (isReplacementBackup) {
        await this.deleteOldBackup(folderId);
      }

      const backupData = {
        id: userData.uniqueId || userData.id,
        name: userData.name,
        dob: userData.dob,
        backupDate: new Date().toISOString().split('T')[0],
        data: btoa(JSON.stringify(userData)),
        app: 'MantraCounter-v1.0'
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: 'identity_backup.json',
        parents: [folderId]
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(backupData) +
        closeDelimiter;

      const request = window.gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: multipartRequestBody
      });

      const response = await request;
      return response.status === 200;
    } catch (error) {
      console.error('Failed to upload backup:', error);
      return false;
    }
  }

  private async deleteOldBackup(folderId: string): Promise<void> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='identity_backup.json' and '${folderId}' in parents and trashed=false`,
        spaces: 'drive'
      });

      if (response.result.files && response.result.files.length > 0) {
        for (const file of response.result.files) {
          await window.gapi.client.drive.files.delete({
            fileId: file.id
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete old backup:', error);
    }
  }

  async getLastBackupDate(): Promise<string | null> {
    try {
      const folderId = await this.createBackupFolder();
      if (!folderId) return null;

      const response = await window.gapi.client.drive.files.list({
        q: `name='identity_backup.json' and '${folderId}' in parents and trashed=false`,
        orderBy: 'modifiedTime desc',
        pageSize: 1
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].modifiedTime;
      }

      return null;
    } catch (error) {
      console.error('Failed to get last backup date:', error);
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
