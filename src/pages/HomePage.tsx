
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Hand, Infinity, Clock, Trophy } from "lucide-react";
import { getCurrentSimpleUserIdentity } from "@/utils/simpleIdentityUtils";
import ThemeToggle from "@/components/ThemeToggle";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileHeader from "@/components/ProfileHeader";
import WelcomePopup from "@/components/WelcomePopup";
import ActiveDaysButton from "@/components/ActiveDaysButton";
import { getLifetimeCount, getTodayCount } from "@/utils/indexedDBUtils";
import { getStreakData, recordTodaysActivity } from "@/utils/activeDaysUtils";
import { getAchievementsForProfile } from "@/utils/motivationUtils";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [streakInfo, setStreakInfo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const identity = getCurrentSimpleUserIdentity();
        
        if (identity) {
          setIsLoggedIn(true);
          setUserData(identity);
          
          const [lifetime, today, streakData] = await Promise.all([
            getLifetimeCount(),
            getTodayCount(),
            getStreakData()
          ]);
          
          setLifetimeCount(lifetime);
          setTodayCount(today);
          setStreakInfo(streakData);
          
          // Store today's activity if user has chanted today
          if (today > 0) {
            await recordTodaysActivity(0); // Just to ensure today is recorded
            console.log(`Recording today's activity: ${today} mantras`);
          }
          
          // Calculate achievements - only show for streaks 21+ days
          const userAchievements = getAchievementsForProfile({ currentStreak: streakData.currentStreak });
          setAchievements(userAchievements);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
          <div className="mb-4 text-amber-400 text-lg">Loading...</div>
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <header className="py-4 text-center relative">
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold text-amber-400">Mantra Counter</h1>
          <p className="text-gray-300 mt-2">Count your spiritual practice with divine blessings</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="mb-4 text-amber-400 text-lg">Loading your spiritual journey...</div>
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <WelcomePopup />
      
      <header className="py-4 text-center relative">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ThemeToggle />
          <ProfileHeader />
        </div>
        <h1 className="text-3xl font-bold text-amber-400">Mantra Counter</h1>
        <div className="mt-2">
          <p className="text-gray-300">
            {userData ? `Namaste, ${userData.name} Ji` : 'Count your spiritual practice with divine blessings'}
          </p>
          <p className="text-xs text-gray-400 mt-1">ID: {userData?.uniqueId}</p>
          <p className="text-xs text-gray-400">Email: {userData?.email}</p>
          {achievements.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Achievements:</span>
              {achievements.map((achievement, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-black px-3 py-1 rounded-full text-sm font-semibold shadow-lg"
                >
                  {achievement.icon} {achievement.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 gap-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          <div className="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Infinity className="w-5 h-5 text-amber-400" />
              <h2 className="text-gray-300 font-medium text-sm">Lifetime</h2>
            </div>
            <p className="text-2xl font-bold text-amber-400">{lifetimeCount}</p>
          </div>
          
          <div className="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-gray-300 font-medium text-sm">Today</h2>
            </div>
            <p className="text-2xl font-bold text-amber-400">{todayCount}</p>
          </div>
        </div>

        {/* Streak Information */}
        {streakInfo && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4 w-full max-w-lg">
            <h3 className="text-amber-400 font-medium mb-3 text-center">Streak Information</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-green-400">{streakInfo.currentStreak}</p>
                <p className="text-xs text-gray-400">Current Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-400">{streakInfo.maxStreak}</p>
                <p className="text-xs text-gray-400">Max Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-400">{streakInfo.totalActiveDays}</p>
                <p className="text-xs text-gray-400">Active Days</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mantra Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
          <button 
            onClick={() => navigate('/manual')}
            className="bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 rounded-xl p-1 transform hover:scale-105 transition-all"
          >
            <div className="bg-zinc-900 rounded-lg p-6 h-full">
              <div className="flex justify-center mb-4">
                <Hand size={64} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-amber-400 mb-2 text-center">Manual</h2>
              <p className="text-gray-300 text-sm mb-1">Press by hand or use volume buttons</p>
              <p className="text-gray-400 text-xs italic">हाथ से दबाएं या वॉल्यूम बटन का उपयोग करें</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/audio')}
            className="bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 rounded-xl p-1 transform hover:scale-105 transition-all"
          >
            <div className="bg-zinc-900 rounded-lg p-6 h-full">
              <div className="flex justify-center mb-4">
                <Mic size={64} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-amber-400 mb-2 text-center">By Audio</h2>
              <p className="text-gray-300 text-sm mb-1">Chant with 1 second gaps</p>
              <p className="text-gray-400 text-xs italic">1 सेकंड के अंतराल के साथ जप करें</p>
            </div>
          </button>
        </div>
      </main>
      
      <ActiveDaysButton />
      
      <footer className="py-4 text-center text-gray-400 text-sm">
        <p>Created with love for spiritual practice</p>
      </footer>
    </div>
  );
};

export default HomePage;
