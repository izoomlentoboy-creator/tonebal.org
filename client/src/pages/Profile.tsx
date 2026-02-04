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
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [codeCopied, setCodeCopied] = useState(false);
  
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

  const handleCopyCode = () => {
    if (subscription?.accessCode) {
      navigator.clipboard.writeText(subscription.accessCode);
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

  const hasSubscription = subscription && subscription.isActive === 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к программам
            </Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-8">
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
                <p className="font-medium">{user?.loginMethod || "OAuth"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          {hasSubscription && subscription ? (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Подписка активна</CardTitle>
                <CardDescription>
                  У вас есть доступ ко всем premium программам
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Код доступа для мобильного приложения</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
                      <p className="text-4xl font-mono font-bold tracking-[0.3em] text-center text-primary">
                        {subscription.accessCode.length === 8
                          ? `${subscription.accessCode.slice(0, 4)}-${subscription.accessCode.slice(4)}`
                          : subscription.accessCode}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-12 w-12"
                      onClick={handleCopyCode}
                    >
                      {codeCopied ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Введите этот код в мобильном приложении для получения доступа
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Осталось дней</p>
                    <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Истекает</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.expiresAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
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
                  Оформите подписку, чтобы получить доступ ко всем программам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/payment">Оформить подписку</Link>
                </Button>
              </CardContent>
            </Card>
          )}

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
                      Это действие нельзя отменить. Все ваши данные, включая прогресс и подписку, будут безвозвратно удалены.
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
