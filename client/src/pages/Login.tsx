import { useAuth } from "@/_core/hooks/useAuth";
import { VKSignInButton } from "@/components/VKSignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Если пользователь уже авторизован, редиректим на dashboard
  if (!loading && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-gradient-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-gradient-light flex flex-col">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <Volume2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ToneBalance</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Volume2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Вход в ToneBalance</CardTitle>
              <CardDescription>
                Войдите через VK для доступа к программам голосовой реабилитации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* VK Sign In */}
              <VKSignInButton
                className="w-full"
                size="lg"
                variant="default"
              />

              {/* Security info */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Мы не храним ваш пароль — авторизация происходит через VK</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Ваши данные защищены и используются только для идентификации</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Продолжая, вы соглашаетесь с{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  условиями использования
                </Link>{" "}
                и{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  политикой конфиденциальности
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">После входа вам будет доступно:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Бесплатные программы: Введение и Дыхательная гимнастика
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Отслеживание вашего прогресса
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Синхронизация с мобильным приложением
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 ToneBalance. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
