import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { formatRands } from '../utils/helpers';

const CURRENT_ROUTE = '/player/results';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const players = gameState?.players ?? [];

  // Navigate when host broadcasts a new route (shouldn't happen from results,
  // but guard in case host restarts)
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const isTeamMode = gameState?.teamMode;
  const teams = gameState?.teams ?? [];
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex((p) => p.id === playerId) + 1;
  const winner = sorted[0];

  const getPlayerTeam = (pId: string) => teams.find((t) => t.playerIds.includes(pId));

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Game Over title */}
        <motion.h1
          className="font-display text-5xl text-text-primary text-center tracking-tight"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          GAME OVER
        </motion.h1>

        {/* Winner card */}
        {winner && (
          <motion.div
            className="bg-gradient-to-br from-neon-gold/20 to-neon-pink/10 rounded-2xl shadow-soft p-5 flex flex-col items-center gap-2 border border-neon-gold/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 20 }}
          >
            <span className="text-4xl">🏆</span>
            <span className="text-3xl">{winner.avatar}</span>
            <p className="font-display text-xl text-text-primary tracking-wide">{winner.name}</p>
            <p className="font-score text-3xl text-neon-gold font-bold">{formatRands(winner.score)}</p>
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase">Winner</p>
          </motion.div>
        )}

        {/* My rank card */}
        {me && myRank > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-4 flex items-center gap-4"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="font-display text-5xl text-neon-cyan w-16 text-center">
              #{myRank}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-text-muted tracking-wide uppercase">Your Rank</p>
              <p className="font-medium text-text-primary">{me.name}</p>
              <p className="font-score text-lg text-neon-gold">{formatRands(me.score)}</p>
            </div>
          </motion.div>
        )}

        {/* Team standings */}
        {isTeamMode && teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Team Standings</p>
            <div className="flex flex-col gap-2">
              {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => {
                const myTeam = me && team.playerIds.includes(me.id);
                const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
                return (
                  <div
                    key={team.id}
                    className={`px-3 py-2.5 rounded-xl ${myTeam ? 'bg-bg-elevated' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted font-score text-sm w-5 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : `${idx + 1}`}
                      </span>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.colour }} />
                      <span className="flex-1 font-medium text-text-primary">
                        {team.name}
                        {myTeam && <span className="ml-1.5 text-xs text-neon-cyan">(your team)</span>}
                      </span>
                      <span className="font-score text-neon-gold">{formatRands(team.score)}</span>
                    </div>
                    {teamPlayers.length > 0 && (
                      <div className="ml-8 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {teamPlayers.map((p) => (
                          <span key={p.id} className="text-xs text-text-muted">
                            {p.avatar} {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Full rankings */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Final Rankings</p>
          <div className="flex flex-col gap-2">
            {sorted.map((player, idx) => {
              const team = getPlayerTeam(player.id);
              return (
                <motion.div
                  key={player.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    player.id === playerId ? 'bg-bg-elevated' : ''
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                >
                  <span
                    className={`font-score text-lg w-6 text-center ${
                      idx === 0 ? 'text-neon-gold' : 'text-text-muted'
                    }`}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  {isTeamMode && team && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.colour }}
                      title={team.name}
                    />
                  )}
                  <span className="flex-1 font-medium text-text-primary">
                    {player.name}
                    {player.id === playerId && (
                      <span className="ml-1.5 text-xs text-neon-cyan">(you)</span>
                    )}
                  </span>
                  <span className="font-score text-neon-gold text-sm">{formatRands(player.score)}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Leave button */}
        <motion.button
          onClick={handleLeave}
          className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all mt-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          LEAVE GAME
        </motion.button>
      </div>
    </motion.div>
  );
}
