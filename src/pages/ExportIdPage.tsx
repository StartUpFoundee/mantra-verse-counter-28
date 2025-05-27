
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Copy, Download, RefreshCw, Share2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { webAuthnIdentity, UserIdentity } from "@/utils/webauthn-identity";
import { QRCode } from "@/components/ui/qr-code";
import { getTodayCount, getLifetimeCount } from "@/utils/indexedDBUtils";
import { refreshTodaysActivity } from "@/utils/activeDaysUtils";

const ExportIdPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentIdentity, setCurrentIdentity] = useState<UserIdentity | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const identity = await webAuthnIdentity.getCurrentIdentity();
    if (!identity) {
      navigate('/');
      return;
    }
    
    setCurrentIdentity(identity);
    
    // Load current counts
    const [lifetime, today] = await Promise.all([
      getLifetimeCount(),
      getTodayCount()
    ]);
    
    setLifetimeCount(lifetime);
    setTodayCount(today);
    
    // Generate QR code with current data
    try {
      const exportedData = await webAuthnIdentity.exportIdentity(identity.id);
      setQrData(JSON.stringify(exportedData));
    } catch (error) {
      console.error("Error generating QR data:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh today's activity data
      await refreshTodaysActivity();
      
      // Reload all data
      await loadUserData();
      
      toast.success("Data Refreshed", {
        description: "QR code updated with latest mantra counts!"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Refresh Failed", {
        description: "Unable to refresh data. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyId = () => {
    if (!currentIdentity?.id) return;
    
    navigator.clipboard.writeText(currentIdentity.id)
      .then(() => {
        toast.success("ID Copied", {
          description: "Your unique ID has been copied to clipboard"
        });
      })
      .catch(() => {
        toast.error("Copy Failed", {
          description: "Could not copy to clipboard"
        });
      });
  };

  const handleCopyQRData = () => {
    if (!qrData) return;
    
    navigator.clipboard.writeText(qrData)
      .then(() => {
        toast.success("QR Data Copied", {
          description: "QR code data copied to clipboard"
        });
      })
      .catch(() => {
        toast.error("Copy Failed", {
          description: "Could not copy QR data to clipboard"
        });
      });
  };

  const handleDownloadQR = () => {
    if (!qrData) return;

    const blob = new Blob([qrData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mantra-counter-backup-${currentIdentity?.id.substring(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Backup Downloaded", {
      description: "Your identity backup has been saved to downloads"
    });
  };

  const handleShare = () => {
    const shareText = `My Mantra Counter Progress\nLifetime: ${lifetimeCount} mantras\nToday: ${todayCount} mantras`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Mantra Counter Progress',
        text: shareText
      });
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!currentIdentity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="mb-4 text-amber-400 text-lg">Loading...</div>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="py-4 px-4 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-amber-400 hover:bg-zinc-800"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold text-amber-400">Export Identity</h1>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-amber-400 hover:bg-zinc-800"
          onClick={() => navigate('/')}
        >
          <Home className="h-6 w-6" />
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 space-y-6">
        {/* User Info Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/30 rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🕉️</div>
            <h2 className="text-xl font-bold text-amber-400 mb-1">{currentIdentity.name}</h2>
            <p className="text-gray-300 text-sm mb-2">ID: {currentIdentity.id.substring(0, 12)}...</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-900 rounded-lg p-3 text-center">
              <p className="text-amber-400 text-lg font-bold">{lifetimeCount}</p>
              <p className="text-gray-400 text-xs">Lifetime</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-3 text-center">
              <p className="text-amber-400 text-lg font-bold">{todayCount}</p>
              <p className="text-gray-400 text-xs">Today</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCopyId}
              variant="outline"
              size="sm"
              className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy ID
            </Button>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* QR Code Section */}
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-black mb-2">Identity Backup QR</h3>
            <p className="text-gray-600 text-sm">Use this to restore your account on other devices</p>
          </div>
          
          {qrData && (
            <div className="flex justify-center mb-4">
              <QRCode 
                value={qrData} 
                size={200} 
                bgColor="#ffffff" 
                fgColor="#000000"
              />
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleCopyQRData}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="w-full max-w-md bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h4 className="text-amber-400 font-medium mb-2">How to restore on another device:</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>1. 📱 Open website on new device</p>
            <p>2. 🔍 Click "Import Existing Identity"</p>
            <p>3. 📋 Paste the backup data you copied</p>
            <p>4. ✅ Your account will be restored!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExportIdPage;
