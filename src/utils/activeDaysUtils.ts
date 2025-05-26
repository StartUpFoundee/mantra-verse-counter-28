
import { getTodayCount, getLifetimeCount, updateMantraCounts } from './indexedDBUtils';
import { getCurrentSimpleUserIdentity } from './simpleIdentityUtils';

export interface ActiveDayData {
  date: string;
  count: number;
  level: 'none' | 'light' | 'medium' | 'strong';
  intensity: number;
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
 * Store today's activity - Updated to sync with main counting system
 */
export const recordTodaysActivity = async (additionalCount: number = 0): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const user = getCurrentSimpleUserIdentity();
  
  if (!user) return;
  
  // Get the actual today count from the main system
  const currentTodayCount = await getTodayCount();
  const totalCount = currentTodayCount;
  
  // Store in localStorage with user-specific key
  const activityKey = `mantra_activity_${user.uniqueId}_${today}`;
  localStorage.setItem(activityKey, JSON.stringify({
    date: today,
    count: totalCount,
    timestamp: Date.now(),
    userId: user.uniqueId
  }));
  
  console.log(`Recorded activity for ${today}: ${totalCount} mantras`);
};

/**
 * Gets activity data for the calendar - Updated to use main counting data
 */
export const getActivityData = async (): Promise<{[date: string]: number}> => {
  const activityData: {[date: string]: number} = {};
  const user = getCurrentSimpleUserIdentity();
  
  if (!user) return activityData;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Always get today's count from the main system
  const todayCount = await getTodayCount();
  if (todayCount > 0) {
    activityData[today] = todayCount;
    // Ensure it's stored for persistence
    await recordTodaysActivity(0);
  }
  
  // Get all stored activity data from localStorage for this user
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`mantra_activity_${user.uniqueId}_`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.date && data.count !== undefined && data.userId === user.uniqueId) {
          // Don't override today's count with stored data if main system has newer data
          if (data.date !== today || todayCount === 0) {
            activityData[data.date] = data.count;
          }
        }
      } catch (error) {
        console.error('Error parsing activity data:', error);
      }
    }
  }
  
  console.log('Activity data loaded:', activityData);
  return activityData;
};

/**
 * Gets streak data
 */
export const getStreakData = async (): Promise<StreakInfo> => {
  const activityData = await getActivityData();
  const today = new Date();
  const dates = Object.keys(activityData).sort();
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let totalActiveDays = 0;
  
  // Count total active days
  totalActiveDays = Object.values(activityData).filter(count => count > 0).length;
  
  // Calculate streaks
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const count = activityData[dateStr] || 0;
    
    if (count > 0) {
      tempStreak++;
      if (i === 0) {
        // If today has activity, start current streak
        currentStreak = tempStreak;
      } else if (tempStreak === i + 1) {
        // Consecutive days from today
        currentStreak = tempStreak;
      }
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      if (i === 0) {
        // If no activity today, current streak is 0
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }
  
  maxStreak = Math.max(maxStreak, tempStreak);
  maxStreak = Math.max(maxStreak, currentStreak);
  
  return {
    currentStreak,
    maxStreak,
    totalActiveDays
  };
};
