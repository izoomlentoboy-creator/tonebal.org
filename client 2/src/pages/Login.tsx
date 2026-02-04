import { useAuth } from "@/_core/hooks/useAuth";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Если пользователь уже авторизован, редиректим на dashboard
  if (!loading && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Введите корректный email");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка авторизации");
      }

      toast.success("Вы успешно вошли!");
      // Редирект на dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка авторизации");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {!showEmailForm ? (
              <>
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

                {/* Email Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowEmailForm(true)}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Войти по email
                </Button>
              </>
            ) : (
              <>
                {/* Email Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Имя (необязательно)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Как вас зовут?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Входим...
                      </>
                    ) : (
                      "Войти"
                    )}
                  </Button>
                </form>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowEmailForm(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Другие способы входа
                </Button>
              </>
            )}

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
