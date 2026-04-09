import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRands } from '../../../utils/helpers';
import type { TvRevealProps } from '../../../roundTypes/types';
import type { SnapState } from '../../../roundTypes/definitions/snap';

export default function TvReveal({
  question,
  players,
  roundState,
  correctAnswer,
  explanation,
  correctPlayerIds,
  scoreUpdates,
}: TvRevealProps) {
  const state = roundState as SnapState;
  const [phase, setPhase] = useState<'recap' | 'answer' | 'results'>('recap');
  const buzzTimestamps: Record<string, number> = state?.buzzTimestamps ?? {};
  const buzzes: Array<{ playerId: string; timestamp: number }> = Object.entries(buzzTimestamps).map(([playerId, timestamp]) => ({ playerId, timestamp }));
  const sortedBuzzes = [...buzzes].sort((a, b) => a.timestamp - b.timestamp);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('answer'), 2000);
    const t2 = setTimeout(() => setPhase('results'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const correctAnswerText =
    question.options && typeof correctAnswer === 'number'
      ? question.options[correctAnswer]
      : String(correctAnswer);

  const buzzedPlayerIds = new Set(buzzes.map((b) => b.playerId));

  // Find fastest correct buzzer
  const fastestCorrectId = sortedBuzzes.find((b) => correctPlayerIds.includes(b.playerId))?.playerId;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {/* Phase 1: Recap */}
        {phase === 'recap' && (
          <motion.div
            key="recap"
            className="text-center max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-text-muted text-sm uppercase tracking-widest mb-4 block">
              The Question Was...
            </span>
            <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
              {question.question}
            </p>
          </motion.div>
        )}

        {/* Phase 2: Answer */}
        {phase === 'answer' && (
          <motion.div
            key="answer"
            className="text-center max-w-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <span className="text-text-muted text-sm uppercase tracking-widest mb-4 block">
              The Correct Answer
            </span>
            <motion.div
              className="bg-bg-card shadow-soft rounded-3xl p-8 mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            >
              <p className="font-display text-4xl md:text-5xl font-bold text-neon-green">
                {correctAnswerText}
              </p>
            </motion.div>
            {explanation && (
              <motion.p
                className="text-text-secondary text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {explanation}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Phase 3: Results with buzz order */}
        {phase === 'results' && (
          <motion.div
            key="results"
            className="w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-display text-2xl text-text-primary text-center mb-6">Buzz Order</h2>

            <div className="space-y-3">
              {sortedBuzzes.map((buzz, rank) => {
                const player = players.find((p) => p.id === buzz.playerId);
                if (!player) return null;
                const isCorrect = correctPlayerIds.includes(player.id);
                const isFastest = player.id === fastestCorrectId;
                const update = scoreUpdates.find((u) => u.playerId === player.id);
                const delta = update?.delta ?? 0;

                return (
                  <motion.div
                    key={player.id}
                    className={`flex items-center gap-3 py-3 px-4 rounded-2xl ${
                      isFastest
                        ? 'bg-neon-gold/15 ring-1 ring-neon-gold/30'
                        : isCorrect
                          ? 'bg-neon-green/10'
                          : 'bg-neon-pink/10'
                    }`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rank * 0.12 }}
                  >
                    <span
                      className={`font-score text-lg font-bold w-8 text-center ${
                        rank === 0 ? 'text-neon-gold' : 'text-text-muted'
                      }`}
                    >
                      #{rank + 1}
                    </span>
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-text-primary font-medium flex-1">{player.name}</span>

                    {isFastest && (
                      <span className="text-xs font-display text-neon-gold uppercase tracking-wider">
                        Fastest
                      </span>
                    )}

                    <span className={`text-lg font-bold ${isCorrect ? 'text-neon-green' : 'text-neon-pink'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>

                    {delta !== 0 && (
                      <motion.span
                        className={`font-score text-sm font-bold ${
                          delta > 0 ? 'text-neon-gold' : 'text-neon-pink'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: rank * 0.12 + 0.3 }}
                      >
                        {delta > 0 ? '+' : ''}
                        {formatRands(delta)}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}

              {/* Players who didn't buzz */}
              {players
                .filter((p) => !buzzedPlayerIds.has(p.id))
                .map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-bg-elevated/50 opacity-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: sortedBuzzes.length * 0.12 + i * 0.08 }}
                  >
                    <span className="font-score text-lg font-bold w-8 text-center text-text-muted">-</span>
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-text-muted font-medium flex-1">{player.name}</span>
                    <span className="text-xs text-text-muted">No buzz</span>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
