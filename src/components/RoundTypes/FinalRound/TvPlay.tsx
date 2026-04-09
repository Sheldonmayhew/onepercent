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
  const alivePlayers = players.filter((p) => !p.eliminated);
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Red vignette edges */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(220,38,38,0.25) 100%)',
          }}
        />
      </div>

      {/* SUDDEN DEATH banner */}
      <motion.div
        className="w-full py-2 bg-gradient-to-r from-transparent via-red-600/30 to-transparent text-center relative z-10"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="font-display text-sm text-red-400 uppercase tracking-[0.4em]">
          SUDDEN DEATH
        </span>
      </motion.div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">💀</span>
          <span className="font-display text-sm font-bold text-red-500 uppercase tracking-wider">
            Final Round
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Timer bar with heartbeat animation */}
      <div className="px-6 relative z-10">
        <motion.div
          className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden"
          animate={isCritical ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              isCritical ? 'bg-red-500' : isUrgent ? 'bg-neon-pink' : 'bg-neon-cyan'
            }`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </motion.div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Time</span>
          <motion.span
            className={`font-score text-sm font-bold tabular-nums ${
              isCritical ? 'text-red-500' : isUrgent ? 'text-neon-pink' : 'text-neon-cyan'
            }`}
            animate={isCritical ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            {timeLeft}s
          </motion.span>
        </div>
      </div>

      {/* Player avatars — each glowing with life */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 relative z-10">
        {alivePlayers.map((player, idx) => (
          <motion.div
            key={player.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <motion.span
              className="text-4xl"
              animate={{
                filter: [
                  'drop-shadow(0 0 4px rgba(34,197,94,0.3))',
                  'drop-shadow(0 0 12px rgba(34,197,94,0.6))',
                  'drop-shadow(0 0 4px rgba(34,197,94,0.3))',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
            >
              {player.avatar}
            </motion.span>
            <span className="text-xs text-text-muted mt-1 truncate max-w-[60px]">
              {player.name}
            </span>
            {player.hasAnswered && (
              <span className="text-neon-green text-xs mt-0.5">✓</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Main question area */}
      <div className="flex flex-1 px-6 py-4 gap-6 relative z-10">
        <div className="flex-1">
          <motion.div
            className="bg-bg-card/90 shadow-soft rounded-3xl p-8 border border-red-900/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {question.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-red-900/20 text-xs font-bold text-red-400 uppercase tracking-wider mb-4">
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
                    className="flex items-center py-4 px-5 rounded-2xl bg-bg-elevated/80 text-text-primary border border-red-900/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-900/20 text-red-400 text-sm font-bold mr-3 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-lg font-medium">{option}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-bg-card/80 shadow-soft rounded-2xl p-4 border border-red-900/20">
            <h3 className="font-display text-sm text-red-400 uppercase tracking-wider mb-3">
              Survivors
            </h3>
            <div className="mb-3 px-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Answered</span>
                <span className="font-score text-neon-cyan">
                  {answeredCount}/{alivePlayers.length}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-red-500"
                  animate={{ width: `${(answeredCount / Math.max(alivePlayers.length, 1)) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {alivePlayers.map((player) => (
                <motion.div
                  key={player.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bg-elevated/80"
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
