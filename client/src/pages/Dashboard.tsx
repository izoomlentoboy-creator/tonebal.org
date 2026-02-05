import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToneBalanceLogo } from "@/components/ToneBalanceLogo";
import { trpc } from "@/lib/trpc";
import {
  Lock,
  Smartphone,
  User,
  Calendar,
  BarChart3,
  Smile,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Target,
  TrendingUp,
  LogOut,
  ArrowRight,
  Sparkles,
  Download,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Helper to get first day of month (0 = Sunday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

// Calendar Component
const ActivityCalendar = ({ completedDates }: { completedDates: string[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = trpc.progress.getCalendar.useQuery({
    year,
    month,
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const dates = calendarData?.dates || completedDates;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <span className="font-semibold text-slate-900">
          {monthNames[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="py-1 font-medium">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isCompleted = dates.includes(dateStr);
          const isToday =
            new Date().getFullYear() === year &&
            new Date().getMonth() + 1 === month &&
            new Date().getDate() === day;

          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                ${isCompleted ? "bg-[#7C3AED] text-white font-medium" : ""}
                ${isToday && !isCompleted ? "ring-2 ring-[#7C3AED] ring-inset" : ""}
                ${!isCompleted && !isToday ? "text-slate-600 hover:bg-slate-100" : ""}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#7C3AED]" />
          <span>День занятий</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-2 ring-[#7C3AED] ring-inset" />
          <span>Сегодня</span>
        </div>
      </div>
    </div>
  );
};

// Activity Chart Component
const ActivityChart = () => {
  const { data: stats } = trpc.progress.getStats.useQuery({ days: 7 });

  if (!stats) return null;

  const maxCount = Math.max(...stats.dailyStats.map((s) => s.count), 1);
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div>
      <div className="flex items-end justify-between gap-2 h-28 mb-2">
        {stats.dailyStats.map((day, i) => {
          const height = (day.count / maxCount) * 100;
          const date = new Date(day.date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t-lg transition-all ${
                  isToday ? "bg-[#7C3AED]" : "bg-[#7C3AED]/30"
                }`}
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        {stats.dailyStats.map((day) => {
          const date = new Date(day.date);
          const dayIndex = date.getDay();
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          return (
            <span key={day.date} className="flex-1 text-center">
              {dayNames[adjustedIndex]}
            </span>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-[#7C3AED]">{stats.completedLessons}</div>
          <div className="text-xs text-slate-500">Завершено</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-slate-900">{stats.totalLessons}</div>
          <div className="text-xs text-slate-500">Всего</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-600">{stats.completionPercent}%</div>
          <div className="text-xs text-slate-500">Прогресс</div>
        </div>
      </div>
    </div>
  );
};

// Voice Rating Component
const VoiceRatingWidget = () => {
  const [rating, setRating] = useState([5]);
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();

  const { data: ratings } = trpc.voiceRating.getMy.useQuery({ limit: 7 });

  const addRatingMutation = trpc.voiceRating.add.useMutation({
    onSuccess: () => {
      toast.success("Оценка сохранена");
      utils.voiceRating.getMy.invalidate();
      setNote("");
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при сохранении");
    },
  });

  const handleSaveRating = () => {
    addRatingMutation.mutate({
      rating: rating[0],
      note: note || undefined,
    });
  };

  const getRatingEmoji = (value: number) => {
    if (value <= 2) return "😣";
    if (value <= 4) return "😕";
    if (value <= 6) return "😐";
    if (value <= 8) return "🙂";
    return "😄";
  };

  const getRatingColor = (value: number) => {
    if (value <= 3) return "text-red-500";
    if (value <= 5) return "text-yellow-500";
    if (value <= 7) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Как ваш голос сегодня?</span>
          <span className={`text-3xl ${getRatingColor(rating[0])}`}>
            {getRatingEmoji(rating[0])}
          </span>
        </div>

        <div className="mb-3">
          <Slider
            value={rating}
            onValueChange={setRating}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1</span>
            <span className="font-bold text-lg text-[#7C3AED]">{rating[0]}</span>
            <span>10</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
          onClick={handleSaveRating}
          disabled={addRatingMutation.isPending}
        >
          Сохранить оценку
        </Button>
      </div>

      {ratings && ratings.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Последние оценки</div>
          <div className="flex items-end gap-1 h-16">
            {ratings.slice(0, 7).reverse().map((r, i) => {
              const height = (r.rating / 10) * 100;
              return (
                <div
                  key={r.id}
                  className="flex-1 bg-[#7C3AED]/30 rounded-t transition-all hover:bg-[#7C3AED]"
                  style={{ height: `${height}%` }}
                  title={`${r.rating}/10 - ${new Date(r.ratedAt).toLocaleDateString("ru-RU")}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Program Card Component
const ProgramCard = ({
  nosology,
  progress,
  hasAccess,
  isFree,
}: {
  nosology: any;
  progress: number;
  hasAccess: boolean;
  isFree: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 ${!hasAccess ? "opacity-60" : ""}`}
      style={{ borderTopColor: nosology.color, borderTopWidth: "3px" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{nosology.icon}</span>
        {isFree ? (
          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
            Бесплатно
          </span>
        ) : !hasAccess ? (
          <Lock className="h-4 w-4 text-slate-400" />
        ) : null}
      </div>

      <h3 className="font-bold text-slate-900 mb-1">{nosology.name}</h3>
      {!isFree && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{nosology.description}</p>
      )}

      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>{nosology.lessonCount} уроков</span>
        <span>{progress}/{nosology.lessonCount}</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-[#7C3AED] h-1.5 rounded-full transition-all"
          style={{ width: `${(progress / nosology.lessonCount) * 100}%` }}
        />
      </div>

      {hasAccess ? (
        <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl" size="sm" asChild>
          <Link href={`/nosology/${nosology.id}`}>
            {progress > 0 ? "Продолжить" : "Начать"}
          </Link>
        </Button>
      ) : (
        <Button className="w-full rounded-xl" size="sm" variant="outline" disabled>
          <Lock className="h-3 w-3 mr-2" />
          Требуется подписка
        </Button>
      )}
    </motion.div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: nosologies, isLoading: nosologiesLoading } = trpc.nosologies.getAll.useQuery();
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();
  const { data: direction } = trpc.direction.getMy.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/");
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (nosologiesLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.isActive === 1;
  const completedLessons = progress?.filter((p) => p.completed === 1).length || 0;
  const totalLessons = nosologies?.reduce((sum, n) => sum + n.lessonCount, 0) || 0;
  const currentDirectionNosology = direction?.nosology || null;

  return (
    <div className="min-h-screen bg-[#FDFBFF] font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="bg-white rounded-xl shadow-sm p-1 border border-purple-50 group-hover:shadow-md transition-shadow">
              <ToneBalanceLogo className="w-7 h-7" size={28} />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Tone Balance</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-[#7C3AED]">
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Профиль
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Привет, {user?.name?.split(" ")[0] || "пользователь"}!
          </h1>
          <p className="text-slate-500">
            {completedLessons} из {totalLessons} уроков завершено
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Alert */}
            {!hasSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-2xl p-6 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5" />
                    <h2 className="text-lg font-bold">Получите полный доступ</h2>
                  </div>
                  <p className="text-white/80 text-sm mb-4">
                    Разблокируйте все 8 premium программ и получите код для iOS приложения
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="bg-white text-[#7C3AED] hover:bg-white/90 rounded-xl" asChild>
                      <Link href="/payment">Оформить подписку</Link>
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl" asChild>
                      <Link href="/payment">Узнать о ценах</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Current Direction */}
            {currentDirectionNosology && hasSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
                style={{ borderTopColor: currentDirectionNosology.color, borderTopWidth: "3px" }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{currentDirectionNosology.icon}</span>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Моё направление</p>
                        <h2 className="text-lg font-bold text-slate-900">{currentDirectionNosology.name}</h2>
                      </div>
                    </div>
                    <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl" asChild>
                      <Link href={`/nosology/${currentDirectionNosology.id}`}>
                        <Play className="h-4 w-4 mr-2" fill="currentColor" />
                        Продолжить
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Прогресс</span>
                        <span className="font-medium text-slate-900">
                          {progress?.filter((p) => p.nosologyId === currentDirectionNosology.id && p.completed === 1).length || 0}
                          /{currentDirectionNosology.lessonCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-[#7C3AED] h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              ((progress?.filter((p) => p.nosologyId === currentDirectionNosology.id && p.completed === 1).length || 0) /
                                currentDirectionNosology.lessonCount) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Free Programs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Бесплатные программы
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {nosologies
                  ?.filter((n) => n.isFree)
                  .map((nosology, i) => {
                    const nosologyProgress =
                      progress?.filter((p) => p.nosologyId === nosology.id && p.completed === 1).length || 0;

                    return (
                      <ProgramCard
                        key={nosology.id}
                        nosology={nosology}
                        progress={nosologyProgress}
                        hasAccess={true}
                        isFree={true}
                      />
                    );
                  })}
              </div>
            </motion.div>

            {/* Premium Programs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#7C3AED]" />
                Premium программы
                {!hasSubscription && (
                  <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full">
                    Требуется подписка
                  </span>
                )}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {nosologies
                  ?.filter((n) => !n.isFree)
                  .map((nosology, i) => {
                    const nosologyProgress =
                      progress?.filter((p) => p.nosologyId === nosology.id && p.completed === 1).length || 0;

                    return (
                      <ProgramCard
                        key={nosology.id}
                        nosology={nosology}
                        progress={nosologyProgress}
                        hasAccess={hasSubscription || false}
                        isFree={false}
                      />
                    );
                  })}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#7C3AED]" />
                Календарь занятий
              </h3>
              <ActivityCalendar completedDates={[]} />
            </motion.div>

            {/* Activity Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#7C3AED]" />
                Активность за неделю
              </h3>
              <ActivityChart />
            </motion.div>

            {/* Voice Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Smile className="h-4 w-4 text-[#7C3AED]" />
                Оценка голоса
              </h3>
              <VoiceRatingWidget />
            </motion.div>

            {/* Subscription Card */}
            {hasSubscription && subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-[#7C3AED]/10 to-purple-50 rounded-2xl p-5 border border-purple-100"
              >
                <h3 className="text-base font-bold text-slate-900 mb-3">Ваша подписка</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-[#7C3AED]">{subscription.daysRemaining}</div>
                  <div className="text-sm text-slate-500">дней осталось</div>
                </div>
                <Button className="w-full rounded-xl" variant="outline" asChild>
                  <Link href="/profile">
                    Код доступа для iOS
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            )}

            {/* App Promo Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Мобильное приложение</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Дневник голоса, гидратация и офлайн-режим — только в приложении
              </p>
              <Button variant="secondary" size="sm" className="w-full rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Скачать
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
