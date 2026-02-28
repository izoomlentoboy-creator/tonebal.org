import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VKSignInButton } from "@/components/VKSignInButton";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Mic,
  Wind,
  Activity,
  Calendar,
  Play,
  CheckCircle2,
  BarChart3,
  Droplets,
  Menu,
  X,
  Smile,
  LogIn,
  ArrowRight,
  Laptop,
  Smartphone,
  Globe,
  Layout,
  Bell,
  Clock,
  Download,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// --- Web Dashboard Mockup ---
const WebDashboardMockup = () => (
  <div className="w-full bg-white rounded-[1.5rem] shadow-2xl border border-slate-200/60 overflow-hidden relative font-sans text-left">
    {/* Browser Chrome */}
    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
      </div>
      <div className="ml-4 bg-white rounded-md px-3 py-1 text-[10px] text-slate-400 flex items-center gap-2 flex-1 max-w-xs shadow-sm border border-slate-100">
        <Globe size={10} /> tonebal.org/dashboard
      </div>
    </div>

    <div className="flex h-[400px] md:h-[520px]">
      {/* Sidebar */}
      <div className="w-14 lg:w-48 bg-white border-r border-slate-100 p-3 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#7C3AED] font-bold px-2">
            <span className="hidden lg:block text-base tracking-tight">Tone</span>
          </div>
          <div className="space-y-1">
            <div className="p-2.5 bg-purple-50 text-[#7C3AED] rounded-xl flex items-center gap-3 font-medium text-sm">
              <Layout size={18} /> <span className="hidden lg:block">Главная</span>
            </div>
            <div className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-medium text-sm transition-colors cursor-pointer">
              <Wind size={18} /> <span className="hidden lg:block">Упражнения</span>
            </div>
            <div className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-medium text-sm transition-colors cursor-pointer">
              <BarChart3 size={18} /> <span className="hidden lg:block">Прогресс</span>
            </div>
            <div className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-3 font-medium text-sm transition-colors cursor-pointer">
              <Calendar size={18} /> <span className="hidden lg:block">Календарь</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#F8FAFC] p-4 lg:p-6 relative overflow-y-auto">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Обзор</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar size={12} /> Сегодня
            </p>
          </div>
          <button className="w-8 h-8 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#7C3AED] transition-colors relative">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Main Action Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 text-[#7C3AED] text-[10px] font-bold mb-3">
              <Wind size={10} /> Рекомендуем сегодня
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Вечерняя гимнастика</h3>
            <p className="text-xs text-slate-500 mb-4">Мягкий комплекс для снятия напряжения со связок.</p>
            <button className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg font-bold text-xs shadow-lg shadow-purple-200 flex items-center gap-2">
              <Play size={14} fill="currentColor" /> Начать
            </button>
          </div>

          {/* Stats Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Droplets size={18} /></div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Цель: 2.0 Л</span>
            </div>
            <div className="flex justify-between items-end mb-2">
              <div className="text-2xl font-bold text-slate-900">1.5 Л</div>
              <div className="text-xs font-bold text-blue-500">75%</div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-4">История активности</h3>
          <div className="space-y-3">
            {[
              { title: "Утренняя разминка", time: "Сегодня, 09:30", xp: "+15 xp", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
              { title: "Запись голоса", time: "Вчера, 18:45", xp: "Анализ", icon: Mic, color: "text-purple-500", bg: "bg-purple-50" },
              { title: "Дыхательная практика", time: "Вчера, 10:00", xp: "+20 xp", icon: Wind, color: "text-blue-500", bg: "bg-blue-50" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock size={8} /> {item.time}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{item.xp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Hero Composition ---
const HeroComposition = () => (
  <div className="relative w-full max-w-[380px] mx-auto h-[420px] flex flex-col items-center justify-center">
    {/* Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-tr from-purple-300/30 to-blue-200/30 rounded-full blur-[80px] pointer-events-none"></div>

    {/* Floating Card: Analysis */}
    <motion.div
      initial={{ y: 20, opacity: 0, rotateX: 10 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-20 bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full mb-[-20px] border border-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
            <Mic size={18} />
          </div>
          <div>
            <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Live</div>
            <div className="text-base font-bold text-slate-900">Анализ тона</div>
          </div>
        </div>
        <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
      </div>

      {/* Dynamic Waveform */}
      <div className="bg-slate-50/50 rounded-xl h-16 flex items-center justify-center gap-1 px-2 overflow-hidden border border-slate-100">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-[#8B5CF6] rounded-full"
            animate={{ height: [12, Math.random() * 40 + 16, 12] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
              delay: i * 0.05,
            }}
          />
        ))}
      </div>
    </motion.div>

    {/* Floating Card: Stats */}
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="relative z-30 bg-[#1E293B] rounded-[2rem] p-6 shadow-2xl w-[95%] text-white border border-slate-700/50"
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Прогресс</div>
            <div className="font-bold text-sm">Отлично</div>
          </div>
        </div>
        <div className="text-[#4ADE80] font-bold text-xs bg-[#4ADE80]/10 px-2.5 py-1 rounded-full border border-[#4ADE80]/20">+12%</div>
      </div>

      <div className="h-20 flex items-end justify-between gap-1.5">
        {[30, 50, 45, 70, 60, 100, 80].map((h, i) => (
          <motion.div
            key={i}
            className={`flex-1 rounded-t-lg ${i === 5 ? "bg-gradient-to-t from-[#7C3AED] to-[#A855F7]" : "bg-slate-700/50"}`}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
          ></motion.div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
        <span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>ВС</span>
      </div>
    </motion.div>
  </div>
);

// --- Step Card ---
const StepCard = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="flex flex-col items-center text-center p-5 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 group border border-transparent hover:border-purple-50">
    <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-400 font-bold text-lg flex items-center justify-center mb-5 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
      {number}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{text}</p>
  </div>
);

// --- Feature Item ---
const FeatureItem = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => (
  <div className="flex gap-4 items-start p-4 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 border border-transparent hover:border-purple-50 group">
    <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
      <Icon size={22} strokeWidth={2} />
    </div>
    <div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm group-hover:text-slate-600 transition-colors">{text}</p>
    </div>
  </div>
);

// --- App Feature Card ---
const AppFeatureCard = ({ icon: Icon, title, description, highlight }: { icon: React.ElementType; title: string; description: string; highlight?: boolean }) => (
  <div className={`p-5 rounded-2xl ${highlight ? "bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white" : "bg-white border border-slate-100 shadow-sm"}`}>
    <Icon size={28} className={highlight ? "text-white/90 mb-3" : "text-[#7C3AED] mb-3"} />
    <h4 className={`font-bold mb-1.5 ${highlight ? "text-white" : "text-slate-900"}`}>{title}</h4>
    <p className={`text-sm ${highlight ? "text-white/80" : "text-slate-500"}`}>{description}</p>
  </div>
);

// --- Main Component ---
export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { data: nosologies } = trpc.nosologies.getAll.useQuery();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 50]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBFF' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFF] font-sans text-slate-900 overflow-x-hidden selection:bg-[#7C3AED] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <span className="font-bold text-lg tracking-tight text-slate-900">Tone Balance</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-[#7C3AED] transition-colors">Как это работает</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#7C3AED] transition-colors">Возможности</a>
            <a href="#app" className="text-sm font-medium text-slate-600 hover:text-[#7C3AED] transition-colors">Приложение</a>
            <div className="h-5 w-px bg-slate-200"></div>
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Мои программы</Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <LogIn size={16} className="mr-2" /> Войти
                </Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 bg-white z-[60] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">Tone Balance</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full">
                <X />
              </button>
            </div>
            <div className="flex flex-col gap-5 text-lg font-medium">
              <a href="#how" onClick={() => setIsMobileMenuOpen(false)}>Как это работает</a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Возможности</a>
              <a href="#app" onClick={() => setIsMobileMenuOpen(false)}>Приложение</a>
              <hr className="border-slate-100" />
              {isAuthenticated ? (
                <Button asChild className="justify-center w-full">
                  <Link href="/dashboard">Мои программы</Link>
                </Button>
              ) : (
                <>
                  <VKSignInButton className="w-full justify-center" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text Content */}
            <motion.div className="lg:w-1/2 text-center lg:text-left" style={{ opacity: opacityHero }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur border border-purple-100 text-[#7C3AED] font-semibold text-[11px] uppercase tracking-wider mb-6 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></span>
                  Голосовая реабилитация
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-5 leading-[1.1] tracking-tight">
                  Верните силу <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-purple-600 to-indigo-600">своему голосу</span>
                </h1>

                <p className="text-base lg:text-lg text-slate-500 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Персональный помощник для здоровья голоса. Дыхательная гимнастика, трекер водного баланса и анализ прогресса —
                  <span className="text-slate-900 font-medium"> в приложении и на сайте.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  {isAuthenticated ? (
                    <Button size="lg" asChild>
                      <Link href="/dashboard">
                        Перейти к программам <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <VKSignInButton />
                      <Button size="lg" variant="outline" asChild>
                        <Link href="/login">
                          <Globe className="mr-2 h-5 w-5" /> Подробнее
                        </Link>
                      </Button>
                    </>
                  )}
                </div>

                <div className="mt-10 flex items-center justify-center lg:justify-start gap-5 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#7C3AED]" /> iOS App
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#7C3AED]" /> Web-версия
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Content */}
            <div className="lg:w-1/2 relative w-full flex justify-center lg:justify-end">
              <motion.div style={{ y: y1 }} className="w-full">
                <HeroComposition />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="py-16 relative">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl lg:text-4xl font-bold text-center mb-10">Как начать?</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StepCard number="1" title="Войдите через VK" text="Быстрая регистрация через ВКонтакте. Это займет несколько секунд." />
            <StepCard number="2" title="Выберите программу" text="10 специализированных программ для разных нозологий голоса." />
            <StepCard number="3" title="Начните занятия" text="Следуйте персональному плану упражнений 10-15 минут в день." />
          </div>
        </div>
      </section>

      {/* Web Platform Section */}
      <section id="web" className="py-20 relative overflow-hidden bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">Личный кабинет</h2>
            <p className="text-slate-500 text-base">
              Полноценный функционал доступен в браузере. Отслеживайте прогресс, выполняйте упражнения и ведите дневник.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <WebDashboardMockup />
            </motion.div>

            {/* Floating Devices Icons */}
            <motion.div
              className="absolute -left-4 lg:-left-10 top-1/3 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden md:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Laptop size={28} className="text-slate-700" />
            </motion.div>
            <motion.div
              className="absolute -right-4 lg:-right-10 bottom-1/3 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden md:block"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            >
              <Smartphone size={28} className="text-slate-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left: Features Composition */}
            <div className="lg:w-1/2 order-2 lg:order-1 w-full">
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="space-y-4 mt-8">
                  <div className="bg-purple-50 p-5 rounded-2xl h-40 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 shadow-sm">
                    <Wind size={28} className="text-[#7C3AED]" />
                    <span className="font-bold text-slate-900 text-sm">Дыхание</span>
                  </div>
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl h-52 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                    <Activity size={28} className="text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">98%</div>
                      <span className="text-slate-500 text-xs">Точность анализа</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl h-52 shadow-lg flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                    <Droplets size={28} className="text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">1.8 Л</div>
                      <span className="text-slate-500 text-xs">Водный баланс</span>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] p-5 rounded-2xl h-40 flex flex-col justify-between text-white hover:scale-[1.02] transition-transform duration-300 shadow-xl">
                    <Smile size={28} className="text-yellow-400" />
                    <span className="font-bold text-sm">Дневник</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature List */}
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">
                Комплексный подход
              </h2>
              <p className="text-slate-500 text-base mb-10">
                Мы объединили медицинскую экспертизу, современные технологии и удобство использования.
              </p>

              <div className="grid gap-4">
                <FeatureItem icon={Wind} title="Дыхательная гимнастика" text="Упражнения для развития диафрагмального дыхания — основы сильного голоса." />
                <FeatureItem icon={Smile} title="Дневник ощущений" text="Оценивайте состояние голоса от 1 до 10, фиксируйте симптомы и следите за динамикой." />
                <FeatureItem icon={Activity} title="Персонализация" text="Система адаптируется под ваш темп восстановления и предлагает оптимальную нагрузку." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Promo Section */}
      <section id="app" className="py-20 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">Мобильное приложение</h2>
            <p className="text-slate-500 text-base">
              Полноценный дневник голоса, офлайн-режим и дополнительные возможности — только в приложении.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <AppFeatureCard icon={Mic} title="Запись голоса" description="Записывайте голос и отслеживайте изменения тембра" />
            <AppFeatureCard icon={Droplets} title="Гидратация" description="Трекер водного баланса с напоминаниями" highlight />
            <AppFeatureCard icon={Download} title="Офлайн-доступ" description="Скачивайте видео для занятий без интернета" />
            <AppFeatureCard icon={Calendar} title="Полный дневник" description="Подробная статистика и история занятий" />
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-slate-500 mb-4">Используйте код из личного кабинета для активации подписки в приложении</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" /> Скачать из App Store
              </Button>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-5 w-5" /> Скачать из Google Play
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">Наши программы</h2>
            <p className="text-slate-500 text-base">
              10 специализированных программ. 2 программы доступны бесплатно после регистрации.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {nosologies?.slice(0, 6).map((nosology) => (
              <Card key={nosology.id} className="hover:shadow-lg transition-shadow" style={{ borderTopColor: nosology.color, borderTopWidth: "3px" }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{nosology.icon}</div>
                    {nosology.isFree && (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        Бесплатно
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base">{nosology.name}</CardTitle>
                  <CardDescription className="text-sm">{nosology.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{nosology.lessonCount} уроков</span>
                    <span>{nosology.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">Все программы <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            ) : (
              <VKSignInButton />
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[#1E293B] text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold mb-4">Простое ценообразование</h2>
            <p className="text-slate-400 text-base">
              2 программы бесплатно. Полный доступ ко всем 10 программам — по подписке.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="text-lg font-bold mb-2">Месячная подписка</div>
              <div className="text-3xl font-bold mb-4">1 500 <span className="text-base font-normal text-slate-400">₽/мес</span></div>
              <ul className="space-y-2 text-sm text-slate-300 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" /> Все 10 программ</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" /> Код для iOS приложения</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" /> Календарь и статистика</li>
              </ul>
              <Button variant="outline" className="w-full bg-transparent border-white/30 hover:bg-white/10" asChild>
                <Link href="/payment">Оформить</Link>
              </Button>
            </div>

            {/* Yearly */}
            <div className="bg-gradient-to-br from-[#7C3AED] to-[#9333EA] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                -37%
              </div>
              <div className="text-lg font-bold mb-2">Годовая подписка</div>
              <div className="text-3xl font-bold mb-1">11 340 <span className="text-base font-normal text-white/70">₽/год</span></div>
              <div className="text-sm text-white/70 mb-4">~945 ₽/мес</div>
              <ul className="space-y-2 text-sm text-white/90 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> Все 10 программ</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> Код для iOS приложения</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-white" /> Экономия 6 660 ₽</li>
              </ul>
              <Button className="w-full bg-white text-[#7C3AED] hover:bg-white/90" asChild>
                <Link href="/payment">Оформить со скидкой</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
            Tone Balance
          </h2>
          <p className="text-slate-500 text-base mb-8 max-w-md mx-auto">
            Присоединяйтесь к пользователям, которые уже восстанавливают свой голос с нами.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <VKSignInButton />
            </div>
          )}

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <div className="text-center md:text-left">
              <p>© 2026 Tone Balance</p>
              <p className="mt-1">Самозанятый Баймуратов А.М. ИНН: 023818270238</p>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">
                Условия использования
              </Link>
              <Link href="/faq" className="hover:text-slate-900 transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
