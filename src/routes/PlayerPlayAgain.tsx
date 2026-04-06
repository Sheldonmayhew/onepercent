import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';

const CURRENT_ROUTE = '/player/play-again';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  // Navigate when host broadcasts a new route (e.g. lobby once categories are picked)
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const handleStay = () => {
    // Nothing to do — just wait for host to broadcast the lobby route
  };

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-6"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <motion.span
          className="text-6xl"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        >
          🔄
        </motion.span>

        <motion.h1
          className="font-display text-4xl text-text-primary text-center tracking-tight"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          PLAY AGAIN?
        </motion.h1>

        <motion.p
          className="text-text-muted text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          The host wants to start a new round.
          {playerName && (
            <span className="block mt-1 text-text-secondary font-medium">{playerName}</span>
          )}
        </motion.p>

        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            onClick={handleStay}
            className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            I'M IN!
          </motion.button>
          <motion.button
            onClick={handleLeave}
            className="w-full py-3.5 rounded-full font-display text-lg tracking-wide bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            LEAVE
          </motion.button>
        </motion.div>

        {/* Waiting indicator — shown immediately since staying is the default */}
        <motion.div
          className="flex items-center justify-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for host to pick categories</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
