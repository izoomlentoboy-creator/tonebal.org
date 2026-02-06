import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Star, Trophy, Zap, Heart } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

type EncouragementType =
  | "first_lesson"
  | "half_done"
  | "all_done"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "welcome_back";

interface EncouragementConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  gradient: string;
  iconBg: string;
}

const ENCOURAGEMENTS: Record<EncouragementType, EncouragementConfig> = {
  first_lesson: {
    icon: <Zap className="h-8 w-8 text-yellow-400" />,
    title: "Отличное начало!",
    message: "Вы выполнили первое упражнение на сегодня. Продолжайте в том же духе!",
    gradient: "from-yellow-500 to-orange-500",
    iconBg: "bg-yellow-500/20",
  },
  half_done: {
    icon: <Star className="h-8 w-8 text-blue-400" />,
    title: "Половина пути!",
    message: "Вы выполнили 50% дневной нормы. Осталось совсем немного!",
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/20",
  },
  all_done: {
    icon: <Trophy className="h-8 w-8 text-emerald-400" />,
    title: "Все упражнения выполнены!",
    message: "Поздравляем! Вы выполнили все упражнения на сегодня. Вы молодец!",
    gradient: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/20",
  },
  streak_3: {
    icon: <Flame className="h-8 w-8 text-orange-400" />,
    title: "3 дня подряд!",
    message: "Вы занимаетесь 3 дня без перерыва. Формируется привычка!",
    gradient: "from-orange-500 to-red-500",
    iconBg: "bg-orange-500/20",
  },
  streak_7: {
    icon: <Flame className="h-8 w-8 text-red-400" />,
    title: "Неделя занятий!",
    message: "7 дней подряд — это серьёзное достижение. Вы на верном пути!",
    gradient: "from-red-500 to-pink-500",
    iconBg: "bg-red-500/20",
  },
  streak_14: {
    icon: <Trophy className="h-8 w-8 text-purple-400" />,
    title: "2 недели занятий!",
    message: "14 дней подряд! Ваша голосовая реабилитация идёт полным ходом!",
    gradient: "from-purple-500 to-indigo-500",
    iconBg: "bg-purple-500/20",
  },
  streak_30: {
    icon: <Trophy className="h-8 w-8 text-yellow-300" />,
    title: "Месяц занятий!",
    message: "30 дней подряд — невероятное достижение! Вы настоящий чемпион!",
    gradient: "from-yellow-400 to-amber-500",
    iconBg: "bg-yellow-400/20",
  },
  welcome_back: {
    icon: <Heart className="h-8 w-8 text-pink-400" />,
    title: "С возвращением!",
    message: "Рады видеть вас снова. Продолжим занятия?",
    gradient: "from-pink-500 to-rose-500",
    iconBg: "bg-pink-500/20",
  },
};

// Storage key for tracking shown encouragements
const STORAGE_KEY = "tb_encouragements";

interface ShownState {
  date: string; // YYYY-MM-DD
  shown: EncouragementType[];
  lastVisit: string; // YYYY-MM-DD
}

function getStoredState(): ShownState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { date: "", shown: [], lastVisit: "" };
}

function saveState(state: ShownState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function useEncouragement(
  completedToday: number,
  totalRequired: number,
  streak: number
) {
  const [popup, setPopup] = useState<EncouragementType | null>(null);
  const [queue, setQueue] = useState<EncouragementType[]>([]);

  const checkEncouragements = useCallback(() => {
    const today = getTodayStr();
    const state = getStoredState();

    // Reset shown list if new day
    if (state.date !== today) {
      state.shown = [];
      // Check welcome back (if last visit was >1 day ago)
      if (state.lastVisit && state.lastVisit !== today) {
        const last = new Date(state.lastVisit);
        const now = new Date(today);
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 2 && !state.shown.includes("welcome_back")) {
          state.shown.push("welcome_back");
          setQueue(prev => [...prev, "welcome_back"]);
        }
      }
      state.date = today;
      state.lastVisit = today;
      saveState(state);
    }

    if (totalRequired === 0) return;
    const percent = Math.round((completedToday / totalRequired) * 100);

    const toShow: EncouragementType[] = [];

    // First lesson of the day
    if (completedToday >= 1 && !state.shown.includes("first_lesson")) {
      toShow.push("first_lesson");
    }

    // 50% done
    if (percent >= 50 && !state.shown.includes("half_done")) {
      toShow.push("half_done");
    }

    // 100% done
    if (percent >= 100 && !state.shown.includes("all_done")) {
      toShow.push("all_done");
    }

    // Streak milestones
    const streakMilestones: Array<[number, EncouragementType]> = [
      [3, "streak_3"],
      [7, "streak_7"],
      [14, "streak_14"],
      [30, "streak_30"],
    ];
    for (const [days, type] of streakMilestones) {
      if (streak >= days && !state.shown.includes(type)) {
        toShow.push(type);
      }
    }

    if (toShow.length > 0) {
      state.shown.push(...toShow);
      saveState(state);
      setQueue(prev => [...prev, ...toShow]);
    }
  }, [completedToday, totalRequired, streak]);

  useEffect(() => {
    checkEncouragements();
  }, [checkEncouragements]);

  // Show next popup from queue
  useEffect(() => {
    if (!popup && queue.length > 0) {
      const [next, ...rest] = queue;
      setPopup(next);
      setQueue(rest);
    }
  }, [popup, queue]);

  const dismiss = useCallback(() => {
    setPopup(null);
  }, []);

  return { popup, dismiss };
}

export function EncouragementPopup({
  type,
  onDismiss,
}: {
  type: EncouragementType | null;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!type) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [type, onDismiss]);

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-md"
        >
          <div
            className={`bg-gradient-to-r ${ENCOURAGEMENTS[type].gradient} rounded-[24px] p-5 shadow-2xl text-white relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${ENCOURAGEMENTS[type].iconBg} flex items-center justify-center shrink-0`}>
                {ENCOURAGEMENTS[type].icon}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{ENCOURAGEMENTS[type].title}</h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  {ENCOURAGEMENTS[type].message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
