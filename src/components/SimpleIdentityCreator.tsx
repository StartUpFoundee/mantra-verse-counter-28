
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Mail, LogIn, UserPlus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  createSimpleUserIdentity, 
  saveSimpleUserIdentity,
  getCurrentSimpleUserIdentity 
} from "@/utils/simpleIdentityUtils";

interface SimpleIdentityCreatorProps {
  onIdentityCreated: () => void;
}

const SimpleIdentityCreator: React.FC<SimpleIdentityCreatorProps> = ({ onIdentityCreated }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'login'>('select');
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    dob: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleModeSelect = (selectedMode: 'create' | 'login') => {
    setMode(selectedMode);
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1) {
      if (mode === 'login') {
        if (!formData.email.trim()) {
          toast("Email Required", { description: "Please enter your email address" });
          return;
        }
        handleLogin();
      } else {
        if (!formData.email.trim()) {
          toast("Email Required", { description: "Please enter your email address" });
          return;
        }
        if (!formData.name.trim()) {
          toast("Name Required", { description: "Please enter your name" });
          return;
        }
        setStep(2);
      }
    }
  };

  const handleLogin = async () => {
    setIsProcessing(true);
    try {
      // Check if user exists in localStorage with this email
      const userKey = `user_${formData.email.toLowerCase()}`;
      const storedUser = localStorage.getItem(userKey);
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        saveSimpleUserIdentity(userData);
        toast("Login Successful", {
          description: `Welcome back, ${userData.name}!`
        });
        onIdentityCreated();
      } else {
        toast("User Not Found", {
          description: "No account found with this email. Please create a new account."
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast("Login Failed", {
        description: "Unable to login. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateIdentity = async () => {
    if (!formData.dob) {
      toast("Date of Birth Required", { description: "Please select your date of birth" });
      return;
    }

    setIsProcessing(true);

    try {
      // Check if email already exists
      const userKey = `user_${formData.email.toLowerCase()}`;
      const existingUser = localStorage.getItem(userKey);
      
      if (existingUser) {
        toast("Email Already Exists", {
          description: "An account with this email already exists. Please login instead."
        });
        setIsProcessing(false);
        return;
      }

      // Create identity with email-based unique ID
      const identity = createSimpleUserIdentity(formData.name.trim(), formData.dob, formData.email.toLowerCase());

      // Save identity with email as key
      saveSimpleUserIdentity(identity);
      localStorage.setItem(userKey, JSON.stringify(identity));

      toast("Account Created Successfully", {
        description: `Welcome ${identity.name}! Your unique ID: ${identity.uniqueId}`
      });

      onIdentityCreated();
    } catch (error) {
      console.error("Identity creation failed:", error);
      toast("Creation Failed", {
        description: "Unable to create account. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 text-center text-2xl">
              Welcome to Mantra Counter
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Begin your spiritual journey / अपनी आध्यात्मिक यात्रा शुरू करें
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleModeSelect('create')}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Create New Account / नया खाता बनाएं
            </Button>
            
            <Button
              onClick={() => handleModeSelect('login')}
              variant="outline"
              className="w-full h-14 border-amber-600 text-amber-400 hover:bg-amber-600/10 text-lg font-semibold"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Login to Existing Account / मौजूदा खाते में लॉगिन करें
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login to Your Account
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter your email to access your spiritual journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-amber-400">
                Email Address / ईमेल पता
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white h-12 text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                className="flex-1 h-12 border-zinc-600 text-gray-300"
                disabled={isProcessing}
              >
                Back / वापस
              </Button>
              <Button
                onClick={handleNext}
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

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 1 && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Step 1: Email & Name
            </CardTitle>
            <CardDescription className="text-gray-300">
              Create your spiritual identity / अपनी आध्यात्मिक पहचान बनाएं
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-amber-400">
                Email Address / ईमेल पता
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white h-12 text-lg"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-amber-400">
                Full Name / पूरा नाम
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white h-12 text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                className="flex-1 h-12 border-zinc-600 text-gray-300"
              >
                Back / वापस
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Next / आगे
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Step 2: Complete Your Identity
            </CardTitle>
            <CardDescription className="text-gray-300">
              When were you born? / आप कब पैदा हुए थे?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 border-zinc-600 text-gray-300"
                disabled={isProcessing}
              >
                Back / वापस
              </Button>
              <Button
                onClick={handleCreateIdentity}
                disabled={isProcessing}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "🚀 Create Account / खाता बनाएं"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleIdentityCreator;
