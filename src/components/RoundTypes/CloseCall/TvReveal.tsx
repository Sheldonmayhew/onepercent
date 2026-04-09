import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import { useSound } from '../../../hooks/useSound';
import { formatRands } from '../../../utils/helpers';

type Phase = 'scrambled' | 'cascade' | 'results';

export default function TvReveal({ question, players, roundState: _roundState, correctAnswer, explanation: _explanation, correctPlayerIds, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates, theme: _theme }: TvRevealProps) {
  const [phase, setPhase] = useState<Phase>('scrambled');
  const { play } = useSound();
  const soundPlayed = useRef(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const items = question.sequence_items ?? question.options ?? [];
  const correctOrder = question.correct_answers ?? [];

  // Build the correct ordered items list
  const correctItems = correctOrder.length > 0
    ? correctOrder.map((idx) => items[idx] ?? `Item ${idx}`)
    : items;

  useEffect(() => {
    setPhase('scrambled');
    soundPlayed.current = false;
    const t1 = setTimeout(() => setPhase('cascade'), 2500);
    const t2 = setTimeout(() => setPhase('results'), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [correctAnswer]);

  useEffect(() => {
    if (phase === 'results' && !soundPlayed.current) {
      soundPlayed.current = true;
      const anyCorrect = correctPlayerIds.length > 0;
      play(anyCorrect ? 'correct_reveal' : 'wrong_reveal');
    }
  }, [phase, correctPlayerIds, play]);

  // Get per-player score delta
  const getPlayerDelta = (playerId: string): number => {
    const update = scoreUpdates?.find((u) => u.playerId === playerId);
    return update?.delta ?? 0;
  };

  // Derive points from max delta for closeness calculation
  const maxDelta = scoreUpdates?.reduce((max, u) => Math.max(max, u.delta), 0) ?? 0;

  // Calculate closeness percentage for display (0-100)
  const getCloseness = (playerId: string): number => {
    const delta = getPlayerDelta(playerId);
    if (delta <= 0) return 0;
    if (maxDelta <= 0) return 0;
    return Math.round((delta / maxDelta) * 100);
  };

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* Criterion */}
          {question.ranking_criterion && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="text-lg text-orange-400 font-display font-bold tracking-wide">{question.ranking_criterion}</span>
            </div>
          )}

          {/* Phase 1: Scrambled order */}
          <AnimatePresence mode="wait">
            {phase === 'scrambled' && (
              <motion.div
                key="scrambled"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl lg:text-3xl font-bold text-text-primary text-center mb-2">
                  {question.question}
                </h2>
                <div className="flex flex-col gap-3 w-full max-w-lg">
                  {items.map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-4 bg-bg-card shadow-soft rounded-xl px-5 py-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <span className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center font-display text-sm text-text-muted font-bold">
                        ?
                      </span>
                      <span className="text-lg text-text-primary font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  className="text-text-muted text-lg mt-4"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  Rearranging into correct order...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Cascade into correct order */}
          <AnimatePresence>
            {(phase === 'cascade' || phase === 'results') && (
              <motion.div
                key="cascade"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
                  {question.question}
                </p>
                <span className="text-sm text-neon-green tracking-[0.2em] uppercase">Correct Order</span>
                <div className="flex flex-col gap-3 w-full max-w-lg">
                  {correctItems.map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-4 bg-neon-green/5 border border-neon-green/20 rounded-xl px-5 py-4"
                      initial={{ opacity: 0, x: 80, y: 20 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{
                        delay: i * 0.25,
                        type: 'spring',
                        stiffness: 180,
                        damping: 18,
                      }}
                    >
                      <span className="w-8 h-8 rounded-full bg-neon-green/15 flex items-center justify-center font-display text-sm text-neon-green font-bold">
                        {i + 1}
                      </span>
                      <span className="text-lg text-text-primary font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Player rankings with closeness meter */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="bg-bg-card shadow-soft rounded-2xl p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
                  Closeness Ranking
                </h3>
                <div className="flex flex-col gap-4">
                  {sortedPlayers.map((p, idx) => {
                    const delta = getPlayerDelta(p.id);
                    const closeness = getCloseness(p.id);
                    return (
                      <motion.div
                        key={p.id}
                        className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-bg-elevated"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + idx * 0.07 }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                              idx === 0
                                ? 'bg-neon-gold/20 text-neon-gold'
                                : idx === 1
                                  ? 'bg-text-secondary/15 text-text-secondary'
                                  : idx === 2
                                    ? 'bg-neon-pink/15 text-neon-pink'
                                    : 'bg-bg-card text-text-muted'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-3xl">{p.avatar}</span>
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.colour }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xl font-medium text-text-primary">{p.name}</p>
                            <p className={`text-sm font-score ${delta > 0 ? 'text-neon-green' : 'text-text-muted'}`}>
                              {delta > 0 ? `+${formatRands(delta)} (partial credit)` : 'No points'}
                            </p>
                          </div>
                          <span className="font-score text-xl text-neon-gold">
                            {formatRands(p.score)}
                          </span>
                        </div>

                        {/* Closeness meter */}
                        <div className="flex items-center gap-3 ml-14">
                          <span className="text-xs text-text-muted w-20">Closeness</span>
                          <div className="flex-1 h-3 rounded-full bg-bg-card overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                closeness >= 80 ? 'bg-neon-green' : closeness >= 50 ? 'bg-orange-400' : closeness > 0 ? 'bg-neon-pink' : 'bg-bg-elevated'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${closeness}%` }}
                              transition={{ delay: 0.5 + idx * 0.1, duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="font-score text-sm text-text-secondary w-12 text-right">
                            {closeness}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
