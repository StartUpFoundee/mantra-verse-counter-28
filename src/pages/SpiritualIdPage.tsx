import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Download, Share2, Printer, QrCode, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { 
  generateUserID, 
  validateUserID, 
  extractDOBFromID, 
  spiritualIcons,
  getUserData,
  saveUserData,
  logoutUser
} from "@/utils/spiritualIdUtils";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    // Check if user already has a spiritual ID stored
    const userData = getUserData();
    
    if (userData) {
      setSpiritualId(userData.id);
      setSpiritualName(userData.name || "");
      setSelectedIcon(userData.symbol || "om");
      setIsNewUser(false);
      setShowLoginOptions(false);
    } else {
      // For new users or logged out users, show login options
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

  // Find the selected icon
  const selectedIconObj = spiritualIcons.find(icon => icon.id === selectedIcon);
  const iconSymbol = selectedIconObj ? selectedIconObj.symbol : "🕉️";

  // Login options screen
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
            <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-6 mb-8 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🕉️</div>
                <h2 className="text-2xl font-bold text-amber-400 mb-3">Welcome, Spiritual Seeker</h2>
                <p className="text-gray-300 mb-1">Please choose an option to continue</p>
                <p className="text-amber-300 text-sm">आगे बढ़ने के लिए कृपया एक विकल्प चुनें</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-black w-full h-12 text-lg"
                  onClick={handleShowCreateId}
                >
                  Create New Identity / नई पहचान बनाएं
                </Button>
                
                <Button 
                  className="bg-zinc-700 hover:bg-zinc-600 text-white w-full h-12 text-lg"
                  onClick={handleShowLoginWithId}
                >
                  Login with ID / आईडी से लॉगिन करें
                </Button>
                
                <Button 
                  className="bg-transparent hover:bg-zinc-800 text-gray-300 w-full"
                  onClick={() => navigate('/')}
                >
                  Continue as Guest / अतिथि के रूप में जारी रखें
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Name input screen for new users
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
            <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-6 mb-8 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🕉️</div>
                <h2 className="text-2xl font-bold text-amber-400 mb-3">Welcome, Spiritual Seeker</h2>
                <p className="text-gray-300 mb-1">Please enter your details to start your spiritual journey</p>
                <p className="text-amber-300 text-sm">कृपया अपना विवरण दर्ज करें जिससे आपकी आध्यात्मिक यात्रा शुरू करने के लिए</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-full">
                  <Label htmlFor="name-input" className="text-amber-400 mb-1 block">
                    Enter your name / अपना नाम लिखें
                  </Label>
                  <Input 
                    id="name-input"
                    className="bg-zinc-900 border border-zinc-600 text-white text-lg h-14 text-center"
                    placeholder="Your Name / आपका नाम"
                    value={nameInput}
                    onChange={handleNameInputChange}
                  />
                </div>
                
                <div className="w-full">
                  <Label htmlFor="dob-input" className="text-amber-400 mb-1 block">
                    Date of Birth / जन्म तिथि
                  </Label>
                  <Input 
                    id="dob-input"
                    type="date"
                    className="bg-zinc-900 border border-zinc-600 text-white h-14"
                    value={dobInput}
                    onChange={handleDobInputChange}
                  />
                </div>
                
                <SpiritualIconSelector selectedIcon={selectedIcon} onSelectIcon={handleIconSelect} />
                
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-black w-full h-12 text-lg"
                  onClick={handleNameSubmit}
                >
                  Start My Journey / मेरी यात्रा शुरू करें
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

  // Main spiritual ID view (when logged in)
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
      
      {/* QR Code Modal */}
      {spiritualId && (
        <QRCodeModal 
          open={qrModalOpen} 
          onOpenChange={setQrModalOpen} 
          spiritualId={spiritualId}
        />
      )}
      
      {/* QR Code Backup Panel - Fix the props */}
      <QRCodeBackupPanel 
        isOpen={showQRBackupPanel} 
        onClose={() => setShowQRBackupPanel(false)}
      />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-6 mb-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">{iconSymbol}</div>
            <h2 className="text-xl font-bold text-amber-400 mb-2">
              {spiritualName ? `${spiritualName} Ji, आपका स्वागत है` : 'Your Spiritual Identity'}
            </h2>
            <p className="text-gray-300 text-sm">आपकी आध्यात्मिक पहचान</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-1 rounded-lg mb-6">
              <div className="bg-black rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Spiritual ID / आध्यात्मिक आईडी</p>
                <p className="text-3xl md:text-4xl font-bold tracking-wider text-amber-400">{spiritualId}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Logout button */}
        <Button 
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 w-full mb-8 flex items-center justify-center gap-2 max-w-md"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout / लॉग आउट करें</span>
        </Button>
        
        {/* Enhanced sharing options */}
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium text-amber-400 mb-4 text-center">
            Backup & Share Your Identity
            <br />
            <span className="text-sm font-normal text-gray-300">अपनी पहचान का बैकअप और साझाकरण</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex flex-col items-center py-6"
              onClick={() => setShowQRBackupPanel(true)}
            >
              <QrCode className="h-6 w-6 mb-2" />
              <span>QR & Backup</span>
              <span className="text-xs text-gray-400">क्यूआर व बैकअप</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex flex-col items-center py-6"
              onClick={handleDownloadScreenshot}
            >
              <Download className="h-6 w-6 mb-2" />
              <span>Screenshot</span>
              <span className="text-xs text-gray-400">स्क्रीनशॉट</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex flex-col items-center py-6"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="h-6 w-6 mb-2" />
              <span>WhatsApp</span>
              <span className="text-xs text-gray-400">व्हाट्सएप</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex flex-col items-center py-6"
              onClick={handlePrint}
            >
              <Printer className="h-6 w-6 mb-2" />
              <span>Print Card</span>
              <span className="text-xs text-gray-400">प्रिंट कार्ड</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 flex flex-col items-center py-6"
              onClick={handleQrCode}
            >
              <QrCode className="h-6 w-6 mb-2" />
              <span>QR Code</span>
              <span className="text-xs text-gray-400">क्यूआर कोड</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpiritualIdPage;
