
import { getTodayCount, getLifetimeCount, storeDailyActivity } from './indexedDBUtils';

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
 * Store today's activity when user chants
 */
export const recordTodaysActivity = async (additionalCount: number = 0): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const currentTodayCount = await getTodayCount();
  const totalCount = currentTodayCount + additionalCount;
  
  // Store in localStorage for the active days calendar
  const activityKey = `mantra_activity_${today}`;
  localStorage.setItem(activityKey, JSON.stringify({
    date: today,
    count: totalCount,
    timestamp: Date.now()
  }));
  
  // Also store in IndexedDB for consistency
  await storeDailyActivity(today, totalCount);
};

/**
 * Gets activity data for the calendar
 */
export const getActivityData = async (): Promise<{[date: string]: number}> => {
  const activityData: {[date: string]: number} = {};
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's count from IndexedDB
  const todayCount = await getTodayCount();
  if (todayCount > 0) {
    activityData[today] = todayCount;
    // Also ensure it's stored for the calendar
    await recordTodaysActivity(0);
  }
  
  // Get all stored activity data from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mantra_activity_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.date && data.count !== undefined) {
          activityData[data.date] = data.count;
        }
      } catch (error) {
        console.error('Error parsing activity data:', error);
      }
    }
  }
  
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
