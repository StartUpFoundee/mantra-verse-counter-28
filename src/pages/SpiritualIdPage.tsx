import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2, QrCode, LogOut, Cloud, CloudOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  generateUserID, 
  validateUserID, 
  extractDOBFromID, 
  spiritualIcons,
  getUserData,
  saveUserData,
  logoutUser
} from "@/utils/spiritualIdUtils";
import SpiritualIconSelector from "@/components/SpiritualIconSelector";
import QRCodeModal from "@/components/QRCodeModal";
import QRCodeBackupPanel from "@/components/QRCodeBackupPanel";

const SpiritualIdPage: React.FC = () => {
  const navigate = useNavigate();
  const [spiritualId, setSpiritualId] = useState<string>("");
  const [spiritualName, setSpiritualName] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [dobInput, setDobInput] = useState<string>("");
  const [inputId, setInputId] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [showInputField, setShowInputField] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [inputValid, setInputValid] = useState<boolean | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("om");
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [showLoginOptions, setShowLoginOptions] = useState<boolean>(false);
  const [showQRBackupPanel, setShowQRBackupPanel] = useState<boolean>(false);
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState<boolean>(false);

  useEffect(() => {
    const userData = getUserData();
    
    if (userData) {
      setSpiritualId(userData.id);
      setSpiritualName(userData.name || "");
      setSelectedIcon(userData.symbol || "om");
      setGoogleDriveEnabled(userData.googleDriveEnabled || false);
      setIsNewUser(false);
      setShowLoginOptions(false);
    } else {
      setIsNewUser(true);
      setShowNameInput(false);
      setShowLoginOptions(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputId(value);
    
    if (value.length >= 6) {
      // Validate as user types if the input is long enough
      const isValid = validateUserID(value);
      setInputValid(isValid);
    } else {
      setInputValid(null);
    }
  };

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
  };
  
  const handleDobInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDobInput(e.target.value);
  };

  const handleIconSelect = (iconId: string) => {
    setSelectedIcon(iconId);
  };

  const handleNameSubmit = () => {
    if (!nameInput.trim()) {
      toast("Missing Name", {
        description: "Please enter your name"
      });
      return;
    }
    
    if (!dobInput) {
      toast("Missing Date of Birth", {
        description: "Please enter your date of birth"
      });
      return;
    }

    // Generate ID with DOB and save both
    const newId = generateUserID(dobInput);
    setSpiritualId(newId);
    setSpiritualName(nameInput);
    
    // Create full user data object
    const iconObj = spiritualIcons.find(i => i.id === selectedIcon);
    const userData = {
      id: newId,
      name: nameInput,
      dob: dobInput,
      symbol: selectedIcon,
      symbolImage: iconObj?.symbol || "🕉️",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    saveUserData(userData);
    
    setShowNameInput(false);
    setShowLoginOptions(false);
    setIsNewUser(false);
    
    toast("Identity Created", {
      description: "Your spiritual ID was created successfully!"
    });
    
    // Navigate to home after successful creation
    navigate("/");
  };

  const handleSubmitId = () => {
    const isValid = validateUserID(inputId);
    setInputValid(isValid);
    
    if (isValid) {
      // If valid, update the stored ID
      const extractedDob = extractDOBFromID(inputId);
      const iconSymbol = spiritualIcons.find(i => i.id === selectedIcon)?.symbol || "🕉️";
      
      // Create user data object
      const userData = {
        id: inputId,
        name: nameInput || "Spiritual Seeker",
        dob: extractedDob,
        symbol: selectedIcon,
        symbolImage: iconSymbol,
        lastLogin: new Date().toISOString()
      };
      
      saveUserData(userData);
      setSpiritualId(inputId);
      setSpiritualName(userData.name);
      setShowInputField(false);
      setShowLoginOptions(false);
      
      toast("Login Successful", {
        description: "You've logged in with your spiritual ID"
      });
      
      // Navigate to home after successful login
      navigate("/");
    } else {
      toast("Invalid ID", {
        description: "Invalid spiritual ID format"
      });
    }
  };

  const handleLogout = () => {
    logoutUser();
    
    setShowLoginOptions(true);
    setSpiritualId("");
    setSpiritualName("");
    setInputId("");
    setIsNewUser(true);
    setSelectedIcon("om");
    
    toast("Logged Out", {
      description: "You have been logged out successfully"
    });
  };

  const handleShowCreateId = () => {
    setShowNameInput(true);
    setShowLoginOptions(false);
  };

  const handleShowLoginWithId = () => {
    setShowInputField(true);
    setShowLoginOptions(false);
  };

  const handleDownloadScreenshot = () => {
    setQrModalOpen(true);
  };

  const handleShareWhatsApp = () => {
    const shareText = `My spiritual ID: ${spiritualId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
    toast.info("Printing spiritual ID card", {
      style: { background: '#262626', color: '#fcd34d' }
    });
  };

  const handleQrCode = () => {
    setQrModalOpen(true);
  };

  const handleGoogleDriveToggle = (enabled: boolean) => {
    setGoogleDriveEnabled(enabled);
    const userData = getUserData();
    if (userData) {
      const updatedData = { ...userData, googleDriveEnabled: enabled };
      saveUserData(updatedData);
      toast(enabled ? "Google Drive Backup Enabled" : "Google Drive Backup Disabled", {
        description: enabled 
          ? "Your data will be automatically backed up to Google Drive" 
          : "Google Drive backup has been turned off"
      });
    }
  };

  // Find the selected icon
  const selectedIconObj = spiritualIcons.find(icon => icon.id === selectedIcon);
  const iconSymbol = selectedIconObj ? selectedIconObj.symbol : "🕉️";

  // Login options screen with simplified UI
  if (showLoginOptions) {
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
          <h1 className="text-xl font-bold text-amber-400">Create Your Spiritual Identity</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-amber-400 hover:bg-zinc-800"
            onClick={() => navigate('/')}
          >
            <Home className="h-6 w-6" />
          </Button>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🕉️</div>
              <h2 className="text-2xl font-bold text-amber-400 mb-3">Welcome, Spiritual Seeker</h2>
              <p className="text-gray-300 mb-2">Choose how you want to begin your journey</p>
              <p className="text-amber-300 text-sm">अपनी आध्यात्मिक यात्रा शुरू करने का तरीका चुनें</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full h-16 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black text-lg font-bold"
                onClick={() => { setShowNameInput(true); setShowLoginOptions(false); }}
              >
                🆕 Create New Identity
                <br />
                <span className="text-sm font-normal">नई पहचान बनाएं</span>
              </Button>
              
              <Button 
                className="w-full h-16 bg-zinc-700 hover:bg-zinc-600 text-white text-lg"
                onClick={() => { setShowInputField(true); setShowLoginOptions(false); }}
              >
                🔑 Login with Existing ID
                <br />
                <span className="text-sm font-normal">मौजूदा आईडी से लॉगिन करें</span>
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full text-gray-400 hover:text-gray-300"
                onClick={() => navigate('/')}
              >
                Continue as Guest / अतिथि के रूप में जारी रखें
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Name input screen with Google Drive option
  if (showNameInput) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <header className="py-4 px-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-amber-400 hover:bg-zinc-800"
            onClick={() => setShowLoginOptions(true)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-amber-400">Create Identity</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-amber-400 hover:bg-zinc-800"
            onClick={() => navigate('/')}
          >
            <Home className="h-6 w-6" />
          </Button>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🕉️</div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">Enter Your Details</h2>
                <p className="text-gray-300 text-sm">अपना विवरण दर्ज करें</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-amber-400 mb-2 block">Name / नाम</Label>
                  <Input 
                    className="bg-zinc-900 border-zinc-600 text-white h-12"
                    placeholder="Enter your name / अपना नाम लिखें"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-amber-400 mb-2 block">Date of Birth / जन्म तिथि</Label>
                  <Input 
                    type="date"
                    className="bg-zinc-900 border-zinc-600 text-white h-12"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                  />
                </div>
                
                <SpiritualIconSelector selectedIcon={selectedIcon} onSelectIcon={setSelectedIcon} />
                
                {/* Google Drive Backup Option */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {googleDriveEnabled ? <Cloud className="h-5 w-5 text-amber-400" /> : <CloudOff className="h-5 w-5 text-gray-400" />}
                      <Label className="text-amber-400 font-medium">Google Drive Backup</Label>
                    </div>
                    <Switch 
                      checked={googleDriveEnabled}
                      onCheckedChange={setGoogleDriveEnabled}
                    />
                  </div>
                  <p className="text-xs text-gray-300">
                    {googleDriveEnabled 
                      ? "✅ Your data will be safely backed up to Google Drive automatically"
                      : "Turn on to automatically backup your spiritual journey data"}
                  </p>
                  <p className="text-xs text-amber-300 mt-1">
                    {googleDriveEnabled 
                      ? "आपका डेटा स्वचालित रूप से Google Drive में सुरक्षित रहेगा"
                      : "अपनी आध्यात्मिक यात्रा का डेटा सुरक्षित रखने के लिए चालू करें"}
                  </p>
                </div>
                
                <Button 
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black text-lg font-bold"
                  onClick={() => {
                    if (!nameInput.trim()) {
                      toast("Missing Name", {
                        description: "Please enter your name"
                      });
                      return;
                    }
                    
                    if (!dobInput) {
                      toast("Missing Date of Birth", {
                        description: "Please enter your date of birth"
                      });
                      return;
                    }

                    // Generate ID with DOB and save both
                    const newId = generateUserID(dobInput);
                    setSpiritualId(newId);
                    setSpiritualName(nameInput);
                    
                    // Create full user data object
                    const iconObj = spiritualIcons.find(i => i.id === selectedIcon);
                    const userData = {
                      id: newId,
                      name: nameInput,
                      dob: dobInput,
                      symbol: selectedIcon,
                      symbolImage: iconObj?.symbol || "🕉️",
                      createdAt: new Date().toISOString(),
                      lastLogin: new Date().toISOString()
                    };
                    
                    saveUserData(userData);
                    
                    setShowNameInput(false);
                    setShowLoginOptions(false);
                    setIsNewUser(false);
                    
                    toast("Identity Created", {
                      description: "Your spiritual ID was created successfully!"
                    });
                    
                    // Navigate to home after successful creation
                    navigate("/");
                  }}
                >
                  🚀 Start My Journey / मेरी यात्रा शुरू करें
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ID input for existing users
  if (showInputField) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <header className="py-4 px-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-amber-400 hover:bg-zinc-800"
            onClick={() => setShowLoginOptions(true)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-amber-400">Spiritual ID</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-amber-400 hover:bg-zinc-800"
            onClick={() => navigate('/')}
          >
            <Home className="h-6 w-6" />
          </Button>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-amber-400 mb-2 text-center">Enter Your Spiritual ID</h3>
              <p className="text-gray-300 text-sm mb-4 text-center">अपना आध्यात्मिक आईडी दर्ज करें</p>
              
              <div className="mb-4">
                <Input 
                  className={`bg-zinc-900 border ${
                    inputValid === null ? 'border-zinc-600' : 
                    inputValid ? 'border-green-500' : 'border-red-500'
                  } text-amber-400 text-xl text-center tracking-wider h-16`}
                  placeholder="OMName123A"
                  value={inputId}
                  onChange={handleInputChange}
                  maxLength={15}
                />
                
                {inputValid === false && (
                  <p className="text-red-500 text-sm mt-2">
                    Invalid format. IDs usually start with OM and have your name followed by numbers.
                    <br />
                    अमान्य प्रारूप। आईडी आमतौर पर OM से शुरू होती है और इसके बाद आपका नाम और अंक होते हैं।
                  </p>
                )}
              </div>
              
              <SpiritualIconSelector selectedIcon={selectedIcon} onSelectIcon={handleIconSelect} />
              
              <div className="flex gap-2 mt-4">
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-black flex-1"
                  onClick={handleSubmitId}
                  disabled={!inputId || inputValid === false}
                >
                  Login / लॉगिन करें
                </Button>
                <Button 
                  className="bg-zinc-700 hover:bg-zinc-600 text-white"
                  onClick={() => setShowLoginOptions(true)}
                >
                  Cancel / रद्द करें
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main spiritual ID view with better instructions
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
        <h1 className="text-xl font-bold text-amber-400">My Spiritual Identity</h1>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-amber-400 hover:bg-zinc-800"
          onClick={() => navigate('/')}
        >
          <Home className="h-6 w-6" />
        </Button>
      </header>
      
      <QRCodeModal 
        open={qrModalOpen} 
        onOpenChange={setQrModalOpen} 
        spiritualId={spiritualId}
      />
      
      <QRCodeBackupPanel 
        isOpen={showQRBackupPanel} 
        onClose={() => setShowQRBackupPanel(false)}
      />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 space-y-6">
        {/* Identity Card */}
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/30 rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{spiritualIcons.find(i => i.id === selectedIcon)?.symbol || "🕉️"}</div>
            <h2 className="text-xl font-bold text-amber-400 mb-2">
              {spiritualName ? `${spiritualName} Ji` : 'Your Spiritual Identity'}
            </h2>
            <p className="text-gray-300 text-sm">आपकी आध्यात्मिक पहचान</p>
          </div>
          
          <div className="bg-black rounded-lg p-4 text-center border border-amber-500/20">
            <p className="text-gray-400 text-xs mb-1">Spiritual ID / आध्यात्मिक आईडी</p>
            <p className="text-2xl md:text-3xl font-bold tracking-wider text-amber-400">{spiritualId}</p>
          </div>
          
          {/* Google Drive Status */}
          <div className="mt-4 flex items-center justify-between bg-zinc-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {googleDriveEnabled ? <Cloud className="h-4 w-4 text-green-400" /> : <CloudOff className="h-4 w-4 text-gray-400" />}
              <span className="text-sm text-gray-300">Google Drive Backup</span>
            </div>
            <Switch 
              checked={googleDriveEnabled}
              onCheckedChange={handleGoogleDriveToggle}
              size="sm"
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="w-full max-w-md space-y-4">
          <h3 className="text-lg font-bold text-amber-400 text-center mb-4">
            Quick Actions / त्वरित कार्य
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-20 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/30 flex flex-col items-center justify-center"
              onClick={() => setShowQRBackupPanel(true)}
            >
              <QrCode className="h-8 w-8 mb-1" />
              <span className="text-sm">QR & Backup</span>
              <span className="text-xs text-gray-400">क्यूआर व बैकअप</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/30 flex flex-col items-center justify-center"
              onClick={() => setQrModalOpen(true)}
            >
              <Download className="h-8 w-8 mb-1" />
              <span className="text-sm">Download</span>
              <span className="text-xs text-gray-400">डाउनलोड</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/30 flex flex-col items-center justify-center"
              onClick={() => {
                const shareText = `My spiritual ID: ${spiritualId}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                window.open(whatsappUrl, '_blank');
              }}
            >
              <Share2 className="h-8 w-8 mb-1" />
              <span className="text-sm">Share</span>
              <span className="text-xs text-gray-400">साझा करें</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 bg-zinc-800 hover:bg-zinc-700 text-red-400 border-red-500/30 flex flex-col items-center justify-center"
              onClick={() => {
                logoutUser();
                navigate('/');
                toast("Logged Out", { description: "You have been logged out successfully" });
              }}
            >
              <LogOut className="h-8 w-8 mb-1" />
              <span className="text-sm">Logout</span>
              <span className="text-xs text-gray-400">लॉग आउट</span>
            </Button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="w-full max-w-md bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h4 className="text-amber-400 font-medium mb-2">How to use on another device:</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>1. 📱 Open this website on new device</p>
            <p>2. 🔍 Click "Login with Existing ID"</p>
            <p>3. ⌨️ Enter your ID: <span className="text-amber-400">{spiritualId}</span></p>
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

export default SpiritualIdPage;
