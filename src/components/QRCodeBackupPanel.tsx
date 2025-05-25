
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, QrCode, Calendar, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  generateQRCodeCanvas, 
  downloadQRCodePNG, 
  generateQRCodeDataURL 
} from "@/utils/qrCodeService";
import { googleDriveService } from "@/utils/googleDriveService";
import { 
  getBackupScheduleStatus, 
  forceBackupNow, 
  getNextBackupDate 
} from "@/utils/backupScheduler";
import { getCurrentUserIdentity } from "@/utils/portableIdentityUtils";

interface QRCodeBackupPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeBackupPanel: React.FC<QRCodeBackupPanelProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [driveAuthorized, setDriveAuthorized] = useState(false);
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "drive">("qr");

  useEffect(() => {
    if (isOpen) {
      loadBackupStatus();
      generateQRCode();
    }
  }, [isOpen]);

  const loadBackupStatus = async () => {
    try {
      await googleDriveService.initialize();
      setDriveAuthorized(googleDriveService.isUserAuthorized());
      
      const status = await getBackupScheduleStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  };

  const generateQRCode = async () => {
    const identity = getCurrentUserIdentity();
    if (!identity || !canvasRef.current) return;

    try {
      await generateQRCodeCanvas(identity, canvasRef.current);
      setQrGenerated(true);
    } catch (error) {
      toast("QR Generation Failed", {
        description: "Unable to generate QR code. Please try again."
      });
    }
  };

  const handleDownloadQR = async () => {
    const identity = getCurrentUserIdentity();
    if (!identity) return;

    try {
      await downloadQRCodePNG(identity);
      toast("QR Code Downloaded", {
        description: "Your identity QR code has been saved to your downloads."
      });
    } catch (error) {
      toast("Download Failed", {
        description: "Unable to download QR code. Please try again."
      });
    }
  };

  const handleAuthorizeGoogleDrive = async () => {
    try {
      const success = await googleDriveService.requestAuthorization();
      if (success) {
        setDriveAuthorized(true);
        toast("Google Drive Authorized", {
          description: "You can now backup your identity to Google Drive."
        });
        loadBackupStatus();
      } else {
        toast("Authorization Failed", {
          description: "Unable to authorize Google Drive. Please try again."
        });
      }
    } catch (error) {
      toast("Authorization Error", {
        description: "An error occurred during authorization."
      });
    }
  };

  const handleRevokeAccess = async () => {
    try {
      await googleDriveService.revokeAuthorization();
      setDriveAuthorized(false);
      toast("Access Revoked", {
        description: "Google Drive access has been removed."
      });
      loadBackupStatus();
    } catch (error) {
      toast("Revoke Failed", {
        description: "Unable to revoke access. Please try again."
      });
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const success = await forceBackupNow();
      if (success) {
        toast("Backup Successful", {
          description: "Your identity has been backed up to Google Drive."
        });
        loadBackupStatus();
      } else {
        toast("Backup Failed", {
          description: "Unable to backup to Google Drive. Please try again."
        });
      }
    } catch (error) {
      toast("Backup Error", {
        description: (error as Error).message
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
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
            Secure your spiritual journey with multiple backup options
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="drive">Google Drive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr" className="space-y-4 mt-6">
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <canvas 
                    ref={canvasRef}
                    className="max-w-full h-auto"
                  />
                </div>
                
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
                        Download PNG
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="border-zinc-700 text-gray-300"
                      >
                        Print QR Code
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="drive" className="space-y-4 mt-6">
              <div className="space-y-4">
                {/* Authorization Status */}
                <div className={`p-4 rounded-lg border ${driveAuthorized ? 'border-green-500/20 bg-green-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
                  <div className="flex items-center gap-3">
                    {driveAuthorized ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {driveAuthorized ? 'Google Drive Authorized' : 'Authorization Required'}
                      </p>
                      <p className="text-sm text-gray-300">
                        {driveAuthorized 
                          ? 'Your identity can be automatically backed up to Google Drive'
                          : 'Grant permission to backup your identity to Google Drive'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Backup Schedule Info */}
                {driveAuthorized && backupStatus && (
                  <div className="bg-zinc-800 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-amber-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Backup Schedule
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Last Backup</p>
                        <p className="text-white">{formatDate(backupStatus.lastBackupDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Next Backup</p>
                        <p className="text-white">{formatDate(backupStatus.nextBackupDate)}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Automatic backups occur on the 15th and 28th of each month
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {!driveAuthorized ? (
                    <Button
                      onClick={handleAuthorizeGoogleDrive}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Authorize Google Drive
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handleBackupNow}
                        disabled={isBackingUp}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isBackingUp ? "Backing up..." : "Backup Now"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleRevokeAccess}
                        className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        Revoke Access
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Security Notice */}
                <div className="bg-zinc-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">
                    🔒 Your data is encrypted and sent directly to your Google Drive. 
                    We never store or access your information on any server.
                  </p>
                </div>
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
