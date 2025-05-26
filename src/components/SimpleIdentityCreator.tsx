
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Cloud, User, Calendar, Mail } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  createUserIdentity, 
  saveUserIdentity, 
  validateEmail 
} from "@/utils/portableIdentityUtils";
import { googleDriveService } from "@/utils/googleDriveService";
import { initializeBackupScheduler } from "@/utils/backupScheduler";

interface SimpleIdentityCreatorProps {
  onIdentityCreated: () => void;
}

const SimpleIdentityCreator: React.FC<SimpleIdentityCreatorProps> = ({ onIdentityCreated }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    email: ""
  });
  const [emergencyBackupEnabled, setEmergencyBackupEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast("Name Required", { description: "Please enter your name" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.dob) {
        toast("Date of Birth Required", { description: "Please select your date of birth" });
        return;
      }
      setStep(3);
    }
  };

  const handleCreateIdentity = async () => {
    if (!formData.email.trim()) {
      toast("Email Required", { description: "Please enter your email address" });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast("Invalid Email", { description: "Please enter a valid email address" });
      return;
    }

    setIsCreating(true);

    try {
      // Create identity
      const identity = await createUserIdentity(
        formData.name.trim(), 
        formData.dob, 
        formData.email.trim()
      );

      // Set emergency backup preference
      identity.googleDriveEnabled = emergencyBackupEnabled;

      // If emergency backup is enabled, authorize Google Drive
      if (emergencyBackupEnabled) {
        await googleDriveService.initialize();
        const authorized = await googleDriveService.requestAuthorization();
        if (!authorized) {
          toast("Backup Setup Failed", {
            description: "Emergency backup disabled. You can enable it later in profile settings."
          });
          identity.googleDriveEnabled = false;
        } else {
          // Initialize backup scheduler
          initializeBackupScheduler();
        }
      }

      // Save identity
      await saveUserIdentity(identity);

      toast("Identity Created Successfully", {
        description: `Welcome ${identity.name}! Your spiritual journey begins now.`
      });

      onIdentityCreated();
    } catch (error) {
      console.error("Identity creation failed:", error);
      toast("Creation Failed", {
        description: "Unable to create identity. Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 1 && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <User className="h-5 w-5" />
              Step 1: Your Name
            </CardTitle>
            <CardDescription className="text-gray-300">
              Tell us your name / अपना नाम बताएं
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              onClick={handleNext}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-lg"
            >
              Next / आगे
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Step 2: Date of Birth
            </CardTitle>
            <CardDescription className="text-gray-300">
              When were you born? / आप कब पैदा हुए थे?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

      {step === 3 && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Step 3: Email & Emergency Backup
            </CardTitle>
            <CardDescription className="text-gray-300">
              Secure your spiritual journey / अपनी आध्यात्मिक यात्रा को सुरक्षित करें
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-amber-400">
                Email Address / ईमेल पता
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white h-12"
              />
            </div>

            {/* Emergency Backup Feature */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-400" />
                  <Label className="text-amber-400 font-medium">
                    Emergency Backup Feature
                  </Label>
                </div>
                <Switch 
                  checked={emergencyBackupEnabled}
                  onCheckedChange={setEmergencyBackupEnabled}
                />
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  🛡️ <strong>Automatic Protection:</strong> Your spiritual data will be safely backed up to Google Drive on the 15th & 28th of every month.
                </p>
                <p className="text-amber-300">
                  📱 <strong>Device Recovery:</strong> Lost your phone? Recover your account anytime using your email.
                </p>
                <p className="text-gray-400 text-xs">
                  आपातकालीन बैकअप: आपका डेटा हर महीने 15 और 28 तारीख को Google Drive में सुरक्षित होगा।
                </p>
              </div>

              {emergencyBackupEnabled && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                  ✅ Your spiritual journey will be automatically protected!
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 border-zinc-600 text-gray-300"
                disabled={isCreating}
              >
                Back / वापस
              </Button>
              <Button
                onClick={handleCreateIdentity}
                disabled={isCreating}
                className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "🚀 Start My Journey / यात्रा शुरू करें"
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
