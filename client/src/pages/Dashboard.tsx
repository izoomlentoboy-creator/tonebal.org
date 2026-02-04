import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PracticeCalendar } from "@/components/PracticeCalendar";
import { PracticeStats } from "@/components/PracticeStats";
import { DailyProgress } from "@/components/DailyProgress";
import { trpc } from "@/lib/trpc";
import { Lock, Smartphone, User, Volume2, ChevronRight, Play, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: nosologies, isLoading: nosologiesLoading } = trpc.nosologies.getAll.useQuery();
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();
  const { data: calendarData } = trpc.activity.getCalendar.useQuery({});
  const { data: todayProgress } = trpc.activity.getTodayProgress.useQuery();
  const { data: stats } = trpc.activity.getStats.useQuery();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <Volume2 className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Загрузка программ...</p>
        </motion.div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.isActive === 1;

  // Calculate progress
  const completedLessons = progress?.filter(p => p.completed === 1).length || 0;
  const totalLessons = nosologies?.reduce((sum, n) => sum + n.lessonCount, 0) || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Prepare calendar data
  const practiceDays = calendarData?.map(d => ({
    date: d.date,
    lessonsCompleted: d.lessonsCompleted,
    totalMinutes: d.totalMinutes,
  })) || [];

  // Prepare today's progress
  const dailyProgressItems = todayProgress?.map(tp => ({
    nosologyId: tp.nosologyId,
    nosologyName: tp.nosologyName,
    nosologyIcon: tp.nosologyIcon,
    nosologyColor: tp.nosologyColor,
    lessonsCompleted: tp.lessonsCompleted,
    totalLessons: tp.totalLessons,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              ToneBalance
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Профиль</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 md:py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Добро пожаловать{user?.name ? `, ${user.name}` : ""}! 👋
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Общий прогресс: {progressPercent}%</span>
            <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              />
            </div>
            <span className="text-sm">{completedLessons}/{totalLessons}</span>
          </div>
        </motion.div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Programs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Alert */}
            {!hasSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-lg shadow-violet-500/25">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      <CardTitle className="text-white">Получите полный доступ</CardTitle>
                    </div>
                    <CardDescription className="text-white/80">
                      Разблокируйте все 8 premium программ и получите код для мобильного приложения
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" asChild className="shadow-md">
                      <Link href="/payment">Оформить подписку</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Programs Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">Все программы</TabsTrigger>
                <TabsTrigger value="free">Бесплатные</TabsTrigger>
                <TabsTrigger value="premium">Premium</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ProgramsGrid
                  nosologies={nosologies || []}
                  progress={progress || []}
                  hasSubscription={hasSubscription || false}
                  filter="all"
                />
              </TabsContent>

              <TabsContent value="free" className="mt-0">
                <ProgramsGrid
                  nosologies={nosologies || []}
                  progress={progress || []}
                  hasSubscription={hasSubscription || false}
                  filter="free"
                />
              </TabsContent>

              <TabsContent value="premium" className="mt-0">
                <ProgramsGrid
                  nosologies={nosologies || []}
                  progress={progress || []}
                  hasSubscription={hasSubscription || false}
                  filter="premium"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Today's Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DailyProgress items={dailyProgressItems} />
            </motion.div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PracticeCalendar practiceDays={practiceDays} />
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PracticeStats
                practiceDays={practiceDays}
                totalLessonsAllTime={completedLessons}
              />
            </motion.div>

            {/* Subscription Card */}
            {hasSubscription && subscription && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-emerald-700">Ваша подписка</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Код доступа для приложения:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-mono font-bold tracking-wider text-emerald-700">
                          {subscription.accessCode}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(subscription.accessCode)}
                        >
                          Копировать
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Осталось дней:</span>
                      <span className="text-2xl font-bold text-emerald-700">{subscription.daysRemaining}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* App Promo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <CardHeader className="pb-2">
                  <Smartphone className="h-8 w-8 text-white/80 mb-2" />
                  <CardTitle className="text-lg text-white">Мобильное приложение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Дневник голоса с записью</li>
                    <li>• Видео-упражнения офлайн</li>
                    <li>• Отслеживание прогресса</li>
                  </ul>
                  <Button variant="secondary" size="sm" className="w-full">
                    Скачать из App Store
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Programs Grid Component
interface ProgramsGridProps {
  nosologies: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    lessonCount: number;
    duration: string;
    isFree: boolean;
  }>;
  progress: Array<{
    nosologyId: string;
    completed: number;
  }>;
  hasSubscription: boolean;
  filter: "all" | "free" | "premium";
}

function ProgramsGrid({ nosologies, progress, hasSubscription, filter }: ProgramsGridProps) {
  const filtered = nosologies.filter(n => {
    if (filter === "free") return n.isFree;
    if (filter === "premium") return !n.isFree;
    return true;
  });

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {filtered.map((nosology, index) => {
        const isAccessible = nosology.isFree || hasSubscription;
        const nosologyProgress = progress.filter(
          p => p.nosologyId === nosology.id && p.completed === 1
        ).length;
        const progressPercent = (nosologyProgress / nosology.lessonCount) * 100;

        return (
          <motion.div
            key={nosology.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                !isAccessible ? "opacity-70" : "hover:-translate-y-1"
              }`}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: nosology.color }}
              />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{nosology.icon}</span>
                  <div className="flex flex-col items-end gap-1">
                    {nosology.isFree && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Бесплатно
                      </span>
                    )}
                    {!isAccessible && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <CardTitle className="text-base leading-tight">{nosology.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {nosology.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{nosology.lessonCount} уроков</span>
                  <span>{nosology.duration}</span>
                </div>

                {isAccessible && (
                  <>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Прогресс</span>
                        <span className="font-medium">{nosologyProgress}/{nosology.lessonCount}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: nosology.color }}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full group-hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: nosology.color,
                        borderColor: nosology.color,
                      }}
                      asChild
                    >
                      <Link href={`/nosology/${nosology.id}`} className="flex items-center justify-center gap-2">
                        {nosologyProgress > 0 ? (
                          <>
                            <Play className="h-4 w-4" />
                            Продолжить
                          </>
                        ) : (
                          <>
                            Начать
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Link>
                    </Button>
                  </>
                )}

                {!isAccessible && (
                  <Button className="w-full" variant="outline" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Требуется подписка
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
