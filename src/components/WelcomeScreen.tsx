
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IdentityRestore from "./IdentityRestore";
import SimpleIdentityCreator from "./SimpleIdentityCreator";
import { toast } from "@/components/ui/sonner";
import { initializeDatabase, migrateFromLocalStorage } from "@/utils/indexedDBUtils";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<"create" | "restore">("create");
  const [showRestore, setShowRestore] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsMigrating(true);
      
      await initializeDatabase();
      const migrationSuccess = await migrateFromLocalStorage();
      
      if (migrationSuccess) {
        console.log("Data migration successful");
      }
      
      const params = new URLSearchParams(location.search);
      if (params.get('restore') === 'true') {
        setShowRestore(true);
      }
      
      setIsMigrating(false);
    };
    
    init();
  }, [location]);

  const handleIdentityCreated = () => {
    toast("Welcome to Your Spiritual Journey", {
      description: "Your identity has been created successfully!"
    });
    navigate("/");
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
          <div className="text-amber-400 text-lg mb-6">Preparing your spiritual space...</div>
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
          onCancel={() => setShowRestore(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🕉️</div>
        <h1 className="text-2xl font-bold text-amber-400 mb-2">
          Welcome to Mantra Counter
        </h1>
        <p className="text-gray-300 text-sm mb-1">
          Begin your spiritual journey with divine blessings
        </p>
        <p className="text-amber-300 text-xs">
          मंत्र काउंटर में आपका स्वागत है - दिव्य आशीर्वाद के साथ
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "create" | "restore")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="create">Create Identity</TabsTrigger>
          <TabsTrigger value="restore">Restore Identity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-0">
          <SimpleIdentityCreator onIdentityCreated={handleIdentityCreated} />
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
      
      <div className="mt-6 pt-4 border-t border-zinc-700 text-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-gray-300 hover:bg-zinc-800 mb-2"
        >
          Continue as Guest / अतिथि के रूप में जारी रखें
        </Button>
        <p className="text-xs text-gray-400">
          Your data is stored securely with automatic backup options
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
