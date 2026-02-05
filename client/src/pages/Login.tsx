import { useAuth } from "@/_core/hooks/useAuth";
import { VKSignInButton } from "@/components/VKSignInButton";
import { ToneBalanceLogo } from "@/components/ToneBalanceLogo";
import { Shield, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Вход в ToneBalance</h1>
              <p className="text-slate-500">
                Войдите через VK для доступа к программам голосовой реабилитации
              </p>
            </div>

            {/* VK Sign In */}
            <div className="mb-8">
              <VKSignInButton className="w-full flex justify-center" />
            </div>

            {/* Security info */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-violet-600" />
                </div>
                <span>Мы не храним ваш пароль — авторизация происходит через VK</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <span>Ваши данные защищены и используются только для идентификации</span>
              </div>
            </div>

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
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6">
        <div className="container mx-auto text-center text-sm text-slate-400">
          <p>© 2026 ToneBalance. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
