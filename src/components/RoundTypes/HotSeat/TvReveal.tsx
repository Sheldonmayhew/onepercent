import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TvRevealProps } from '../../../roundTypes/types';
import type { HotSeatState } from '../../../roundTypes/definitions/hotSeat';
import { useSound } from '../../../hooks/useSound';

export default function TvReveal({ question, players, roundState, correctAnswer: correctAnswerProp, explanation: _explanation, correctPlayerIds: _correctPlayerIds, incorrectPlayerIds: _incorrectPlayerIds, scoreUpdates: _scoreUpdates, theme: _theme }: TvRevealProps) {
  const state = roundState as HotSeatState & { isCorrect?: boolean };
  const [phase, setPhase] = useState(0);
  const { play } = useSound();
  const correctAnswer = correctAnswerProp;

  const hotSeatOrder: string[] = state?.hotSeatOrder ?? [];
  const currentIndex: number = state?.currentHotSeatIndex ?? 0;
  const activePlayerId = hotSeatOrder[currentIndex];
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const isCorrect: boolean = state?.isCorrect ?? false;

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setPhase(1);
        play(isCorrect ? 'correct_reveal' : 'wrong_reveal');
      }, 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [play, isCorrect]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Spotlight background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-full opacity-15"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(253,212,4,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 0: Spotlight + answer reveal */}
        {phase === 0 && (
          <motion.div
            key="spotlight"
            className="flex flex-col items-center text-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activePlayer && (
              <motion.span
                className="text-8xl mb-6"
                animate={{
                  filter: [
                    'drop-shadow(0 0 10px rgba(253,212,4,0.3))',
                    'drop-shadow(0 0 30px rgba(253,212,4,0.7))',
                    'drop-shadow(0 0 10px rgba(253,212,4,0.3))',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {activePlayer.avatar}
              </motion.span>
            )}
            <p className="font-display text-xl text-neon-gold tracking-wider mb-4">
              {activePlayer?.name ?? 'Player'}
            </p>
            <p className="text-text-muted text-sm uppercase tracking-widest mb-6">
              The answer is...
            </p>
            {question.options ? (
              <motion.div
                className="inline-block px-8 py-4 rounded-2xl bg-neon-green/10 ring-2 ring-neon-green"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 15 }}
              >
                <span className="font-display text-3xl text-neon-green">
                  {question.options[Number(correctAnswer)]}
                </span>
              </motion.div>
            ) : (
              <motion.span
                className="font-score text-5xl text-neon-green"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {String(correctAnswer)}
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Phase 1: Result */}
        {phase === 1 && (
          <motion.div
            key="result"
            className="flex flex-col items-center text-center relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            {isCorrect ? (
              <>
                {/* Golden burst */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0.2] }}
                  transition={{ duration: 1 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2 w-1 h-16 bg-gradient-to-t from-neon-gold to-transparent rounded-full"
                      style={{
                        transformOrigin: '50% 0%',
                        rotate: `${i * 30}deg`,
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: [0, 1, 0.5], opacity: [0, 1, 0] }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                    />
                  ))}
                </motion.div>

                <motion.span
                  className="text-9xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                >
                  {activePlayer?.avatar ?? '🔥'}
                </motion.span>
                <motion.h2
                  className="font-display text-5xl text-neon-gold tracking-wider mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  CORRECT!
                </motion.h2>
                <motion.p
                  className="text-text-secondary text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {activePlayer?.name} survives the Hot Seat!
                </motion.p>
              </>
            ) : (
              <>
                <motion.span
                  className="text-9xl mb-6"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.5, opacity: 0.2, rotate: -15, y: 40 }}
                  transition={{ duration: 1.5, ease: 'easeIn' }}
                >
                  {activePlayer?.avatar ?? '🔥'}
                </motion.span>
                <motion.h2
                  className="font-display text-5xl text-neon-pink tracking-wider mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  WRONG
                </motion.h2>
                <motion.p
                  className="text-text-muted text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  The spotlight dims on {activePlayer?.name}...
                </motion.p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
