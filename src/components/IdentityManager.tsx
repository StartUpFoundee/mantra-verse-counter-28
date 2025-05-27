import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { UserPlus, LogIn, Users, Shield, Key, QrCode, Upload, Download } from 'lucide-react';
import { cryptoIdentity, CryptoIdentity, ExportedCryptoIdentity } from '@/utils/crypto-identity';
import { QRCode } from '@/components/ui/qr-code';

interface IdentityManagerProps {
  onIdentitySelected: (identity: CryptoIdentity) => void;
}

const IdentityManager: React.FC<IdentityManagerProps> = ({ onIdentitySelected }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [identities, setIdentities] = useState<CryptoIdentity[]>([]);
  const [newName, setNewName] = useState('');
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exportQR, setExportQR] = useState<string>('');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadIdentities();
  }, []);

  const loadIdentities = async () => {
    try {
      const allIdentities = await cryptoIdentity.getAllIdentities();
      setIdentities(allIdentities);
      
      // Auto-login if only one identity exists
      if (allIdentities.length === 1) {
        const identity = await cryptoIdentity.loginWithIdentity(allIdentities[0].id);
        onIdentitySelected(identity);
      }
    } catch (error) {
      console.error('Failed to load identities:', error);
    }
  };

  const handleCreateIdentity = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name for your identity');
      return;
    }

    if (!cryptoIdentity.isCryptoSupported()) {
      toast.error('Web Crypto API is not supported in this browser');
      return;
    }

    setIsLoading(true);
    try {
      const identity = await cryptoIdentity.createIdentity(newName.trim());
      toast.success('Identity created successfully!', {
        description: 'Your cryptographic identity has been generated securely.'
      });
      
      onIdentitySelected(identity);
    } catch (error) {
      console.error('Failed to create identity:', error);
      toast.error('Failed to create identity', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIdentity = async (identityId: string) => {
    try {
      const identity = await cryptoIdentity.loginWithIdentity(identityId);
      toast.success(`Welcome back, ${identity.name}!`);
      onIdentitySelected(identity);
    } catch (error) {
      console.error('Failed to select identity:', error);
      toast.error('Failed to select identity');
    }
  };

  const handleImportIdentity = async () => {
    if (!importData.trim()) {
      toast.error('Please enter identity data to import');
      return;
    }

    setIsLoading(true);
    try {
      const exportedData: ExportedCryptoIdentity = JSON.parse(importData.trim());
      const identity = await cryptoIdentity.importIdentity(exportedData);
      
      toast.success('Identity imported successfully!', {
        description: `Welcome ${identity.name}! Your identity has been restored.`
      });
      
      await loadIdentities();
      onIdentitySelected(identity);
    } catch (error) {
      console.error('Failed to import identity:', error);
      toast.error('Failed to import identity', {
        description: 'Please check the identity data format.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportIdentity = async (identityId: string) => {
    try {
      const exportedData = await cryptoIdentity.exportIdentity(identityId);
      const exportString = JSON.stringify(exportedData, null, 2);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(exportString);
      
      // Generate QR code
      setExportQR(exportString);
      setShowExport(true);
      
      toast.success('Identity exported!', {
        description: 'Export data copied to clipboard and QR code generated.'
      });
    } catch (error) {
      console.error('Failed to export identity:', error);
      toast.error('Failed to export identity');
    }
  };

  const handleDeleteIdentity = async (identityId: string) => {
    if (!confirm('Are you sure you want to delete this identity? This action cannot be undone.')) {
      return;
    }

    try {
      await cryptoIdentity.deleteIdentity(identityId);
      toast.success('Identity deleted successfully');
      await loadIdentities();
    } catch (error) {
      console.error('Failed to delete identity:', error);
      toast.error('Failed to delete identity');
    }
  };

  if (!cryptoIdentity.isCryptoSupported()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <Card className="w-full max-w-md bg-red-900/20 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Crypto API Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Your browser doesn't support the Web Crypto API, which is required for secure identity management.
            </p>
            <p className="text-sm text-gray-400">
              Please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showExport) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Export Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={exportQR} size={200} className="mx-auto" />
            </div>
            <p className="text-sm text-gray-300 text-center">
              Scan this QR code or use the copied data to import your identity on another device.
            </p>
            <Button
              onClick={() => setShowExport(false)}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-amber-400">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-zinc-900 border-zinc-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateIdentity()}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCreateIdentity}
                disabled={isLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Create Identity
                  </>
                )}
              </Button>
              <Button
                onClick={() => setMode('select')}
                variant="outline"
                className="border-zinc-600 text-gray-300"
              >
                Back
              </Button>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-400">
                🔐 Your identity will be secured with Web Crypto API and stored locally on this device.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'import') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="import-data" className="text-amber-400">Identity Data</Label>
              <textarea
                id="import-data"
                placeholder="Paste your exported identity data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-32 bg-zinc-900 border-zinc-600 text-white p-3 rounded-md resize-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleImportIdentity}
                disabled={isLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Identity
                  </>
                )}
              </Button>
              <Button
                onClick={() => setMode('select')}
                variant="outline"
                className="border-zinc-600 text-gray-300"
              >
                Back
              </Button>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                📱 You can scan a QR code or paste the exported identity data to restore your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {identities.length === 0 ? (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🔐</div>
              <p className="text-gray-300">No identities found</p>
              <p className="text-sm text-gray-400">Create a new secure identity or import an existing one</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">Select Identity</span>
              </div>
              
              {identities.map((identity) => (
                <div
                  key={identity.id}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{identity.name}</h3>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(identity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Last login: {new Date(identity.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleSelectIdentity(identity.id)}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <LogIn className="h-3 w-3 mr-1" />
                        Login
                      </Button>
                      <Button
                        onClick={() => handleExportIdentity(identity.id)}
                        size="sm"
                        variant="outline"
                        className="border-zinc-600 text-gray-300"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteIdentity(identity.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-500/10"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-700">
            <Button
              onClick={() => setMode('create')}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create New
            </Button>
            <Button
              onClick={() => setMode('import')}
              variant="outline"
              className="border-zinc-600 text-gray-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-400">
              🔒 All identities are secured with Web Crypto API and stored locally on your device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentityManager;
