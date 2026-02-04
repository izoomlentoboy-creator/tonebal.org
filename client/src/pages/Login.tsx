import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

declare global {
  interface Window {
    VKIDSDK?: any;
  }
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const vkContainerRef = useRef<HTMLDivElement>(null);
  const vkInitialized = useRef(false);

  // Если пользователь уже авторизован, редиректим на dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Инициализация VK ID SDK
  useEffect(() => {
    if (loading || isAuthenticated || vkInitialized.current) return;

    const initVKID = () => {
      if (!window.VKIDSDK || !vkContainerRef.current) return;

      const VKID = window.VKIDSDK;

      VKID.Config.init({
        app: 54441764,
        redirectUrl: 'https://tonebal.org/api/auth/vk/callback',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oneTap = new VKID.OneTap();

      oneTap.render({
        container: vkContainerRef.current,
        showAlternativeLogin: true
      })
      .on(VKID.WidgetEvents.ERROR, (error: any) => {
        console.error('VK ID Error:', error);
        toast.error('Ошибка авторизации VK');
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code: string; device_id: string }) => {
        const { code, device_id } = payload;

        try {
          // Отправляем код на сервер для обмена на токен
          const response = await fetch('/api/auth/vk/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, device_id }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка авторизации');
          }

          toast.success('Вы успешно вошли!');
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('VK auth error:', error);
          toast.error(error instanceof Error ? error.message : 'Ошибка авторизации');
        }
      });

      vkInitialized.current = true;
    };

    // Загружаем VK ID SDK
    if (!window.VKIDSDK) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
      script.async = true;
      script.onload = initVKID;
      document.body.appendChild(script);
    } else {
      initVKID();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
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
              Войдите через VK для доступа к программам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* VK ID SDK Container */}
            <div ref={vkContainerRef} className="flex justify-center" />

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
