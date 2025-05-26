
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { getCurrentSimpleUserIdentity } from "@/utils/simpleIdentityUtils";
import { QRCode } from "@/components/ui/qr-code";
import { getTodayCount, getLifetimeCount } from "@/utils/indexedDBUtils";

const ExportIdPage: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [qrRefreshKey, setQrRefreshKey] = useState<number>(Date.now());

  useEffect(() => {
    const loadData = async () => {
      const identity = getCurrentSimpleUserIdentity();
      if (identity) {
        setUserData(identity);
        const today = await getTodayCount();
        const lifetime = await getLifetimeCount();
        setTodayCount(today);
        setLifetimeCount(lifetime);
      } else {
        navigate('/');
      }
    };
    
    loadData();
  }, [navigate]);

  const handleRefreshQR = async () => {
    // Refresh the current data
    const today = await getTodayCount();
    const lifetime = await getLifetimeCount();
    setTodayCount(today);
    setLifetimeCount(lifetime);
    setQrRefreshKey(Date.now());
    
    toast("QR Code Refreshed", {
      description: "QR code updated with latest data"
    });
  };

  const handleDownloadQR = () => {
    // Create a canvas element to convert QR to image
    const qrContainer = document.querySelector('.qr-container img') as HTMLImageElement;
    if (qrContainer) {
      const link = document.createElement('a');
      link.download = `spiritual-id-${userData.uniqueId}.png`;
      link.href = qrContainer.src;
      link.click();
      
      toast("QR Code Downloaded", {
        description: "Your identity QR code has been saved to downloads"
      });
    }
  };

  const handleShareWhatsApp = () => {
    const shareText = `My spiritual ID: ${userData.uniqueId}\nToday's mantras: ${todayCount}\nLifetime mantras: ${lifetimeCount}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const qrData = JSON.stringify({
    uniqueId: userData?.uniqueId,
    name: userData?.name,
    dob: userData?.dob,
    todayCount,
    lifetimeCount,
    timestamp: qrRefreshKey
  });

  if (!userData) {
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
        <h1 className="text-xl font-bold text-amber-400">Export ID & QR</h1>
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
        {/* Identity Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/30 rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🕉️</div>
            <h2 className="text-xl font-bold text-amber-400 mb-2">
              {userData.name} Ji
            </h2>
            <p className="text-gray-300 text-sm">आपकी आध्यात्मिक पहचान</p>
          </div>
          
          <div className="bg-black rounded-lg p-4 text-center border border-amber-500/20 mb-4">
            <p className="text-gray-400 text-xs mb-1">Spiritual ID / आध्यात्मिक आईडी</p>
            <p className="text-2xl md:text-3xl font-bold tracking-wider text-amber-400">{userData.uniqueId}</p>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-lg font-bold text-amber-400">{todayCount}</p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Lifetime</p>
              <p className="text-lg font-bold text-amber-400">{lifetimeCount}</p>
            </div>
          </div>
        </div>
        
        {/* QR Code Section */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold text-amber-400">Transfer to Another Device</h3>
            <p className="text-sm text-gray-300">Scan this QR code on another device to access your account</p>
            
            <div className="qr-container bg-white p-4 rounded-lg inline-block">
              <QRCode 
                key={qrRefreshKey}
                value={qrData} 
                size={200} 
                bgColor="#ffffff" 
                fgColor="#000000"
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleRefreshQR}
                variant="outline"
                className="bg-zinc-700 hover:bg-zinc-600 text-amber-400 border-amber-500/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={handleDownloadQR}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="bg-green-700 hover:bg-green-600 text-white border-green-500"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="w-full max-w-md bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h4 className="text-amber-400 font-medium mb-2">How to use on another device:</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>1. 📱 Open this website on new device</p>
            <p>2. 🔍 Click "Login with Existing ID"</p>
            <p>3. ⌨️ Enter your ID: <span className="text-amber-400">{userData.uniqueId}</span></p>
            <p>4. ✅ Start chanting!</p>
          </div>
          <div className="mt-3 text-xs text-amber-300">
            <p>दूसरे डिवाइस पर उपयोग करने के लिए:</p>
            <p>अपनी आईडी दर्ज करें और जप शुरू करें!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExportIdPage;
