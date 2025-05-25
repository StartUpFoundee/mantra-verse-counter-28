
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Hand, Infinity, Clock } from "lucide-react";
import { getCurrentUserIdentity } from "@/utils/portableIdentityUtils";
import ThemeToggle from "@/components/ThemeToggle";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileHeader from "@/components/ProfileHeader";
import WelcomePopup from "@/components/WelcomePopup";
import ActiveDaysButton from "@/components/ActiveDaysButton";
import { getLifetimeCount, getTodayCount } from "@/utils/indexedDBUtils";
import { toast } from "@/components/ui/sonner";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check if user has an identity
        const identity = getCurrentUserIdentity();
        
        if (identity) {
          setIsLoggedIn(true);
          setUserData(identity);
          
          // Load counts from IndexedDB
          const lifetime = await getLifetimeCount();
          const today = await getTodayCount();
          
          setLifetimeCount(lifetime);
          setTodayCount(today);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("There was an error loading your data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // If user is not logged in, show the welcome screen
  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white dark:bg-zinc-900">
          <div className="mb-4 text-amber-400 text-lg">Loading...</div>
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex flex-col bg-black text-white dark:bg-zinc-900">
        <header className="py-6 text-center relative">
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold text-amber-400">Mantra Counter</h1>
          <p className="text-gray-300 mt-2">Count your spiritual practice with ease</p>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <WelcomeScreen />
        </main>
        
        <footer className="py-4 text-center text-gray-400 text-sm">
          <p>Created with love for spiritual practice</p>
        </footer>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white dark:bg-zinc-900">
        <div className="mb-4 text-amber-400 text-lg">Loading your spiritual journey...</div>
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white dark:bg-zinc-900">
      {/* Add the WelcomePopup component */}
      <WelcomePopup />
      
      <header className="py-6 text-center relative">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ThemeToggle />
          <ProfileHeader />
        </div>
        <h1 className="text-3xl font-bold text-amber-400">Mantra Counter</h1>
        <p className="text-gray-300 mt-2">
          {userData ? `Namaste, ${userData.name} Ji` : 'Count your spiritual practice with ease'}
        </p>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 gap-8">
        <div className="stats w-full max-w-md flex gap-4 mb-4">
          <div className="stat flex-1 bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 text-center dark:bg-zinc-800 dark:border-zinc-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Infinity className="w-5 h-5 text-amber-400" />
              <h2 className="text-gray-300 font-medium">Lifetime Chants</h2>
            </div>
            <p className="text-3xl font-bold text-amber-400">{lifetimeCount}</p>
          </div>
          
          <div className="stat flex-1 bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 text-center dark:bg-zinc-800 dark:border-zinc-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-gray-300 font-medium">Today</h2>
            </div>
            <p className="text-3xl font-bold text-amber-400">{todayCount}</p>
          </div>
        </div>
        
        <div className="w-full max-w-md bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-8 dark:bg-zinc-800/30">
          <p className="text-center text-gray-400 text-sm">Advertisement</p>
          <p className="text-center text-gray-500 text-xs">Place your ad here</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
          <button 
            onClick={() => navigate('/manual')}
            className="bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 rounded-xl p-1"
          >
            <div className="bg-zinc-900 rounded-lg p-6 h-full dark:bg-zinc-800">
              <div className="flex justify-center mb-4">
                <Hand size={64} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-amber-400 mb-2 text-center">Manual</h2>
              <p className="text-gray-300 text-sm mb-1">Press by hand or press the earphone button or press volume up/down button</p>
              <p className="text-gray-400 text-xs italic">हाथ से दबाएं या ईयरफोन बटन या वॉल्यूम अप डाउन बटन दबाएं</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/audio')}
            className="bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 rounded-xl p-1"
          >
            <div className="bg-zinc-900 rounded-lg p-6 h-full dark:bg-zinc-800">
              <div className="flex justify-center mb-4">
                <Mic size={64} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-amber-400 mb-2 text-center">By Audio</h2>
              <p className="text-gray-300 text-sm mb-1">Chant mantra and take 1sec gap, counter will increase</p>
              <p className="text-gray-400 text-xs italic">मंत्र का जाप करें और 1 सेकंड का अंतराल रखें, काउंटर बढ़ेगा</p>
            </div>
          </button>
        </div>
      </main>
      
      {/* Active Days Floating Button */}
      <ActiveDaysButton />
      
      <footer className="py-4 text-center text-gray-400 text-sm">
        <p>Created with love for spiritual practice</p>
      </footer>
    </div>
  );
};

export default HomePage;
