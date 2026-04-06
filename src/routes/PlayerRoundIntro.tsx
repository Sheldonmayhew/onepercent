import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { getDifficultyColour, formatRands } from '../utils/helpers';

const CURRENT_ROUTE = '/player/round-intro';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect, sendReady } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const round = gameState?.round;

  // Signal host we're ready on mount
  useEffect(() => {
    if (playerId != null && round != null) {
      sendReady(playerId, round.index);
    }
  }, [playerId, round?.index, sendReady]);

  // Navigate when host broadcasts a new route
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  const difficulty = round?.difficulty ?? 90;
  const points = round?.points ?? 0;
  const roundIndex = round?.index ?? 0;
  const totalRounds = round?.totalRounds ?? 11;
  const diffColour = getDifficultyColour(difficulty);

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          {me && <span className="text-2xl">{me.avatar}</span>}
          <div>
            <p className="font-medium text-text-primary text-sm">{playerName}</p>
            {me && (
              <p className="text-xs text-neon-gold font-score">
                R{me.score.toLocaleString('en-ZA')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs text-text-muted hover:text-neon-pink transition-colors px-3 py-1.5 rounded-lg bg-bg-card"
        >
          LEAVE
        </button>
      </div>

      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 flex-1 justify-center">
        {/* Round label */}
        <motion.p
          className="text-xs text-text-muted tracking-[0.2em] uppercase font-medium"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Round {roundIndex + 1} of {totalRounds}
        </motion.p>

        {/* Difficulty badge */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="font-display text-8xl font-bold tracking-tight" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="text-text-muted text-sm">difficulty</span>
        </motion.div>

        {/* Points */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-xs text-text-muted tracking-[0.15em] uppercase">Worth</span>
          <span className="font-score text-3xl text-neon-gold font-bold">{formatRands(points)}</span>
        </motion.div>

        {/* Ready indicator */}
        <motion.div
          className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <span className="text-neon-cyan text-xs font-medium tracking-wide">READY — WAITING FOR HOST</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
