import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { VKSignInButton } from "@/components/VKSignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="bg-transparent">
        <div className="container flex h-20 items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-[#1a4d3e]" />
            <span className="text-2xl font-serif font-bold text-[#1a4d3e] italic">Tone Balance</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card-modern border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a4d3e] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-serif text-[#1a4d3e]">Вход в ToneBalance</CardTitle>
            <CardDescription className="text-[#1a4d3e]/60">
              Выберите способ авторизации для доступа к программам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {!showEmailForm ? (
              <>
                {/* Google Sign In - Primary */}
                <GoogleSignInButton
                  className="w-full h-12 rounded-xl text-base"
                  size="lg"
                  variant="default"
                />

                {/* VK Sign In */}
                <VKSignInButton
                  className="w-full h-12 rounded-xl text-base"
                  size="lg"
                  variant="outline"
                />

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#1a4d3e]/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/60 px-3 text-[#1a4d3e]/50 rounded-full">
                      или
                    </span>
                  </div>
                </div>

                {/* Email Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-xl text-base border-[#1a4d3e]/20 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
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
                    <Label htmlFor="email" className="text-[#1a4d3e]">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      className="h-12 rounded-xl border-[#1a4d3e]/20 focus:border-[#1a4d3e] focus:ring-[#1a4d3e]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#1a4d3e]">Имя (необязательно)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Как вас зовут?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="h-12 rounded-xl border-[#1a4d3e]/20 focus:border-[#1a4d3e] focus:ring-[#1a4d3e]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 rounded-xl text-base bg-[#1a4d3e] hover:bg-[#1a4d3e]/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Входим...
                      </>
                    ) : (
                      <>
                        Войти
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <Button
                  variant="ghost"
                  className="w-full text-[#1a4d3e]/70 hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                  onClick={() => setShowEmailForm(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Другие способы входа
                </Button>
              </>
            )}

            <p className="text-xs text-center text-[#1a4d3e]/50 pt-2">
              Продолжая, вы соглашаетесь с{" "}
              <Link href="/terms" className="underline hover:text-[#1a4d3e]">
                условиями использования
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6">
        <div className="container text-center text-sm text-[#1a4d3e]/50">
          <p>© 2026 ToneBalance. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
