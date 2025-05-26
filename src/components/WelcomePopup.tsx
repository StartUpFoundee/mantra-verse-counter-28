
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const spiritualQuotes = [
  {
    english: "The goal of life is to make your heartbeat match the beat of the universe",
    hindi: "जीवन का लक्ष्य अपने हृदय की धड़कन को ब्रह्मांड की धड़कन से मिलाना है"
  },
  {
    english: "Through mantra chanting, the mind becomes purified and the soul enlightened",
    hindi: "मंत्र जाप से मन शुद्ध होता है और आत्मा प्रकाशित होती है"
  },
  {
    english: "Each chant is a step closer to divine consciousness",
    hindi: "हर जप दिव्य चेतना के करीब एक कदम है"
  },
  {
    english: "In the silence between mantras, God speaks to your soul",
    hindi: "मंत्रों के बीच की शांति में, भगवान आपकी आत्मा से बात करते हैं"
  },
  {
    english: "Regular practice transforms the ordinary into the sacred",
    hindi: "नियमित अभ्यास सामान्य को पवित्र में बदल देता है"
  }
];

const WelcomePopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(spiritualQuotes[0]);

  useEffect(() => {
    // Only show popup on page refresh/initial load, not on navigation
    const hasShownWelcome = sessionStorage.getItem('welcomeShown');
    const isPageRefresh = performance.navigation.type === performance.navigation.TYPE_RELOAD || 
                          !sessionStorage.getItem('hasNavigated');
    
    if (!hasShownWelcome && isPageRefresh) {
      // Select a random quote
      const randomQuote = spiritualQuotes[Math.floor(Math.random() * spiritualQuotes.length)];
      setCurrentQuote(randomQuote);
      
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-amber-500/30 rounded-xl p-6 max-w-md w-full relative shadow-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-300 hover:bg-zinc-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="text-center pt-2">
          <div className="text-5xl mb-4">🕉️</div>
          <h2 className="text-xl font-bold text-amber-400 mb-3">
            Welcome to Mantra Counter
          </h2>
          <h3 className="text-lg text-amber-300 mb-4">
            मंत्र काउंटर में आपका स्वागत है
          </h3>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <h4 className="text-amber-400 font-medium mb-2">Today's Spiritual Wisdom</h4>
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              "{currentQuote.english}"
            </p>
            <p className="text-amber-200 text-sm leading-relaxed italic">
              "{currentQuote.hindi}"
            </p>
          </div>
          
          <p className="text-gray-300 mb-6 text-sm">
            Begin your spiritual journey with divine mantras, track your progress, and achieve spiritual milestones with our automated backup system.
          </p>
          
          <Button
            onClick={handleClose}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-8 py-3"
          >
            🚀 Start Your Journey / यात्रा शुरू करें
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
