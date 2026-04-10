import { motion } from 'framer-motion';
import type { BroadcastPlayer, GameBroadcast } from '../../stores/multiplayerStore';
import type { Team } from '../../types';
import { formatRands } from '../../utils/helpers';

interface TvRevealResultsProps {
  players: BroadcastPlayer[];
  reveal: NonNullable<GameBroadcast['reveal']>;
  teamMode: boolean;
  teams?: Team[];
  points: number;
}

export default function TvRevealResults({ players, reveal, teamMode, teams, points }: TvRevealResultsProps) {
  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal.incorrectPlayerIds.includes(p.id));
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const getPlayerTeam = (pId: string) => teams?.find((t) => t.playerIds.includes(pId));

  return (
    <>
      {/* Correct / Incorrect grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Correct */}
        {correctPlayers.length > 0 && (
          <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-6">
            <h3 className="text-sm text-neon-green tracking-[0.15em] uppercase mb-4">
              Correct
            </h3>
            <div className="flex flex-wrap gap-3">
              {correctPlayers.map((p, i) => {
                const pTeam = teamMode ? getPlayerTeam(p.id) : null;
                return (
                  <motion.div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-green/10 border border-neon-green/20"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-lg text-text-primary font-medium">{p.name}</span>
                    {pTeam && (
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                    )}
                    <span className="text-neon-green font-score">
                      +{formatRands(points)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incorrect */}
        {incorrectPlayers.length > 0 && (
          <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-2xl p-6">
            <h3 className="text-sm text-neon-pink tracking-[0.15em] uppercase mb-4">
              Incorrect
            </h3>
            <div className="flex flex-wrap gap-3">
              {incorrectPlayers.map((p, i) => {
                const pTeam = teamMode ? getPlayerTeam(p.id) : null;
                return (
                  <motion.div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-pink/10 border border-neon-pink/20"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-lg text-text-primary font-medium">{p.name}</span>
                    {pTeam && (
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                    )}
                    <span className="text-text-muted">--</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Round Rankings */}
      <motion.div
        className="bg-bg-card shadow-soft rounded-2xl p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
          {teamMode ? 'Round Rankings' : 'Leaderboard'}
        </h3>
        {teamMode ? (
          <div className="flex flex-col gap-3">
            {sortedPlayers.map((p, idx) => {
              const pTeam = getPlayerTeam(p.id);
              const wasCorrect = reveal.correctPlayerIds.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-bg-elevated"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.07 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                      idx === 0
                        ? 'bg-neon-gold/20 text-neon-gold'
                        : idx === 1
                          ? 'bg-text-secondary/15 text-text-secondary'
                          : idx === 2
                            ? 'bg-neon-pink/15 text-neon-pink'
                            : 'bg-bg-card text-text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-3xl">{p.avatar}</span>
                  {pTeam && (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-medium text-text-primary">{p.name}</p>
                    <p className={`text-sm font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                      {wasCorrect ? `+${formatRands(points)}` : 'No points'}
                    </p>
                  </div>
                  <span className="font-score text-xl text-neon-gold">
                    {formatRands(p.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedPlayers.map((p, idx) => {
              const wasCorrect = reveal.correctPlayerIds.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-bg-elevated"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.07 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                      idx === 0
                        ? 'bg-neon-gold/20 text-neon-gold'
                        : idx === 1
                          ? 'bg-text-secondary/15 text-text-secondary'
                          : idx === 2
                            ? 'bg-neon-pink/15 text-neon-pink'
                            : 'bg-bg-card text-text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-3xl">{p.avatar}</span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.colour }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-medium text-text-primary">{p.name}</p>
                    <p className={`text-sm font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                      {wasCorrect ? `+${formatRands(points)}` : 'No points'}
                    </p>
                  </div>
                  <span className="font-score text-xl text-neon-gold">
                    {formatRands(p.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
