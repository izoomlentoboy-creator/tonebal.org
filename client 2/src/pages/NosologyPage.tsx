import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

export default function NosologyPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { data: nosology, isLoading } = trpc.nosologies.getById.useQuery({ id: id! });
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!nosology) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Программа не найдена</h1>
          <Button asChild>
            <Link href="/dashboard">Вернуться к программам</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasSubscription = subscription && subscription.isActive === 1;
  const hasAccess = nosology.isFree || hasSubscription;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Link>
            </Button>
          </div>
        </header>

        <div className="container max-w-2xl py-16 text-center">
          <Lock className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Требуется подписка</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Эта программа доступна только с premium подпиской
          </p>
          <Button size="lg" asChild>
            <Link href="/payment">Оформить подписку</Link>
          </Button>
        </div>
      </div>
    );
  }

  const completedLessons = progress?.filter(
    p => p.nosologyId === nosology.id && p.completed === 1
  ) || [];

  const progressPercent = Math.round((completedLessons.length / nosology.lessonCount) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к программам
            </Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-8">
        {/* Nosology Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-6xl">{nosology.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{nosology.name}</h1>
                {nosology.isFree && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Бесплатно
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-4">{nosology.description}</p>
              
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{nosology.duration}</span>
                </div>
                <div>
                  <span>{nosology.lessonCount} уроков</span>
                </div>
                <div>
                  <span>{completedLessons.length} завершено</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Warning for nodules */}
          {'warning' in nosology && nosology.warning && (
            <Card className="mt-4 border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-destructive">{'warning' in nosology ? nosology.warning : ''}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold mb-4">Уроки</h2>
          
          {nosology.lessons.map((lesson, index) => {
            const isCompleted = completedLessons.some(p => p.lessonId === lesson.id);
            
            return (
              <Card 
                key={lesson.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/nosology/${nosology.id}/lesson/${lesson.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            Урок {index + 1}: {lesson.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {lesson.goal}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.duration} мин</span>
                        </div>
                      </div>
                      
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Завершено
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
