import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ToneBalanceLogo } from "@/components/ToneBalanceLogo";
import { EncouragementPopup, useEncouragement } from "@/components/EncouragementPopup";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Compass,
  CalendarDays,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  Flame,
  Target,
  Bell,
  Lock,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  Smartphone,
  Wind,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Helper to get first day of month (0 = Sunday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month - 1, 1).getDay();
};

// Tabs
type TabId = "dashboard" | "exercises" | "calendar";

const navigation: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Главная", icon: LayoutDashboard },
  { id: "exercises", label: "Упражнения", icon: Compass },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: nosologies, isLoading: nosologiesLoading } = trpc.nosologies.getAll.useQuery();
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();
  const { data: directions } = trpc.direction.getMy.useQuery();
  const { data: dailyProgress } = trpc.progress.getDailyProgress.useQuery();

  // Set timezone on mount
  const setTimezoneMutation = trpc.user.setTimezone.useMutation();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezoneMutation.mutate({ timezone: tz });
  }, []);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/");
      window.location.reload();
    },
  });

  // Encouragement popups
  const { popup, dismiss } = useEncouragement(
    dailyProgress?.completedToday || 0,
    dailyProgress?.totalRequired || 0,
    dailyProgress?.streak || 0
  );

  if (nosologiesLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.isActive === 1 && subscription.daysRemaining > 0;
  const subscriptionExpired = subscription && subscription.isActive === 1 && subscription.daysRemaining <= 0;
  const hasDirections = directions && directions.length > 0;

  // Code rotation warning (disabled until feature is implemented)
  const showCodeWarning7 = false;
  const showCodeWarning1 = false;

  const today = new Date();
  const monthNames = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FC] text-[#1D1D1F] font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
            <Wind size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#7C3AED]">Tone</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id
                  ? "bg-purple-50 text-[#7C3AED] font-semibold"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-[#7C3AED]" : "group-hover:text-slate-500"} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
              <User size={20} className="text-[#7C3AED]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name || "Пользователь"}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {hasSubscription ? "Pro-аккаунт" : "Бесплатный"}
              </p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              title="Выйти"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 safe-area-bottom">
        <nav className="flex justify-around items-center h-16 px-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === item.id
                  ? "text-[#7C3AED]"
                  : "text-slate-400"
              }`}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setLocation("/profile")}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-slate-400"
          >
            <User size={22} />
            <span className="text-[10px] font-medium">Профиль</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Header */}
        <header className="px-6 lg:px-10 py-6 flex justify-between items-center sticky top-0 bg-[#F8F9FC]/80 backdrop-blur-md z-10">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              {activeTab === "dashboard" && "Обзор"}
              {activeTab === "exercises" && "Упражнения"}
              {activeTab === "calendar" && "Календарь"}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5 flex items-center gap-2">
              <CalendarDays size={14} /> Сегодня, {today.getDate()} {monthNames[today.getMonth()]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasSubscription && subscription && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 bg-purple-50 text-[#7C3AED] px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                <Smartphone size={16} />
                Код для iOS
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setLocation("/profile")}
            >
              <User size={20} />
            </Button>
          </div>
        </header>

        <div className="px-6 lg:px-10 pb-10 max-w-6xl">
          {/* Code Rotation Warnings */}
          {hasSubscription && (showCodeWarning7 || showCodeWarning1) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-2xl p-4 flex items-center gap-3 ${
                showCodeWarning1
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              <Bell size={20} className={showCodeWarning1 ? "text-red-500" : "text-amber-500"} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {showCodeWarning1
                    ? "Код доступа обновится завтра!"
                    : "Код доступа скоро обновится"}
                </p>
                <p className="text-xs opacity-70 mt-0.5">
                  После обновления нужно будет ввести новый код в iOS приложении
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <DashboardTab
                key="dashboard"
                user={user}
                subscription={subscription}
                hasSubscription={hasSubscription || false}
                subscriptionExpired={subscriptionExpired || false}
                nosologies={nosologies}
                progress={progress}
                directions={directions}
                dailyProgress={dailyProgress}
                hasDirections={hasDirections || false}
              />
            )}
            {activeTab === "exercises" && (
              <ExercisesTab
                key="exercises"
                nosologies={nosologies}
                progress={progress}
                directions={directions}
                hasSubscription={hasSubscription || false}
                hasDirections={hasDirections || false}
              />
            )}
            {activeTab === "calendar" && (
              <CalendarTab key="calendar" />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Encouragement Popup */}
      <EncouragementPopup type={popup} onDismiss={dismiss} />
    </div>
  );
}

// ============ Dashboard Tab ============
function DashboardTab({
  user,
  subscription,
  hasSubscription,
  subscriptionExpired,
  nosologies,
  progress,
  directions,
  dailyProgress,
  hasDirections,
}: {
  user: any;
  subscription: any;
  hasSubscription: boolean;
  subscriptionExpired: boolean;
  nosologies: any;
  progress: any;
  directions: any;
  dailyProgress: any;
  hasDirections: boolean;
}) {
  const [, setLocation] = useLocation();

  // Find recommended lesson (next incomplete from first direction)
  const firstDirection = directions?.[0]?.nosology;
  const nextLesson = firstDirection
    ? firstDirection.lessons.find(
        (l: any) =>
          !progress?.some((p: any) => p.nosologyId === firstDirection.id && p.lessonId === l.id && p.completed === 1)
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highlight Card */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10">
            {nextLesson && firstDirection ? (
              <>
                <span className="inline-flex items-center gap-2 bg-purple-50 text-[#7C3AED] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 lg:mb-6">
                  <Star size={12} fill="currentColor" /> Рекомендуем сегодня
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2 tracking-tight">{nextLesson.title}</h2>
                <p className="text-slate-400 max-w-md leading-relaxed mb-6 lg:mb-8 text-sm lg:text-base">
                  {nextLesson.goal}
                </p>
                <button
                  onClick={() => setLocation(`/nosology/${firstDirection.id}/lesson/${nextLesson.id}`)}
                  className="bg-[#7C3AED] text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-purple-100 hover:translate-y-[-2px] hover:shadow-purple-200 transition-all active:scale-95"
                >
                  <Play size={20} fill="currentColor" /> Начать
                </button>
              </>
            ) : hasDirections ? (
              <>
                <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                  <CheckCircle2 size={12} /> Все на сегодня выполнено
                </span>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Отличная работа!</h2>
                <p className="text-slate-400 max-w-md leading-relaxed">
                  Вы выполнили все упражнения. Отдохните и возвращайтесь завтра.
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 bg-purple-50 text-[#7C3AED] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                  <Compass size={12} /> Начните путь
                </span>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Выберите направление</h2>
                <p className="text-slate-400 max-w-md leading-relaxed mb-8">
                  Выберите направления реабилитации, чтобы мы подготовили для вас персональную программу упражнений.
                </p>
                <DirectionSelector nosologies={nosologies} />
              </>
            )}
          </div>
        </div>

        {/* Daily Progress Circle */}
        <DailyProgressCard dailyProgress={dailyProgress} />
      </div>

      {/* Subscription Alerts */}
      {subscriptionExpired && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-[32px] p-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock size={18} /> Подписка истекла
              </h3>
              <p className="text-white/90 text-sm mt-1">Продлите, чтобы продолжить обучение</p>
            </div>
            <Button className="bg-white text-red-600 hover:bg-white/90 rounded-xl shrink-0" asChild>
              <Link href="/payment">Продлить</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {!hasSubscription && !subscriptionExpired && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-[32px] p-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={18} /> Получите полный доступ
              </h3>
              <p className="text-white/80 text-sm mt-1">Все premium программы + код для iOS</p>
            </div>
            <Button className="bg-white text-[#7C3AED] hover:bg-white/90 rounded-xl shrink-0" asChild>
              <Link href="/payment">Оформить</Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* My Directions Progress */}
      {hasDirections && dailyProgress && (
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Мои направления</h3>
            <DirectionSelector nosologies={nosologies} compact />
          </div>
          <div className="space-y-4">
            {dailyProgress.directions.map((dir: any) => {
              const dirNosology = nosologies?.find((n: any) => n.id === dir.nosologyId);
              if (!dirNosology) return null;
              const totalCompleted = progress?.filter(
                (p: any) => p.nosologyId === dir.nosologyId && p.completed === 1
              ).length || 0;
              const totalLessons = dirNosology.lessonCount;
              const overallPercent = Math.round((totalCompleted / totalLessons) * 100);

              return (
                <Link
                  key={dir.nosologyId}
                  href={`/nosology/${dir.nosologyId}`}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <span className="text-3xl">{dir.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{dir.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] rounded-full transition-all"
                          style={{ width: `${overallPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium shrink-0">
                        {totalCompleted}/{totalLessons}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Сегодня: {dir.completedToday}/{dir.totalLessons}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-[#7C3AED] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Info */}
      {hasSubscription && subscription && (
        <div className="bg-gradient-to-br from-[#7C3AED]/10 to-purple-50 rounded-[32px] p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Подписка</p>
              <p className="text-2xl font-bold text-slate-900">{subscription.daysRemaining} дн.</p>
              <p className="text-xs text-slate-500">до истечения</p>
            </div>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/profile">
                Код для iOS
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============ Daily Progress Card ============
function DailyProgressCard({ dailyProgress }: { dailyProgress: any }) {
  const percent = dailyProgress?.percent || 0;
  const streak = dailyProgress?.streak || 0;
  const completedToday = dailyProgress?.completedToday || 0;
  const totalRequired = dailyProgress?.totalRequired || 0;

  // SVG circle dimensions
  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">
        Прогресс дня
      </p>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#7C3AED"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900">{percent}%</span>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500 mt-3">
        {completedToday} / {totalRequired}
      </p>

      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-3 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full">
          <Flame size={14} />
          <span className="text-xs font-bold">{streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}</span>
        </div>
      )}
    </div>
  );
}

// ============ Direction Selector ============
function DirectionSelector({ nosologies, compact }: { nosologies: any; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const utils = trpc.useUtils();
  const { data: directions } = trpc.direction.getMy.useQuery();
  const { data: subscription } = trpc.subscription.getMy.useQuery();

  const hasSubscription = subscription && subscription.isActive === 1 && subscription.daysRemaining > 0;

  const setDirectionsMutation = trpc.direction.setMy.useMutation({
    onSuccess: () => {
      toast.success("Направления обновлены");
      utils.direction.getMy.invalidate();
      utils.progress.getDailyProgress.invalidate();
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (directions) {
      setSelected(directions.map((d: any) => d.nosologyId));
    }
  }, [directions]);

  const toggleDirection = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selected.length === 0) {
      toast.error("Выберите хотя бы одно направление");
      return;
    }
    setDirectionsMutation.mutate({ nosologyIds: selected });
  };

  if (compact) {
    return (
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
      >
        Изменить
      </button>
    );
  }

  // Full inline selector
  const premiumNosologies = nosologies?.filter((n: any) => !n.isFree) || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {premiumNosologies.map((n: any) => {
          const isSelected = selected.includes(n.id);
          const locked = !hasSubscription && !n.isFree;
          return (
            <button
              key={n.id}
              onClick={() => !locked && toggleDirection(n.id)}
              disabled={locked}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? "bg-[#7C3AED]/10 border-2 border-[#7C3AED]"
                  : locked
                  ? "bg-slate-50 border-2 border-transparent opacity-50 cursor-not-allowed"
                  : "bg-white border-2 border-slate-100 hover:border-purple-200"
              }`}
            >
              <span className="text-2xl">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.name}</p>
                <p className="text-xs text-slate-400">{n.lessonCount} уроков</p>
              </div>
              {locked && <Lock size={14} className="text-slate-400" />}
              {isSelected && <CheckCircle2 size={18} className="text-[#7C3AED] shrink-0" />}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <Button
          onClick={handleSave}
          disabled={setDirectionsMutation.isPending}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
        >
          Сохранить ({selected.length})
        </Button>
      )}
    </div>
  );
}

// ============ Exercises Tab ============
function ExercisesTab({
  nosologies,
  progress,
  directions,
  hasSubscription,
  hasDirections,
}: {
  nosologies: any;
  progress: any;
  directions: any;
  hasSubscription: boolean;
  hasDirections: boolean;
}) {
  const directionIds = directions?.map((d: any) => d.nosologyId) || [];

  // Show only direction lessons if directions are selected, else show all
  const myNosologies = hasDirections
    ? nosologies?.filter((n: any) => directionIds.includes(n.id))
    : nosologies;

  const freeNosologies = nosologies?.filter((n: any) => n.isFree) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* My Directions */}
      {hasDirections && myNosologies && myNosologies.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#7C3AED]" />
            Мои направления
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myNosologies.map((nosology: any) => {
              const nosologyProgress = progress?.filter(
                (p: any) => p.nosologyId === nosology.id && p.completed === 1
              ).length || 0;

              return (
                <ProgramCard
                  key={nosology.id}
                  nosology={nosology}
                  progress={nosologyProgress}
                  hasAccess={true}
                  isFree={nosology.isFree}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Free Programs */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Бесплатные программы
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {freeNosologies.map((nosology: any) => {
            const nosologyProgress = progress?.filter(
              (p: any) => p.nosologyId === nosology.id && p.completed === 1
            ).length || 0;

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
      </div>

      {/* All Premium Programs */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7C3AED]" />
          Все программы
          {!hasSubscription && (
            <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full">
              Требуется подписка
            </span>
          )}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {nosologies
            ?.filter((n: any) => !n.isFree)
            .map((nosology: any) => {
              const nosologyProgress = progress?.filter(
                (p: any) => p.nosologyId === nosology.id && p.completed === 1
              ).length || 0;

              return (
                <ProgramCard
                  key={nosology.id}
                  nosology={nosology}
                  progress={nosologyProgress}
                  hasAccess={hasSubscription}
                  isFree={false}
                />
              );
            })}
        </div>
      </div>
    </motion.div>
  );
}

// ============ Program Card ============
function ProgramCard({
  nosology,
  progress,
  hasAccess,
  isFree,
}: {
  nosology: any;
  progress: number;
  hasAccess: boolean;
  isFree: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 ${!hasAccess ? "opacity-60" : ""}`}
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

      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>{nosology.lessonCount} уроков</span>
        <span>
          {progress}/{nosology.lessonCount}
        </span>
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
}

// ============ Calendar Tab ============
function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = trpc.progress.getCalendar.useQuery({ year, month });
  const { data: stats } = trpc.progress.getStats.useQuery({ days: 7 });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month, 1));

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const dates = calendarData?.dates || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Calendar */}
      <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <span className="font-bold text-lg text-slate-900">
            {monthNames[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-3">
          {dayNames.map((day) => (
            <div key={day} className="py-2 font-medium">{day}</div>
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
                className={`aspect-square flex items-center justify-center text-sm rounded-xl transition-colors font-medium
                  ${isCompleted ? "bg-[#7C3AED] text-white" : ""}
                  ${isToday && !isCompleted ? "ring-2 ring-[#7C3AED] ring-inset text-[#7C3AED]" : ""}
                  ${!isCompleted && !isToday ? "text-slate-600" : ""}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#7C3AED]" />
            <span>День занятий</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded ring-2 ring-[#7C3AED] ring-inset" />
            <span>Сегодня</span>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      {stats && (
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Активность за неделю</h3>
          <div className="flex items-end justify-between gap-2 h-28 mb-3">
            {stats.dailyStats.map((day) => {
              const maxCount = Math.max(...stats.dailyStats.map((s) => s.count), 1);
              const height = (day.count / maxCount) * 100;
              const date = new Date(day.date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  {day.count > 0 && (
                    <span className="text-xs text-slate-400 font-medium mb-1">{day.count}</span>
                  )}
                  <div
                    className={`w-full rounded-xl transition-all ${
                      isToday ? "bg-[#7C3AED]" : day.count > 0 ? "bg-[#7C3AED]/30" : "bg-slate-100"
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

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-[#7C3AED]">{stats.completedLessons}</div>
              <div className="text-xs text-slate-500 mt-1">Завершено</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.totalLessons}</div>
              <div className="text-xs text-slate-500 mt-1">Всего</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completionPercent}%</div>
              <div className="text-xs text-slate-500 mt-1">Прогресс</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
