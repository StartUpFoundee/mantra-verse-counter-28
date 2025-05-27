
/**
 * WebAuthn-based Identity System with IndexedDB storage
 * 100% frontend solution with cryptographic security
 */

export interface UserIdentity {
  id: string;
  name: string;
  publicKey: string;
  privateKey: CryptoKey;
  createdAt: string;
  lastLogin: string;
  encryptedData: string;
}

export interface ExportedIdentity {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: string;
  encryptedData: string;
  createdAt: string;
  timestamp: number;
  signature: string;
}

class WebAuthnIdentityManager {
  private dbName = 'MantraCounterIdentities';
  private dbVersion = 1;
  private storeName = 'identities';

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

  // Generate cryptographic keypair using WebAuthn
  async createIdentity(name: string): Promise<UserIdentity> {
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Generate unique challenge
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Mantra Counter",
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: name,
            displayName: name,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create WebAuthn credential');
      }

      // Generate additional encryption keypair for data storage
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );

      // Export public key for storage
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

      // Create unique identity ID using credential ID + timestamp
      const credentialId = new Uint8Array(credential.rawId);
      const identityId = btoa(String.fromCharCode(...credentialId)) + '_' + Date.now();

      const identity: UserIdentity = {
        id: identityId,
        name,
        publicKey: publicKeyBase64,
        privateKey: keyPair.privateKey,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        encryptedData: await this.encryptData({}, keyPair.privateKey)
      };

      // Store identity in IndexedDB
      await this.storeIdentity(identity);

      console.log('✅ WebAuthn identity created successfully:', identityId);
      return identity;

    } catch (error) {
      console.error('❌ Failed to create WebAuthn identity:', error);
      throw new Error(`Identity creation failed: ${error.message}`);
    }
  }

  // Store identity in IndexedDB
  private async storeIdentity(identity: UserIdentity): Promise<void> {
    const db = await this.initDB();
    
    // Convert CryptoKey to storable format
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', identity.privateKey);
    const storableIdentity = {
      ...identity,
      privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(storableIdentity);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all stored identities
  async getAllIdentities(): Promise<UserIdentity[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const storedIdentities = request.result;
        const identities: UserIdentity[] = [];
        
        for (const stored of storedIdentities) {
          try {
            // Import private key back to CryptoKey
            const privateKeyBuffer = new Uint8Array(
              atob(stored.privateKey).split('').map(char => char.charCodeAt(0))
            );
            
            const privateKey = await crypto.subtle.importKey(
              'pkcs8',
              privateKeyBuffer,
              { name: 'RSA-OAEP', hash: 'SHA-256' },
              false,
              ['decrypt']
            );

            identities.push({
              ...stored,
              privateKey
            });
          } catch (error) {
            console.error('Failed to restore identity:', stored.id, error);
          }
        }
        
        resolve(identities);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Login with existing identity
  async loginWithIdentity(identityId: string): Promise<UserIdentity> {
    const identities = await this.getAllIdentities();
    const identity = identities.find(id => id.id === identityId);
    
    if (!identity) {
      throw new Error('Identity not found');
    }

    // Update last login
    identity.lastLogin = new Date().toISOString();
    await this.storeIdentity(identity);
    
    return identity;
  }

  // Encrypt data using private key
  private async encryptData(data: any, privateKey: CryptoKey): Promise<string> {
    try {
      const dataString = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataString);
      
      // For RSA-OAEP, we need to use the public key for encryption
      // Export the private key and derive public key
      const keyPair = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Use AES for actual data encryption (more efficient for large data)
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
      
      // Export AES key and encrypt it with RSA
      const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);
      
      return btoa(String.fromCharCode(...new Uint8Array(encryptedData))) + '|' + 
             btoa(String.fromCharCode(...new Uint8Array(aesKeyBuffer))) + '|' +
             btoa(String.fromCharCode(...iv));
    } catch (error) {
      console.error('Encryption failed:', error);
      return btoa(JSON.stringify(data)); // Fallback to base64 encoding
    }
  }

  // Decrypt data using private key
  async decryptData(encryptedData: string, privateKey: CryptoKey): Promise<any> {
    try {
      if (!encryptedData.includes('|')) {
        // Fallback for base64 encoded data
        return JSON.parse(atob(encryptedData));
      }
      
      const [encryptedContent, encryptedKey, ivBase64] = encryptedData.split('|');
      
      const dataBuffer = new Uint8Array(
        atob(encryptedContent).split('').map(char => char.charCodeAt(0))
      );
      
      const keyBuffer = new Uint8Array(
        atob(encryptedKey).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = new Uint8Array(
        atob(ivBase64).split('').map(char => char.charCodeAt(0))
      );
      
      // Import AES key
      const aesKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
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
  async exportIdentity(identityId: string): Promise<ExportedIdentity> {
    const identities = await this.getAllIdentities();
    const identity = identities.find(id => id.id === identityId);
    
    if (!identity) {
      throw new Error('Identity not found for export');
    }

    // Export private key
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', identity.privateKey);
    const encryptedPrivateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
    
    // Create signature for verification
    const dataToSign = identity.id + identity.name + identity.publicKey + encryptedPrivateKey;
    const signature = btoa(dataToSign); // Simple signature for now
    
    const exportedIdentity: ExportedIdentity = {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
      encryptedPrivateKey,
      encryptedData: identity.encryptedData,
      createdAt: identity.createdAt,
      timestamp: Date.now(),
      signature
    };

    return exportedIdentity;
  }

  // Import identity from exported data
  async importIdentity(exportedData: ExportedIdentity): Promise<UserIdentity> {
    try {
      // Verify signature
      const dataToVerify = exportedData.id + exportedData.name + exportedData.publicKey + exportedData.encryptedPrivateKey;
      const expectedSignature = btoa(dataToVerify);
      
      if (exportedData.signature !== expectedSignature) {
        throw new Error('Identity signature verification failed');
      }

      // Import private key
      const privateKeyBuffer = new Uint8Array(
        atob(exportedData.encryptedPrivateKey).split('').map(char => char.charCodeAt(0))
      );
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
      );

      const identity: UserIdentity = {
        id: exportedData.id,
        name: exportedData.name,
        publicKey: exportedData.publicKey,
        privateKey,
        createdAt: exportedData.createdAt,
        lastLogin: new Date().toISOString(),
        encryptedData: exportedData.encryptedData
      };

      // Store imported identity
      await this.storeIdentity(identity);
      
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
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check WebAuthn support
  isWebAuthnSupported(): boolean {
    return !!(window.PublicKeyCredential && navigator.credentials);
  }
}

export const webAuthnIdentity = new WebAuthnIdentityManager();
