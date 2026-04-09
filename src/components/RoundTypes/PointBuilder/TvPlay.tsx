import { motion } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';

export default function TvPlay({
  question,
  players,
  timerStarted,
  allAnswersIn,
  roundIndex,
  difficulty,
  points,
}: TvPlayProps) {
  const diffColour = getDifficultyColour(difficulty);
  const { timeLeft, progress } = useTimer({
    duration: question.time_limit_seconds,
    autoStart: timerStarted,
  });

  const answeredCount = players.filter((p) => p.hasAnswered).length;
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">🧱</span>
          <span className="font-display text-sm font-bold text-neon-green uppercase tracking-wider">
            Point Builder
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="px-6">
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-neon-cyan'
            }`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Time</span>
          <span
            className={`font-score text-sm font-bold tabular-nums ${
              isCritical ? 'text-neon-pink' : isUrgent ? 'text-neon-gold' : 'text-neon-cyan'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 px-6 py-6 gap-6">
        {/* Question section */}
        <div className="flex-1">
          <motion.div
            className="bg-bg-card shadow-soft rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {question.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                {question.category}
              </span>
            )}
            <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-6">
              {question.question}
            </p>

            {question.image_url && (
              <img
                src={question.image_url}
                alt="Question visual"
                className="rounded-xl max-h-64 mx-auto object-contain mb-6"
              />
            )}

            {/* Options grid */}
            {question.options && (
              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center py-4 px-5 rounded-2xl bg-bg-elevated text-text-primary"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-container/20 text-neon-cyan text-sm font-bold mr-3 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-lg font-medium">{option}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Player sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-bg-card shadow-soft rounded-2xl p-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider mb-3">
              Players
            </h3>

            {/* Building score animation */}
            <div className="mb-4 px-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Answered</span>
                <span className="font-score text-neon-cyan">
                  {answeredCount}/{players.length}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-neon-green"
                  animate={{ width: `${(answeredCount / Math.max(players.length, 1)) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bg-elevated"
                  animate={player.hasAnswered ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: player.colour }}
                  />
                  <span className="text-sm text-text-primary font-medium flex-1 truncate">
                    {player.name}
                  </span>
                  {player.hasAnswered ? (
                    <span className="text-neon-green text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-text-muted text-xs">...</span>
                  )}
                </motion.div>
              ))}
            </div>

            {allAnswersIn && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-xs text-neon-green font-display uppercase tracking-wider">
                  All Locked In!
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
