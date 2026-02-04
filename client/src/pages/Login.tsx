import { useAuth } from "@/_core/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { VKSignInButton } from "@/components/VKSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight, Mic } from "lucide-react";
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

  if (!loading && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Введите email");
      return;
    }

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
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка авторизации");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-fuchsia-100 rounded-full blur-3xl opacity-40 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-violet-100 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3"></div>

      {/* Header */}
      <header className="bg-transparent py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center text-white">
                <Mic size={16} />
              </div>
              <span>ToneBalance<span className="text-violet-600">.</span></span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Вход в ToneBalance</h1>
              <p className="text-slate-500">
                Выберите способ авторизации для доступа к программам
              </p>
            </div>

            {/* Auth buttons */}
            <div className="space-y-4">
              {!showEmailForm ? (
                <>
                  {/* Google Sign In */}
                  <GoogleSignInButton
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    size="lg"
                    variant="default"
                  />

                  {/* VK Sign In */}
                  <VKSignInButton
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    size="lg"
                    variant="outline"
                  />

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-400 font-medium">
                        или
                      </span>
                    </div>
                  </div>

                  {/* Email Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 rounded-xl text-base font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
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
                      <Label htmlFor="email" className="text-slate-700 font-medium">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                        className="h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700 font-medium">Имя (необязательно)</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Как вас зовут?"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 rounded-xl text-base font-semibold bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200"
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
                    className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    onClick={() => setShowEmailForm(false)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Другие способы входа
                  </Button>
                </>
              )}

              <p className="text-xs text-center text-slate-400 pt-4">
                Продолжая, вы соглашаетесь с{" "}
                <Link href="/terms" className="text-violet-600 hover:underline">
                  условиями использования
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6">
        <div className="text-center text-sm text-slate-400">
          <p>&copy; 2026 ToneBalance. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
