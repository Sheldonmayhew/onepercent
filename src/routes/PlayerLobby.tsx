import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';

const CURRENT_ROUTE = '/player/lobby';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  // Navigate when host broadcasts a new route
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const me = gameState?.players.find((p) => p.id === playerId);
  const players = gameState?.players ?? [];
  const packName = gameState?.packName;
  const isTeamMode = gameState?.teamMode;
  const teams = gameState?.teams ?? [];

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 w-full max-w-lg mx-auto">
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

      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 flex-1">
        {/* You're in card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6 flex flex-col items-center gap-3"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="text-5xl">🎉</span>
          <h1 className="font-display text-3xl text-neon-cyan tracking-wide">YOU'RE IN!</h1>
          {packName && (
            <p className="text-sm text-text-muted text-center">
              Pack: <span className="text-text-secondary font-medium">{packName}</span>
            </p>
          )}
          <p className="text-xs text-text-muted text-center">
            Waiting for the host to start the game…
          </p>
        </motion.div>

        {/* Player list */}
        <div>
          <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">
            Players ({players.length}/8)
          </p>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-card shadow-soft border ${
                    player.id === playerId ? 'border-neon-cyan/30' : 'border-transparent'
                  }`}
                >
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.colour }} />
                  <span className="flex-1 font-medium text-text-primary">
                    {player.name}
                    {player.id === playerId && (
                      <span className="ml-1.5 text-xs text-neon-cyan">(you)</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Team picker (display-only) */}
        {isTeamMode && teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Teams</p>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}
            >
              {teams.map((team) => {
                const teamPlayers = players.filter((p) =>
                  team.playerIds.includes(p.id)
                );
                const isMine = me && team.playerIds.includes(me.id);
                return (
                  <div
                    key={team.id}
                    className={`bg-bg-card rounded-xl shadow-soft p-3 min-h-[72px] border ${
                      isMine ? 'border-opacity-50' : 'border-transparent'
                    }`}
                    style={isMine ? { borderColor: team.colour } : undefined}
                  >
                    <h4
                      className="font-display text-xs tracking-wide mb-2"
                      style={{ color: team.colour }}
                    >
                      {team.name}
                    </h4>
                    {teamPlayers.length === 0 ? (
                      <p className="text-text-muted text-xs italic">No players yet</p>
                    ) : (
                      <div className="space-y-1">
                        {teamPlayers.map((p) => (
                          <div key={p.id} className="flex items-center gap-1 text-xs text-text-primary">
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Waiting indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-auto pb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for host</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
