import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Copy,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  Clock,
  Undo2,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [codeCopied, setCodeCopied] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [cancelTimeLeft, setCancelTimeLeft] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: subscription } = trpc.subscription.getMy.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/");
      window.location.reload();
    },
  });

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Аккаунт удалён");
      setLocation("/");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при удалении аккаунта");
    },
  });

  const revealCodeMutation = trpc.subscription.revealCode.useMutation({
    onSuccess: (data) => {
      utils.subscription.getMy.invalidate();
      if (!data.alreadyRevealed) {
        toast.success("Код раскрыт! Введите его в приложении в течение 5 минут.");
        setCancelTimeLeft(5 * 60); // 5 minutes in seconds
      }
      setShowRevealDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при раскрытии кода");
    },
  });

  const cancelRevealMutation = trpc.subscription.cancelReveal.useMutation({
    onSuccess: () => {
      utils.subscription.getMy.invalidate();
      toast.success("Раскрытие кода отменено");
      setCancelTimeLeft(null);
    },
    onError: (error) => {
      toast.error(error.message || "Не удалось отменить");
    },
  });

  // Timer for cancel window
  useEffect(() => {
    if (subscription?.canCancelReveal && subscription?.codeRevealedAt) {
      const revealTime = new Date(subscription.codeRevealedAt).getTime();
      const fiveMinutesLater = revealTime + 5 * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((fiveMinutesLater - now) / 1000));
      if (remaining > 0) {
        setCancelTimeLeft(remaining);
      }
    }
  }, [subscription]);

  // Countdown timer
  useEffect(() => {
    if (cancelTimeLeft === null || cancelTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setCancelTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cancelTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    if (subscription?.accessCode && !subscription.accessCodeMasked) {
      navigator.clipboard.writeText(subscription.accessCode.replace("-", ""));
      setCodeCopied(true);
      toast.success("Код скопирован");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const handleRevealCode = () => {
    revealCodeMutation.mutate();
  };

  const handleCancelReveal = () => {
    cancelRevealMutation.mutate();
  };

  const hasSubscription = subscription && subscription.isActive === 1;
  const isCodeMasked = subscription?.accessCodeMasked;
  const canCancel = subscription?.canCancelReveal && cancelTimeLeft && cancelTimeLeft > 0;

  return (
    <div className="min-h-screen bg-purple-gradient-light">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к программам
            </Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-medium">{user?.name || "Не указано"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || "Не указан"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Метод входа</p>
                <p className="font-medium">VK</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Access Code */}
          {hasSubscription && subscription ? (
            <Card className="border-primary/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-purple-400" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      Подписка активна
                    </CardTitle>
                    <CardDescription>
                      Полный доступ ко всем программам
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Access Code Section */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      <span className="font-medium">Код доступа для iOS</span>
                    </div>
                    {!isCodeMasked && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        Раскрыт
                      </span>
                    )}
                  </div>

                  {/* Code Display */}
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-mono font-bold tracking-[0.3em] mb-1">
                        {isCodeMasked ? "****-****" : subscription.accessCode}
                      </p>
                      <p className="text-xs text-white/60">
                        {isCodeMasked ? "Нажмите кнопку ниже, чтобы раскрыть код" : "Введите этот код в приложении"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isCodeMasked ? (
                    // Code is hidden - show reveal button
                    <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" variant="secondary">
                          <Eye className="h-4 w-4 mr-2" />
                          Раскрыть код
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Раскрыть код доступа?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>
                              Код доступа предназначен для активации подписки в мобильном приложении.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
                              <p className="font-medium mb-1">Важно:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Код можно раскрыть только один раз</li>
                                <li>У вас будет 5 минут, чтобы отменить раскрытие</li>
                                <li>После подтверждения в приложении код исчезнет</li>
                              </ul>
                            </div>
                            <p className="text-sm">
                              Подтвердите, что вы готовы ввести код в приложение прямо сейчас.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRevealCode}
                            disabled={revealCodeMutation.isPending}
                          >
                            {revealCodeMutation.isPending ? "Раскрываем..." : "Раскрыть код"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    // Code is revealed
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          variant="secondary"
                          onClick={handleCopyCode}
                        >
                          {codeCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              Скопировано
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Копировать
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Cancel window */}
                      {canCancel && (
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-yellow-200">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                Можно отменить: {formatTime(cancelTimeLeft)}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-200 hover:text-yellow-100 hover:bg-yellow-500/20"
                              onClick={handleCancelReveal}
                              disabled={cancelRevealMutation.isPending}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Отменить
                            </Button>
                          </div>
                        </div>
                      )}

                      {!canCancel && !isCodeMasked && (
                        <p className="text-xs text-white/50 text-center">
                          Введите код в приложении, чтобы получить доступ к подписке
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subscription Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Осталось дней</p>
                    <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">Истекает</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.expiresAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href="/payment">Продлить подписку</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Подписка не активна</CardTitle>
                <CardDescription>
                  Оформите подписку, чтобы получить доступ ко всем программам и код для iOS приложения
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/payment">Оформить подписку</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* App Info */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <Smartphone className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Мобильное приложение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                В приложении доступны дополнительные функции:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Полноценный дневник голоса с историей
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Трекер гидратации с напоминаниями
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Скачивание видео для офлайн-просмотра
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Запись голоса и анализ прогресса
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Скачать из App Store
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Управление аккаунтом</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                Выйти из аккаунта
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={deleteAccountMutation.isPending}
                  >
                    Удалить аккаунт
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Все ваши данные, включая прогресс и подписку, будут
                      безвозвратно удалены.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Удалить навсегда
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
