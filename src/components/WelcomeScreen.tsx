
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpiritualIconSelector from "./SpiritualIconSelector";
import EmailBackupConsent from "./EmailBackupConsent";
import IdentityRestore from "./IdentityRestore";
import { toast } from "@/components/ui/sonner";
import { 
  createUserIdentity, 
  saveUserIdentity, 
  validateEmail 
} from "@/utils/portableIdentityUtils";
import { initializeDatabase, migrateFromLocalStorage } from "@/utils/indexedDBUtils";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form states
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("om");
  
  // UI states
  const [activeTab, setActiveTab] = useState<"create" | "restore">("create");
  const [showEmailConsent, setShowEmailConsent] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [pendingIdentity, setPendingIdentity] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setIsMigrating(true);
      
      // Initialize systems
      await initializeDatabase();
      const migrationSuccess = await migrateFromLocalStorage();
      
      if (migrationSuccess) {
        console.log("Data migration successful");
      }
      
      // Check if user wants to restore from URL
      const params = new URLSearchParams(location.search);
      if (params.get('restore') === 'true') {
        setShowRestore(true);
      }
      
      setIsMigrating(false);
    };
    
    init();
  }, [location]);

  const handleCreateIdentity = async () => {
    if (!name.trim() || !dob || !email.trim()) {
      toast("Missing Information", {
        description: "Please fill all required fields"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast("Invalid Email", {
        description: "Please enter a valid email address"
      });
      return;
    }

    try {
      // Create the user identity
      const identity = await createUserIdentity(name.trim(), dob, email.trim(), selectedIcon);
      
      // Save the pending identity for after consent
      setPendingIdentity(identity);
      
      // Show email backup consent
      setShowEmailConsent(true);
      
    } catch (error) {
      console.error("Identity creation failed:", error);
      toast("Creation Failed", {
        description: "Unable to create identity. Please try again."
      });
    }
  };

  const handleEmailConsent = async (finalEmail: string, enabled: boolean) => {
    if (!pendingIdentity) return;
    
    try {
      // Update the identity with final email and backup preference
      const finalIdentity = {
        ...pendingIdentity,
        email: finalEmail,
        emailBackupEnabled: enabled
      };
      
      // Save the identity to storage
      await saveUserIdentity(finalIdentity);
      
      toast("Identity Created Successfully", {
        description: `Welcome ${finalIdentity.name}! Your unique ID: ${finalIdentity.uniqueId}`
      });
      
      // Hide consent modal
      setShowEmailConsent(false);
      
      // Navigate to homepage
      navigate("/");
      
    } catch (error) {
      console.error("Failed to save identity:", error);
      toast("Save Failed", {
        description: "Unable to save identity. Please try again."
      });
    }
  };

  const handleRestoreComplete = () => {
    setShowRestore(false);
    toast("Identity Restored", {
      description: "Welcome back! Your spiritual journey continues."
    });
    navigate("/");
  };

  if (isMigrating) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-amber-400 text-lg mb-6">Upgrading your spiritual journey...</div>
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (showRestore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <IdentityRestore
          onRestoreComplete={handleRestoreComplete}
          onCancel={() => {
            setShowRestore(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
      {/* Email Backup Consent Modal */}
      {showEmailConsent && pendingIdentity && (
        <EmailBackupConsent
          userEmail={pendingIdentity.email}
          onConsent={handleEmailConsent}
          onSkip={() => handleEmailConsent(pendingIdentity.email, false)}
        />
      )}
      
      <h1 className="text-2xl font-bold text-amber-400 text-center mb-6">
        Welcome to Mantra Counter
      </h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "create" | "restore")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Identity</TabsTrigger>
          <TabsTrigger value="restore">Restore Identity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-400">
                Your Name / आपका नाम
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-amber-400">
                Date of Birth / जन्म तिथि
              </Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-400">
                Email Address / ईमेल पता
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            
            <SpiritualIconSelector 
              selectedIcon={selectedIcon}
              onSelectIcon={setSelectedIcon}
            />
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleCreateIdentity}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Create Your Spiritual Identity
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-gray-300 hover:bg-zinc-800"
            >
              Continue as Guest
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="restore" className="mt-6 space-y-4">
          <div className="text-center py-8">
            <Button
              onClick={() => setShowRestore(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Restore Your Identity
            </Button>
            <p className="text-sm text-gray-400 mt-2">
              Use your backup data to restore your spiritual journey
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 pt-4 border-t border-zinc-700">
        <p className="text-xs text-center text-gray-400">
          Your identity is stored securely and can be backed up to email/Google Drive
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
