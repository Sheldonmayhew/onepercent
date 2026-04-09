import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import { useSound } from '../../../hooks/useSound';
import { formatRands } from '../../../utils/helpers';

type Phase = 'question' | 'bubbles' | 'results';

export default function TvReveal({ question, players, roundState: _roundState, correctAnswer, explanation: _explanation, correctPlayerIds, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates, theme: _theme }: TvRevealProps) {
  const [phase, setPhase] = useState<Phase>('question');
  const { play } = useSound();
  const soundPlayed = useRef(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const options = question.options ?? [];
  const correctIndices = new Set(question.correct_answers ?? []);

  useEffect(() => {
    setPhase('question');
    soundPlayed.current = false;
    const t1 = setTimeout(() => setPhase('bubbles'), 2000);
    const t2 = setTimeout(() => setPhase('results'), 5000);
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

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* Phase 1: Question recap with all bubbles */}
          <AnimatePresence mode="wait">
            {phase === 'question' && (
              <motion.div
                key="question-recap"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug text-center max-w-3xl">
                  {question.question}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
                  {options.map((option, i) => (
                    <div
                      key={i}
                      className="bg-bg-card shadow-soft rounded-2xl px-5 py-4 text-text-primary font-medium text-center"
                    >
                      {option}
                    </div>
                  ))}
                </div>
                <motion.p
                  className="text-text-muted text-lg mt-4"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  Revealing answers...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Correct bubbles glow green and float up; wrong shake red and fade */}
          <AnimatePresence>
            {(phase === 'bubbles' || phase === 'results') && (
              <motion.div
                key="bubble-reveal"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
                  {question.question}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
                  {options.map((option, i) => {
                    const isCorrect = correctIndices.has(i);
                    return (
                      <motion.div
                        key={i}
                        className={`rounded-2xl px-5 py-4 font-medium text-center border-2 ${
                          isCorrect
                            ? 'bg-neon-green/15 border-neon-green/40 text-neon-green'
                            : 'bg-red-500/10 border-red-500/30 text-text-muted'
                        }`}
                        initial={{ y: 0, opacity: 1 }}
                        animate={
                          isCorrect
                            ? { y: -10, opacity: 1, scale: 1.05 }
                            : { x: [0, -3, 3, -2, 2, 0], opacity: 0.3, scale: 0.95 }
                        }
                        transition={{
                          delay: i * 0.1,
                          duration: 0.5,
                          ease: 'easeOut',
                        }}
                      >
                        {isCorrect && <span className="mr-1">✓</span>}
                        {option}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Per-player breakdown */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="bg-bg-card shadow-soft rounded-2xl p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">Player Breakdown</h3>
                <div className="flex flex-col gap-4">
                  {sortedPlayers.map((p, idx) => {
                    const wasCorrect = correctPlayerIds.includes(p.id);
                    const delta = getPlayerDelta(p.id);
                    return (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl bg-bg-elevated"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + idx * 0.07 }}
                      >
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
                          <p className={`text-sm font-score ${wasCorrect ? 'text-neon-green' : delta < 0 ? 'text-red-500' : 'text-text-muted'}`}>
                            {delta > 0 ? `+${formatRands(delta)}` : delta < 0 ? `-R${Math.abs(delta).toLocaleString('en-ZA')}` : 'No points'}
                          </p>
                        </div>
                        <span className="font-score text-xl text-neon-gold">
                          {formatRands(p.score)}
                        </span>
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
