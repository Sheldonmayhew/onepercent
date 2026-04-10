import { motion } from 'framer-motion';
import type { Player, Team, RoundResult } from '../../types';
import PlayerStatusBar from './PlayerStatusBar';
import { formatRands } from '../../utils/helpers';

interface RevealPlayerResultsProps {
  players: Player[];
  correctPlayers: Player[];
  incorrectPlayers: Player[];
  isTeamMode: boolean;
  teams: Team[];
  lastRound: RoundResult;
  pointsAtStake: number;
}

export default function RevealPlayerResults({
  players,
  correctPlayers,
  incorrectPlayers,
  isTeamMode,
  teams,
  lastRound,
  pointsAtStake,
}: RevealPlayerResultsProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {correctPlayers.length > 0 && (
        <div>
          <p className="text-xs text-neon-green tracking-[0.15em] uppercase mb-2">
            Correct ✓
          </p>
          <div className="flex flex-wrap gap-2">
            {correctPlayers.map((p) => {
              const pTeam = isTeamMode ? teams.find((t) => t.id === p.teamId) : null;
              return (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                >
                  <span>{p.avatar}</span>
                  <span className="text-text-primary font-medium">{p.name}</span>
                  {pTeam && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                  )}
                  <span className="text-neon-green text-xs font-score">
                    +{formatRands(pointsAtStake)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {incorrectPlayers.length > 0 && (
        <div>
          <p className="text-xs text-neon-pink tracking-[0.15em] uppercase mb-2">
            Incorrect ✗
          </p>
          <div className="flex flex-wrap gap-2">
            {incorrectPlayers.map((p) => {
              const pTeam = isTeamMode ? teams.find((t) => t.id === p.teamId) : null;
              return (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
                >
                  <span>{p.avatar}</span>
                  <span className="text-text-primary font-medium">{p.name}</span>
                  {pTeam && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                  )}
                  <span className="text-text-muted text-xs">—</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Round Rankings */}
      <div className="mt-1">
        <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-2">
          {isTeamMode ? 'Round Rankings' : 'Scores'}
        </p>
        {isTeamMode ? (
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((p, idx) => {
              const pTeam = teams.find((t) => t.id === p.teamId);
              const wasCorrect = lastRound.correctPlayers.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card shadow-soft"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0
                        ? 'bg-neon-gold/20 text-neon-gold'
                        : idx === 1
                          ? 'bg-text-secondary/15 text-text-secondary'
                          : idx === 2
                            ? 'bg-neon-pink/15 text-neon-pink'
                            : 'bg-bg-elevated text-text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xl">{p.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{p.name}</p>
                    <p className={`text-xs font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                      {wasCorrect ? `+${formatRands(pointsAtStake)}` : 'No points'}
                    </p>
                  </div>
                  {pTeam && (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                  )}
                  <span className="font-score text-neon-gold text-sm">
                    {formatRands(p.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <PlayerStatusBar players={players} />
        )}
      </div>
    </motion.div>
  );
}
