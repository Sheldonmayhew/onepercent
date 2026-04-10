import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import GameLayout, { NavCTA, NavBack } from '../components/Game/GameLayout';

const CURRENT_ROUTE = '/player/play-again';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

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

  return (
    <GameLayout
      secondaryAction={<NavBack onClick={handleLeave} label="Leave" icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      } />}
      cta={<NavCTA onClick={() => {}}>I'M IN!</NavCTA>}
    >
      <div className="flex flex-col items-center gap-8 pt-16">
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

        {/* Waiting indicator */}
        <motion.div
          className="flex items-center justify-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for host to pick categories</p>
        </motion.div>
      </div>
    </GameLayout>
  );
}
