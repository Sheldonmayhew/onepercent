import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TvPlayProps } from '../../../roundTypes/types';
import { useTimer } from '../../../hooks/useTimer';
import { useSound } from '../../../hooks/useSound';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';

export default function TvPlay({ question, players, roundState: _roundState, timerStarted, allAnswersIn: _allAnswersIn, roundIndex, difficulty, points, theme: _theme }: TvPlayProps) {
  const { play } = useSound();
  const prevTimeLeft = useRef<number | null>(null);

  const timerDuration = 30;
  const { timeLeft, progress, isExpired, start } = useTimer({
    duration: timerDuration,
    autoStart: false,
  });

  useEffect(() => {
    if (timerStarted) start();
  }, [timerStarted, start]);

  useEffect(() => {
    if (!timerStarted) return;
    if (prevTimeLeft.current !== null && timeLeft !== prevTimeLeft.current && timeLeft <= 5 && timeLeft > 0) {
      play('timer_tick');
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, timerStarted, play]);

  useEffect(() => {
    if (isExpired) play('timer_expired');
  }, [isExpired, play]);

  const answeredCount = players.filter((p) => p.hasAnswered).length;
  const diffColour = getDifficultyColour(difficulty);
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;
  const items = question.sequence_items ?? question.options ?? [];
  const criterion = question.ranking_criterion ?? 'Rank these items';

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">
            {formatRands(points)}
          </span>
        </div>

        {timerStarted && (
          <motion.div
            className={`font-score text-6xl font-bold tabular-nums ${
              isCritical ? 'text-neon-pink animate-timer-pulse' : isUrgent ? 'text-neon-gold' : 'text-neon-cyan'
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
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-orange-400'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Question area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {question.category && (
            <span className="inline-block self-start px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
              {question.category}
            </span>
          )}

          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug">
            {question.question}
          </h2>

          {/* Ranking criterion */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <span className="text-lg text-orange-400 font-display font-bold tracking-wide">
              {criterion}
            </span>
          </div>

          {/* Items as numbered cards */}
          <div className="flex flex-col gap-3 mt-2">
            {items.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 bg-bg-card shadow-soft rounded-xl px-5 py-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <span className="w-10 h-10 rounded-full bg-orange-400/15 flex items-center justify-center font-display text-lg text-orange-400 font-bold">
                  {i + 1}
                </span>
                <span className="text-lg text-text-primary font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Player sidebar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-sm text-text-muted tracking-[0.15em] uppercase">Players</h3>
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

      {/* Waiting state */}
      {!timerStarted && (
        <motion.div
          className="flex items-center justify-center gap-3 mt-6"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <p className="text-text-muted text-lg">Waiting for host to start the round...</p>
        </motion.div>
      )}
    </div>
  );
}
