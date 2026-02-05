import { Button } from "@/components/ui/button";
import { Timer } from "@/components/Timer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Play, Pause, Volume2, VolumeX, Maximize, Target, AlertTriangle, BookOpen, Timer as TimerIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Helper to determine if a lesson needs a timer
// Timer is NOT needed for informational lessons (reading, learning theory)
// Timer IS needed for practical exercises with timed steps
function lessonNeedsTimer(lesson: any): boolean {
  // Check if any step has a duration specified
  const hasTimedSteps = lesson.steps.some((step: any) => step.duration !== null && step.duration > 0);

  // Check if this is an introduction/theory lesson based on nosology
  const isIntroLesson = lesson.id.startsWith("intro_");

  // Also check the lesson title for keywords that indicate it's informational
  const infoKeywords = [
    "добро пожаловать", "анатомия", "введение", "знакомство",
    "теория", "гигиена", "безопасность", "как работать"
  ];
  const titleLower = lesson.title.toLowerCase();
  const isInformational = infoKeywords.some(kw => titleLower.includes(kw));

  // If it's an intro lesson or informational, no timer needed
  if (isIntroLesson || isInformational) {
    return false;
  }

  // If steps have durations, timer is useful
  if (hasTimedSteps) {
    return true;
  }

  // Default: show timer for exercises (lesson duration >= 5 minutes suggests it's a real exercise)
  return lesson.duration >= 5;
}

export default function LessonPage() {
  const { nosologyId, lessonId } = useParams<{ nosologyId: string; lessonId: string }>();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: nosology } = trpc.nosologies.getById.useQuery({ id: nosologyId! });
  const { data: lesson, isLoading } = trpc.nosologies.getLesson.useQuery({
    nosologyId: nosologyId!,
    lessonId: lessonId!,
  });
  const { data: progress } = trpc.progress.getMy.useQuery();

  const markCompleteMutation = trpc.progress.markComplete.useMutation({
    onSuccess: () => {
      toast.success("Урок отмечен как завершённый!");
      utils.progress.getMy.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при сохранении прогресса");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  if (!lesson || !nosology) {
    return (
      <div className="min-h-screen bg-[#FDFBFF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Урок не найден</h1>
          <Button asChild className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]">
            <Link href={`/nosology/${nosologyId}`}>Вернуться к программе</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted = progress?.some(
    p => p.nosologyId === nosologyId && p.lessonId === lessonId && p.completed === 1
  );

  const currentLessonIndex = nosology.lessons.findIndex(l => l.id === lessonId);
  const nextLesson = nosology.lessons[currentLessonIndex + 1];
  const prevLesson = nosology.lessons[currentLessonIndex - 1];
  const showTimer = lessonNeedsTimer(lesson);

  const handleMarkComplete = () => {
    markCompleteMutation.mutate({
      nosologyId: nosologyId!,
      lessonId: lessonId!,
    });
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      setLocation(`/nosology/${nosologyId}/lesson/${nextLesson.id}`);
    }
  };

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
            <Link href={`/nosology/${nosologyId}`}>
              <ArrowLeft className="h-4 w-4" />
              К урокам
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {isCompleted && (
              <span className="hidden sm:flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Завершено
              </span>
            )}
            <Link href="/" className="flex items-center">
              <span className="font-bold text-lg tracking-tight text-slate-900">Tone Balance</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 max-w-4xl pt-24 pb-12 relative z-10">
        {/* Lesson Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <span className="text-lg">{nosology.icon}</span>
              {nosology.name}
            </span>
            <span className="text-slate-300">•</span>
            <span>Урок {currentLessonIndex + 1} из {nosology.lessonCount}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">{lesson.title}</h1>

          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#7C3AED]" />
              <span>{lesson.duration} минут</span>
            </div>
            {showTimer && (
              <div className="flex items-center gap-2">
                <TimerIcon className="h-4 w-4 text-[#7C3AED]" />
                <span>С таймером</span>
              </div>
            )}
          </div>

          {/* Goal Card */}
          <div className="mt-6 bg-gradient-to-br from-[#7C3AED]/10 to-purple-50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-xs text-[#7C3AED] font-medium uppercase tracking-wider mb-1">Цель урока</p>
                <p className="text-slate-700 font-medium">{lesson.goal}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Video Player */}
        {lesson.videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
            </div>
          </motion.div>
        )}

        {/* Timer - only show for exercises that need it */}
        {showTimer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TimerIcon className="h-5 w-5 text-[#7C3AED]" />
                Таймер упражнения
              </h2>
              <Timer duration={lesson.duration * 60} />
            </div>
          </motion.div>
        )}

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#7C3AED]" />
              Пошаговая инструкция
            </h2>
            <div className="space-y-4">
              {lesson.steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-slate-700">{step.text}</p>
                    {step.duration && (
                      <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.duration} секунд
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Methodology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">{lesson.methodology.icon}</span>
              {lesson.methodology.title}
            </h2>
            <ul className="space-y-2">
              {lesson.methodology.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#7C3AED] mt-1">•</span>
                  <span className="text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Errors/Warnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className={`rounded-2xl p-5 shadow-sm border ${
            lesson.errors.isWarning
              ? "bg-red-50 border-red-200"
              : "bg-white border-slate-100"
          }`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              lesson.errors.isWarning ? "text-red-800" : "text-slate-900"
            }`}>
              <span className="text-2xl">{lesson.errors.icon}</span>
              {lesson.errors.title}
            </h2>
            <ul className="space-y-2">
              {lesson.errors.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={lesson.errors.isWarning ? "text-red-500" : "text-[#7C3AED]"} style={{ marginTop: '4px' }}>
                    {lesson.errors.isWarning ? <AlertTriangle className="h-4 w-4" /> : "•"}
                  </span>
                  <span className={lesson.errors.isWarning ? "text-red-700" : "text-slate-600"}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {!isCompleted && (
              <Button
                size="lg"
                className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
                onClick={handleMarkComplete}
                disabled={markCompleteMutation.isPending}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Отметить как завершённое
              </Button>
            )}

            {nextLesson && (
              <Button
                size="lg"
                variant={isCompleted ? "default" : "outline"}
                className={`flex-1 rounded-xl ${isCompleted ? "bg-[#7C3AED] hover:bg-[#6D28D9]" : ""}`}
                onClick={handleNextLesson}
              >
                Следующий урок
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-between pt-6 border-t border-slate-200"
        >
          {prevLesson ? (
            <Button variant="ghost" asChild className="text-slate-600 hover:text-[#7C3AED]">
              <Link href={`/nosology/${nosologyId}/lesson/${prevLesson.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Предыдущий
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Button variant="ghost" asChild className="text-slate-600 hover:text-[#7C3AED]">
              <Link href={`/nosology/${nosologyId}/lesson/${nextLesson.id}`}>
                Следующий
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild className="text-slate-600 hover:text-[#7C3AED]">
              <Link href={`/nosology/${nosologyId}`}>
                К программе
              </Link>
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Video Player Component with controls
function VideoPlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * video.duration;
    video.currentTime = newTime;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isYouTube) {
    const videoId = getYouTubeId(videoUrl);
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={videoUrl}
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#7C3AED] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#7C3AED] transition-colors"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-[#7C3AED] transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <span className="text-white text-sm">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[#7C3AED] transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#7C3AED]/90 hover:bg-[#7C3AED] rounded-full p-4 transition-all hover:scale-110"
        >
          <Play className="h-10 w-10 text-white" />
        </button>
      )}
    </div>
  );
}
