import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Smartphone, Volume2 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { data: nosologies } = trpc.nosologies.getAll.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ToneBalance</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Мои программы</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>Войти</a>
                </Button>
                <Button asChild>
                  <a href={getLoginUrl()}>Начать</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Голосовая реабилитация онлайн
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Профессиональные программы восстановления голоса, разработанные логопедами. 
            Занимайтесь в удобное время, отслеживайте прогресс, достигайте результатов.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">Перейти к программам</Link>
              </Button>
            ) : (
              <>
                <AppleSignInButton size="lg" variant="default" />
                <Button size="lg" variant="outline" asChild>
                  <a href={getLoginUrl()}>Другие способы входа</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-16 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Почему ToneBalance?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Профессиональный подход</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Все программы разработаны дипломированными логопедами с многолетним опытом работы
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Индивидуальный подход</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  10 специализированных программ для разных нозологий — от постановки голоса до парезов гортани
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Удобство и гибкость</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Занимайтесь в любое время, в любом месте. Встроенные таймеры и видео-инструкции
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Nosologies Section */}
      <section className="container py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Наши программы</h2>
          <p className="text-center text-muted-foreground mb-12">
            2 программы доступны бесплатно после регистрации
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nosologies?.map((nosology) => (
              <Card 
                key={nosology.id} 
                className="hover:shadow-lg transition-shadow"
                style={{ borderTopColor: nosology.color, borderTopWidth: '3px' }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-4xl mb-2">{nosology.icon}</div>
                    {nosology.isFree && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Бесплатно
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{nosology.name}</CardTitle>
                  <CardDescription>{nosology.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{nosology.lessonCount} уроков</span>
                    <span>{nosology.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Promo Section */}
      <section className="container py-16 bg-primary/5">
        <div className="mx-auto max-w-4xl text-center">
          <Smartphone className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Скачайте мобильное приложение</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Дневник голоса и запись голоса доступны только в мобильном приложении. 
            Отслеживайте свой прогресс, записывайте упражнения и анализируйте результаты.
          </p>
          <Button size="lg" variant="outline">
            Скачать из App Store
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="container py-20">
          <div className="mx-auto max-w-3xl text-center bg-primary text-primary-foreground rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Начните восстановление голоса сегодня</h2>
            <p className="text-lg mb-8 opacity-90">
              Зарегистрируйтесь и получите бесплатный доступ к программам "Введение" и "Дыхательная гимнастика"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AppleSignInButton size="lg" variant="secondary" />
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 hover:bg-white/10" asChild>
                <a href={getLoginUrl()}>Другие способы</a>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>© 2026 ToneBalance. Все права защищены.</p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Пользовательское соглашение
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Профессиональная голосовая реабилитация онлайн
          </p>
        </div>
      </footer>
    </div>
  );
}
