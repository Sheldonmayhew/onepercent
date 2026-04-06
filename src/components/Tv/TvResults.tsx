import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { useSound } from '../../hooks/useSound';
import { formatRands } from '../../utils/helpers';

interface TvResultsProps {
  gameState: GameBroadcast;
}

export default function TvResults({ gameState }: TvResultsProps) {
  const { players, teamMode, teams } = gameState;
  const { play } = useSound();
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    play('winner');
  }, [play]);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Title */}
        <motion.h1
          className="font-display text-7xl lg:text-8xl text-text-primary text-center tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          GAME OVER
        </motion.h1>

        {/* Winner card */}
        {winner && (
          <motion.div
            className="bg-gradient-to-br from-neon-gold/20 to-neon-pink/10 rounded-3xl shadow-soft p-8 lg:p-10 flex flex-col items-center gap-4 border border-neon-gold/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <span className="text-7xl">🏆</span>
            <span className="text-6xl">{winner.avatar}</span>
            <p className="font-display text-4xl text-text-primary tracking-wide">
              {winner.name}
            </p>
            <p className="font-score text-5xl text-neon-gold font-bold">
              {formatRands(winner.score)}
            </p>
            <p className="text-sm text-text-muted tracking-[0.2em] uppercase">Winner</p>
          </motion.div>
        )}

        {/* Team standings */}
        {teamMode && teams && teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
              Team Standings
            </h3>
            <div className="flex flex-col gap-3">
              {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => {
                const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
                return (
                  <div
                    key={team.id}
                    className="px-5 py-3 rounded-xl bg-bg-elevated"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-score text-lg w-6 text-center text-text-muted">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : `${idx + 1}`}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: team.colour }}
                      />
                      <span className="flex-1 text-xl font-medium text-text-primary">
                        {team.name}
                      </span>
                      <span className="font-score text-xl text-neon-gold">
                        {formatRands(team.score)}
                      </span>
                    </div>
                    {teamPlayers.length > 0 && (
                      <div className="ml-10 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {teamPlayers.map((p) => (
                          <span key={p.id} className="text-sm text-text-muted">
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

        {/* Individual rankings */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
            Final Rankings
          </h3>
          <div className="flex flex-col gap-3">
            {sorted.map((player, idx) => {
              const playerTeam = teamMode && teams ? teams.find((t) => t.playerIds.includes(player.id)) : null;
              return (
                <motion.div
                  key={player.id}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl bg-bg-elevated"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + idx * 0.07 }}
                >
                  <span
                    className={`font-score text-xl w-8 text-center ${
                      idx === 0 ? 'text-neon-gold' : idx === 1 ? 'text-text-secondary' : 'text-text-muted'
                    }`}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-3xl">{player.avatar}</span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: playerTeam ? playerTeam.colour : player.colour }}
                    title={playerTeam?.name}
                  />
                  <span className="flex-1 text-xl font-medium text-text-primary">
                    {player.name}
                  </span>
                  <span className="font-score text-xl text-neon-gold">
                    {formatRands(player.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
