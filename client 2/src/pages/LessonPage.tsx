import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "@/components/Timer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson || !nosology) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
          <Button asChild>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/nosology/${nosologyId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к программе
            </Link>
          </Button>
          
          {isCompleted && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Завершено
            </Badge>
          )}
        </div>
      </header>

      <div className="container max-w-4xl py-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{nosology.name}</span>
            <span>•</span>
            <span>Урок {currentLessonIndex + 1} из {nosology.lessonCount}</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{lesson.duration} минут</span>
            </div>
          </div>
          
          <Card className="mt-4 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="font-medium">
                <span className="text-primary">Цель урока:</span> {lesson.goal}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Video Player */}
        {lesson.videoUrl && (
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timer */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Таймер упражнения</h2>
          <Timer duration={lesson.duration * 60} />
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Пошаговая инструкция</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {lesson.steps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1 pt-1">
                      <p>{step.text}</p>
                      {step.duration && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Длительность: {step.duration} секунд
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Methodology */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{lesson.methodology.icon}</span>
                {lesson.methodology.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lesson.methodology.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        <div className="mb-8">
          <Card className={lesson.errors.isWarning ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{lesson.errors.icon}</span>
                {lesson.errors.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lesson.errors.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className={lesson.errors.isWarning ? "text-destructive" : "text-primary"} style={{ marginTop: '4px' }}>
                      {lesson.errors.isWarning ? "⚠" : "•"}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {!isCompleted && (
            <Button 
              size="lg" 
              className="flex-1"
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
              className="flex-1"
              onClick={handleNextLesson}
            >
              Следующий урок
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          {prevLesson ? (
            <Button variant="ghost" asChild>
              <Link href={`/nosology/${nosologyId}/lesson/${prevLesson.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Предыдущий урок
              </Link>
            </Button>
          ) : (
            <div />
          )}
          
          {nextLesson ? (
            <Button variant="ghost" asChild>
              <Link href={`/nosology/${nosologyId}/lesson/${nextLesson.id}`}>
                Следующий урок
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href={`/nosology/${nosologyId}`}>
                Вернуться к программе
              </Link>
            </Button>
          )}
        </div>
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

  // Check if it's a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Extract YouTube video ID
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

  // YouTube embed
  if (isYouTube) {
    const videoId = getYouTubeId(videoUrl);
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
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

  // Native HTML5 video player
  return (
    <div
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
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

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div
          className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <button
              onClick={toggleMute}
              className="text-white hover:text-primary transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <span className="text-white text-sm">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-primary transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Big play button in center when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/90 hover:bg-primary rounded-full p-4 transition-all hover:scale-110"
        >
          <Play className="h-10 w-10 text-white" />
        </button>
      )}
    </div>
  );
}
