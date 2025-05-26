
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import CompletionAlert from "@/components/CompletionAlert";
import TargetSelector from "@/components/TargetSelector";
import { Hand } from "lucide-react";
import { getLifetimeCount, getTodayCount, updateMantraCounts } from "@/utils/indexedDBUtils";

const ManualCounter: React.FC = () => {
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [showCompletionAlert, setShowCompletionAlert] = useState<boolean>(false);
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load saved counts from IndexedDB on component mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        setIsLoading(true);
        const lifetime = await getLifetimeCount();
        const today = await getTodayCount();
        
        setLifetimeCount(lifetime);
        setTodayCount(today);
      } catch (error) {
        console.error("Error loading counts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCounts();
  }, []);

  // Vibrate function
  const vibratePhone = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100); // Vibrate for 100ms
    }
  };

  // Listen for volume buttons, earphone buttons, and other keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Volume up/down, media buttons, space, plus/minus keys
      if (
        event.key === "AudioVolumeUp" || 
        event.key === "AudioVolumeDown" || 
        event.key === "MediaPlayPause" ||
        event.key === "MediaTrackNext" ||
        event.key === "MediaTrackPrevious" ||
        event.code === "KeyPlus" ||
        event.code === "KeyMinus" ||
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown"
      ) {
        if (targetCount !== null) {
          incrementCount();
          event.preventDefault();
        }
      }
    };

    // Also listen for hardware button events
    const handleVolumeButton = (event: Event) => {
      if (targetCount !== null) {
        incrementCount();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Listen for hardware volume button events
    document.addEventListener("volumeupbutton", handleVolumeButton, false);
    document.addEventListener("volumedownbutton", handleVolumeButton, false);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("volumeupbutton", handleVolumeButton, false);
      document.removeEventListener("volumedownbutton", handleVolumeButton, false);
    };
  }, [targetCount, currentCount]);

  const handleSelectTarget = (target: number) => {
    setTargetCount(target);
    setCurrentCount(0);
    setShowCompletionAlert(false);
  };

  const incrementCount = async () => {
    if (targetCount === null) return;
    
    const newCount = currentCount + 1;
    setCurrentCount(newCount);
    
    // Vibrate the phone
    vibratePhone();
    
    try {
      // Update counts in IndexedDB and get updated values
      const { lifetimeCount: newLifetime, todayCount: newToday } = await updateMantraCounts(1);
      setLifetimeCount(newLifetime);
      setTodayCount(newToday);
      
      // Show toast
      toast.success(`Mantra counted: ${newCount}`, {
        duration: 1000,
        style: { background: '#262626', color: '#fcd34d' },
      });
      
      // Check if target is reached
      if (newCount >= targetCount) {
        handleCompletion();
      }
    } catch (error) {
      console.error("Error updating counts:", error);
      toast.error("Failed to update count. Please try again.");
    }
  };
  
  const handleCompletion = () => {
    setShowCompletionAlert(true);
  };

  const resetCounter = () => {
    setCurrentCount(0);
    setShowCompletionAlert(false);
    toast.info("Counter reset", {
      style: { background: '#262626', color: '#fcd34d' }
    });
  };

  const handleReset = () => {
    resetCounter();
    setTargetCount(null);
  };

  const progressPercentage = targetCount ? (currentCount / targetCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 py-12">
        <div className="text-amber-400 text-lg mb-4">Loading your spiritual journey...</div>
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (targetCount === null) {
    return <TargetSelector onSelectTarget={handleSelectTarget} />;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4">
      <div className="mb-4 text-center w-full">
        <div className="text-amber-400 text-lg">{currentCount} / {targetCount}</div>
        <div className="text-sm text-gray-400">{Math.round(progressPercentage)}% complete</div>
      </div>
      
      <div className="stats w-full flex gap-4 mb-6">
        <div className="stat flex-1 bg-zinc-800/80 rounded-lg p-3 text-center">
          <h3 className="text-xs text-gray-400">Lifetime</h3>
          <p className="text-lg font-bold text-amber-400">{lifetimeCount}</p>
        </div>
        
        <div className="stat flex-1 bg-zinc-800/80 rounded-lg p-3 text-center">
          <h3 className="text-xs text-gray-400">Today</h3>
          <p className="text-lg font-bold text-amber-400">{todayCount}</p>
        </div>
      </div>
      
      {/* Advertisement placeholder */}
      <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
        <p className="text-center text-gray-400 text-sm">Advertisement</p>
        <p className="text-center text-gray-500 text-xs">Place your ad here</p>
      </div>
      
      <div className="counter-display relative mb-10">
        {/* Gold circle */}
        <div className="relative">
          <button 
            onClick={incrementCount}
            className="w-48 h-48 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            <div className="text-white text-5xl font-bold">
              <div className="text-3xl mb-2">ॐ</div>
              <div>{currentCount}</div>
            </div>
          </button>
        </div>
        
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
          <Hand className="w-7 h-7 text-amber-400" />
        </div>
      </div>
      
      <div className="text-center mb-5 text-sm text-gray-300">
        <p>Tap circle, volume buttons, or earphone button to count</p>
        <p className="text-xs text-gray-400 mt-1">सर्कल, वॉल्यूम बटन या ईयरफोन बटन दबाएं</p>
        <p className="text-xs text-green-400 mt-1">📳 Phone will vibrate on each count</p>
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700"
          onClick={resetCounter}
        >
          Reset Count
        </Button>
        <Button 
          variant="outline" 
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700"
          onClick={handleReset}
        >
          Change Target
        </Button>
      </div>

      <CompletionAlert 
        isOpen={showCompletionAlert} 
        targetCount={targetCount} 
        onClose={() => setShowCompletionAlert(false)} 
      />
    </div>
  );
};

export default ManualCounter;
