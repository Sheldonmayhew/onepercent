import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands } from '../../utils/helpers';
import { POINTS_PER_ROUND } from '../../types';

interface TvRevealProps {
  gameState: GameBroadcast;
}

type Phase = 'answer' | 'results';

export default function TvReveal({ gameState }: TvRevealProps) {
  const { players, reveal, round } = gameState;
  const [phase, setPhase] = useState<Phase>('answer');

  const difficulty = round?.difficulty ?? 90;
  const pointsAtStake = POINTS_PER_ROUND[difficulty] ?? 0;

  useEffect(() => {
    setPhase('answer');
    const timer = setTimeout(() => setPhase('results'), 2000);
    return () => clearTimeout(timer);
  }, [reveal?.correctAnswer]);

  if (!reveal) return null;

  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal.incorrectPlayerIds.includes(p.id));

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Correct answer card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-3xl p-8 lg:p-10 flex flex-col items-center gap-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <span className="text-sm text-text-muted tracking-[0.2em] uppercase">
            Correct Answer
          </span>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-neon-green text-center">
            {reveal.correctAnswer}
          </h2>
          {reveal.explanation && (
            <p className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl">
              {reveal.explanation}
            </p>
          )}
          <span className="font-score text-xl text-neon-gold">
            Worth {formatRands(pointsAtStake)}
          </span>
        </motion.div>

        {/* Player results — animate in after delay */}
        <AnimatePresence>
          {phase === 'results' && (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Correct */}
              {correctPlayers.length > 0 && (
                <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-6">
                  <h3 className="text-sm text-neon-green tracking-[0.15em] uppercase mb-4">
                    Correct
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {correctPlayers.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-green/10 border border-neon-green/20"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-lg text-text-primary font-medium">{p.name}</span>
                        <span className="text-neon-green font-score">
                          +{formatRands(pointsAtStake)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incorrect */}
              {incorrectPlayers.length > 0 && (
                <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-2xl p-6">
                  <h3 className="text-sm text-neon-pink tracking-[0.15em] uppercase mb-4">
                    Incorrect
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {incorrectPlayers.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-pink/10 border border-neon-pink/20"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-lg text-text-primary font-medium">{p.name}</span>
                        <span className="text-text-muted">--</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live leaderboard */}
        <AnimatePresence>
          {phase === 'results' && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-2xl p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
                Leaderboard
              </h3>
              <div className="flex flex-wrap gap-3">
                {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                  <motion.div
                    key={p.id}
                    layout
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated"
                  >
                    <span className={`font-score text-sm w-5 text-center ${
                      idx === 0 ? 'text-neon-gold' : 'text-text-muted'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span className="text-xl">{p.avatar}</span>
                    <span className="text-text-primary font-medium">{p.name}</span>
                    <span className="font-score text-neon-gold text-sm">
                      {formatRands(p.score)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
