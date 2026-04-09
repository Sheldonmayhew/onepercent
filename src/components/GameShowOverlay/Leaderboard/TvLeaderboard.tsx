import { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useMultiplayerStore } from '../../../stores/multiplayerStore';
import RollingCounter from './RollingCounter';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

export default function TvLeaderboard() {
  const gameState = useMultiplayerStore((s) => s.gameState);

  const phase = gameState ? getPhase(gameState.route) : 'lobby';
  const showLeaderboard = phase === 'round-intro' || phase === 'reveal';

  const sorted = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.players]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [gameState]);

  if (!gameState) return null;

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          className="fixed top-6 right-6 z-30 w-64"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          <div className="bg-bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-display text-neon-cyan tracking-[0.2em] uppercase">
                Leaderboard
              </p>
            </div>

            <LayoutGroup>
              <div className="py-2">
                {sorted.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    className="flex items-center gap-3 px-4 py-2"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    {/* Rank */}
                    <span className="w-6 text-center text-sm font-bold text-white/50">
                      {player.rank}
                    </span>

                    {/* Avatar */}
                    <span className="text-lg">{player.avatar}</span>

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-white truncate">
                      {player.name}
                    </span>

                    {/* Score */}
                    <RollingCounter
                      value={player.score}
                      className="text-sm font-bold font-display"
                    />
                  </motion.div>
                ))}
              </div>
            </LayoutGroup>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
