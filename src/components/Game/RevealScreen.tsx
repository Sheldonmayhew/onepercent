import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useSound } from '../../hooks/useSound';
import { formatRands } from '../../utils/helpers';
import PlayerStatusBar from './PlayerStatusBar';

export default function RevealScreen() {
  const { session, proceedToNextRound, getCurrentPoints, getTiers, setScreen } = useGameStore();
  const { play } = useSound();
  const [phase, setPhase] = useState<'answer' | 'results' | 'ready'>('answer');

  const lastRound = session?.roundHistory[session.roundHistory.length - 1];
  const tiers = getTiers();

  useEffect(() => {
    // Phase 1: Show answer (1.5s)
    const t1 = setTimeout(() => {
      setPhase('results');
      if (lastRound && lastRound.eliminatedPlayers.length > 0) {
        play('eliminate');
      } else {
        play('correct');
      }
    }, 1500);

    // Phase 2: Show player results (3s)
    const t2 = setTimeout(() => setPhase('ready'), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastRound, play]);

  if (!session || !lastRound) return null;

  const question = lastRound.question;
  const correctAnswer =
    question.type === 'multiple_choice' || question.type === 'image_based'
      ? question.options?.[Number(question.correct_answer)] ?? String(question.correct_answer)
      : question.type === 'sequence'
        ? String(question.correct_answer).split(',').map((i) => {
            const items = question.sequence_items ?? question.options;
            return items?.[Number(i)] ?? i;
          }).join(' → ')
        : String(question.correct_answer);

  const correctPlayers = session.players.filter((p) => lastRound.correctPlayers.includes(p.id));
  const eliminatedPlayers = session.players.filter((p) => lastRound.eliminatedPlayers.includes(p.id));
  const activePlayers = session.players.filter((p) => !p.isEliminated && !p.isBanked);
  const isGameOver = activePlayers.length === 0 || session.currentRound >= tiers.length - 1;

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep via-bg-primary to-bg-deep pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setScreen('results')}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>

        {/* Question recap */}
        <p className="text-text-secondary text-sm mb-3 line-clamp-2">{question.question}</p>

        {/* Correct Answer */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        >
          <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">The answer is</span>
          <h2 className="font-display text-5xl md:text-6xl text-neon-green glow-green">
            {correctAnswer}
          </h2>
          <p className="text-text-secondary mt-3 text-sm max-w-md mx-auto">{question.explanation}</p>
        </motion.div>

        {/* Player Results */}
        <AnimatePresence>
          {phase !== 'answer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 mb-8"
            >
              {/* Correct */}
              {correctPlayers.length > 0 && (
                <div className="bg-neon-green/5 border border-neon-green/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <span className="text-neon-green text-lg">✓</span>
                    <span className="text-neon-green font-display text-lg tracking-wide">CORRECT</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {correctPlayers.map((p) => (
                      <motion.span
                        key={p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green text-sm font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        {p.avatar} {p.name}
                        <span className="text-xs text-neon-green/60 ml-1">
                          +{formatRands(getCurrentPoints())}
                        </span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Eliminated / Incorrect */}
              {eliminatedPlayers.length > 0 && (
                <motion.div
                  className="bg-neon-pink/5 border border-neon-pink/20 rounded-xl p-4"
                  initial={{ x: 0 }}
                  animate={{ x: [0, -4, 4, -4, 4, 0] }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <span className="text-neon-pink text-lg">✗</span>
                    <span className="text-neon-pink font-display text-lg tracking-wide">
                      {session.settings.eliminationRule === 'keep_last_cleared' ? 'INCORRECT' : 'ELIMINATED'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {eliminatedPlayers.map((p) => (
                      <motion.span
                        key={p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-pink/10 text-neon-pink text-sm font-medium line-through"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        {p.avatar} {p.name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status bar */}
        <div className="mb-6">
          <PlayerStatusBar players={session.players} />
        </div>

        {/* Continue / End */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isGameOver ? (
                <motion.button
                  onClick={proceedToNextRound}
                  className="py-4 px-10 rounded-xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-gold to-amber-400 text-bg-deep hover:brightness-110 box-glow-gold"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  SEE FINAL RESULTS
                </motion.button>
              ) : (
                <div className="space-y-3">
                  <p className="text-text-muted text-sm">
                    {activePlayers.length} player{activePlayers.length !== 1 ? 's' : ''} remaining
                  </p>
                  <motion.button
                    onClick={proceedToNextRound}
                    className="py-4 px-10 rounded-xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 box-glow-cyan"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    NEXT QUESTION
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
