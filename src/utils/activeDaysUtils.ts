import { getTodayCount } from './indexedDBUtils';

export interface DayStatus {
  date: string;
  hasActivity: boolean;
  mantraCount: number;
}

export interface StreakInfo {
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
}

/**
 * Records today's activity with the given mantra count.
 * @param mantraCount The number of mantras chanted today.
 */
export const recordTodaysActivity = async (mantraCount: number): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  let existingData = localStorage.getItem('activeDays');
  let activeDays: DayStatus[] = existingData ? JSON.parse(existingData) : [];

  // Check if today's activity already exists
  const todayIndex = activeDays.findIndex(day => day.date === today);

  if (todayIndex !== -1) {
    // Update existing activity
    activeDays[todayIndex] = { date: today, hasActivity: true, mantraCount };
  } else {
    // Add new activity
    activeDays.push({ date: today, hasActivity: true, mantraCount });
  }

  localStorage.setItem('activeDays', JSON.stringify(activeDays));
};

/**
 * Retrieves the activity status for a specific date.
 * @param date The date to check (YYYY-MM-DD).
 * @returns An object containing the date, activity status, and mantra count, or null if not found.
 */
export const getActivityForDate = (date: string): DayStatus | null => {
  const existingData = localStorage.getItem('activeDays');
  if (!existingData) return null;

  const activeDays: DayStatus[] = JSON.parse(existingData);
  const day = activeDays.find(day => day.date === date);
  return day || null;
};

/**
 * Retrieves all recorded active days.
 * @returns An array of DayStatus objects.
 */
export const getAllActiveDays = (): DayStatus[] => {
  const existingData = localStorage.getItem('activeDays');
  return existingData ? JSON.parse(existingData) : [];
};

/**
 * Calculates streak data including current streak, max streak, and total active days.
 * @returns An object containing streak information.
 */
export const getStreakData = async (): Promise<StreakInfo> => {
  const activeDays = getAllActiveDays();
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  let currentStreak = 0;
  let maxStreak = 0;
  let totalActiveDays = 0;
  let tempStreak = 0;
  let currentDate = today;

  // Sort active days by date
  activeDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (let i = activeDays.length - 1; i >= 0; i--) {
    const day = activeDays[i];
    totalActiveDays++;

    const dayDate = new Date(day.date);
    const diffTime = Math.abs(currentDate.getTime() - dayDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      tempStreak++;
      currentDate = dayDate;
    } else {
      break;
    }
  }

  currentStreak = tempStreak;

  // Calculate max streak
  let tempMaxStreak = 0;
  for (let i = 0; i < activeDays.length; i++) {
    tempMaxStreak++;
    if (i + 1 < activeDays.length) {
      const day1Date = new Date(activeDays[i].date);
      const day2Date = new Date(activeDays[i + 1].date);
      const diffTime = Math.abs(day2Date.getTime() - day1Date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        maxStreak = Math.max(maxStreak, tempMaxStreak);
        tempMaxStreak = 0;
      }
    }
  }
  maxStreak = Math.max(maxStreak, tempMaxStreak);

  return {
    currentStreak,
    maxStreak,
    totalActiveDays
  };
};

/**
 * Refreshes today's activity by recounting mantras and updating the activity record.
 */
export const refreshTodaysActivity = async (): Promise<void> => {
  const todayCount = await getTodayCount();
  await recordTodaysActivity(todayCount);
};
