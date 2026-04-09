import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import type { PointStealerState } from '../../../roundTypes/definitions/pointStealer';
import { useSound } from '../../../hooks/useSound';

interface StealResult {
  stealerId: string;
  victimId: string;
  amount: number;
}

export default function TvReveal({ question, players, roundState, correctAnswer, explanation: _explanation, correctPlayerIds: correctPlayerIdsProp, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates: _scoreUpdates, theme: _theme }: TvRevealProps) {
  const state = roundState as PointStealerState;
  const [phase, setPhase] = useState(0);
  const { play } = useSound();
  const correctPlayerIds: string[] = state?.correctPlayerIds ?? correctPlayerIdsProp;
  const stealResults: StealResult[] = (state as any)?.stealResults ?? [];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => {
        setPhase(2);
        play('correct_reveal');
      }, 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [play]);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* Phase 0: Question recap */}
        {phase === 0 && (
          <motion.div
            key="recap"
            className="max-w-3xl w-full text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-display text-sm text-neon-pink uppercase tracking-widest mb-6">
              Point Stealer — Recap
            </p>
            <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
              {question.question}
            </p>
          </motion.div>
        )}

        {/* Phase 1: Answer reveal */}
        {phase === 1 && (
          <motion.div
            key="answer"
            className="max-w-3xl w-full text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-display text-sm text-text-muted uppercase tracking-widest mb-4">
              The Answer
            </p>

            {question.options ? (
              <motion.div
                className="inline-block px-8 py-4 rounded-2xl bg-neon-green/10 ring-2 ring-neon-green"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <span className="font-display text-3xl text-neon-green">
                  {question.options[Number(correctAnswer)]}
                </span>
              </motion.div>
            ) : (
              <motion.span
                className="font-score text-5xl text-neon-green"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
              >
                {String(correctAnswer)}
              </motion.span>
            )}

            {/* Correct / incorrect indicators */}
            <div className="flex justify-center gap-4 mt-8">
              {players.map((player) => {
                const isCorrect = correctPlayerIds.includes(player.id);
                return (
                  <motion.div
                    key={player.id}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-3xl mb-1">{player.avatar}</span>
                    <span className={`text-xs font-bold ${isCorrect ? 'text-neon-green' : 'text-neon-pink'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phase 2: Steal results */}
        {phase === 2 && (
          <motion.div
            key="steals"
            className="max-w-4xl w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h2
              className="font-display text-4xl text-neon-pink text-center tracking-wider mb-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              STEAL RESULTS
            </motion.h2>

            {stealResults.length === 0 ? (
              <p className="text-center text-text-muted text-lg">No steals this round!</p>
            ) : (
              <div className="space-y-6">
                {stealResults.map((steal, idx) => {
                  const stealer = getPlayer(steal.stealerId);
                  const victim = getPlayer(steal.victimId);
                  if (!stealer || !victim) return null;

                  return (
                    <motion.div
                      key={idx}
                      className="flex items-center justify-center gap-6"
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.5 + 0.3 }}
                    >
                      {/* Victim */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="relative"
                          animate={{
                            boxShadow: [
                              '0 0 0px rgba(239,68,68,0)',
                              '0 0 30px rgba(239,68,68,0.6)',
                              '0 0 15px rgba(239,68,68,0.3)',
                            ],
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <span className="text-5xl block p-3 rounded-full bg-red-500/10">
                            {victim.avatar}
                          </span>
                        </motion.div>
                        <span className="text-sm text-text-primary mt-2 font-medium">{victim.name}</span>
                        <span className="text-xs text-neon-pink font-score">
                          -{steal.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Arrow — animated point transfer */}
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: idx * 0.5 + 0.6, type: 'spring' }}
                      >
                        <motion.div
                          className="flex items-center"
                          animate={{ x: [0, 8, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <div className="w-16 md:w-24 h-0.5 bg-gradient-to-r from-neon-pink to-neon-gold" />
                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-neon-gold" />
                        </motion.div>
                        <motion.span
                          className="font-score text-lg text-neon-gold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.5 + 0.8 }}
                        >
                          {steal.amount.toLocaleString()}
                        </motion.span>
                      </motion.div>

                      {/* Stealer */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="relative"
                          animate={{
                            boxShadow: [
                              '0 0 0px rgba(253,212,4,0)',
                              '0 0 30px rgba(253,212,4,0.6)',
                              '0 0 15px rgba(253,212,4,0.3)',
                            ],
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <span className="text-5xl block p-3 rounded-full bg-neon-gold/10">
                            {stealer.avatar}
                          </span>
                        </motion.div>
                        <span className="text-sm text-text-primary mt-2 font-medium">{stealer.name}</span>
                        <span className="text-xs text-neon-green font-score">
                          +{steal.amount.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
