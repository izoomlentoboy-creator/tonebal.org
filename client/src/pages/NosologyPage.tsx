import { Button } from "@/components/ui/button";
import { ToneBalanceLogo } from "@/components/ToneBalanceLogo";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock, BookOpen, Play } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";

export default function NosologyPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: nosology, isLoading } = trpc.nosologies.getById.useQuery({ id: id! });
  const { data: subscription } = trpc.subscription.getMy.useQuery();
  const { data: progress } = trpc.progress.getMy.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  if (!nosology) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Программа не найдена</h1>
          <Button asChild className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
            <Link href="/dashboard">Вернуться к программам</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Проверяем активность подписки: isActive и daysRemaining > 0
  const hasSubscription = subscription && subscription.isActive === 1 && subscription.daysRemaining > 0;
  const hasAccess = nosology.isFree || hasSubscription;

  // Проверяем, истекла ли подписка (была активная, но дней не осталось)
  const subscriptionExpired = subscription && subscription.isActive === 1 && subscription.daysRemaining <= 0;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] font-sans">
        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Header */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50">
          <div className="container mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
            <Button variant="ghost" asChild className="gap-2 text-slate-600 hover:text-[#7C3AED]">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <ToneBalanceLogo className="w-8 h-8" size={32} />
              <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Tone Balance</span>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 md:px-6 max-w-2xl pt-32 pb-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Lock className="h-10 w-10 text-slate-400" />
            </div>
            {subscriptionExpired ? (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Подписка истекла</h1>
                <p className="text-lg text-slate-500 mb-8">
                  Ваша подписка закончилась. Продлите её, чтобы продолжить обучение
                </p>
                <Button size="lg" className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]" asChild>
                  <Link href="/payment">Продлить подписку</Link>
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Требуется подписка</h1>
                <p className="text-lg text-slate-500 mb-8">
                  Эта программа доступна только с premium подпиской
                </p>
                <Button size="lg" className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]" asChild>
                  <Link href="/payment">Оформить подписку</Link>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const completedLessons = progress?.filter(
    p => p.nosologyId === nosology.id && p.completed === 1
  ) || [];

  const progressPercent = Math.round((completedLessons.length / nosology.lessonCount) * 100);

  // Find the next incomplete lesson
  const nextLessonIndex = nosology.lessons.findIndex(
    lesson => !completedLessons.some(p => p.lessonId === lesson.id)
  );

  return (
    <div className="min-h-screen bg-[#FDFBFF] font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
          <Button variant="ghost" asChild className="gap-2 text-slate-600 hover:text-[#7C3AED]">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              К программам
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <ToneBalanceLogo className="w-8 h-8" size={32} />
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Tone Balance</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 max-w-4xl pt-24 pb-12 relative z-10">
        {/* Nosology Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6" style={{ borderTopColor: nosology.color, borderTopWidth: "3px" }}>
            <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
              <span className="text-6xl">{nosology.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{nosology.name}</h1>
                  {nosology.isFree && (
                    <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                      Бесплатно
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mb-4">{nosology.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#7C3AED]" />
                    <span>{nosology.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#7C3AED]" />
                    <span>{nosology.lessonCount} уроков</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{completedLessons.length} завершено</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Прогресс</span>
                <span className="font-medium text-slate-900">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Continue Button */}
            {nextLessonIndex >= 0 && (
              <div className="mt-6">
                <Button className="w-full md:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl" asChild>
                  <Link href={`/nosology/${nosology.id}/lesson/${nosology.lessons[nextLessonIndex].id}`}>
                    <Play className="h-4 w-4 mr-2" fill="currentColor" />
                    {completedLessons.length > 0 ? "Продолжить обучение" : "Начать обучение"}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Warning for nodules */}
          {'warning' in nosology && nosology.warning && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-medium text-red-700">{nosology.warning}</p>
            </div>
          )}
        </motion.div>

        {/* Lessons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Уроки</h2>

          <div className="space-y-3">
            {nosology.lessons.map((lesson, index) => {
              const isCompleted = completedLessons.some(p => p.lessonId === lesson.id);
              const isNext = index === nextLessonIndex;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setLocation(`/nosology/${nosology.id}/lesson/${lesson.id}`)}
                  className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-purple-100/50
                    ${isCompleted ? "border-green-200" : isNext ? "border-[#7C3AED] shadow-md shadow-purple-100/50" : "border-slate-100"}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                      ) : isNext ? (
                        <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                          <Play className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-500">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${isNext ? "text-[#7C3AED]" : "text-slate-900"}`}>
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {lesson.goal}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.duration} мин</span>
                        </div>
                      </div>

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Завершено
                        </span>
                      )}
                      {isNext && !isCompleted && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded-full">
                          <Play className="h-3 w-3" fill="currentColor" />
                          Следующий урок
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
