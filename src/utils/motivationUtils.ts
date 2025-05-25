
export interface MotivationLevel {
  min: number;
  max: number;
  color: string;
  name: string;
  description: string;
}

export const MOTIVATION_LEVELS: MotivationLevel[] = [
  {
    min: 1,
    max: 107,
    color: "bg-green-200 dark:bg-green-900/30",
    name: "Starting Journey",
    description: "चंत हुई शुरुआत - Journey Begun"
  },
  {
    min: 108,
    max: 507,
    color: "bg-green-300 dark:bg-green-800/50", 
    name: "Good Progress",
    description: "अच्छी प्रगति - Good Progress"
  },
  {
    min: 508,
    max: 1007,
    color: "bg-green-400 dark:bg-green-700/70",
    name: "Excellent Practice",
    description: "उत्कृष्ट अभ्यास - Excellent Practice"
  },
  {
    min: 1008,
    max: Infinity,
    color: "bg-green-500 dark:bg-green-600",
    name: "Master Level",
    description: "गुरु स्तर - Master Level"
  }
];

export const getMotivationLevel = (count: number): MotivationLevel => {
  return MOTIVATION_LEVELS.find(level => count >= level.min && count <= level.max) || MOTIVATION_LEVELS[0];
};

export const calculateAchievements = (streakData: any): string[] => {
  const achievements = [];
  
  if (streakData.currentStreak >= 5) {
    achievements.push("🔥 5-Day Warrior");
  }
  
  if (streakData.currentStreak >= 21) {
    achievements.push("🏆 21-Day Champion");
  }
  
  if (streakData.currentStreak >= 50) {
    achievements.push("💎 50-Day Diamond");
  }
  
  if (streakData.currentStreak >= 108) {
    achievements.push("🕉️ 108-Day Master");
  }
  
  return achievements;
};
