
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Flame, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivityData, getStreakData } from "@/utils/activityUtils";
import { getMotivationLevel, MOTIVATION_LEVELS } from "@/utils/motivationUtils";

interface ActivityData {
  [date: string]: number;
}

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
}

const ActiveDaysPage: React.FC = () => {
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    totalActiveDays: 0
  });
  const [hoveredDay, setHoveredDay] = useState<{date: string, count: number} | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      const activity = await getActivityData();
      const streaks = await getStreakData();
      setActivityData(activity);
      setStreakData(streaks);
    };
    loadData();
  }, []);

  const getActivityColor = (count: number): string => {
    if (count === 0) return "bg-gray-200 dark:bg-gray-800";
    const level = getMotivationLevel(count);
    return level.color;
  };

  const generateCalendarData = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= today) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const count = activityData[dateStr] || 0;
      const isToday = dateStr === today.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        count,
        isToday,
        dayOfWeek: currentDay.getDay(),
        month: currentDay.getMonth(),
        dayOfMonth: currentDay.getDate(),
        displayDate: new Date(currentDay)
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="min-h-screen bg-black text-white dark:bg-zinc-900 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-3xl lg:text-4xl font-bold text-amber-400">Active Days</h1>
        <div className="w-24"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
        <Card className="bg-zinc-800/50 border-amber-600/20 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-amber-400 text-xl">
              <Flame className="w-6 h-6" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">{streakData.currentStreak}</div>
            <p className="text-gray-400">days in a row</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-amber-600/20 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-amber-400 text-xl">
              <TrendingUp className="w-6 h-6" />
              Max Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">{streakData.maxStreak}</div>
            <p className="text-gray-400">personal best</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-amber-600/20 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-amber-400 text-xl">
              <Target className="w-6 h-6" />
              Total Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">{streakData.totalActiveDays}</div>
            <p className="text-gray-400">lifetime practice</p>
          </CardContent>
        </Card>
      </div>

      {/* Motivation Guide */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className="bg-zinc-800/50 border-amber-600/20 text-white">
          <CardHeader>
            <CardTitle className="text-amber-400 text-xl">Motivation Guide / प्रेरणा गाइड</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MOTIVATION_LEVELS.map((level, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg">
                  <div className={`w-6 h-6 rounded ${level.color}`}></div>
                  <div>
                    <div className="font-medium text-amber-400">{level.min === 1008 ? "1008+" : `${level.min}-${level.max}`}</div>
                    <div className="text-sm text-gray-300">{level.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-zinc-800/50 border-amber-600/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-400 text-2xl">
              <Calendar className="w-6 h-6" />
              Activity Calendar
            </CardTitle>
            <p className="text-gray-400">Your spiritual practice journey over the past year</p>
          </CardHeader>
          <CardContent className="p-8">
            {/* Weekday Labels */}
            <div className="flex gap-2 mb-4 ml-16">
              {weekdays.map((day) => (
                <div key={day} className="w-4 h-4 text-sm text-gray-400 flex items-center justify-center">
                  {day[0]}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex gap-2 overflow-x-auto pb-6">
              {Array.from({ length: 53 }, (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-2">
                  {weekIndex === 0 || (calendarDays[weekIndex * 7] && calendarDays[weekIndex * 7].displayDate.getDate() <= 7) ? (
                    <div className="h-6 text-sm text-gray-400 mb-2 min-w-[60px]">
                      {calendarDays[weekIndex * 7] && months[calendarDays[weekIndex * 7].month]}
                    </div>
                  ) : (
                    <div className="h-6 mb-2"></div>
                  )}
                  
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = calendarDays[weekIndex * 7 + dayIndex];
                    if (!dayData) return <div key={dayIndex} className="w-4 h-4"></div>;
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-amber-400 relative group ${
                          getActivityColor(dayData.count)
                        } ${dayData.isToday ? 'ring-2 ring-amber-500' : ''} flex items-center justify-center`}
                        onMouseEnter={(e) => {
                          setHoveredDay({ date: dayData.date, count: dayData.count });
                          handleMouseMove(e);
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <span className="text-[8px] font-bold text-gray-700 group-hover:text-white transition-colors">
                          {dayData.dayOfMonth}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-zinc-900 border border-amber-600/30 rounded-lg px-4 py-3 text-sm pointer-events-none shadow-xl"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 50,
          }}
        >
          <div className="text-white font-medium mb-1">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-amber-400">
            {hoveredDay.count} jaaps completed
          </div>
          {hoveredDay.count > 0 && (
            <div className="text-green-400 text-xs">
              {getMotivationLevel(hoveredDay.count).description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveDaysPage;
