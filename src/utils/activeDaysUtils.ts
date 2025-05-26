
import { getChantsByDate, getTodayCount, getLifetimeCount } from './indexedDBUtils';

export interface ActiveDayData {
  date: string;
  count: number;
  level: 'none' | 'light' | 'medium' | 'strong';
  intensity: number; // 0-100
}

export interface StreakInfo {
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
}

/**
 * Determines the motivation level based on chant count
 */
export const getMotivationLevel = (count: number): { level: string; intensity: number; color: string } => {
  if (count === 0) {
    return { level: 'none', intensity: 0, color: 'bg-gray-200 dark:bg-gray-800' };
  } else if (count < 54) {
    return { level: 'light', intensity: 25, color: 'bg-green-200 dark:bg-green-900' };
  } else if (count < 108) {
    return { level: 'medium-light', intensity: 40, color: 'bg-green-300 dark:bg-green-800' };
  } else if (count < 324) {
    return { level: 'medium', intensity: 60, color: 'bg-green-400 dark:bg-green-700' };
  } else if (count < 540) {
    return { level: 'medium-strong', intensity: 80, color: 'bg-green-500 dark:bg-green-600' };
  } else if (count < 1008) {
    return { level: 'strong', intensity: 90, color: 'bg-green-600 dark:bg-green-500' };
  } else {
    return { level: 'strongest', intensity: 100, color: 'bg-green-700 dark:bg-green-400' };
  }
};

/**
 * Gets active days data for calendar visualization
 */
export const getActiveDaysData = async (year: number, month: number): Promise<ActiveDayData[]> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const activeDays: ActiveDayData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const chants = await getChantsByDate(date);
    const count = chants.reduce((sum, chant) => sum + chant.count, 0);
    
    // For today, also check the current today count
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const todayCount = await getTodayCount();
      const totalCount = Math.max(count, todayCount);
      const motivation = getMotivationLevel(totalCount);
      
      activeDays.push({
        date,
        count: totalCount,
        level: motivation.level as any,
        intensity: motivation.intensity
      });
    } else {
      const motivation = getMotivationLevel(count);
      
      activeDays.push({
        date,
        count,
        level: motivation.level as any,
        intensity: motivation.intensity
      });
    }
  }

  return activeDays;
};

/**
 * Calculates streak information
 */
export const calculateStreakInfo = async (): Promise<StreakInfo> => {
  let currentStreak = 0;
  let maxStreak = 0;
  let totalActiveDays = 0;
  let tempStreak = 0;
  let streakBroken = false;

  // Check last 365 days for comprehensive streak calculation
  const today = new Date();
  const oneYearAgo = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000));

  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    let count = 0;
    
    // For today, get the current count
    if (dateStr === todayStr) {
      count = await getTodayCount();
    } else {
      // For other days, get from stored activity data
      const chants = await getChantsByDate(dateStr);
      count = chants.reduce((sum, chant) => sum + chant.count, 0);
    }

    if (count > 0) {
      tempStreak++;
      totalActiveDays++;
      
      // Only count towards current streak if we haven't broken it yet
      if (!streakBroken) {
        currentStreak = tempStreak;
      }
    } else {
      // Update max streak if current temp streak is higher
      maxStreak = Math.max(maxStreak, tempStreak);
      
      // If this is today or a recent day, mark streak as broken
      const daysDiff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
      if (daysDiff <= 1) {
        streakBroken = true;
        if (daysDiff === 0) {
          currentStreak = 0; // No activity today breaks the streak
        }
      }
      
      tempStreak = 0;
    }
  }

  // Final check for max streak
  maxStreak = Math.max(maxStreak, tempStreak);

  return {
    currentStreak,
    maxStreak,
    totalActiveDays
  };
};

/**
 * Gets motivation instructions for users
 */
export const getMotivationInstructions = () => {
  return [
    {
      range: "1-53 mantras",
      color: "Light Green",
      description: "Getting Started / शुरुआत",
      hindi: "हल्का हरा - शुरुआत"
    },
    {
      range: "54-107 mantras", 
      color: "Medium Green",
      description: "Building Habit / आदत बनाना",
      hindi: "मध्यम हरा - आदत निर्माण"
    },
    {
      range: "108-323 mantras",
      color: "Strong Green", 
      description: "Sacred Count / पवित्र संख्या",
      hindi: "गहरा हरा - पवित्र गिनती"
    },
    {
      range: "324-539 mantras",
      color: "Deep Green",
      description: "Deepening Practice / गहरी साधना", 
      hindi: "अधिक गहरा हरा - गहरी साधना"
    },
    {
      range: "540-1007 mantras",
      color: "Very Deep Green",
      description: "Advanced Practice / उन्नत साधना",
      hindi: "बहुत गहरा हरा - उन्नत साधना"
    },
    {
      range: "1008+ mantras",
      color: "Brightest Green",
      description: "Divine Connection / दिव्य संपर्क", 
      hindi: "सबसे चमकीला हरा - दिव्य संपर्क"
    }
  ];
};
