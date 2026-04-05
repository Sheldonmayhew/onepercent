import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useSound } from '../../hooks/useSound';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

export default function BankingPhase() {
  const { session, bankPlayer, setScreen, getCurrentDifficulty, getCurrentPoints } = useGameStore();
  const { play } = useSound();
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!session) return null;

  const activePlayers = session.players.filter((p) => !p.isEliminated && !p.isBanked);
  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const diffColour = getDifficultyColour(difficulty);

  const currentPlayer = activePlayers[currentIdx];

  const handleBank = () => {
    if (!currentPlayer) return;
    play('bank');
    bankPlayer(currentPlayer.id);
    advance();
  };

  const handleContinue = () => {
    advance();
  };

  const advance = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= activePlayers.length) {
      // All players have decided — continue to next question
      setScreen('playing');
    } else {
      setCurrentIdx(nextIdx);
    }
  };

  if (!currentPlayer) {
    setScreen('playing');
    return null;
  }

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-gold/5 blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <h1 className="font-display text-4xl text-neon-gold glow-gold tracking-wide mb-2">BANKING TIME</h1>
          <p className="text-text-secondary">
            Next question is{' '}
            <span className="font-bold" style={{ color: diffColour }}>
              {difficulty}%
            </span>{' '}
            — worth <span className="font-score text-neon-gold">{formatRands(points)}</span>
          </p>
        </motion.div>

        {/* Current Player Decision */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-bg-surface/80 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">{currentPlayer.avatar}</span>
              <span
                className="font-display text-2xl tracking-wide"
                style={{ color: currentPlayer.colour }}
              >
                {currentPlayer.name}
              </span>
            </div>

            <div className="bg-bg-elevated rounded-xl p-4 mb-6">
              <span className="text-xs text-text-muted block mb-1">Current Score</span>
              <span className="font-score text-3xl text-neon-gold font-bold">
                {formatRands(currentPlayer.score)}
              </span>
            </div>

            <p className="text-text-secondary mb-6 text-sm">
              Bank now to keep your {formatRands(currentPlayer.score)}, or risk it on the next question?
            </p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleBank}
                className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-gold/15 border border-neon-gold/40 text-neon-gold hover:bg-neon-gold/25 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                BANK IT
              </motion.button>
              <motion.button
                onClick={handleContinue}
                className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/25 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                RISK IT
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress through players */}
        <div className="flex gap-2 justify-center">
          {activePlayers.map((p, i) => (
            <div
              key={p.id}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < currentIdx ? 'bg-neon-gold' : i === currentIdx ? 'bg-neon-cyan scale-125' : 'bg-bg-elevated'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
