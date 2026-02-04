import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface PracticeDay {
  date: string;
  lessonsCompleted: number;
  totalMinutes: number;
}

interface PracticeCalendarProps {
  practiceDays: PracticeDay[];
  className?: string;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export function PracticeCalendar({ practiceDays, className }: PracticeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const practiceMap = useMemo(() => {
    const map = new Map<string, PracticeDay>();
    practiceDays.forEach(day => map.set(day.date, day));
    return map;
  }, [practiceDays]);

  const { calendarDays, streak } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (practiceMap.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return { calendarDays: days, streak: currentStreak };
  }, [currentDate, practiceMap]);

  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Календарь практик
            {streak > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm font-normal bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
              >
                <Flame className="h-4 w-4" />
                {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}
              </motion.span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate.toISOString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = date.toISOString().split("T")[0];
              const practice = practiceMap.get(dateStr);
              const isToday = date.getTime() === today.getTime();
              const isFuture = date > today;
              const hasPractice = !!practice;

              return (
                <motion.div
                  key={dateStr}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm relative transition-all",
                    isToday && "ring-2 ring-primary ring-offset-2",
                    isFuture && "text-muted-foreground/50",
                    hasPractice && "bg-gradient-to-br from-green-400 to-emerald-500 text-white font-medium shadow-sm",
                    !hasPractice && !isFuture && "hover:bg-muted cursor-default"
                  )}
                  title={practice ? `${practice.lessonsCompleted} уроков, ${practice.totalMinutes} мин` : undefined}
                >
                  {date.getDate()}
                  {hasPractice && practice.lessonsCompleted >= 3 && (
                    <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-green-400 to-emerald-500" />
            <span>Практика</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>3+ уроков</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PracticeCalendar;
