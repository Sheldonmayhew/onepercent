import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { getDifficultyColour, getDifficultyLabel, formatRands } from '../utils/helpers';
import { getRoundDefinition } from '../roundTypes/registry';
import GameLayout from '../components/Game/GameLayout';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useGameStore((s) => s.session);
  const getCurrentDifficulty = useGameStore((s) => s.getCurrentDifficulty);
  const getCurrentPoints = useGameStore((s) => s.getCurrentPoints);
  const getTotalRounds = useGameStore((s) => s.getTotalRounds);
  const role = useMultiplayerStore((s) => s.role);

  const prefix = location.pathname.startsWith('/host') ? '/host' : '/quick-play';
  const isHost = role === 'host';
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAdvancedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleAdvance = () => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isHost) {
      broadcastHostState('/player/play');
    }
    navigate(`${prefix}/play`, { replace: true });
  };

  useEffect(() => {
    timerRef.current = setTimeout(handleAdvance, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const totalRounds = getTotalRounds();
  const roundIndex = session.currentRound;
  const diffColour = getDifficultyColour(difficulty);

  const roundTypeId = session.roundTypeSequence?.[roundIndex];
  const roundDef = roundTypeId ? getRoundDefinition(roundTypeId) : null;

  return (
    <GameLayout
      header={
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="font-display text-xs font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1} of {totalRounds}
          </span>
          <span className="text-xs text-text-muted tracking-[0.15em] uppercase">
            Worth {formatRands(points)}
          </span>
        </div>
      }
      cta={
        <div className="flex flex-col items-center gap-2" onClick={handleAdvance}>
          <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: roundDef?.theme.primary ?? diffColour }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </div>
          <p className="text-text-muted text-xs">Tap anywhere to skip</p>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 pt-12" onClick={handleAdvance}>
        {/* Round type name + icon */}
        {roundDef && (
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
          >
            <span className="text-5xl">{roundDef.theme.icon}</span>
            <span
              className="font-display text-2xl font-bold tracking-wide uppercase"
              style={{ color: roundDef.theme.primary }}
            >
              {roundDef.name}
            </span>
            <span className="text-text-secondary text-sm text-center italic">
              {roundDef.tagline}
            </span>
          </motion.div>
        )}

        {/* Difficulty badge */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span
            className="font-display text-7xl font-bold tracking-tight"
            style={{ color: diffColour }}
          >
            {getDifficultyLabel(difficulty)}
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
          <span className="font-score text-3xl text-neon-gold font-bold">
            {formatRands(points)}
          </span>
        </motion.div>
      </div>
    </GameLayout>
  );
}
