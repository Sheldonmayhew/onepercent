import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';
import type { LookBeforeYouLeapState } from '../../../roundTypes/definitions/lookBeforeYouLeap';

interface BuzzEntry {
  playerId: string;
  timestamp: number;
}

const MULTIPLIERS = ['3x', '2x', '1.5x', '1x'];
const MULTIPLIER_COLOURS = ['text-neon-gold', 'text-neon-green', 'text-neon-cyan', 'text-text-secondary'];

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

  const state = roundState as LookBeforeYouLeapState & { buzzes?: BuzzEntry[] };
  const revealChunks: string[] = question.reveal_chunks ?? [];
  const revealedCount: number = state?.revealedChunks ?? 1;
  const buzzes: BuzzEntry[] = state?.buzzes ?? [];
  const [showFlash, setShowFlash] = useState(false);

  const totalChunks = Math.max(revealChunks.length, 1);
  const multiplierIndex = Math.min(
    Math.floor((revealedCount / totalChunks) * MULTIPLIERS.length),
    MULTIPLIERS.length - 1,
  );

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  // Flash on new buzz
  const [lastBuzzCount, setLastBuzzCount] = useState(buzzes.length);
  useEffect(() => {
    if (buzzes.length > lastBuzzCount) {
      setShowFlash(true);
      setLastBuzzCount(buzzes.length);
      const t = setTimeout(() => setShowFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [buzzes.length, lastBuzzCount]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">👀</span>
          <span className="font-display text-sm font-bold text-red-500 uppercase tracking-wider">
            Look Before You Leap
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

      {/* Multiplier bar */}
      <div className="px-6 mt-4">
        <div className="flex items-center justify-between bg-bg-card rounded-2xl px-6 py-3">
          <span className="text-sm text-text-muted font-display uppercase tracking-wider">Bonus</span>
          <div className="flex items-center gap-4">
            {MULTIPLIERS.map((m, i) => (
              <motion.span
                key={m}
                className={`font-score text-xl font-bold transition-all ${
                  i === multiplierIndex
                    ? `${MULTIPLIER_COLOURS[i]} scale-110`
                    : i < multiplierIndex
                    ? 'text-text-muted/30 line-through'
                    : 'text-text-muted/50'
                }`}
                animate={i === multiplierIndex ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {m}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* LOCKED IN flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="font-display text-6xl text-neon-green tracking-widest"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              LOCKED IN!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 px-6 py-6 gap-6">
        {/* Question with typewriter reveal */}
        <div className="flex-1">
          <motion.div
            className="bg-bg-card shadow-soft rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-6 min-h-[4rem]">
              {revealChunks.slice(0, revealedCount).map((chunk, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {chunk}{' '}
                </motion.span>
              ))}
              {revealedCount < totalChunks && (
                <motion.span
                  className="text-text-muted"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ???
                </motion.span>
              )}
            </div>

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

        {/* Player sidebar — who has buzzed */}
        <div className="w-64 shrink-0">
          <div className="bg-bg-card shadow-soft rounded-2xl p-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider mb-3">
              Buzz Status
            </h3>

            <div className="space-y-2">
              {players.map((player) => {
                const buzz = buzzes.find((b) => b.playerId === player.id);
                return (
                  <motion.div
                    key={player.id}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl ${
                      buzz ? 'bg-neon-green/10 ring-1 ring-neon-green/20' : 'bg-bg-elevated'
                    }`}
                    animate={buzz ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-sm text-text-primary font-medium flex-1 truncate">
                      {player.name}
                    </span>
                    {buzz ? (
                      <span className="text-neon-green text-xs font-bold">BUZZED</span>
                    ) : (
                      <span className="text-text-muted text-xs">waiting</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {allAnswersIn && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-xs text-neon-green font-display uppercase tracking-wider">
                  All Buzzed In!
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
