
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import IdentityManager from "@/components/IdentityManager";
import { CryptoIdentity } from "@/utils/crypto-identity";

const SpiritualIdPage: React.FC = () => {
  const navigate = useNavigate();

  const handleIdentitySelected = (identity: CryptoIdentity) => {
    // Redirect to home after identity selection
    navigate("/", { replace: true });
  };

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
        <h1 className="text-xl font-bold text-amber-400">Identity Management</h1>
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
        <IdentityManager onIdentitySelected={handleIdentitySelected} />
      </main>
    </div>
  );
};

export default SpiritualIdPage;
