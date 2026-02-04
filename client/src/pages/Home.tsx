import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Wind, Mic, BookOpen, BarChart3, Calendar, Smartphone, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { data: nosologies } = trpc.nosologies.getAll.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-hero min-h-screen relative overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="container flex h-20 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a4d3e] italic">Tone</span>
              <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a4d3e] italic">Balance</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button asChild className="rounded-full px-6">
                  <Link href="/dashboard">Мои программы</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <a href={getLoginUrl()}>Войти</a>
                  </Button>
                  <Button asChild className="rounded-full px-6">
                    <a href={getLoginUrl()}>Начать</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#1a4d3e] italic leading-tight mb-4">
                Tone<br />Balance
              </h1>
              <p className="text-xl md:text-2xl text-[#1a4d3e]/80 mb-8">
                Верните силу своему голосу
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isAuthenticated ? (
                  <Button size="lg" asChild className="rounded-full px-8 bg-[#1a4d3e] hover:bg-[#1a4d3e]/90">
                    <Link href="/dashboard">
                      Перейти к программам
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="rounded-full px-8 bg-[#1a4d3e] hover:bg-[#1a4d3e]/90">
                      <a href={getLoginUrl()}>
                        Начать бесплатно
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="rounded-full px-8 border-[#1a4d3e]/30 text-[#1a4d3e] hover:bg-[#1a4d3e]/5">
                      <a href="https://apps.apple.com/app/tonebalance" target="_blank" rel="noopener noreferrer">
                        <Smartphone className="mr-2 h-5 w-5" />
                        App Store
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Content - Phone Mockups */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                {/* Main Phone */}
                <div className="phone-mockup phone-mockup-main">
                  <div className="phone-screen">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>18:54</span>
                        <span>Диафрагмальное дыхание (б...</span>
                      </div>
                      <div className="bg-blue-100 rounded-2xl p-4 text-center">
                        <div className="w-12 h-12 bg-blue-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <Wind className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-semibold text-sm">Диафрагмальное дыхание</p>
                        <p className="text-xs text-gray-500">(базовое)</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">8 мин</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-full">Видео-демонстрация</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Phone */}
                <div className="phone-mockup phone-mockup-secondary">
                  <div className="phone-screen">
                    <div className="p-4 space-y-3">
                      <div className="text-xs text-gray-500">16:45</div>
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1 rounded-full"></div>
                      <p className="font-semibold text-sm">Гидратация — ключ к здоровому г...</p>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-800">70</div>
                        <span className="text-sm text-gray-500">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1a4d3e] italic mb-4">
              Простота в<br />использовании
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="feature-card">
              <div className="feature-icon bg-blue-100">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Библиотека упражнений</h3>
              <p className="text-muted-foreground text-sm">
                Структурированные уроки с видео-инструкциями и пошаговыми объяснениями
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-purple-100">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Запись голоса</h3>
              <p className="text-muted-foreground text-sm">
                Записывайте свой голос и отслеживайте прогресс до и после упражнений
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-green-100">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Отслеживание прогресса</h3>
              <p className="text-muted-foreground text-sm">
                Статистика и аналитика ваших занятий в удобном формате
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1a4d3e] italic mb-4">
              Множество<br />направлений
            </h2>
            <p className="text-xl text-[#1a4d3e]/70">Более 70 уникальных упражнений</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {nosologies?.slice(0, 6).map((nosology) => (
              <Card
                key={nosology.id}
                className="program-card hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${nosology.color}20` }}
                    >
                      {nosology.icon}
                    </div>
                    {nosology.isFree && (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        Бесплатно
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4">{nosology.name}</CardTitle>
                  <CardDescription className="text-sm">{nosology.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-primary font-semibold">{nosology.lessonCount} уроков</span>
                    <span className="text-muted-foreground">{nosology.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="text-center mt-12">
              <Button size="lg" asChild className="rounded-full px-8 bg-[#1a4d3e] hover:bg-[#1a4d3e]/90">
                <a href={getLoginUrl()}>
                  Смотреть все программы
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Unique Features Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1a4d3e] italic mb-4">
                Уникальные<br />функции
              </h2>
              <p className="text-xl text-[#1a4d3e]/70 mb-8">
                Запись голоса, чтобы увидеть результат до и после
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ежедневная запись</h3>
                    <p className="text-muted-foreground text-sm">
                      Записывайте голос каждый день для детального отслеживания изменений
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Детальный прогресс</h3>
                    <p className="text-muted-foreground text-sm">
                      Наглядные графики и статистика вашего развития
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <Mic className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Дневник голоса</h3>
                    <p className="text-muted-foreground text-sm">
                      Ежедневная оценка состояния голоса для адаптации программы
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="voice-diary-card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-purple-600 font-medium">Закрыть</span>
                    <span className="font-semibold">Дневник голоса</span>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-5xl mb-2">&#128522;</div>
                    <div className="text-4xl font-bold text-green-500">10/10</div>
                    <div className="text-muted-foreground">Отлично</div>
                  </div>

                  <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 mb-8"></div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Симптомы</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="symptom-tag symptom-tag-red">Осиплость</span>
                      <span className="symptom-tag symptom-tag-orange">Боль</span>
                      <span className="symptom-tag symptom-tag-yellow">Жжение</span>
                      <span className="symptom-tag symptom-tag-pink">Сухость</span>
                      <span className="symptom-tag symptom-tag-blue">Усталость</span>
                      <span className="symptom-tag symptom-tag-gray">Другое</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card-modern rounded-3xl p-12">
              <Smartphone className="w-16 h-16 mx-auto mb-6 text-[#1a4d3e]" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a4d3e] italic mb-4">
                Скачайте приложение
              </h2>
              <p className="text-lg text-[#1a4d3e]/70 mb-8 max-w-2xl mx-auto">
                Дневник голоса и запись голоса доступны только в мобильном приложении.
                Отслеживайте свой прогресс где угодно.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="rounded-full px-8 bg-black hover:bg-black/90 text-white">
                  <a href="https://apps.apple.com/app/tonebalance" target="_blank" rel="noopener noreferrer">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    App Store
                  </a>
                </Button>
                {!isAuthenticated && (
                  <Button size="lg" variant="outline" asChild className="rounded-full px-8 border-[#1a4d3e]/30 text-[#1a4d3e] hover:bg-[#1a4d3e]/5">
                    <a href={getLoginUrl()}>
                      Веб-версия
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="bg-gradient-hero py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center bg-[#1a4d3e] text-white rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold italic mb-4">
                Начните восстановление голоса сегодня
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Зарегистрируйтесь и получите бесплатный доступ к программам "Введение" и "Дыхательная гимнастика"
              </p>
              <Button size="lg" asChild className="rounded-full px-10 bg-white text-[#1a4d3e] hover:bg-white/90">
                <a href={getLoginUrl()}>
                  Войти
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gradient-hero border-t border-[#1a4d3e]/10 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-[#1a4d3e] italic">Tone Balance</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/terms" className="text-[#1a4d3e]/70 hover:text-[#1a4d3e] transition-colors">
                Пользовательское соглашение
              </Link>
              <Link href="/privacy" className="text-[#1a4d3e]/70 hover:text-[#1a4d3e] transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/faq" className="text-[#1a4d3e]/70 hover:text-[#1a4d3e] transition-colors">
                FAQ
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-[#1a4d3e]/60">
              © 2026 ToneBalance. Все права защищены.
            </p>
            <p className="text-sm text-[#1a4d3e]/60 mt-2">
              Профессиональная голосовая реабилитация онлайн
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
