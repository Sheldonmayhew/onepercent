import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { getDifficultyColour, formatRands } from '../utils/helpers';
import { getRoundDefinition } from '../roundTypes/registry';
import GameLayout, { NavBack } from '../components/Game/GameLayout';

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

  useEffect(() => {
    if (playerId != null && round != null) {
      sendReady(playerId, round.index);
    }
  }, [playerId, round?.index, sendReady]);

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
    <GameLayout
      header={
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            {me && <span className="text-2xl">{me.avatar}</span>}
            <div>
              <p className="font-medium text-text-primary text-sm">{playerName}</p>
              {me && <p className="text-xs text-neon-gold font-score">R{me.score.toLocaleString('en-ZA')}</p>}
            </div>
          </div>
        </div>
      }
      secondaryAction={<NavBack onClick={handleLeave} label="Leave" icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      } />}
      cta={
        <motion.div
          className="flex items-center gap-2 justify-center py-3.5 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <span className="text-neon-cyan text-xs font-medium tracking-wide">READY — WAITING FOR HOST</span>
        </motion.div>
      }
    >
      <div className="flex flex-col items-center gap-6 pt-8">
        {/* Round label */}
        <motion.p
          className="text-xs text-text-muted tracking-[0.2em] uppercase font-medium"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Round {roundIndex + 1} of {totalRounds}
        </motion.p>

        {/* Round type */}
        {(() => {
          const roundType = round?.roundType;
          if (!roundType) return null;
          const def = getRoundDefinition(roundType);
          return (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            >
              <span className="text-4xl">{def.theme.icon}</span>
              <span className="font-display text-xl font-bold tracking-wide uppercase" style={{ color: def.theme.primary }}>
                {def.name}
              </span>
              <span className="text-text-secondary text-xs text-center italic">{def.tagline}</span>
            </motion.div>
          );
        })()}

        {/* Difficulty */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="font-display text-7xl font-bold tracking-tight" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="text-text-muted text-sm">difficulty</span>
        </motion.div>

        {/* Points */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <span className="text-xs text-text-muted tracking-[0.15em] uppercase">Worth</span>
          <span className="font-score text-3xl text-neon-gold font-bold">{formatRands(points)}</span>
        </motion.div>
      </div>
    </GameLayout>
  );
}
