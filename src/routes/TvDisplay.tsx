import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import TvLobby from '../components/Tv/TvLobby';
import TvRoundIntro from '../components/Tv/TvRoundIntro';
import TvPlay from '../components/Tv/TvPlay';
import TvReveal from '../components/Tv/TvReveal';
import TvResults from '../components/Tv/TvResults';

function getPhase(route: string): string {
  if (route.includes('/lobby')) return 'lobby';
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const role = useMultiplayerStore((s) => s.role);
  const roomCode = useMultiplayerStore((s) => s.roomCode);

  // Redirect if not connected as spectator
  useEffect(() => {
    if (role !== 'spectator') {
      navigate('/tv', { replace: true });
    }
  }, [role, navigate]);

  // Handle game_ended (role gets reset to null by the hook)
  useEffect(() => {
    if (role === null && !gameState) {
      navigate('/tv', { replace: true });
    }
  }, [role, gameState, navigate]);

  if (!gameState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg-primary">
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-secondary font-display text-2xl tracking-wide">
            WAITING FOR HOST...
          </p>
          {roomCode && (
            <p className="text-text-muted font-display text-lg tracking-[0.3em]">{roomCode}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const phase = getPhase(gameState.route);

  return (
    <div className="min-h-dvh bg-bg-primary overflow-hidden">
      {/* Room code watermark — always visible, bottom-right */}
      {roomCode && (
        <div className="fixed bottom-4 right-6 z-50 opacity-30">
          <span className="font-display text-sm text-text-muted tracking-[0.2em]">
            {roomCode}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvLobby gameState={gameState} roomCode={roomCode} />
          </motion.div>
        )}
        {phase === 'round-intro' && (
          <motion.div key="round-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvRoundIntro gameState={gameState} />
          </motion.div>
        )}
        {phase === 'play' && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvPlay gameState={gameState} />
          </motion.div>
        )}
        {phase === 'reveal' && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvReveal gameState={gameState} />
          </motion.div>
        )}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvResults gameState={gameState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
