
/**
 * Web Crypto API-based Identity System with IndexedDB storage
 * 100% frontend solution using crypto.subtle for keypair generation
 */

export interface CryptoIdentity {
  id: string;
  name: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  createdAt: string;
  lastLogin: string;
  encryptedData: string;
}

export interface ExportedCryptoIdentity {
  id: string;
  name: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  encryptedData: string;
  createdAt: string;
  timestamp: number;
  signature: string;
}

class CryptoIdentityManager {
  private dbName = 'MantraCounterCryptoIdentities';
  private dbVersion = 1;
  private storeName = 'cryptoIdentities';
  private currentIdentityKey = 'currentCryptoIdentity';

  // Initialize IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  // Generate cryptographic keypair using Web Crypto API
  async createIdentity(name: string): Promise<CryptoIdentity> {
    try {
      // Generate ECDSA keypair for unique identity
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256"
        },
        true, // extractable
        ["sign", "verify"]
      );

      // Export keys to JWK format for storage
      const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

      // Create unique identity ID from public key
      const publicKeyString = JSON.stringify(publicKeyJwk);
      const publicKeyBuffer = new TextEncoder().encode(publicKeyString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const identityId = btoa(String.fromCharCode(...hashArray)).substring(0, 32);

      const identity: CryptoIdentity = {
        id: identityId,
        name,
        publicKeyJwk,
        privateKeyJwk,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        encryptedData: await this.encryptData({}, privateKeyJwk)
      };

      // Store identity in IndexedDB
      await this.storeIdentity(identity);

      // Set as current identity
      localStorage.setItem(this.currentIdentityKey, identityId);

      console.log('✅ Crypto identity created successfully:', identityId);
      return identity;

    } catch (error) {
      console.error('❌ Failed to create crypto identity:', error);
      throw new Error(`Identity creation failed: ${error.message}`);
    }
  }

  // Get current active identity
  async getCurrentIdentity(): Promise<CryptoIdentity | null> {
    try {
      const currentId = localStorage.getItem(this.currentIdentityKey);
      if (!currentId) return null;

      const identities = await this.getAllIdentities();
      const identity = identities.find(id => id.id === currentId);
      
      if (identity) {
        // Update last login
        identity.lastLogin = new Date().toISOString();
        await this.storeIdentity(identity);
      }
      
      return identity || null;
    } catch (error) {
      console.error('Failed to get current identity:', error);
      return null;
    }
  }

  // Logout current user
  logout(): void {
    localStorage.removeItem(this.currentIdentityKey);
    localStorage.removeItem('chantTrackerUserData'); // Clear legacy data
  }

  // Store identity in IndexedDB
  private async storeIdentity(identity: CryptoIdentity): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(identity);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all stored identities
  async getAllIdentities(): Promise<CryptoIdentity[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Login with existing identity
  async loginWithIdentity(identityId: string): Promise<CryptoIdentity> {
    const identities = await this.getAllIdentities();
    const identity = identities.find(id => id.id === identityId);
    
    if (!identity) {
      throw new Error('Identity not found');
    }

    // Update last login
    identity.lastLogin = new Date().toISOString();
    await this.storeIdentity(identity);
    
    // Set as current identity
    localStorage.setItem(this.currentIdentityKey, identityId);
    
    return identity;
  }

  // Encrypt data using AES-GCM
  private async encryptData(data: any, privateKeyJwk: JsonWebKey): Promise<string> {
    try {
      const dataString = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataString);
      
      // Generate AES key for encryption
      const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        dataBuffer
      );
      
      // Export AES key
      const aesKeyJwk = await crypto.subtle.exportKey('jwk', aesKey);
      
      return btoa(JSON.stringify({
        encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        aesKeyJwk,
        iv: btoa(String.fromCharCode(...iv))
      }));
    } catch (error) {
      console.error('Encryption failed:', error);
      return btoa(JSON.stringify(data)); // Fallback to base64 encoding
    }
  }

  // Decrypt data using AES-GCM
  async decryptData(encryptedData: string, privateKeyJwk: JsonWebKey): Promise<any> {
    try {
      const encryptedPackage = JSON.parse(atob(encryptedData));
      
      if (!encryptedPackage.aesKeyJwk) {
        // Fallback for simple base64 data
        return JSON.parse(atob(encryptedData));
      }
      
      // Import AES key
      const aesKey = await crypto.subtle.importKey(
        'jwk',
        encryptedPackage.aesKeyJwk,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const dataBuffer = new Uint8Array(
        atob(encryptedPackage.encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = new Uint8Array(
        atob(encryptedPackage.iv).split('').map(char => char.charCodeAt(0))
      );
      
      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        dataBuffer
      );
      
      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to base64 decoding
      try {
        return JSON.parse(atob(encryptedData));
      } catch {
        return {};
      }
    }
  }

  // Export identity for transfer
  async exportIdentity(identityId: string): Promise<ExportedCryptoIdentity> {
    const identities = await this.getAllIdentities();
    const identity = identities.find(id => id.id === identityId);
    
    if (!identity) {
      throw new Error('Identity not found for export');
    }

    // Create signature for verification using private key
    const dataToSign = identity.id + identity.name + JSON.stringify(identity.publicKeyJwk);
    const dataBuffer = new TextEncoder().encode(dataToSign);
    
    // Import private key for signing
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      identity.privateKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      dataBuffer
    );
    
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    
    const exportedIdentity: ExportedCryptoIdentity = {
      id: identity.id,
      name: identity.name,
      publicKeyJwk: identity.publicKeyJwk,
      privateKeyJwk: identity.privateKeyJwk,
      encryptedData: identity.encryptedData,
      createdAt: identity.createdAt,
      timestamp: Date.now(),
      signature
    };

    return exportedIdentity;
  }

  // Import identity from exported data
  async importIdentity(exportedData: ExportedCryptoIdentity): Promise<CryptoIdentity> {
    try {
      // Verify signature
      const dataToVerify = exportedData.id + exportedData.name + JSON.stringify(exportedData.publicKeyJwk);
      const dataBuffer = new TextEncoder().encode(dataToVerify);
      
      // Import public key for verification
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        exportedData.publicKeyJwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
      
      const signatureBuffer = new Uint8Array(
        atob(exportedData.signature).split('').map(char => char.charCodeAt(0))
      );
      
      const isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        signatureBuffer,
        dataBuffer
      );
      
      if (!isValid) {
        throw new Error('Identity signature verification failed');
      }

      const identity: CryptoIdentity = {
        id: exportedData.id,
        name: exportedData.name,
        publicKeyJwk: exportedData.publicKeyJwk,
        privateKeyJwk: exportedData.privateKeyJwk,
        createdAt: exportedData.createdAt,
        lastLogin: new Date().toISOString(),
        encryptedData: exportedData.encryptedData
      };

      // Store imported identity
      await this.storeIdentity(identity);
      
      // Set as current identity
      localStorage.setItem(this.currentIdentityKey, identity.id);
      
      console.log('✅ Identity imported successfully:', identity.id);
      return identity;

    } catch (error) {
      console.error('❌ Failed to import identity:', error);
      throw new Error(`Identity import failed: ${error.message}`);
    }
  }

  // Delete identity
  async deleteIdentity(identityId: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(identityId);
      
      request.onsuccess = () => {
        // Clear current identity if it was deleted
        if (localStorage.getItem(this.currentIdentityKey) === identityId) {
          localStorage.removeItem(this.currentIdentityKey);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Check Web Crypto API support
  isCryptoSupported(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }
}

export const cryptoIdentity = new CryptoIdentityManager();
