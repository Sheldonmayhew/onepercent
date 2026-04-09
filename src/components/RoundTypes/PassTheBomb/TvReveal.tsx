import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import { useSound } from '../../../hooks/useSound';
import { formatRands } from '../../../utils/helpers';

type Phase = 'question' | 'answer' | 'results';

export default function TvReveal({ question, players, roundState: _roundState, correctAnswer, explanation, correctPlayerIds, incorrectPlayerIds, scoreUpdates, theme: _theme, teams: _teams }: TvRevealProps) {
  const [phase, setPhase] = useState<Phase>('question');
  const { play } = useSound();
  const soundPlayed = useRef(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    setPhase('question');
    soundPlayed.current = false;
    const t1 = setTimeout(() => setPhase('answer'), 2000);
    const t2 = setTimeout(() => setPhase('results'), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [correctAnswer]);

  useEffect(() => {
    if (phase === 'results' && !soundPlayed.current) {
      soundPlayed.current = true;
      const anyCorrect = correctPlayerIds.length > 0;
      play(anyCorrect ? 'correct_reveal' : 'wrong_reveal');
    }
  }, [phase, correctPlayerIds, play]);

  const correctPlayers = players.filter((p) => correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => incorrectPlayerIds.includes(p.id));

  // Get penalty deltas from scoreUpdates
  const getPlayerPenalty = (playerId: string): number => {
    const update = scoreUpdates?.find((u) => u.playerId === playerId);
    return update && update.delta < 0 ? update.delta : 0;
  };

  // Derive points from scoreUpdates for correct players
  const pointsAwarded = scoreUpdates?.find((u) => u.delta > 0)?.delta ?? 0;

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* Phase 1: Question recap */}
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
                {question.options && (
                  <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                    {question.options.map((option, i) => (
                      <div key={i} className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-3">
                        <span className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center font-display text-sm text-text-secondary font-bold">
                          {['A', 'B', 'C', 'D', 'E', 'F'][i]}
                        </span>
                        <span className="text-text-primary font-medium">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                <motion.p
                  className="text-text-muted text-lg mt-4"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  Revealing answer...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Answer reveal */}
          <AnimatePresence>
            {(phase === 'answer' || phase === 'results') && (
              <motion.div
                key="answer-card"
                className="bg-bg-card shadow-soft rounded-3xl p-8 lg:p-10 flex flex-col items-center gap-4"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
                  {question.question}
                </p>
                <span className="text-sm text-text-muted tracking-[0.2em] uppercase">Correct Answer</span>
                <motion.h2
                  className="text-5xl lg:text-6xl font-display font-bold text-neon-green text-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 15 }}
                >
                  {correctAnswer}
                </motion.h2>
                {explanation && (
                  <motion.p
                    className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {explanation}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Player results with explosion for wrong */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Correct players */}
                {correctPlayers.length > 0 && (
                  <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-6">
                    <h3 className="text-sm text-neon-green tracking-[0.15em] uppercase mb-4">Correct</h3>
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
                          <span className="text-neon-green font-score">+{formatRands(pointsAwarded)}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incorrect players — explosion shake + red */}
                {incorrectPlayers.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                    <h3 className="text-sm text-red-500 tracking-[0.15em] uppercase mb-4">
                      Exploded
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {incorrectPlayers.map((p, i) => {
                        const penalty = getPlayerPenalty(p.id);
                        return (
                          <motion.div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-red-500/10 border border-red-500/20"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              x: [0, -4, 4, -3, 3, 0],
                            }}
                            transition={{
                              scale: { delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 },
                              x: { delay: i * 0.1 + 0.2, duration: 0.4, ease: 'easeInOut' },
                            }}
                          >
                            <span className="text-2xl">{p.avatar}</span>
                            <span className="text-lg text-text-primary font-medium">{p.name}</span>
                            <span className="text-red-500 font-score font-bold">
                              {penalty < 0 ? `-R${Math.abs(penalty).toLocaleString('en-ZA')}` : '--'}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaderboard */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="bg-bg-card shadow-soft rounded-2xl p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">Leaderboard</h3>
                <div className="flex flex-col gap-3">
                  {sortedPlayers.map((p, idx) => {
                    const wasCorrect = correctPlayerIds.includes(p.id);
                    const penalty = getPlayerPenalty(p.id);
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
                          <p className={`text-sm font-score ${wasCorrect ? 'text-neon-green' : 'text-red-500'}`}>
                            {wasCorrect ? `+${formatRands(pointsAwarded)}` : penalty < 0 ? `-R${Math.abs(penalty).toLocaleString('en-ZA')}` : 'No points'}
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
