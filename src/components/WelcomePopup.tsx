
import React, { useState, useEffect } from "react";
import { getCurrentUserIdentity } from "@/utils/portableIdentityUtils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getRandomDefaultQuote } from "@/utils/spiritualQuotesService";

const WelcomePopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState(getRandomDefaultQuote());
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Load user data
    const identity = getCurrentUserIdentity();
    setUserData(identity);
    
    if (identity) {
      // Check if this is a genuine page refresh (not navigation)
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
      
      // Only show popup on actual page refresh, not on navigation
      if (isRefresh) {
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('welcomePopupLastShown');
        
        // Show popup if not shown today
        if (lastShownDate !== today) {
          setIsOpen(true);
          localStorage.setItem('welcomePopupLastShown', today);
        }
      }
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!userData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-zinc-900 border-amber-600/30 text-white max-w-md mx-auto">        
        <DialogHeader>
          <div className="flex justify-end">
            <button 
              className="rounded-full p-1.5 text-gray-400 hover:bg-amber-500/20 hover:text-amber-400"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500/30 mb-4">
              <span className="text-4xl">{userData.symbolImage || "🕉️"}</span>
            </div>
            <DialogTitle className="text-2xl font-bold text-amber-400">
              Namaste, {userData.name} Ji
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-2">
          <div className="bg-zinc-800/70 rounded-lg p-4 border border-amber-600/20">
            <p className="text-lg text-amber-300 italic text-center mb-2">"{quote.english}"</p>
            <p className="text-sm text-amber-200/70 text-center">"{quote.hindi}"</p>
          </div>
          
          <p className="text-center text-gray-400 text-sm">
            May your spiritual journey be filled with divine blessings today.
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <Button
            onClick={handleClose}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2"
          >
            Begin Practice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
