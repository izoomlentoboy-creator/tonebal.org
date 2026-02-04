import { useAuth } from "@/_core/hooks/useAuth";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { VKSignInButton } from "@/components/VKSignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Вход в ToneBalance</CardTitle>
            <CardDescription>
              Выберите способ авторизации для доступа к программам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Apple Sign In */}
            <AppleSignInButton
              className="w-full"
              size="lg"
              variant="default"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  или
                </span>
              </div>
            </div>

            {/* VK Sign In */}
            <VKSignInButton className="w-full" />

            <p className="text-xs text-center text-muted-foreground">
              Продолжая, вы соглашаетесь с условиями использования сервиса
            </p>
          </CardContent>
        </Card>
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
