import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { useTimer } from '../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

interface TvPlayProps {
  gameState: GameBroadcast;
}

export default function TvPlay({ gameState }: TvPlayProps) {
  const round = gameState.round;
  const players = gameState.players;
  const timerStarted = gameState.timerStarted ?? false;

  const timerDuration = round?.timerDuration ?? 30;
  const { timeLeft, progress, start } = useTimer({
    duration: timerDuration,
    autoStart: false,
  });

  useEffect(() => {
    if (timerStarted) {
      start();
    }
  }, [timerStarted, start]);

  if (!round) return null;

  const answeredCount = players.filter((p) => p.hasAnswered).length;
  const diffColour = getDifficultyColour(round.difficulty);
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      {/* Top bar: round info + timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg text-text-secondary uppercase tracking-wider">
            Round {round.index + 1} of {round.totalRounds}
          </span>
          <span
            className="font-display text-lg font-bold"
            style={{ color: diffColour }}
          >
            {round.difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">
            {formatRands(round.points)}
          </span>
        </div>

        {/* Timer */}
        {timerStarted && (
          <motion.div
            className={`font-score text-6xl font-bold tabular-nums ${
              isCritical
                ? 'text-neon-pink animate-timer-pulse'
                : isUrgent
                  ? 'text-neon-gold'
                  : 'text-neon-cyan'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {timeLeft}
          </motion.div>
        )}
      </div>

      {/* Timer bar */}
      {timerStarted && (
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden mb-8">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-neon-cyan'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* Main content: question + options on left, players on right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Question area — takes 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Category */}
          {round.categoryName && (
            <span className="inline-block self-start px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
              {round.categoryName}
            </span>
          )}

          {/* Question text */}
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug">
            {round.question.question}
          </h2>

          {/* Image */}
          {round.question.image_url && (
            <img
              src={round.question.image_url}
              alt="Question visual"
              className="rounded-2xl max-h-72 object-contain"
            />
          )}

          {/* Options (for multiple choice / image based) */}
          {round.question.options && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {round.question.options.map((option, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-4"
                >
                  <span className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center font-display text-sm text-text-secondary font-bold">
                    {optionLetters[i]}
                  </span>
                  <span className="text-lg text-text-primary font-medium">{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sequence items (for sequence type) */}
          {round.question.type === 'sequence' && round.question.sequence_items && (
            <div className="flex flex-wrap gap-3 mt-2">
              {round.question.sequence_items.map((item, i) => (
                <div
                  key={i}
                  className="bg-bg-card shadow-soft rounded-xl px-5 py-3 text-lg text-text-primary font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players sidebar — 1/3 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-sm text-text-muted tracking-[0.15em] uppercase">
              Players
            </h3>
            <span className="font-score text-sm text-neon-cyan">
              {answeredCount}/{players.length}
            </span>
          </div>

          {players.map((player) => (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                player.hasAnswered
                  ? 'bg-neon-green/10 border border-neon-green/20'
                  : 'bg-bg-card shadow-soft'
              }`}
            >
              <span className="text-2xl">{player.avatar}</span>
              <span className="flex-1 text-text-primary font-medium">{player.name}</span>
              {player.hasAnswered && (
                <motion.span
                  className="text-neon-green text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  ✓
                </motion.span>
              )}
              <span className="text-xs text-text-muted font-score">
                R{player.score.toLocaleString('en-ZA')}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Waiting for timer start */}
      {!timerStarted && (
        <motion.div
          className="flex items-center justify-center gap-3 mt-6"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-3 h-3 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-lg">Waiting for host to start the round...</p>
        </motion.div>
      )}
    </div>
  );
}
