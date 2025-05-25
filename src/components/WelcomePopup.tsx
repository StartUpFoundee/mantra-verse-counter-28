
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const WelcomePopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show popup on page refresh/initial load, not on navigation
    const hasShownWelcome = sessionStorage.getItem('welcomeShown');
    const isPageRefresh = performance.navigation.type === performance.navigation.TYPE_RELOAD || 
                          !sessionStorage.getItem('hasNavigated');
    
    if (!hasShownWelcome && isPageRefresh) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Mark that user has navigated within the session
    sessionStorage.setItem('hasNavigated', 'true');
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('welcomeShown', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 max-w-md w-full relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="text-4xl mb-4">🕉️</div>
          <h2 className="text-xl font-bold text-amber-400 mb-2">
            Welcome to Mantra Counter
          </h2>
          <p className="text-gray-300 mb-4">
            Begin your spiritual journey with us. Track your mantras, maintain streaks, and achieve spiritual milestones.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            मंत्र काउंटर में आपका स्वागत है। अपनी आध्यात्मिक यात्रा शुरू करें।
          </p>
          
          <Button
            onClick={handleClose}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Start Your Journey / यात्रा शुरू करें
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
