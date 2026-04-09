import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';
import type { PointStealerState } from '../../../roundTypes/definitions/pointStealer';

export default function TvPlay({
  question,
  players,
  roundState,
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

  const state = roundState as PointStealerState;
  const phase = state?.phase ?? 'answering';
  const correctPlayerIds: string[] = state?.correctPlayerIds ?? [];
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
          <span className="text-2xl">🏴‍☠️</span>
          <span className="font-display text-sm font-bold text-neon-pink uppercase tracking-wider">
            Point Stealer
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Timer bar (answer phase only) */}
      {phase === 'answering' && (
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
      )}

      {/* Main content */}
      <div className="flex flex-1 px-6 py-6 gap-6">
        <AnimatePresence mode="wait">
          {phase === 'answering' && (
            <motion.div
              key="answer-phase"
              className="flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <div className="bg-bg-card shadow-soft rounded-3xl p-8">
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
              </div>
            </motion.div>
          )}

          {phase === 'stealing' && (
            <motion.div
              key="steal-phase"
              className="flex-1 flex flex-col items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.h2
                className="font-display text-4xl md:text-5xl text-neon-pink tracking-wider mb-10 text-center"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                WHO DO YOU STEAL FROM?
              </motion.h2>

              {/* Opponent portraits grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-6 max-w-3xl">
                {players.map((player) => {
                  const isCorrect = correctPlayerIds.includes(player.id);
                  const hasChosen = !!player.stealTarget;
                  return (
                    <motion.div
                      key={player.id}
                      className={`flex flex-col items-center p-4 rounded-2xl ${
                        isCorrect ? 'bg-neon-pink/10 ring-1 ring-neon-pink/30' : 'bg-bg-elevated'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <motion.span
                        className="text-5xl mb-2"
                        animate={isCorrect && !hasChosen ? { y: [0, -4, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        {player.avatar}
                      </motion.span>
                      <span className="text-sm font-medium text-text-primary truncate w-full text-center">
                        {player.name}
                      </span>
                      {isCorrect && (
                        <span className="text-xs mt-1">
                          {hasChosen ? (
                            <span className="text-neon-green">Target chosen</span>
                          ) : (
                            <motion.span
                              className="text-neon-pink"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                            >
                              Choosing...
                            </motion.span>
                          )}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-bg-card shadow-soft rounded-2xl p-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider mb-3">
              Players
            </h3>

            <div className="mb-4 px-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{phase === 'answering' ? 'Answered' : 'Steals chosen'}</span>
                <span className="font-score text-neon-cyan">
                  {answeredCount}/{players.length}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-neon-pink"
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
