import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, CreditCard, Gift, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type PlanType = "monthly" | "yearly";

// Calculate days remaining using user's local timezone
const getLocalDaysRemaining = (expiresAt: string | Date): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const diffDays = Math.round((expiryDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<{ valid: boolean; message: string; planLabel?: string } | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: paymentInfo } = trpc.payment.getInfo.useQuery();

  // Цены подписок (из сервера или дефолт)
  const monthlyPrice = paymentInfo?.price ?? 1500;
  const monthlyDays = paymentInfo?.days ?? 30;
  const yearlyPrice = paymentInfo?.yearlyPrice ?? 11340;
  const yearlyDays = paymentInfo?.yearlyDays ?? 365;
  const savingsPercent = paymentInfo?.savingsPercent ?? 37;
  const savingsAmount = paymentInfo?.savingsAmount ?? 6660;

  const activatePromoMutation = trpc.promo.activate.useMutation({
    onSuccess: (data) => {
      toast.success(`Промокод активирован! Подписка на ${data.planType === "yearly" ? "12 месяцев" : "1 месяц"}`);
      utils.subscription.getMy.invalidate();
      setPromoCode("");
      setPromoStatus(null);
      setIsPromoOpen(false);
      setTimeout(() => setLocation("/profile"), 1500);
    },
    onError: (error) => {
      setPromoStatus({ valid: false, message: error.message });
    },
  });

  const handlePromoValidate = async () => {
    if (!promoCode.trim()) return;
    try {
      const result = await utils.client.promo.validate.query({ code: promoCode.trim() });
      if (result.valid) {
        setPromoStatus({ valid: true, message: `Промокод на ${result.planLabel}`, planLabel: result.planLabel });
      } else {
        setPromoStatus({ valid: false, message: result.error || "Неверный промокод" });
      }
    } catch {
      setPromoStatus({ valid: false, message: "Ошибка проверки промокода" });
    }
  };

  const handlePromoActivate = () => {
    if (!promoCode.trim()) return;
    activatePromoMutation.mutate({ code: promoCode.trim() });
  };

  const createPaymentMutation = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => {
      toast.success("Перенаправление на страницу оплаты...");
      // Сохраняем paymentId и тип плана для проверки после возврата
      sessionStorage.setItem("pendingPaymentId", data.paymentId);
      sessionStorage.setItem("pendingPlanType", selectedPlan);
      // Редирект на ЮKassa
      window.location.href = data.confirmationUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при создании платежа");
    },
  });

  // Проверяем параметры URL для обработки возврата с YooKassa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('paymentId') || sessionStorage.getItem("pendingPaymentId");

    if (paymentId) {
      setIsCheckingPayment(true);
      checkPaymentStatus(paymentId);
    }
  }, []);

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const result = await utils.client.payment.checkPaymentStatus.query({ paymentId });

      if (result.status === "succeeded" && result.paid) {
        sessionStorage.removeItem("pendingPaymentId");
        toast.success("Оплата успешна! Ваш код доступа готов.");
        utils.subscription.getMy.invalidate();
        setTimeout(() => {
          setLocation("/profile");
        }, 1500);
      } else if (result.status === "pending") {
        // Платёж ещё обрабатывается - проверим через 3 секунды
        setTimeout(() => checkPaymentStatus(paymentId), 3000);
      } else if (result.status === "canceled") {
        sessionStorage.removeItem("pendingPaymentId");
        toast.error("Платёж был отменён");
        setIsCheckingPayment(false);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      setIsCheckingPayment(false);
      toast.error("Ошибка проверки статуса платежа");
    }
  };

  const handlePayment = () => {
    const returnUrl = `${window.location.origin}/payment`;
    createPaymentMutation.mutate({ returnUrl, planType: selectedPlan });
  };

  const hasSubscription = subscription && subscription.isActive === 1;
  const isLoading = createPaymentMutation.isPending || isCheckingPayment;

  // Текущие значения для выбранного плана
  const currentPrice = selectedPlan === "yearly" ? yearlyPrice : monthlyPrice;
  const currentDays = selectedPlan === "yearly" ? yearlyDays : monthlyDays;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {hasSubscription ? "Продлить подписку" : "Получить полный доступ"}
          </h1>
          <p className="text-xl text-muted-foreground">
            Разблокируйте все 8 premium программ реабилитации
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection Cards */}
          <div className="space-y-4">
            {/* Yearly Plan Card - Most Popular */}
            <Card
              className={`cursor-pointer transition-all duration-200 relative ${
                selectedPlan === "yearly"
                  ? "border-primary border-2 shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan("yearly")}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  Выгодно на {savingsPercent}%
                </div>
              </div>
              <CardHeader className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Годовая подписка</CardTitle>
                    <CardDescription>365 дней полного доступа</CardDescription>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "yearly" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}>
                    {selectedPlan === "yearly" && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{yearlyPrice.toLocaleString('ru-RU')}</span>
                  <span className="text-xl text-muted-foreground">₽</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {(monthlyPrice * 12).toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    Экономия {savingsAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ {Math.round(yearlyPrice / 12).toLocaleString('ru-RU')} ₽/мес
                </p>
              </CardContent>
            </Card>

            {/* Monthly Plan Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === "monthly"
                  ? "border-primary border-2 shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan("monthly")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Месячная подписка</CardTitle>
                    <CardDescription>{monthlyDays} дней полного доступа</CardDescription>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "monthly" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}>
                    {selectedPlan === "monthly" && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{monthlyPrice.toLocaleString('ru-RU')}</span>
                  <span className="text-xl text-muted-foreground">₽</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">за {monthlyDays} дней</p>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Что входит в подписку:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Доступ ко всем 8 premium программам</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">133 профессиональных урока</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">8-значный код для мобильного приложения</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">Отслеживание прогресса и видео-инструкции</p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCheckingPayment ? "Проверка платежа..." : "Создание платежа..."}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Оплатить {currentPrice.toLocaleString('ru-RU')} ₽
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Безопасная оплата через ЮKassa
            </p>

            {/* Promo Code Section */}
            <div className="border-t pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
                onClick={() => setIsPromoOpen(!isPromoOpen)}
              >
                <Gift className="h-4 w-4" />
                Есть промокод?
              </button>

              {isPromoOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите промокод"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoStatus(null);
                      }}
                      className="font-mono tracking-wider"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePromoValidate}
                      disabled={!promoCode.trim() || activatePromoMutation.isPending}
                      className="shrink-0"
                    >
                      Проверить
                    </Button>
                  </div>

                  {promoStatus && (
                    <div className={`text-sm px-3 py-2 rounded-md ${
                      promoStatus.valid
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}>
                      {promoStatus.message}
                    </div>
                  )}

                  {promoStatus?.valid && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={handlePromoActivate}
                      disabled={activatePromoMutation.isPending}
                    >
                      {activatePromoMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Активация...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Активировать промокод
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Benefits Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Что вы получите</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🎤 Постановка голоса</h3>
                  <p className="text-sm text-muted-foreground">18 уроков для развития красивого голоса</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🔊 Парезы гортани</h3>
                  <p className="text-sm text-muted-foreground">24 урока восстановления после парезов</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🍴 Дисфагия</h3>
                  <p className="text-sm text-muted-foreground">15 уроков для глотательной функции</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">👥 Мутации голоса</h3>
                  <p className="text-sm text-muted-foreground">12 уроков формирования голосового стереотипа</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🎙️ Профессионалы голоса</h3>
                  <p className="text-sm text-muted-foreground">16 уроков для певцов и лекторов</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📈 Гипотонусные дисфонии</h3>
                  <p className="text-sm text-muted-foreground">14 уроков активации голоса</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📉 Гипертонусные дисфонии</h3>
                  <p className="text-sm text-muted-foreground">14 уроков расслабления</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">⚠️ Узелки голосовых складок</h3>
                  <p className="text-sm text-muted-foreground">20 уроков SOVT и резонансной терапии</p>
                </div>
              </CardContent>
            </Card>

            {hasSubscription && subscription && (
              <Card className="bg-primary/5 border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">Текущая подписка</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Осталось дней: <span className="font-bold text-foreground">{getLocalDaysRemaining(subscription.expiresAt)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    После оплаты срок подписки будет продлён на {currentDays} дней
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
