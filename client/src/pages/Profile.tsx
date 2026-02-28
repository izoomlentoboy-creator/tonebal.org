import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
  Smartphone,
  AlertTriangle,
  Clock,
  Undo2,
  ShieldCheck,
  User,
  Mail,
  LogOut,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  RefreshCw,
  Compass,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Calculate days remaining using user's local timezone
const getLocalDaysRemaining = (expiresAt: string | Date): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const diffDays = Math.round((expiryDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [codeCopied, setCodeCopied] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [cancelTimeLeft, setCancelTimeLeft] = useState<number | null>(null);
  const [directionOpen, setDirectionOpen] = useState(false);
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: nosologies } = trpc.nosologies.getAll.useQuery();
  const { data: directions } = trpc.direction.getMy.useQuery();
  const { data: emailConsentData } = trpc.auth.getEmailConsent.useQuery();

  const setEmailConsentMutation = trpc.auth.setEmailConsent.useMutation({
    onSuccess: () => {
      utils.auth.getEmailConsent.invalidate();
      toast.success("Настройки уведомлений обновлены");
    },
  });

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
        setCancelTimeLeft(5 * 60);
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

  const setDirectionsMutation = trpc.direction.setMy.useMutation({
    onSuccess: () => {
      toast.success("Направления обновлены");
      utils.direction.getMy.invalidate();
      utils.progress.getDailyProgress.invalidate();
      setDirectionOpen(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    // Cancel reveal timer disabled until code_revealed columns are added
  }, [subscription]);

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

  useEffect(() => {
    if (directions) {
      setSelectedDirections(directions.map((d: any) => d.nosologyId));
    }
  }, [directions]);

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

  const toggleDirection = (id: string) => {
    setSelectedDirections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveDirections = () => {
    if (selectedDirections.length === 0) {
      toast.error("Выберите хотя бы одно направление");
      return;
    }
    setDirectionsMutation.mutate({ nosologyIds: selectedDirections });
  };

  const hasSubscription = subscription && subscription.isActive === 1;
  const isCodeMasked = subscription?.accessCodeMasked;
  const canCancel = false;
  const codeRotation = null;

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
          <Button variant="ghost" asChild className="gap-2 text-slate-600 hover:text-[#7C3AED]">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Назад к программам
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Tone Balance</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 max-w-2xl pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-8 tracking-tight">Личный кабинет</h1>

          <div className="space-y-6">
            {/* User Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-[#7C3AED]" />
                Информация о пользователе
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Имя</p>
                    <p className="font-medium text-slate-900">{user?.name || "Не указано"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{user?.email || "Не указан"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.597v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.658 4 8.2c0-.254.102-.491.597-.491h1.744c.447 0 .615.203.787.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.149-3.574 2.149-3.574.118-.254.322-.491.77-.491h1.744c.524 0 .643.27.524.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Метод входа</p>
                    <p className="font-medium text-slate-900">VK</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Directions Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#7C3AED]" />
                  Мои направления
                </h2>
                <button
                  onClick={() => setDirectionOpen(!directionOpen)}
                  className="text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                >
                  {directionOpen ? "Закрыть" : "Изменить"}
                </button>
              </div>

              {!directionOpen && directions && directions.length > 0 ? (
                <div className="space-y-2">
                  {directions.map((dir: any) => (
                    <div key={dir.nosologyId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-2xl">{dir.nosology?.icon || "?"}</span>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{dir.nosology?.name || dir.nosologyId}</p>
                        <p className="text-xs text-slate-500">{dir.nosology?.lessonCount || 0} уроков</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !directionOpen && (!directions || directions.length === 0) ? (
                <p className="text-sm text-slate-500">Направления не выбраны</p>
              ) : null}

              {directionOpen && nosologies && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                    {nosologies
                      .filter((n: any) => !n.isFree)
                      .map((n: any) => {
                        const isSelected = selectedDirections.includes(n.id);
                        return (
                          <button
                            key={n.id}
                            onClick={() => toggleDirection(n.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              isSelected
                                ? "bg-[#7C3AED]/10 border-2 border-[#7C3AED]"
                                : "bg-white border-2 border-slate-100 hover:border-purple-200"
                            }`}
                          >
                            <span className="text-2xl">{n.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{n.name}</p>
                              <p className="text-xs text-slate-400">{n.lessonCount} уроков</p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-5 w-5 text-[#7C3AED] shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                  <Button
                    onClick={handleSaveDirections}
                    disabled={setDirectionsMutation.isPending || selectedDirections.length === 0}
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
                  >
                    Сохранить ({selectedDirections.length})
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Subscription & Access Code */}
            {hasSubscription && subscription ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
              >
                <div className="h-1.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7]" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Подписка активна</h2>
                        <p className="text-sm text-slate-500">Полный доступ ко всем программам</p>
                      </div>
                    </div>
                  </div>

                  {/* Code Rotation Info (disabled until feature is implemented) */}

                  {/* Access Code Section */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        <span className="font-medium">Код доступа для iOS</span>
                      </div>
                      {!isCodeMasked && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">
                          Раскрыт
                        </span>
                      )}
                    </div>

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

                    {isCodeMasked ? (
                      <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
                        <AlertDialogTrigger asChild>
                          <Button className="w-full bg-white text-slate-900 hover:bg-white/90">
                            <Eye className="h-4 w-4 mr-2" />
                            Раскрыть код
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              Раскрыть код доступа?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                              <p>
                                Код доступа предназначен для активации подписки в мобильном приложении.
                              </p>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm">
                                <p className="font-medium mb-1">Важно:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Код можно раскрыть только один раз</li>
                                  <li>У вас будет 5 минут, чтобы отменить раскрытие</li>
                                  <li>Код обновляется каждые 30 дней</li>
                                </ul>
                              </div>
                              <p className="text-sm">
                                Подтвердите, что вы готовы ввести код в приложение прямо сейчас.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleRevealCode}
                              disabled={revealCodeMutation.isPending}
                              className="rounded-xl"
                            >
                              {revealCodeMutation.isPending ? "Раскрываем..." : "Раскрыть код"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          className="w-full bg-white text-slate-900 hover:bg-white/90"
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

                        {canCancel && (
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-yellow-200">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">
                                  Можно отменить: {formatTime(cancelTimeLeft ?? 0)}
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

                  {/* Subscription Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-[#7C3AED]" />
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{getLocalDaysRemaining(subscription.expiresAt)}</p>
                      <p className="text-xs text-slate-500">дней осталось</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-[#7C3AED]" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(subscription.expiresAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-slate-500">дата истечения</p>
                    </div>
                  </div>

                  <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl" asChild>
                    <Link href="/payment">Продлить подписку</Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-2xl p-6 text-white"
              >
                <h2 className="text-xl font-bold mb-2">Подписка не активна</h2>
                <p className="text-white/80 mb-4">
                  Оформите подписку, чтобы получить доступ ко всем программам и код для iOS приложения
                </p>
                <Button className="w-full bg-white text-[#7C3AED] hover:bg-white/90 rounded-xl" asChild>
                  <Link href="/payment">Оформить подписку</Link>
                </Button>
              </motion.div>
            )}

            {/* App Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold">Мобильное приложение</h2>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                В приложении доступны дополнительные функции:
              </p>
              <ul className="text-sm space-y-2 mb-6">
                {[
                  "Полноценный дневник голоса с историей",
                  "Трекер гидратации с напоминаниями",
                  "Скачивание видео для офлайн-просмотра",
                  "Запись голоса и анализ прогресса",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" className="w-full rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать из App Store
                </Button>
                <Button variant="secondary" className="w-full rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать из Google Play
                </Button>
              </div>
            </motion.div>

            {/* Email Notifications */}
            {user?.email && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#7C3AED]" />
                  Уведомления по email
                </h2>
                <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Рассылка уведомлений</p>
                      <p className="text-xs text-slate-500">Напоминания об истечении подписки и обновления</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={emailConsentData?.emailConsent ?? false}
                      onChange={e => setEmailConsentMutation.mutate({ consent: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      emailConsentData?.emailConsent ? "bg-[#7C3AED]" : "bg-slate-300"
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                        emailConsentData?.emailConsent ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </div>
                  </div>
                </label>
              </motion.div>
            )}

            {/* Account Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">Управление аккаунтом</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-slate-200"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2 text-slate-500" />
                  Выйти из аккаунта
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deleteAccountMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить аккаунт
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие нельзя отменить. Все ваши данные, включая прогресс и подписку, будут
                        безвозвратно удалены.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 rounded-xl"
                      >
                        Удалить навсегда
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
