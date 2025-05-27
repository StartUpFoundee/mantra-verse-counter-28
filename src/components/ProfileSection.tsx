
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { User, Download, Upload, QrCode, LogOut, Shield, Key } from 'lucide-react';
import { cryptoIdentity, CryptoIdentity, ExportedCryptoIdentity } from '@/utils/crypto-identity';
import { QRCode } from '@/components/ui/qr-code';

interface ProfileSectionProps {
  identity: CryptoIdentity;
  onLogout: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ identity, onLogout }) => {
  const [showExport, setShowExport] = useState(false);
  const [exportQR, setExportQR] = useState<string>('');
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');

  const handleExport = async () => {
    try {
      const exportedData = await cryptoIdentity.exportIdentity(identity.id);
      const exportString = JSON.stringify(exportedData, null, 2);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(exportString);
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

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please enter identity data to import');
      return;
    }

    try {
      const exportedData: ExportedCryptoIdentity = JSON.parse(importData.trim());
      await cryptoIdentity.importIdentity(exportedData);
      
      toast.success('Identity imported successfully!', {
        description: 'The identity has been added to your device.'
      });
      
      setShowImport(false);
      setImportData('');
    } catch (error) {
      console.error('Failed to import identity:', error);
      toast.error('Failed to import identity', {
        description: 'Please check the identity data format.'
      });
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout();
      toast.success('Logged out successfully');
    }
  };

  if (showExport) {
    return (
      <Card className="w-full max-w-md mx-auto bg-zinc-800 border-zinc-700">
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
          
          <div className="bg-zinc-900 border border-zinc-600 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Export Data:</p>
            <div className="bg-black p-2 rounded text-xs text-green-400 font-mono max-h-20 overflow-y-auto">
              {exportQR.substring(0, 200)}...
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-300">
              📱 Scan QR code or copy data to import on another device
            </p>
            <p className="text-xs text-amber-400">
              🔐 Data is encrypted with your cryptographic keys
            </p>
          </div>
          
          <Button
            onClick={() => setShowExport(false)}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showImport) {
    return (
      <Card className="w-full max-w-md mx-auto bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-amber-400 text-sm mb-2 block">Identity Data</label>
            <textarea
              placeholder="Paste exported identity data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-32 bg-zinc-900 border-zinc-600 text-white p-3 rounded-md resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => setShowImport(false)}
              variant="outline"
              className="border-zinc-600 text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-amber-400 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{identity.name}</h3>
              <p className="text-xs text-gray-400">
                ID: {identity.id.substring(0, 12)}...
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-amber-400 text-sm">Created</p>
              <p className="text-xs text-gray-300">
                {new Date(identity.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-amber-400 text-sm">Last Login</p>
              <p className="text-xs text-gray-300">
                {new Date(identity.lastLogin).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Security Status</span>
          </div>
          <p className="text-xs text-amber-300">
            🔐 Protected with Web Crypto API
          </p>
          <p className="text-xs text-amber-300">
            🔒 Data encrypted and stored locally
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Identity
          </Button>
          
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            className="w-full border-zinc-600 text-gray-300"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Another Identity
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-600 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
