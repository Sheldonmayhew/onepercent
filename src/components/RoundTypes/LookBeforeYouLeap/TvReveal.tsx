import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import { useSound } from '../../../hooks/useSound';

interface BuzzEntry {
  playerId: string;
  timestamp: number;
  multiplier: string;
  correct: boolean;
}

export default function TvReveal({ question, players, roundState, correctAnswer: correctAnswerProp, explanation: _explanation, correctPlayerIds: _correctPlayerIds, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates, theme: _theme }: TvRevealProps) {
  const state = roundState as { buzzes?: BuzzEntry[] };
  const [phase, setPhase] = useState(0);
  const { play } = useSound();
  const buzzes: BuzzEntry[] = state?.buzzes ?? [];
  // Derive base points from scoreUpdates
  const points = scoreUpdates?.reduce((max, u) => Math.max(max, u.delta), 0) ?? 0;
  const revealChunks: string[] = question.reveal_chunks ?? [];
  const fullText = revealChunks.join(' ') || question.question;

  // Sort buzzes by timestamp (earliest first)
  const sortedBuzzes = [...buzzes].sort((a, b) => a.timestamp - b.timestamp);
  const earliestTimestamp = sortedBuzzes[0]?.timestamp ?? 0;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => {
        setPhase(2);
        play('correct_reveal');
      }, 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [play]);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* Phase 0: Full question reveal */}
        {phase === 0 && (
          <motion.div
            key="full-q"
            className="max-w-3xl w-full text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-display text-sm text-red-500 uppercase tracking-widest mb-6">
              Full Question
            </p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
              {fullText}
            </p>
          </motion.div>
        )}

        {/* Phase 1: Answer + buzz timeline */}
        {phase === 1 && (
          <motion.div
            key="timeline"
            className="max-w-3xl w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Answer */}
            <p className="font-display text-sm text-text-muted uppercase tracking-widest mb-4">
              The Answer
            </p>
            {question.options ? (
              <motion.div
                className="inline-block px-8 py-4 rounded-2xl bg-neon-green/10 ring-2 ring-neon-green mb-8"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <span className="font-display text-3xl text-neon-green">
                  {question.options[Number(correctAnswerProp)]}
                </span>
              </motion.div>
            ) : (
              <motion.span
                className="font-score text-5xl text-neon-green block mb-8"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
              >
                {String(correctAnswerProp)}
              </motion.span>
            )}

            {/* Buzz timeline */}
            <p className="font-display text-sm text-text-muted uppercase tracking-widest mb-4">
              Buzz Timeline
            </p>
            <div className="space-y-3">
              {sortedBuzzes.map((buzz, idx) => {
                const player = getPlayer(buzz.playerId);
                if (!player) return null;
                const offset = ((buzz.timestamp - earliestTimestamp) / 1000).toFixed(2);
                return (
                  <motion.div
                    key={buzz.playerId}
                    className="flex items-center justify-between px-5 py-3 rounded-xl bg-bg-card"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 + 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-score text-lg text-text-muted w-6">#{idx + 1}</span>
                      <span className="text-2xl">{player.avatar}</span>
                      <span className="text-text-primary font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-score text-sm text-text-muted">+{offset}s</span>
                      <span className="font-score text-lg font-bold text-neon-gold">{buzz.multiplier}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phase 2: Multiplier results */}
        {phase === 2 && (
          <motion.div
            key="results"
            className="max-w-3xl w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h2
              className="font-display text-4xl text-center tracking-wider mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-neon-gold">BONUS RESULTS</span>
            </motion.h2>

            <div className="space-y-4">
              {sortedBuzzes.map((buzz, idx) => {
                const player = getPlayer(buzz.playerId);
                if (!player) return null;
                const isCorrect = buzz.correct;

                return (
                  <motion.div
                    key={buzz.playerId}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl ${
                      isCorrect
                        ? 'bg-neon-green/10 ring-1 ring-neon-green/30'
                        : 'bg-neon-pink/10 ring-1 ring-neon-pink/30'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.3 + 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="text-4xl"
                        animate={isCorrect ? { scale: [1, 1.2, 1] } : { opacity: [1, 0.5, 1] }}
                        transition={{ repeat: isCorrect ? 2 : 0, duration: 0.4, delay: idx * 0.3 + 0.5 }}
                      >
                        {player.avatar}
                      </motion.span>
                      <div>
                        <p className="text-text-primary font-medium">{player.name}</p>
                        <p className="text-xs text-text-muted">Buzzed at {buzz.multiplier}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCorrect ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: idx * 0.3 + 0.6 }}
                        >
                          <p className="font-score text-2xl text-neon-green font-bold">
                            +{(points * parseFloat(buzz.multiplier)).toLocaleString()}
                          </p>
                          <p className="text-xs text-neon-gold">{buzz.multiplier} bonus!</p>
                        </motion.div>
                      ) : (
                        <motion.p
                          className="font-display text-lg text-neon-pink tracking-wide"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.3 + 0.5 }}
                        >
                          WRONG
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
