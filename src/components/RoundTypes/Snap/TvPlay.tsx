import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';
import type { SnapState } from '../../../roundTypes/definitions/snap';

export default function TvPlay({
  question,
  players,
  roundState,
  timerStarted,
  allAnswersIn: _allAnswersIn,
  roundIndex,
  difficulty,
  points,
}: TvPlayProps) {
  const state = roundState as SnapState;
  const diffColour = getDifficultyColour(difficulty);
  const revealedOptions: number[] = state?.revealedOptions ?? [];
  const buzzTimestamps: Record<string, number> = state?.buzzTimestamps ?? {};
  const buzzes: Array<{ playerId: string; timestamp: number }> = Object.entries(buzzTimestamps).map(([playerId, timestamp]) => ({ playerId, timestamp }));
  const { timeLeft, progress } = useTimer({
    duration: question.time_limit_seconds,
    autoStart: timerStarted,
  });

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  // Sort buzzes by timestamp for leaderboard
  const sortedBuzzes = [...buzzes].sort((a, b) => a.timestamp - b.timestamp);
  const buzzedPlayerIds = new Set(buzzes.map((b) => b.playerId));

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">⚡</span>
          <span className="font-display text-sm font-bold text-amber-400 uppercase tracking-wider">
            Snap
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
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-amber-400'
            }`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Time</span>
          <span
            className={`font-score text-sm font-bold tabular-nums ${
              isCritical ? 'text-neon-pink' : isUrgent ? 'text-neon-gold' : 'text-amber-400'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 px-6 py-6 gap-6">
        {/* Question + options */}
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

            {/* Options appear one at a time with fly-in */}
            {question.options && (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                  {revealedOptions.map((optIdx) => {
                    const option = question.options![optIdx];
                    if (!option) return null;

                    return (
                      <motion.div
                        key={optIdx}
                        className="flex items-center py-4 px-5 rounded-2xl bg-bg-elevated text-text-primary"
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                      >
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 text-sm font-bold mr-3 shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-lg font-medium">{option}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Player sidebar with buzz indicators + leaderboard */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Player list */}
          <div className="bg-bg-card shadow-soft rounded-2xl p-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider mb-3">
              Players
            </h3>
            <div className="space-y-2">
              {players.map((player) => {
                const hasBuzzed = buzzedPlayerIds.has(player.id);
                return (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bg-elevated"
                    animate={hasBuzzed ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.25 }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-sm text-text-primary font-medium flex-1 truncate">
                      {player.name}
                    </span>
                    {hasBuzzed ? (
                      <span className="text-amber-400 text-xs font-bold">⚡</span>
                    ) : (
                      <span className="text-text-muted text-xs">...</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Buzz order leaderboard */}
          {sortedBuzzes.length > 0 && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-2xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-display text-sm text-amber-400 uppercase tracking-wider mb-3">
                Buzz Order
              </h3>
              <div className="space-y-1.5">
                {sortedBuzzes.map((buzz, rank) => {
                  const player = players.find((p) => p.id === buzz.playerId);
                  if (!player) return null;
                  return (
                    <motion.div
                      key={buzz.playerId}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: rank * 0.08 }}
                    >
                      <span
                        className={`font-score text-sm font-bold w-6 text-center ${
                          rank === 0 ? 'text-neon-gold' : 'text-text-muted'
                        }`}
                      >
                        {rank + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: player.colour }}
                      />
                      <span className="text-sm text-text-primary flex-1 truncate">{player.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
