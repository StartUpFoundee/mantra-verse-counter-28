
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Copy, RefreshCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { getCurrentSimpleUserIdentity } from "@/utils/simpleIdentityUtils";
import { getTodayCount, getLifetimeCount } from "@/utils/indexedDBUtils";
import { QRCode } from "@/components/ui/qr-code";

const ExportIdPage: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [qrData, setQrData] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);

  const loadUserData = async () => {
    const identity = getCurrentSimpleUserIdentity();
    if (!identity) {
      navigate("/");
      return;
    }

    const [today, lifetime] = await Promise.all([
      getTodayCount(),
      getLifetimeCount()
    ]);

    setUserData(identity);
    setTodayCount(today);
    setLifetimeCount(lifetime);

    // Create comprehensive QR data with current stats
    const qrPayload = {
      type: "MantraCounterIdentity",
      version: "2.0",
      identity: identity,
      stats: {
        todayCount: today,
        lifetimeCount: lifetime,
        lastUpdated: new Date().toISOString()
      },
      timestamp: Date.now()
    };

    setQrData(JSON.stringify(qrPayload));
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      toast("QR Code Refreshed", {
        description: "QR code updated with latest mantra counts"
      });
    } catch (error) {
      toast("Refresh Failed", {
        description: "Unable to refresh QR code data"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyId = () => {
    if (!userData?.uniqueId) return;
    
    navigator.clipboard.writeText(userData.uniqueId)
      .then(() => {
        toast("ID Copied", {
          description: "Your unique spiritual ID has been copied"
        });
      })
      .catch(() => {
        toast("Copy Failed", {
          description: "Could not copy to clipboard"
        });
      });
  };

  const handleDownloadQR = () => {
    const canvas = document.createElement('canvas');
    const qrElement = document.querySelector('img[alt="QR Code"]') as HTMLImageElement;
    
    if (qrElement) {
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(qrElement, 0, 0, 300, 300);
        
        const link = document.createElement('a');
        link.download = `mantra-counter-qr-${userData?.name?.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast("QR Code Downloaded", {
          description: "QR code saved to your device"
        });
      }
    }
  };

  const handleExportData = () => {
    if (!userData) return;
    
    const exportData = {
      identity: userData,
      stats: {
        todayCount,
        lifetimeCount,
        exportDate: new Date().toISOString()
      },
      instructions: "Use this data to restore your account on another device"
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `mantra-counter-backup-${userData.uniqueId}.json`);
    link.click();
    
    toast("Data Exported", {
      description: "Your complete spiritual data has been downloaded"
    });
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-400">Loading your spiritual identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-amber-400">Export Spiritual ID</h1>
        <div className="w-24"></div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Identity Information */}
        <Card className="bg-zinc-800/50 border-amber-600/20">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Your Spiritual Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Name / नाम</label>
              <p className="text-white font-medium">{userData.name}</p>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">Email / ईमेल</label>
              <p className="text-white font-medium">{userData.email}</p>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">Unique ID / विशिष्ट आईडी</label>
              <div className="flex items-center gap-2">
                <p className="text-amber-400 font-mono text-sm break-all">{userData.uniqueId}</p>
                <Button onClick={handleCopyId} size="sm" variant="ghost" className="p-1">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">Date of Birth / जन्म तिथि</label>
              <p className="text-white">{new Date(userData.dob).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
              <div>
                <label className="text-gray-400 text-sm">Today's Count</label>
                <p className="text-2xl font-bold text-green-400">{todayCount}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Lifetime Count</label>
                <p className="text-2xl font-bold text-amber-400">{lifetimeCount}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCopyId} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
              <Button onClick={handleExportData} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="bg-zinc-800/50 border-amber-600/20">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code for Cross-Device Login
              </span>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="ghost"
                disabled={isRefreshing}
                className="text-amber-400 hover:text-amber-300"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg">
              {qrData && (
                <QRCode 
                  value={qrData} 
                  size={250}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="mx-auto"
                />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-gray-300 text-sm">
                Scan this QR code on another device to login instantly
              </p>
              <p className="text-gray-400 text-xs">
                दूसरे डिवाइस पर तुरंत लॉगिन करने के लिए इस QR कोड को स्कैन करें
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="flex-1"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh QR'}
              </Button>
              <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <h3 className="text-amber-400 font-semibold mb-3">How to use QR Code / QR कोड का उपयोग कैसे करें</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-white font-medium mb-2">English Instructions:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Open Mantra Counter on another device</li>
                <li>• Click "Login to Existing Account"</li>
                <li>• Scan this QR code to login instantly</li>
                <li>• All your data will be synchronized</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">हिंदी निर्देश:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• दूसरे डिवाइस पर मंत्र काउंटर खोलें</li>
                <li>• "मौजूदा खाते में लॉगिन करें" पर क्लिक करें</li>
                <li>• तुरंत लॉगिन के लिए इस QR कोड को स्कैन करें</li>
                <li>• आपका सारा डेटा सिंक्रोनाइज़ हो जाएगा</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportIdPage;
