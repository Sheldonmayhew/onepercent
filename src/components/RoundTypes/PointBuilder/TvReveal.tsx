import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRands } from '../../../utils/helpers';
import type { TvRevealProps } from '../../../roundTypes/types';

export default function TvReveal({
  question,
  players,
  correctAnswer,
  explanation,
  correctPlayerIds,
  incorrectPlayerIds: _incorrectPlayerIds,
  scoreUpdates,
}: TvRevealProps) {
  const [phase, setPhase] = useState<'recap' | 'answer' | 'results'>('recap');

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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {/* Phase 1: Question recap */}
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

        {/* Phase 2: Correct answer */}
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

        {/* Phase 3: Results */}
        {phase === 'results' && (
          <motion.div
            key="results"
            className="w-full max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-display text-2xl text-text-primary text-center mb-6">Results</h2>

            <div className="space-y-3">
              {players.map((player, i) => {
                const isCorrect = correctPlayerIds.includes(player.id);
                const update = scoreUpdates.find((u) => u.playerId === player.id);
                const delta = update?.delta ?? 0;

                return (
                  <motion.div
                    key={player.id}
                    className={`flex items-center gap-3 py-3 px-4 rounded-2xl ${
                      isCorrect ? 'bg-neon-green/10' : 'bg-neon-pink/10'
                    }`}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-text-primary font-medium flex-1">{player.name}</span>
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
                        transition={{ type: 'spring', delay: i * 0.1 + 0.3 }}
                      >
                        {delta > 0 ? '+' : ''}
                        {formatRands(delta)}
                      </motion.span>
                    )}
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
