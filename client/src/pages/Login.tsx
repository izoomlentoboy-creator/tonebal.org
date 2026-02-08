import { useAuth } from "@/_core/hooks/useAuth";
import { VKSignInButton } from "@/components/VKSignInButton";
import { ToneBalanceLogo } from "@/components/ToneBalanceLogo";
import { Shield, CheckCircle2, ArrowLeft, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

type AuthMode = "login" | "register" | "register-code" | "forgot-password" | "reset-password";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const initialMode = (params.get("mode") as AuthMode) || "login";
  const resetToken = params.get("token") || "";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [emailConsent, setEmailConsent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("mode") === "reset-password") {
      setMode("reset-password");
    }
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus code input
  useEffect(() => {
    if (mode === "register-code") {
      codeInputRef.current?.focus();
    }
  }, [mode]);

  if (!loading && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Step 1 of registration: send code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!email) {
        setError("Введите email");
        return;
      }
      if (password.length < 6) {
        setError("Пароль должен быть не менее 6 символов");
        return;
      }

      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка отправки кода");
        return;
      }

      setMode("register-code");
      setCooldown(60);
      setSuccess("Код отправлен на " + email);
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 of registration: verify code and register
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/email/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, code, emailConsent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка отправки");
        return;
      }

      setCooldown(60);
      setCode("");
      setSuccess("Новый код отправлен на " + email);
    } catch {
      setError("Ошибка сети.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/email/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ошибка входа");
          return;
        }
        window.location.href = "/dashboard";
      } else if (mode === "forgot-password") {
        const res = await fetch("/api/auth/email/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ошибка");
          return;
        }
        setSuccess("Ссылка для сброса пароля отправлена на email");
      } else if (mode === "reset-password") {
        const res = await fetch("/api/auth/email/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Ошибка сброса пароля");
          return;
        }
        setSuccess("Пароль успешно изменён");
        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 2000);
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "register": return "Регистрация";
      case "register-code": return "Подтверждение email";
      case "forgot-password": return "Восстановление пароля";
      case "reset-password": return "Новый пароль";
      default: return "Вход в ToneBalance";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "register": return "Создайте аккаунт для доступа к программам";
      case "register-code": return `Мы отправили 6-значный код на ${email}`;
      case "forgot-password": return "Введите email, и мы отправим ссылку для сброса пароля";
      case "reset-password": return "Придумайте новый пароль";
      default: return "Войдите для доступа к программам голосовой реабилитации";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-200/10 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <ToneBalanceLogo size={40} />
              <span className="font-bold text-xl text-slate-800">Tone Balance</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-violet-500/10 border border-white/50 p-8"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center p-2"
              >
                <ToneBalanceLogo size={60} />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{getTitle()}</h1>
              <p className="text-slate-500">{getSubtitle()}</p>
            </div>

            {/* VK Sign In - only on login/register (not code step) */}
            {(mode === "login" || mode === "register") && (
              <>
                <div className="mb-6">
                  <VKSignInButton className="w-full flex justify-center" />
                </div>
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white/80 px-3 text-slate-400">или по email</span>
                  </div>
                </div>
              </>
            )}

            {/* Error / Success messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
                {success}
              </div>
            )}

            {/* Code verification step */}
            {mode === "register-code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Код подтверждения</label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center text-2xl font-bold tracking-[0.3em] placeholder:text-slate-300 placeholder:tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-2">Введите 6-значный код из письма</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || code.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Подтвердить и создать аккаунт
                </button>

                <div className="text-center text-sm text-slate-500 space-y-2">
                  <p>
                    Не пришёл код?{" "}
                    {cooldown > 0 ? (
                      <span className="text-slate-400">Отправить снова через {cooldown} сек.</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={submitting}
                        className="text-violet-600 hover:underline font-medium"
                      >
                        Отправить снова
                      </button>
                    )}
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); setSuccess(""); setCode(""); }}
                      className="text-violet-600 hover:underline"
                    >
                      Изменить email
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Registration / Login / Password forms */
              <form onSubmit={mode === "register" ? handleSendCode : handleEmailSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                    />
                  </div>
                )}

                {mode !== "reset-password" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="example@mail.ru"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                    </div>
                  </div>
                )}

                {mode !== "forgot-password" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === "reset-password" ? "Новый пароль" : "Минимум 6 символов"}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Email consent checkbox - registration only */}
                {mode === "register" && (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={emailConsent}
                        onChange={e => setEmailConsent(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                        emailConsent
                          ? "bg-violet-600 border-violet-600"
                          : "bg-white border-slate-300 group-hover:border-violet-400"
                      }`}>
                        {emailConsent && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-500 leading-snug">
                      Я согласен(а) получать уведомления о подписке и важные обновления сервиса на email
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "login" && "Войти"}
                  {mode === "register" && "Получить код подтверждения"}
                  {mode === "forgot-password" && "Отправить ссылку"}
                  {mode === "reset-password" && "Сохранить пароль"}
                </button>
              </form>
            )}

            {/* Mode switching links */}
            {mode !== "register-code" && (
              <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
                {mode === "login" && (
                  <>
                    <p>
                      Нет аккаунта?{" "}
                      <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }} className="text-violet-600 hover:underline font-medium">
                        Зарегистрироваться
                      </button>
                    </p>
                    <p>
                      <button onClick={() => { setMode("forgot-password"); setError(""); setSuccess(""); }} className="text-violet-600 hover:underline">
                        Забыли пароль?
                      </button>
                    </p>
                  </>
                )}
                {mode === "register" && (
                  <p>
                    Уже есть аккаунт?{" "}
                    <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-violet-600 hover:underline font-medium">
                      Войти
                    </button>
                  </p>
                )}
                {(mode === "forgot-password" || mode === "reset-password") && (
                  <p>
                    <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-violet-600 hover:underline">
                      Вернуться ко входу
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Security info */}
            {mode !== "register-code" && (
              <div className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                <div className="flex items-start gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-violet-600" />
                  </div>
                  <span>Пароль хранится в зашифрованном виде — мы не можем его увидеть</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Ваши данные защищены и используются только для идентификации</span>
                </div>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-center text-slate-400 pt-6">
              Продолжая, вы соглашаетесь с{" "}
              <Link href="/terms" className="underline hover:text-violet-600 transition-colors">
                условиями использования
              </Link>{" "}
              и{" "}
              <Link href="/privacy" className="underline hover:text-violet-600 transition-colors">
                политикой конфиденциальности
              </Link>
            </p>
          </motion.div>

          {/* Benefits Card */}
          {(mode === "login" || mode === "register") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-violet-500/10 border border-white/50 p-6"
            >
              <h3 className="font-semibold text-slate-800 mb-4">После входа вам будет доступно:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  Бесплатные программы: Введение и Дыхательная гимнастика
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  Отслеживание вашего прогресса
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  Синхронизация с мобильным приложением
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6">
        <div className="container mx-auto text-center text-sm text-slate-400">
          <p>&copy; 2026 ToneBalance. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
