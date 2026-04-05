import { motion } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
  progress: number;
}

export default function Timer({ timeLeft, progress }: TimerProps) {
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="w-full">
      {/* Time display */}
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Time</span>
        <span
          className={`font-score text-2xl font-bold tabular-nums transition-colors ${
            isCritical
              ? 'text-neon-pink glow-pink animate-timer-pulse'
              : isUrgent
                ? 'text-neon-gold glow-gold'
                : 'text-neon-cyan glow-cyan'
          }`}
        >
          {timeLeft}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${
            isCritical
              ? 'bg-neon-pink shadow-[0_0_12px_rgba(255,45,107,0.5)]'
              : isUrgent
                ? 'bg-neon-gold shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                : 'bg-neon-cyan shadow-[0_0_12px_rgba(0,229,255,0.4)]'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
