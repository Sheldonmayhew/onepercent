import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameBroadcast, BroadcastRound } from '../../stores/multiplayerStore';
import { useSound } from '../../hooks/useSound';
import { formatRands, getDifficultyColour } from '../../utils/helpers';
import { POINTS_PER_ROUND } from '../../types';

interface TvRevealProps {
  gameState: GameBroadcast;
  lastRound: BroadcastRound | null;
}

type Phase = 'question' | 'answer' | 'results';

export default function TvReveal({ gameState, lastRound }: TvRevealProps) {
  const { players, reveal } = gameState;
  const [phase, setPhase] = useState<Phase>('question');
  const { play } = useSound();
  const soundPlayed = useRef(false);

  const difficulty = lastRound?.difficulty ?? 90;
  const points = lastRound?.points ?? (POINTS_PER_ROUND[difficulty] ?? 0);
  const diffColour = getDifficultyColour(difficulty);

  useEffect(() => {
    setPhase('question');
    soundPlayed.current = false;

    // Phase 1: Show question recap (0–2s)
    // Phase 2: Reveal the answer (2–4.5s)
    // Phase 3: Show who got it right/wrong + leaderboard (4.5s+)
    const t1 = setTimeout(() => setPhase('answer'), 2000);
    const t2 = setTimeout(() => setPhase('results'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reveal?.correctAnswer]);

  // Play correct/wrong sound when results phase starts
  useEffect(() => {
    if (phase === 'results' && !soundPlayed.current && reveal) {
      soundPlayed.current = true;
      const anyCorrect = reveal.correctPlayerIds.length > 0;
      play(anyCorrect ? 'correct_reveal' : 'wrong_reveal');
    }
  }, [phase, reveal, play]);

  if (!reveal) return null;

  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal.incorrectPlayerIds.includes(p.id));

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      {/* Top bar: round info */}
      {lastRound && (
        <div className="flex items-center gap-4 mb-6">
          <span className="font-display text-lg text-text-secondary uppercase tracking-wider">
            Round {lastRound.index + 1} of {lastRound.totalRounds}
          </span>
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">
            {formatRands(points)}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* Phase 1: Question recap */}
          <AnimatePresence mode="wait">
            {phase === 'question' && lastRound && (
              <motion.div
                key="question-recap"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                {lastRound.categoryName && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {lastRound.categoryName}
                  </span>
                )}
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug text-center max-w-3xl">
                  {lastRound.question.question}
                </h2>
                {lastRound.question.image_url && (
                  <img
                    src={lastRound.question.image_url}
                    alt="Question visual"
                    className="rounded-2xl max-h-56 object-contain"
                  />
                )}

                {/* Options reminder */}
                {lastRound.question.options && (
                  <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                    {lastRound.question.options.map((option, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-3"
                      >
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

            {/* Phase 1 fallback: no lastRound, skip to answer */}
            {phase === 'question' && !lastRound && (
              <motion.div
                key="question-loading"
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-text-muted text-xl"
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
                {/* Question text (compact) */}
                {lastRound && (
                  <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
                    {lastRound.question.question}
                  </p>
                )}

                <span className="text-sm text-text-muted tracking-[0.2em] uppercase">
                  Correct Answer
                </span>
                <motion.h2
                  className="text-5xl lg:text-6xl font-display font-bold text-neon-green text-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 15 }}
                >
                  {reveal.correctAnswer}
                </motion.h2>
                {reveal.explanation && (
                  <motion.p
                    className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {reveal.explanation}
                  </motion.p>
                )}
                <span className="font-score text-xl text-neon-gold">
                  Worth {formatRands(points)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Player results */}
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
                            +{formatRands(points)}
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

          {/* Leaderboard — shows with results */}
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
    </div>
  );
}
