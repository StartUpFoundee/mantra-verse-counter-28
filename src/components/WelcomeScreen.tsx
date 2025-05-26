
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SimpleIdentityCreator from "./SimpleIdentityCreator";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const handleIdentityCreated = () => {
    // Navigate to home page after identity creation
    navigate("/", { replace: true });
    window.location.reload(); // Force reload to update the app state
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="text-8xl mb-6">🕉️</div>
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4">
          Welcome to Mantra Counter
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Begin your spiritual journey with guided chanting
        </p>
        <p className="text-lg text-amber-300">
          मंत्र जप के साथ अपनी आध्यात्मिक यात्रा शुरू करें
        </p>
      </div>

      <SimpleIdentityCreator onIdentityCreated={handleIdentityCreated} />
      
      <div className="text-center space-y-2 max-w-md">
        <p className="text-sm text-gray-400">
          ✨ Count your mantras manually or with voice detection
        </p>
        <p className="text-sm text-gray-400">
          📊 Track your daily progress and streaks
        </p>
        <p className="text-sm text-gray-400">
          🏆 Earn achievements for consistent practice
        </p>
        <p className="text-xs text-amber-300 mt-4">
          हाथ से या आवाज़ से मंत्र गिनें, प्रगति देखें, और उपलब्धियां पाएं
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
