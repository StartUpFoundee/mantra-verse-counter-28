
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface EmailBackupConsentProps {
  userEmail: string;
  onConsent: (email: string, enabled: boolean) => void;
  onSkip: () => void;
}

const EmailBackupConsent: React.FC<EmailBackupConsentProps> = ({
  userEmail,
  onConsent,
  onSkip
}) => {
  const [email, setEmail] = useState(userEmail);
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onConsent(email, true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-400">Email Backup Setup</h2>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-gray-300 mb-4">
          We can backup your spiritual identity to your email for safekeeping. This ensures you can recover your account if your device is lost.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="backup-email" className="text-amber-400">
              Backup Email Address
            </Label>
            <Input
              id="backup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="backup-consent"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="text-amber-400"
            />
            <Label htmlFor="backup-consent" className="text-sm text-gray-300">
              I agree to backup my identity data to this email address
            </Label>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleAccept}
            disabled={!agreed || !email}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            Enable Backup
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="flex-1 text-gray-400 hover:text-gray-300"
          >
            Skip for Now
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Your data is never shared. You control all backups.
        </p>
      </div>
    </div>
  );
};

export default EmailBackupConsent;
