
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Mail } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  createUserIdentity, 
  saveUserIdentity, 
  validateEmail 
} from "@/utils/portableIdentityUtils";

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
              Step 3: Email Address
            </CardTitle>
            <CardDescription className="text-gray-300">
              Complete your spiritual identity / अपनी आध्यात्मिक पहचान पूरी करें
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
              <p className="text-xs text-gray-400 mt-2">
                This email will be used to create your unique spiritual identity
              </p>
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
