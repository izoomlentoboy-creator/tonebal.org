import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, BookOpen, Target, Award, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface PracticeDay {
  date: string;
  lessonsCompleted: number;
  totalMinutes: number;
}

interface PracticeStatsProps {
  practiceDays: PracticeDay[];
  totalLessonsAllTime: number;
  className?: string;
}

export function PracticeStats({ practiceDays, totalLessonsAllTime, className }: PracticeStatsProps) {
  const stats = useMemo(() => {
    const totalDays = practiceDays.length;
    const totalLessons = practiceDays.reduce((sum, d) => sum + d.lessonsCompleted, 0);
    const totalMinutes = practiceDays.reduce((sum, d) => sum + d.totalMinutes, 0);
    const avgLessonsPerDay = totalDays > 0 ? (totalLessons / totalDays).toFixed(1) : "0";
    const avgMinutesPerDay = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const practiceSet = new Set(practiceDays.map(d => d.date));

    let currentStreak = 0;
    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (practiceSet.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Array.from(practiceSet).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // This week stats
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const thisWeekDays = practiceDays.filter(d => {
      const date = new Date(d.date);
      return date >= weekStart && date <= today;
    });
    const thisWeekLessons = thisWeekDays.reduce((sum, d) => sum + d.lessonsCompleted, 0);

    return {
      totalDays,
      totalLessons,
      totalMinutes,
      avgLessonsPerDay,
      avgMinutesPerDay,
      currentStreak,
      bestStreak,
      thisWeekLessons,
      thisWeekDays: thisWeekDays.length,
    };
  }, [practiceDays]);

  const statItems = [
    {
      label: "Всего практик",
      value: stats.totalDays,
      suffix: "дней",
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Уроков пройдено",
      value: totalLessonsAllTime,
      suffix: "",
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Время практики",
      value: Math.round(stats.totalMinutes / 60),
      suffix: "ч",
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Текущая серия",
      value: stats.currentStreak,
      suffix: "дн.",
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Лучшая серия",
      value: stats.bestStreak,
      suffix: "дн.",
      icon: Award,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "На этой неделе",
      value: stats.thisWeekLessons,
      suffix: "уроков",
      icon: Target,
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Ваша статистика</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-xl transition-all hover:scale-105",
                item.bg
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={cn("h-4 w-4", item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  className="text-2xl font-bold"
                >
                  {item.value}
                </motion.span>
                {item.suffix && (
                  <span className="text-sm text-muted-foreground">{item.suffix}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Progress Bar */}
        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Прогресс за неделю</span>
            <span className="font-medium">{stats.thisWeekDays}/7 дней</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.thisWeekDays / 7) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PracticeStats;
