import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface TimerProps {
  duration: number; // в секундах
}

export function Timer({ duration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="text-5xl font-mono font-bold tracking-wider">
            {formattedTime}
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={handlePlayPause}
              disabled={timeLeft === 0}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Пауза
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Старт
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Сброс
            </Button>
          </div>

          {timeLeft === 0 && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Упражнение завершено!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
