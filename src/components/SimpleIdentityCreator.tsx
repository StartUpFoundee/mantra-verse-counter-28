
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Mail, LogIn, UserPlus, QrCode, Upload } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  createSimpleUserIdentity, 
  saveSimpleUserIdentity,
  emailHasAccount,
  autoDetectAndLogin,
  createAccountFromQRCode
} from "@/utils/simpleIdentityUtils";

interface SimpleIdentityCreatorProps {
  onIdentityCreated: () => void;
}

const SimpleIdentityCreator: React.FC<SimpleIdentityCreatorProps> = ({ onIdentityCreated }) => {
  const [mode, setMode] = useState<'email-check' | 'create' | 'qr-login'>('email-check');
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    dob: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrData, setQrData] = useState("");

  const handleEmailCheck = async () => {
    if (!formData.email.trim()) {
      toast("Email Required", { description: "Please enter your email address" });
      return;
    }

    setIsProcessing(true);
    
    // Check if email already has an account
    const existingUser = autoDetectAndLogin(formData.email.toLowerCase());
    
    if (existingUser) {
      toast("Welcome Back!", {
        description: `Account detected for this email. Logging you in automatically.`
      });
      onIdentityCreated();
    } else {
      // No account found, show create/QR options
      setMode('create');
    }
    
    setIsProcessing(false);
  };

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) {
      toast("Name Required", { description: "Please enter your name" });
      return;
    }
    
    if (!formData.dob) {
      toast("Date of Birth Required", { description: "Please select your date of birth" });
      return;
    }

    setIsProcessing(true);

    try {
      // Double-check email doesn't have account
      if (emailHasAccount(formData.email.toLowerCase())) {
        toast("Account Already Exists", {
          description: "You already have an account on this email. To create a new account, logout and switch to a different email."
        });
        setIsProcessing(false);
        return;
      }

      // Create new identity
      const identity = createSimpleUserIdentity(
        formData.name.trim(), 
        formData.dob, 
        formData.email.toLowerCase()
      );

      saveSimpleUserIdentity(identity);

      toast("Account Created Successfully", {
        description: `Welcome ${identity.name}! Your unique ID: ${identity.uniqueId}`
      });

      onIdentityCreated();
    } catch (error) {
      console.error("Account creation failed:", error);
      toast("Creation Failed", {
        description: "Unable to create account. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRLogin = async () => {
    if (!qrData.trim()) {
      toast("QR Code Required", { description: "Please enter QR code data" });
      return;
    }

    setIsProcessing(true);

    try {
      const identity = createAccountFromQRCode(qrData, formData.email.toLowerCase());
      
      if (identity) {
        saveSimpleUserIdentity(identity);
        
        toast("QR Login Successful", {
          description: `Welcome ${identity.name}! Account transferred to this email.`
        });
        
        onIdentityCreated();
      } else {
        toast("Invalid QR Code", {
          description: "The QR code data is invalid or corrupted."
        });
      }
    } catch (error) {
      console.error("QR login failed:", error);
      toast("QR Login Failed", {
        description: "Unable to login with QR code. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Email check screen
  if (mode === 'email-check') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 text-center text-2xl">
              Welcome to Mantra Counter
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Enter your email to continue / अपना ईमेल दर्ज करके जारी रखें
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-check" className="text-amber-400">
                Email Address / ईमेल पता
              </Label>
              <Input
                id="email-check"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white h-12 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleEmailCheck()}
              />
            </div>
            
            <Button
              onClick={handleEmailCheck}
              disabled={isProcessing}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking...
                </div>
              ) : (
                "Continue / जारी रखें"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create account or QR login options
  if (mode === 'create') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 text-center">
              No Account Found for {formData.email}
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Choose how you want to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {/* Keep create mode, show form */}}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create New Account / नया खाता बनाएं
            </Button>
            
            <Button
              onClick={() => setMode('qr-login')}
              variant="outline"
              className="w-full h-14 border-amber-600 text-amber-400 hover:bg-amber-600/10 text-lg font-semibold"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Login with QR Code / क्यूआर कोड से लॉगिन करें
            </Button>
            
            <Button
              onClick={() => setMode('email-check')}
              variant="ghost"
              className="w-full text-gray-400 hover:text-gray-300"
            >
              Change Email / ईमेल बदलें
            </Button>
            
            {/* Create Account Form */}
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name" className="text-amber-400">
                  Full Name / पूरा नाम
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-900 border-zinc-600 text-white h-12"
                />
              </div>
              
              <div>
                <Label htmlFor="dob" className="text-amber-400">
                  Date of Birth / जन्म तिथि
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="bg-zinc-900 border-zinc-600 text-white h-12"
                />
              </div>
              
              <Button
                onClick={handleCreateAccount}
                disabled={isProcessing}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  "🚀 Create Account / खाता बनाएं"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // QR Login screen
  if (mode === 'qr-login') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Login with QR Code
            </CardTitle>
            <CardDescription className="text-gray-300">
              Paste your QR code data to transfer your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="qr-data" className="text-amber-400">
                QR Code Data / क्यूआर कोड डेटा
              </Label>
              <textarea
                id="qr-data"
                placeholder="Paste your QR code data here..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full h-32 bg-zinc-900 border-zinc-600 text-white p-3 rounded-md resize-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('create')}
                className="flex-1 h-12 border-zinc-600 text-gray-300"
                disabled={isProcessing}
              >
                Back / वापस
              </Button>
              <Button
                onClick={handleQRLogin}
                disabled={isProcessing}
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  "Login / लॉगिन करें"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default SimpleIdentityCreator;
