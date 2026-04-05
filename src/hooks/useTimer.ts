import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  duration: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeLeft: number;
  progress: number;
  isRunning: boolean;
  isExpired: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer({ duration, onExpire, autoStart = false }: UseTimerProps): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  onExpireRef.current = onExpire;

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsExpired(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    cleanup();
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setTimeLeft(duration);
    setIsRunning(false);
    setIsExpired(false);
  }, [duration, cleanup]);

  useEffect(() => {
    if (!isRunning || isExpired) {
      cleanup();
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + timeLeft * 1000;

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsRunning(false);
        setIsExpired(true);
        cleanup();
        onExpireRef.current?.();
      }
    }, 100);

    return cleanup;
  }, [isRunning, isExpired, cleanup]);

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration);
    setIsExpired(false);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [duration, autoStart]);

  const progress = duration > 0 ? timeLeft / duration : 0;

  return { timeLeft, progress, isRunning, isExpired, start, pause, reset };
}
