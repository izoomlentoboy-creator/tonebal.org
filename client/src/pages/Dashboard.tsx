import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

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

  // Adjust first day to Monday start (Russian calendar)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const dates = calendarData?.dates || completedDates;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">
          {monthNames[month - 1]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {dayNames.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before first day */}
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
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
                ${isCompleted ? "bg-primary text-primary-foreground font-medium" : ""}
                ${isToday && !isCompleted ? "border-2 border-primary" : ""}
                ${!isCompleted && !isToday ? "text-muted-foreground hover:bg-muted" : ""}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>День занятий</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-primary" />
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
      <div className="flex items-end justify-between gap-2 h-32 mb-2">
        {stats.dailyStats.map((day, i) => {
          const height = (day.count / maxCount) * 100;
          const date = new Date(day.date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t-lg transition-all ${
                  isToday ? "bg-primary" : "bg-primary/30"
                }`}
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
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
        <div>
          <div className="text-2xl font-bold text-primary">{stats.completedLessons}</div>
          <div className="text-xs text-muted-foreground">Завершено</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.totalLessons}</div>
          <div className="text-xs text-muted-foreground">Всего уроков</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{stats.completionPercent}%</div>
          <div className="text-xs text-muted-foreground">Прогресс</div>
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
      {/* Rating Input */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Как ваш голос сегодня?</span>
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
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span className="font-bold text-lg">{rating[0]}</span>
            <span>10</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={handleSaveRating}
          disabled={addRatingMutation.isPending}
        >
          Сохранить оценку
        </Button>
      </div>

      {/* Recent Ratings */}
      {ratings && ratings.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Последние оценки</div>
          <div className="flex items-end gap-1 h-16">
            {ratings.slice(0, 7).reverse().map((r, i) => {
              const height = (r.rating / 10) * 100;
              return (
                <div
                  key={r.id}
                  className="flex-1 bg-primary/30 rounded-t transition-all hover:bg-primary"
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

// Direction Selection Modal/Card
const DirectionSelector = ({
  nosologies,
  currentDirection,
  hasSubscription,
}: {
  nosologies: any[];
  currentDirection: string | null;
  hasSubscription: boolean;
}) => {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const setDirectionMutation = trpc.direction.setMy.useMutation({
    onSuccess: () => {
      toast.success("Направление выбрано");
      utils.direction.getMy.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при выборе направления");
    },
  });

  const handleSelectDirection = (nosologyId: string) => {
    const nosology = nosologies.find((n) => n.id === nosologyId);
    if (!nosology) return;

    // Check if user has access
    if (!nosology.isFree && !hasSubscription) {
      toast.error("Требуется подписка для этого направления");
      setLocation("/payment");
      return;
    }

    setDirectionMutation.mutate({ nosologyId });
  };

  return (
    <div className="space-y-3">
      {nosologies
        .filter((n) => !n.isFree) // Only show non-free directions
        .map((nosology) => {
          const isSelected = currentDirection === nosology.id;
          const isAccessible = nosology.isFree || hasSubscription;

          return (
            <div
              key={nosology.id}
              onClick={() => isAccessible && handleSelectDirection(nosology.id)}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer
                ${isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:border-muted-foreground/20"}
                ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{nosology.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{nosology.name}</div>
                  <div className="text-xs text-muted-foreground">{nosology.lessonCount} уроков</div>
                </div>
                {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                {!isAccessible && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            </div>
          );
        })}
    </div>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.isActive === 1;
  const completedLessons = progress?.filter((p) => p.completed === 1).length || 0;
  const totalLessons = nosologies?.reduce((sum, n) => sum + n.lessonCount, 0) || 0;

  // Get current direction nosology
  const currentDirectionNosology = direction?.nosology || null;

  return (
    <div className="min-h-screen bg-purple-gradient-light">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold cursor-pointer">ToneBalance</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Профиль
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Добро пожаловать, {user?.name || "пользователь"}!
          </h1>
          <p className="text-muted-foreground">
            Ваш прогресс: {completedLessons} из {totalLessons} уроков завершено
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Alert */}
            {!hasSubscription && (
              <Card className="glass-card border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Получите полный доступ
                  </CardTitle>
                  <CardDescription>
                    Разблокируйте все 8 premium программ и получите код для iOS приложения
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <Link href="/payment">Оформить подписку</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/payment">Узнать о ценах</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Current Direction */}
            {currentDirectionNosology && hasSubscription && (
              <Card className="glass-card overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: currentDirectionNosology.color }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{currentDirectionNosology.icon}</span>
                      <div>
                        <CardTitle>Моё направление</CardTitle>
                        <CardDescription>{currentDirectionNosology.name}</CardDescription>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/nosology/${currentDirectionNosology.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Продолжить
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Прогресс</span>
                        <span>
                          {progress?.filter((p) => p.nosologyId === currentDirectionNosology.id && p.completed === 1).length || 0}
                          /{currentDirectionNosology.lessonCount}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
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
                </CardContent>
              </Card>
            )}

            {/* Free Programs */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Бесплатные программы
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {nosologies
                  ?.filter((n) => n.isFree)
                  .map((nosology) => {
                    const nosologyProgress =
                      progress?.filter((p) => p.nosologyId === nosology.id && p.completed === 1).length || 0;

                    return (
                      <Card
                        key={nosology.id}
                        className="hover:shadow-lg transition-shadow"
                        style={{ borderTopColor: nosology.color, borderTopWidth: "3px" }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="text-3xl mb-1">{nosology.icon}</div>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                              Бесплатно
                            </span>
                          </div>
                          <CardTitle className="text-base">{nosology.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{nosology.lessonCount} уроков</span>
                              <span>
                                {nosologyProgress}/{nosology.lessonCount}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${(nosologyProgress / nosology.lessonCount) * 100}%`,
                                }}
                              />
                            </div>
                            <Button className="w-full" size="sm" asChild>
                              <Link href={`/nosology/${nosology.id}`}>
                                {nosologyProgress > 0 ? "Продолжить" : "Начать"}
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Premium Programs */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Premium программы
                {!hasSubscription && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Требуется подписка
                  </span>
                )}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {nosologies
                  ?.filter((n) => !n.isFree)
                  .map((nosology) => {
                    const isAccessible = hasSubscription;
                    const nosologyProgress =
                      progress?.filter((p) => p.nosologyId === nosology.id && p.completed === 1).length || 0;

                    return (
                      <Card
                        key={nosology.id}
                        className={`hover:shadow-lg transition-shadow ${!isAccessible ? "opacity-60" : ""}`}
                        style={{ borderTopColor: nosology.color, borderTopWidth: "3px" }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="text-3xl mb-1">{nosology.icon}</div>
                            {!isAccessible && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <CardTitle className="text-base">{nosology.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {nosology.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{nosology.lessonCount} уроков</span>
                              <span>{nosology.duration}</span>
                            </div>

                            {isAccessible ? (
                              <>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-1.5 rounded-full transition-all"
                                    style={{
                                      width: `${(nosologyProgress / nosology.lessonCount) * 100}%`,
                                    }}
                                  />
                                </div>
                                <Button className="w-full" size="sm" asChild>
                                  <Link href={`/nosology/${nosology.id}`}>
                                    {nosologyProgress > 0 ? "Продолжить" : "Начать"}
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <Button className="w-full" size="sm" variant="outline" disabled>
                                <Lock className="h-3 w-3 mr-2" />
                                Требуется подписка
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Календарь занятий
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityCalendar completedDates={[]} />
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Активность за неделю
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityChart />
              </CardContent>
            </Card>

            {/* Voice Rating */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smile className="h-4 w-4 text-primary" />
                  Оценка голоса
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceRatingWidget />
              </CardContent>
            </Card>

            {/* Direction Selector (for premium users) */}
            {hasSubscription && nosologies && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Моё направление
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Выберите программу для фокусировки
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DirectionSelector
                    nosologies={nosologies}
                    currentDirection={direction?.nosologyId || null}
                    hasSubscription={hasSubscription}
                  />
                </CardContent>
              </Card>
            )}

            {/* Subscription Card */}
            {hasSubscription && subscription && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Ваша подписка</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{subscription.daysRemaining}</div>
                    <div className="text-sm text-muted-foreground">дней осталось</div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/profile">Код доступа для iOS</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* App Promo Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="pb-2">
                <Smartphone className="h-8 w-8 mb-2" />
                <CardTitle className="text-base">Мобильное приложение</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Дневник голоса, гидратация и офлайн-режим — только в приложении
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Скачать
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
