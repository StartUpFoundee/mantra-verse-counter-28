
import { getTodayCount, getLifetimeCount } from './indexedDBUtils';

export interface ActivityData {
  [date: string]: number;
}

export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
}

/**
 * Get activity data from IndexedDB for the calendar display
 */
export const getActivityData = async (): Promise<ActivityData> => {
  try {
    // Get today's count from IndexedDB
    const todayCount = await getTodayCount();
    const today = new Date().toISOString().split('T')[0];
    
    // For now, we'll just show today's data
    // In a full implementation, you'd store historical data
    const activityData: ActivityData = {};
    
    if (todayCount > 0) {
      activityData[today] = todayCount;
    }
    
    // Get any existing historical data from localStorage as fallback
    const existingData = localStorage.getItem('activeDays');
    if (existingData) {
      try {
        const historicalData = JSON.parse(existingData);
        // Merge historical data but prioritize today's IndexedDB data
        for (const day of historicalData) {
          if (day.date !== today) {
            activityData[day.date] = day.mantraCount || 0;
          }
        }
      } catch (error) {
        console.error('Error parsing historical activity data:', error);
      }
    }
    
    return activityData;
  } catch (error) {
    console.error('Error getting activity data:', error);
    return {};
  }
};

/**
 * Get streak data based on activity
 */
export const getStreakData = async (): Promise<StreakData> => {
  try {
    const activityData = await getActivityData();
    const dates = Object.keys(activityData).filter(date => activityData[date] > 0).sort();
    
    let currentStreak = 0;
    let maxStreak = 0;
    let totalActiveDays = dates.length;
    
    if (dates.length === 0) {
      return { currentStreak: 0, maxStreak: 0, totalActiveDays: 0 };
    }
    
    // Calculate current streak (working backwards from today)
    const today = new Date();
    let currentDate = new Date(today);
    
    while (currentDate >= new Date(dates[0])) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (activityData[dateStr] && activityData[dateStr] > 0) {
        currentStreak++;
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Calculate max streak
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    for (const dateStr of dates) {
      const currentDateObj = new Date(dateStr);
      
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((currentDateObj.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = currentDateObj;
    }
    
    maxStreak = Math.max(maxStreak, tempStreak);
    
    return {
      currentStreak,
      maxStreak,
      totalActiveDays
    };
  } catch (error) {
    console.error('Error calculating streak data:', error);
    return { currentStreak: 0, maxStreak: 0, totalActiveDays: 0 };
  }
};
