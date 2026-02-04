import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Lock, Smartphone, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: nosologies, isLoading: nosologiesLoading } = trpc.nosologies.getAll.useQuery();
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();

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

  // Подсчёт прогресса
  const completedLessons = progress?.filter(p => p.completed === 1).length || 0;
  const totalLessons = nosologies?.reduce((sum, n) => sum + n.lessonCount, 0) || 0;

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

      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Добро пожаловать, {user?.name || "пользователь"}!
              </h1>
              <p className="text-muted-foreground">
                Ваш прогресс: {completedLessons} из {totalLessons} уроков завершено
              </p>
            </div>

            {/* Subscription Alert */}
            {!hasSubscription && (
              <Card className="mb-8 glass-card border-primary/50">
                <CardHeader>
                  <CardTitle>Получите полный доступ</CardTitle>
                  <CardDescription>
                    Разблокируйте все 8 premium программ и получите 8-значный код доступа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/payment">Оформить подписку</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Nosologies Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {nosologies?.map((nosology) => {
                const isAccessible = nosology.isFree || hasSubscription;
                const nosologyProgress = progress?.filter(
                  p => p.nosologyId === nosology.id && p.completed === 1
                ).length || 0;

                return (
                  <Card 
                    key={nosology.id}
                    className={`hover:shadow-lg transition-shadow ${!isAccessible ? 'opacity-60' : ''}`}
                    style={{ borderTopColor: nosology.color, borderTopWidth: '3px' }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="text-4xl mb-2">{nosology.icon}</div>
                        <div className="flex flex-col gap-1 items-end">
                          {nosology.isFree && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              Бесплатно
                            </span>
                          )}
                          {!isAccessible && (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{nosology.name}</CardTitle>
                      <CardDescription>{nosology.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{nosology.lessonCount} уроков</span>
                          <span>{nosology.duration}</span>
                        </div>
                        
                        {isAccessible && (
                          <>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${(nosologyProgress / nosology.lessonCount) * 100}%` 
                                }}
                              />
                            </div>
                            <Button className="w-full" asChild>
                              <Link href={`/nosology/${nosology.id}`}>
                                {nosologyProgress > 0 ? 'Продолжить' : 'Начать'}
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Subscription Card */}
              {hasSubscription && subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ваша подписка</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Код доступа:</p>
                      <p className="text-2xl font-mono font-bold tracking-wider">
                        {subscription.accessCode}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(subscription.accessCode);
                        }}
                      >
                        Копировать код
                      </Button>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Осталось дней:</p>
                      <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
                    </div>
                    
                    <Button className="w-full" asChild>
                      <Link href="/payment">Продлить подписку</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* App Promo Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <Smartphone className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Мобильное приложение</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Дневник голоса и запись голоса доступны в приложении
                  </p>
                  <Button variant="outline" className="w-full">
                    Скачать
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
