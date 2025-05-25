
/**
 * Motivation and achievement system
 */

export interface MotivationLevel {
  min: number;
  max: number;
  color: string;
  description: string;
  intensity: string;
}

export const MOTIVATION_LEVELS: MotivationLevel[] = [
  {
    min: 1,
    max: 53,
    color: "bg-green-200 dark:bg-green-900",
    description: "Getting Started / शुरुआत",
    intensity: "light"
  },
  {
    min: 54,
    max: 107,
    color: "bg-green-300 dark:bg-green-800",
    description: "Building Habit / आदत बनाना",
    intensity: "medium-light"
  },
  {
    min: 108,
    max: 323,
    color: "bg-green-400 dark:bg-green-700",
    description: "Sacred Count / पवित्र संख्या",
    intensity: "medium"
  },
  {
    min: 324,
    max: 539,
    color: "bg-green-500 dark:bg-green-600",
    description: "Deepening Practice / गहरी साधना",
    intensity: "medium-strong"
  },
  {
    min: 540,
    max: 1007,
    color: "bg-green-600 dark:bg-green-500",
    description: "Advanced Practice / उन्नत साधना",
    intensity: "strong"
  },
  {
    min: 1008,
    max: Infinity,
    color: "bg-green-700 dark:bg-green-400",
    description: "Divine Connection / दिव्य संपर्क",
    intensity: "strongest"
  }
];

export const getMotivationLevel = (count: number): MotivationLevel => {
  // Handle zero count separately
  if (count === 0) {
    return {
      min: 0,
      max: 0,
      color: "bg-gray-200 dark:bg-gray-800",
      description: "No Practice",
      intensity: "none"
    };
  }

  // Find the appropriate level for the count
  for (const level of MOTIVATION_LEVELS) {
    if (count >= level.min && count <= level.max) {
      return level;
    }
  }
  
  // Fallback to highest level
  return MOTIVATION_LEVELS[MOTIVATION_LEVELS.length - 1];
};

export interface Achievement {
  id: string;
  name: string;
  nameHindi: string;
  icon: string;
  description: string;
  color: string;
  streakRequired: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "dedicated_5",
    name: "Dedicated Devotee",
    nameHindi: "समर्पित भक्त",
    icon: "🏆",
    description: "5 days continuous practice",
    color: "bg-bronze-500",
    streakRequired: 5
  },
  {
    id: "spiritual_warrior_21",
    name: "Spiritual Warrior",
    nameHindi: "आध्यात्मिक योद्धा",
    icon: "🥇",
    description: "21 days continuous practice",
    color: "bg-gold-500",
    streakRequired: 21
  },
  {
    id: "divine_practitioner_51",
    name: "Divine Practitioner",
    nameHindi: "दिव्य साधक",
    icon: "💎",
    description: "51 days continuous practice",
    color: "bg-diamond-500",
    streakRequired: 51
  },
  {
    id: "enlightened_master_108",
    name: "Enlightened Master",
    nameHindi: "प्रबुद्ध गुरु",
    icon: "👑",
    description: "108 days continuous practice",
    color: "bg-royal-500",
    streakRequired: 108
  }
];

export const calculateAchievements = (streakData: any): string[] => {
  const { currentStreak } = streakData;
  const achievements: string[] = [];
  
  // Only show achievements for streaks of 21 days or more as requested
  const eligibleAchievements = ACHIEVEMENTS.filter(achievement => 
    currentStreak >= achievement.streakRequired && achievement.streakRequired >= 21
  );
  
  return eligibleAchievements.map(achievement => 
    `${achievement.icon} ${achievement.name}`
  );
};

/**
 * Gets achievements for display on profile
 */
export const getAchievementsForProfile = (streakData: any): Achievement[] => {
  const { currentStreak } = streakData;
  
  return ACHIEVEMENTS.filter(achievement => 
    currentStreak >= achievement.streakRequired && achievement.streakRequired >= 5
  );
};
