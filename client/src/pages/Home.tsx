import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Menu, X, ArrowRight, Mic, Wind, BookOpen, BarChart3,
  Check, Smartphone, Calendar, Heart
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { data: nosologies } = trpc.nosologies.getAll.useQuery();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">

      {/* === NAVIGATION === */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center text-white">
              <Mic size={18} />
            </div>
            <span>ToneBalance<span className="text-violet-600">.</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-violet-600 transition-colors">Возможности</a>
            <a href="#programs" className="hover:text-violet-600 transition-colors">Программы</a>
            <a href="#app" className="hover:text-violet-600 transition-colors">Приложение</a>
            {isAuthenticated ? (
              <Button asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200">
                <Link href="/dashboard">Мои программы</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-slate-600 hover:text-violet-600">
                  <a href={getLoginUrl()}>Войти</a>
                </Button>
                <Button asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200 hover:-translate-y-0.5 transition-all">
                  <a href={getLoginUrl()}>Начать бесплатно</a>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 flex flex-col gap-4 md:hidden shadow-xl">
            <a href="#features" className="text-lg font-medium text-slate-700">Возможности</a>
            <a href="#programs" className="text-lg font-medium text-slate-700">Программы</a>
            <a href="#app" className="text-lg font-medium text-slate-700">Приложение</a>
            {isAuthenticated ? (
              <Button asChild className="w-full rounded-xl bg-violet-600">
                <Link href="/dashboard">Мои программы</Link>
              </Button>
            ) : (
              <Button asChild className="w-full rounded-xl bg-violet-600">
                <a href={getLoginUrl()}>Начать бесплатно</a>
              </Button>
            )}
          </div>
        )}
      </nav>

      {/* === HERO SECTION === */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute top-20 right-0 -z-10 w-[600px] h-[600px] bg-fuchsia-100 rounded-full blur-3xl opacity-50 translate-x-1/3"></div>
        <div className="absolute top-40 left-0 -z-10 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-60 -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-violet-100 shadow-sm text-sm font-semibold text-violet-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              70+ упражнений доступно
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] text-slate-900">
              Верните силу<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600">
                своему голосу
              </span>
            </h1>

            <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
              ToneBalance — профессиональная платформа для голосовой реабилитации.
              Программы от логопедов, видео-инструкции и отслеживание прогресса.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Button size="lg" asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-200 hover:-translate-y-1 transition-all group">
                  <Link href="/dashboard">
                    Перейти к программам
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-200 hover:-translate-y-1 transition-all group">
                    <a href={getLoginUrl()}>
                      Начать бесплатно
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-full border-slate-200 hover:bg-slate-50">
                    <a href="https://apps.apple.com/app/tonebalance" target="_blank" rel="noopener noreferrer">
                      <Smartphone size={18} className="mr-2 text-violet-600" />
                      App Store
                    </a>
                  </Button>
                </>
              )}
            </div>

          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center">
            {/* Main phone */}
            <div className="relative z-10 transform hover:scale-[1.02] transition-all duration-500">
              {/* Phone frame */}
              <div className="relative bg-slate-700 rounded-[3rem] p-[10px] shadow-2xl shadow-slate-400/30">
                {/* Screen */}
                <div className="rounded-[2.4rem] overflow-hidden bg-white w-[280px]" style={{ aspectRatio: '9/19.2' }}>
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 pt-3 pb-1 relative">
                    <span className="text-sm font-semibold text-slate-900">17:46</span>
                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[90px] h-[28px] bg-slate-900 rounded-full"></div>
                    {/* Battery */}
                    <div className="flex items-center gap-0.5">
                      <div className="w-[22px] h-[11px] border-[1.5px] border-slate-400 rounded-[3px] relative flex items-center p-[2px]">
                        <div className="w-[60%] h-full bg-slate-400 rounded-[1px]"></div>
                      </div>
                      <div className="w-[2px] h-[5px] bg-slate-400 rounded-r-sm"></div>
                    </div>
                  </div>

                  {/* Progress segments */}
                  <div className="flex gap-1.5 px-5 pt-2 pb-4">
                    <div className="h-[5px] flex-1 bg-emerald-500 rounded-full"></div>
                    <div className="h-[5px] flex-1 bg-violet-500 rounded-full"></div>
                    <div className="h-[5px] flex-1 bg-slate-200 rounded-full"></div>
                    <div className="h-[5px] flex-1 bg-slate-200 rounded-full"></div>
                  </div>

                  {/* Content */}
                  <div className="px-5 pb-5">
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">Выберите ваше направление</h3>
                    <p className="text-xs text-slate-400 mb-4 leading-snug">Это поможет подобрать персональную программу упражнений</p>

                    {/* Program cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Card 1 - Дыхательная гимнастика */}
                      <div className="bg-slate-50/80 rounded-2xl p-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center mb-2">
                          <Wind size={18} className="text-violet-500" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight mb-0.5">Дыхательная гимнастика</p>
                        <p className="text-[10px] text-violet-500 font-medium">10 уроков</p>
                      </div>

                      {/* Card 2 - Постановка голоса */}
                      <div className="bg-slate-50/80 rounded-2xl p-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center mb-2">
                          <Mic size={18} className="text-violet-500" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight mb-0.5">Постановка голоса и речи</p>
                        <p className="text-[10px] text-violet-500 font-medium">14 уроков</p>
                      </div>

                      {/* Card 3 - Парезы гортани */}
                      <div className="bg-slate-50/80 rounded-2xl p-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center mb-2">
                          <BarChart3 size={18} className="text-violet-500" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight mb-0.5">Парезы гортани</p>
                        <p className="text-[10px] text-violet-500 font-medium">15 уроков</p>
                      </div>

                      {/* Card 4 - Дисфагия */}
                      <div className="bg-slate-50/80 rounded-2xl p-3">
                        <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center mb-2">
                          <Heart size={18} className="text-pink-500" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 leading-tight mb-0.5">Дисфагия</p>
                        <p className="text-[10px] text-violet-500 font-medium">6 уроков</p>
                      </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="flex gap-2 mt-4">
                      <div className="w-12 h-12 border border-slate-200 rounded-2xl flex items-center justify-center bg-white">
                        <ArrowRight size={18} className="text-slate-400 rotate-180" />
                      </div>
                      <div className="flex-1 h-12 bg-slate-200 rounded-2xl flex items-center justify-center gap-1">
                        <span className="text-sm text-slate-400 font-medium">Далее</span>
                        <ArrowRight size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second phone - smaller */}
            <div className="absolute -left-16 bottom-12 z-0 transform -rotate-6 hidden lg:block">
              <div className="bg-slate-600 rounded-[2.5rem] p-2 shadow-xl opacity-80">
                <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-slate-50 to-violet-50/50 w-48" style={{ aspectRatio: '9/19' }}>
                  <div className="p-4 pt-8">
                    <div className="h-2 w-14 bg-slate-200 rounded mb-3"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="aspect-square rounded-xl bg-violet-100/80"></div>
                      <div className="aspect-square rounded-xl bg-pink-100/80"></div>
                      <div className="aspect-square rounded-xl bg-emerald-100/80"></div>
                      <div className="aspect-square rounded-xl bg-blue-100/80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-violet-600">70+</p>
              <p className="text-sm text-slate-500 font-medium">Упражнений</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-fuchsia-600">10</p>
              <p className="text-sm text-slate-500 font-medium">Программ</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-violet-600">1000+</p>
              <p className="text-sm text-slate-500 font-medium">Пользователей</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-fuchsia-600">95%</p>
              <p className="text-sm text-slate-500 font-medium">Довольных</p>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Всё для восстановления голоса
            </h2>
            <p className="text-slate-500 text-lg">
              Профессиональные инструменты в удобном формате. Занимайтесь где угодно и когда угодно.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Библиотека упражнений</h3>
              <p className="text-slate-500 leading-relaxed">
                Структурированные уроки с видео-инструкциями и пошаговыми объяснениями от профессионалов.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 mb-6 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                <Mic size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Запись голоса</h3>
              <p className="text-slate-500 leading-relaxed">
                Записывайте свой голос до и после упражнений. Отслеживайте изменения и прогресс.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Отслеживание прогресса</h3>
              <p className="text-slate-500 leading-relaxed">
                Детальная статистика и аналитика ваших занятий. Видьте результаты в удобном формате.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === PROGRAMS SECTION === */}
      <section id="programs" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-600/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                10 специализированных программ
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Программы разработаны дипломированными логопедами для различных нозологий —
                от постановки голоса до реабилитации при парезах гортани.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Дыхательная гимнастика',
                  'Постановка голоса и речи',
                  'Парезы гортани',
                  'Дисфагия',
                  'Профессионалы голоса'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium text-slate-200">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                      <Check size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {isAuthenticated ? (
                <Button size="lg" asChild className="rounded-full bg-white text-violet-600 hover:bg-slate-100">
                  <Link href="/dashboard">
                    Смотреть все программы
                    <ArrowRight size={18} className="ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="rounded-full bg-white text-violet-600 hover:bg-slate-100">
                  <a href={getLoginUrl()}>
                    Смотреть все программы
                    <ArrowRight size={18} className="ml-2" />
                  </a>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {nosologies?.slice(0, 4).map((nosology, i) => (
                <div
                  key={nosology.id}
                  className={`p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all ${i === 0 ? 'col-span-2' : ''}`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ backgroundColor: `${nosology.color}30` }}
                  >
                    {nosology.icon}
                  </div>
                  <h3 className="font-bold text-white mb-1">{nosology.name}</h3>
                  <p className="text-sm text-slate-400">{nosology.lessonCount} уроков</p>
                  {nosology.isFree && (
                    <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Бесплатно
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === VOICE DIARY SECTION === */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-violet-600 font-medium text-sm">Закрыть</span>
                  <span className="font-bold">Дневник голоса</span>
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <Calendar size={16} className="text-violet-600" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-5xl mb-2">&#128522;</div>
                  <div className="text-4xl font-bold text-green-500">10/10</div>
                  <div className="text-slate-500">Отлично</div>
                </div>

                <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 mb-6"></div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-3 text-slate-800">Симптомы</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-medium">Осиплость</span>
                    <span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium">Боль</span>
                    <span className="px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-600 text-sm font-medium">Жжение</span>
                    <span className="px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 text-sm font-medium">Сухость</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Дневник голоса для ежедневной оценки
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Отслеживайте состояние голоса каждый день. Записывайте симптомы,
                нагрузку и самочувствие. Программа адаптируется под ваше состояние.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: Calendar, text: 'Ежедневная оценка состояния' },
                  { icon: BarChart3, text: 'Детальная статистика изменений' },
                  { icon: Heart, text: 'Персональные рекомендации' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                      <item.icon size={20} />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === APP SECTION === */}
      <section id="app" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-violet-100 shadow-sm text-sm font-semibold text-violet-700 mb-6">
            <Smartphone size={16} />
            Доступно в App Store
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Скачайте мобильное приложение
          </h2>
          <p className="text-slate-500 text-lg mb-8 max-w-2xl mx-auto">
            Дневник голоса и запись голоса доступны только в мобильном приложении.
            Занимайтесь где угодно, отслеживайте прогресс на ходу.
          </p>

          <Button size="lg" asChild className="rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
            <a href="https://apps.apple.com/app/tonebalance" target="_blank" rel="noopener noreferrer">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Скачать из App Store
            </a>
          </Button>
        </div>
      </section>

      {/* === CTA === */}
      {!isAuthenticated && (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-violet-300">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwSDB2Nmg2MHYtNkgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Начните восстановление голоса сегодня
              </h2>
              <p className="text-violet-100 text-lg mb-10 max-w-2xl mx-auto">
                Зарегистрируйтесь и получите бесплатный доступ к программам
                «Введение» и «Дыхательная гимнастика».
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" asChild className="rounded-full bg-white text-violet-600 hover:bg-slate-100 shadow-lg">
                  <a href={getLoginUrl()}>
                    Попробовать бесплатно
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full border-white/30 text-white hover:bg-white/10">
                  <Link href="/faq">
                    Узнать больше
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-violet-200 opacity-80">
                2 программы бесплатно • Без карты
              </p>
            </div>
          </div>
        </section>
      )}

      {/* === FOOTER === */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center text-white">
                  <Mic size={14} />
                </div>
                ToneBalance.
              </div>
              <p className="text-slate-500 text-sm max-w-xs mb-6">
                Профессиональная голосовая реабилитация онлайн.
                Программы от логопедов, видео-уроки и отслеживание прогресса.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-violet-600 transition-colors">Возможности</a></li>
                <li><a href="#programs" className="hover:text-violet-600 transition-colors">Программы</a></li>
                <li><a href="#app" className="hover:text-violet-600 transition-colors">Приложение</a></li>
                <li><Link href="/faq" className="hover:text-violet-600 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Юридическая</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/terms" className="hover:text-violet-600 transition-colors">Условия использования</Link></li>
                <li><Link href="/privacy" className="hover:text-violet-600 transition-colors">Политика конфиденциальности</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; 2026 ToneBalance. Все права защищены.</p>
            <div className="flex items-center gap-1 mt-2 md:mt-0">
              Сделано с <span className="text-red-400">&#10084;</span> для вашего голоса
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
