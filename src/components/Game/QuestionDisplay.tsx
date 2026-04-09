import { motion } from 'framer-motion';
import type { Question } from '../../types';
import { formatRands } from '../../utils/helpers';

interface QuestionDisplayProps {
  question: Question;
  roundIndex: number;
  difficulty: number;
  points: number;
  totalRounds: number;
  categoryName?: string;
  playerName?: string;
  playerColour?: string;
  timeLeft?: number;
  timerProgress?: number;
  showTimer?: boolean;
  questionInRound?: number;
  questionsInRound?: number;
}

export default function QuestionDisplay({
  question,
  roundIndex,
  points,
  totalRounds,
  categoryName,
  playerName,
  playerColour,
  timeLeft,
  timerProgress,
  showTimer = false,
  questionInRound = 0,
  questionsInRound = 1,
}: QuestionDisplayProps) {
  const isUrgent = (timeLeft ?? 99) <= 5;
  const isCritical = (timeLeft ?? 99) <= 3;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Header above the card ── */}
      <div className="flex items-start justify-between mb-1">
        <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
          Round {roundIndex + 1} of {totalRounds}
          {questionsInRound > 1 && (
            <span className="text-text-muted font-normal ml-2">
              Q{questionInRound + 1}/{questionsInRound}
            </span>
          )}
        </span>
        {playerName && (
          <span className="inline-flex items-center gap-2 bg-bg-card shadow-soft rounded-full px-3 py-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: playerColour ?? '#22C55E' }}
            />
            <span className="text-sm font-medium text-text-primary">{playerName}'s turn</span>
          </span>
        )}
      </div>

      {/* Worth */}
      <p className="font-display text-2xl font-bold italic text-neon-purple mb-3">
        Worth {formatRands(points)}
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < roundIndex
                ? 'flex-1 bg-neon-cyan'
                : i === roundIndex
                  ? 'flex-[1.5] bg-neon-cyan'
                  : 'flex-1 bg-bg-elevated'
            }`}
          />
        ))}
      </div>

      {/* ── Question card ── */}
      <motion.div
        className="bg-bg-card shadow-soft-md rounded-3xl p-5 md:p-7"
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Card top row: category + timer */}
        <div className="flex items-center justify-between mb-4">
          {categoryName && (
            <span className="inline-block px-3 py-1 rounded-full bg-bg-elevated text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              {categoryName}
            </span>
          )}
          {showTimer && timeLeft !== undefined && (
            <span className={`inline-flex items-center gap-1.5 font-score text-xl font-bold tabular-nums ${
              isCritical
                ? 'text-neon-pink animate-timer-pulse'
                : isUrgent
                  ? 'text-neon-gold'
                  : 'text-neon-cyan'
            }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              {timeLeft}
            </span>
          )}
        </div>

        {/* Question text */}
        <p className="text-xl md:text-2xl font-bold text-text-primary leading-snug text-left">
          {question.question}
        </p>

        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question visual"
            className="mt-4 rounded-xl max-h-64 mx-auto object-contain"
          />
        )}

        {/* Timer bar inside card */}
        {showTimer && timerProgress !== undefined && (
          <div className="mt-5">
            <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-300 ${
                  isCritical
                    ? 'bg-neon-pink'
                    : isUrgent
                      ? 'bg-neon-gold'
                      : 'bg-neon-gold'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${timerProgress * 100}%` }}
                transition={{ duration: 0.3, ease: 'linear' }}
              />
            </div>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                Time Remaining
              </span>
              <span className="text-xs font-score font-medium text-text-muted tabular-nums">
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
