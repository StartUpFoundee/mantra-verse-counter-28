
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, QrCode, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { QRCode } from "@/components/ui/qr-code";
import { webAuthnIdentity } from "@/utils/webauthn-identity";

interface QRCodeBackupPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeBackupPanel: React.FC<QRCodeBackupPanelProps> = ({ isOpen, onClose }) => {
  const [qrData, setQrData] = useState<string>("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [importData, setImportData] = useState("");

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen]);

  const generateQRCode = async () => {
    try {
      const identity = await webAuthnIdentity.getCurrentIdentity();
      if (!identity) return;

      const exportedData = await webAuthnIdentity.exportIdentity(identity.id);
      const qrString = JSON.stringify(exportedData);
      setQrData(qrString);
      setQrGenerated(true);
    } catch (error) {
      toast.error("QR Generation Failed", {
        description: "Unable to generate QR code. Please try again."
      });
    }
  };

  const handleDownloadQR = async () => {
    if (!qrData) return;

    try {
      const blob = new Blob([qrData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mantra-counter-backup.json';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Backup Downloaded", {
        description: "Your identity backup has been saved to downloads."
      });
    } catch (error) {
      toast.error("Download Failed", {
        description: "Unable to download backup. Please try again."
      });
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error("Please enter identity data to import");
      return;
    }

    try {
      const exportedData = JSON.parse(importData.trim());
      await webAuthnIdentity.importIdentity(exportedData);
      
      toast.success("Identity imported successfully!", {
        description: "The identity has been added to your device."
      });
      
      setImportData('');
    } catch (error) {
      console.error('Failed to import identity:', error);
      toast.error("Failed to import identity", {
        description: "Please check the identity data format."
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-700 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl text-amber-400 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Identity Backup & QR Code
          </CardTitle>
          <CardDescription className="text-gray-300">
            Secure your spiritual journey with backup options
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="export" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>
            
            <TabsContent value="export" className="space-y-4 mt-6">
              <div className="text-center space-y-4">
                {qrGenerated && qrData && (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode 
                      value={qrData}
                      size={200}
                    />
                  </div>
                )}
                
                {qrGenerated && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      Scan this QR code to restore your identity on any device
                    </p>
                    
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={handleDownloadQR}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Backup
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-amber-400 text-sm mb-2 block">Identity Data</label>
                  <textarea
                    placeholder="Paste exported identity data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full h-32 bg-zinc-900 border-zinc-600 text-white p-3 rounded-md resize-none"
                  />
                </div>
                
                <Button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Identity
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-zinc-700">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeBackupPanel;
