import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import type { FinalRoundState } from '../../../roundTypes/definitions/finalRound';
import { useSound } from '../../../hooks/useSound';

export default function TvReveal({ question, players, roundState, correctAnswer: correctAnswerProp, explanation: _explanation, correctPlayerIds: correctPlayerIdsProp, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates, theme: _theme }: TvRevealProps) {
  const [phase, setPhase] = useState(0);
  const { play } = useSound();
  const correctAnswer = correctAnswerProp;
  const correctPlayerIds = correctPlayerIdsProp;
  // Derive points from scoreUpdates
  const points = scoreUpdates?.reduce((max, u) => Math.max(max, u.delta), 0) ?? 0;
  const state = roundState as FinalRoundState;
  const eliminatedIds: string[] = state?.eliminatedPlayerIds ?? [];

  const alivePlayers = players.filter((p) => !p.eliminated || correctPlayerIds.includes(p.id));
  const survivors = alivePlayers.filter((p) => correctPlayerIds.includes(p.id));
  const fallen = alivePlayers.filter((p) => eliminatedIds.includes(p.id));
  const isWinner = survivors.length === 1;

  // Generate confetti particles for winner celebration
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: ['#FDD204', '#00E5FF', '#FF4D8D', '#22C55E', '#F97316'][i % 5],
      size: 4 + Math.random() * 8,
    }));
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => {
        setPhase(2);
        if (isWinner) {
          play('winner');
        } else if (fallen.length > 0) {
          play('wrong_reveal');
        } else {
          play('correct_reveal');
        }
      }, 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [play, isWinner, fallen.length]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Red vignette */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,0.2) 100%)',
        }}
      />

      <AnimatePresence mode="wait">
        {/* Phase 0: Tense question recap */}
        {phase === 0 && (
          <motion.div
            key="recap"
            className="max-w-3xl w-full text-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Heartbeat pulse */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0, 0.1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <div className="absolute inset-0 bg-red-500/10 rounded-3xl" />
            </motion.div>

            <p className="font-display text-sm text-red-500 uppercase tracking-[0.3em] mb-6">
              The Final Question
            </p>
            <motion.p
              className="text-2xl md:text-3xl font-bold text-text-primary leading-snug"
              animate={{ scale: [1, 1.005, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              {question.question}
            </motion.p>
          </motion.div>
        )}

        {/* Phase 1: Answer reveal */}
        {phase === 1 && (
          <motion.div
            key="answer"
            className="max-w-3xl w-full text-center relative z-10"
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
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
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
          </motion.div>
        )}

        {/* Phase 2: Elimination / winner celebration */}
        {phase === 2 && (
          <motion.div
            key="elimination"
            className="max-w-4xl w-full relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Confetti for winner */}
            {isWinner && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {confettiParticles.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-sm"
                    style={{
                      left: `${p.x}%`,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                    }}
                    initial={{ y: -20, opacity: 0, rotate: 0 }}
                    animate={{
                      y: ['0vh', '100vh'],
                      opacity: [0, 1, 1, 0],
                      rotate: [0, 360, 720],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Fallen players — shatter animation */}
            {fallen.length > 0 && (
              <div className="flex items-center justify-center gap-6 mb-10">
                {fallen.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    className="flex flex-col items-center"
                    initial={{ scale: 1, opacity: 1, rotate: 0 }}
                    animate={{
                      scale: 0,
                      opacity: 0,
                      rotate: idx % 2 === 0 ? 45 : -45,
                      y: 80,
                    }}
                    transition={{ duration: 1.5, delay: idx * 0.3 + 0.5, ease: 'easeIn' }}
                  >
                    <span className="text-6xl mb-2">{player.avatar}</span>
                    <span className="text-sm text-neon-pink font-medium">{player.name}</span>
                    <span className="font-display text-xs text-red-500 uppercase tracking-widest mt-1">
                      ELIMINATED
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Survivors */}
            <div className="flex items-center justify-center gap-8">
              {survivors.map((player, idx) => (
                <motion.div
                  key={player.id}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: fallen.length * 0.3 + 1 + idx * 0.2, type: 'spring' }}
                >
                  {/* Crown for winner */}
                  {isWinner && (
                    <motion.span
                      className="text-4xl mb-1"
                      initial={{ y: -30, opacity: 0, rotate: -20 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{ delay: fallen.length * 0.3 + 1.5, type: 'spring', stiffness: 200 }}
                    >
                      👑
                    </motion.span>
                  )}
                  <motion.span
                    className="text-7xl mb-3"
                    animate={isWinner ? {
                      filter: [
                        'drop-shadow(0 0 10px rgba(253,212,4,0.4))',
                        'drop-shadow(0 0 30px rgba(253,212,4,0.8))',
                        'drop-shadow(0 0 10px rgba(253,212,4,0.4))',
                      ],
                    } : {
                      filter: [
                        'drop-shadow(0 0 5px rgba(34,197,94,0.3))',
                        'drop-shadow(0 0 15px rgba(34,197,94,0.5))',
                        'drop-shadow(0 0 5px rgba(34,197,94,0.3))',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {player.avatar}
                  </motion.span>
                  <span className="text-lg text-text-primary font-medium">{player.name}</span>
                  <motion.span
                    className="font-score text-xl text-neon-gold mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: fallen.length * 0.3 + 1.5 }}
                  >
                    +{points.toLocaleString()}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            {/* Title */}
            <motion.div
              className="text-center mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: fallen.length * 0.3 + 1.2 }}
            >
              {isWinner ? (
                <motion.h2
                  className="font-display text-5xl text-neon-gold tracking-wider"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  WINNER!
                </motion.h2>
              ) : survivors.length > 0 ? (
                <h2 className="font-display text-3xl text-neon-green tracking-wider">
                  SURVIVORS ADVANCE
                </h2>
              ) : (
                <h2 className="font-display text-3xl text-neon-pink tracking-wider">
                  EVERYONE ELIMINATED
                </h2>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
