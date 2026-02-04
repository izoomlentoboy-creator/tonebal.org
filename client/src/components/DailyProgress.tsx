import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, Info, Sparkles, Target, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DailyProgressItem {
  nosologyId: string;
  nosologyName: string;
  nosologyIcon: string;
  nosologyColor: string;
  lessonsCompleted: number;
  totalLessons: number;
}

interface DailyProgressProps {
  items: DailyProgressItem[];
  className?: string;
}

const DAILY_INFO_SHOWN_KEY = "tonebalance_daily_info_shown";

export function DailyProgress({ items, className }: DailyProgressProps) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  useEffect(() => {
    // Show info dialog on first visit
    const hasShown = localStorage.getItem(DAILY_INFO_SHOWN_KEY);
    if (!hasShown && items.length > 0) {
      setShowInfoDialog(true);
      localStorage.setItem(DAILY_INFO_SHOWN_KEY, "true");
    }
  }, [items.length]);

  // Calculate time until midnight
  const [timeUntilReset, setTimeUntilReset] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilReset(`${hours}ч ${minutes}мин`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalCompleted = items.reduce((sum, item) => sum + item.lessonsCompleted, 0);
  const hasProgress = items.some(item => item.lessonsCompleted > 0);

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Сегодняшний прогресс
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reset Timer */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>До обновления:</span>
            </div>
            <span className="font-medium">{timeUntilReset}</span>
          </div>

          {/* Progress Items */}
          <AnimatePresence>
            {items.map((item, index) => {
              const percentage = item.totalLessons > 0
                ? (item.lessonsCompleted / item.totalLessons) * 100
                : 0;
              const isComplete = item.lessonsCompleted >= item.totalLessons;

              return (
                <motion.div
                  key={item.nosologyId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.nosologyIcon}</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {item.nosologyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.lessonsCompleted}/{item.totalLessons}
                      </span>
                      {isComplete && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-500"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{
                        ["--progress-color" as string]: item.nosologyColor,
                      }}
                    />
                    {isComplete && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -right-1 -top-1"
                      >
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {!hasProgress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-muted-foreground"
            >
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Начните урок, чтобы увидеть прогресс</p>
            </motion.div>
          )}

          {/* Today's Summary */}
          {hasProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Сегодня пройдено:</span>
                <span className="text-lg font-bold text-primary">
                  {totalCompleted} {totalCompleted === 1 ? "урок" : totalCompleted < 5 ? "урока" : "уроков"}
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Как работает ежедневный прогресс
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p>
                Ваш ежедневный прогресс показывает, сколько уроков вы прошли сегодня по каждому направлению.
              </p>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800 mb-2">
                  ⏰ Важно: Прогресс обновляется каждый день в полночь
                </p>
                <p className="text-sm text-amber-700">
                  Это сделано для того, чтобы мотивировать вас заниматься регулярно.
                  Ваш общий прогресс по программе сохраняется навсегда.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Советы для успеха:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Занимайтесь каждый день хотя бы по 15-20 минут</li>
                  <li>Старайтесь проходить минимум 1-2 урока в день</li>
                  <li>Следите за своей серией практик в календаре</li>
                </ul>
              </div>

              <Button onClick={() => setShowInfoDialog(false)} className="w-full">
                Понятно, начать практику
              </Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DailyProgress;
