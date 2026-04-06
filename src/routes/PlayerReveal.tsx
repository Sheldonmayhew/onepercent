import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { formatRands } from '../utils/helpers';

const CURRENT_ROUTE = '/player/reveal';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const reveal = gameState?.reveal;
  const players = gameState?.players ?? [];
  const round = gameState?.round;

  const isTeamMode = gameState?.teamMode;
  const teams = gameState?.teams ?? [];

  // Navigate when host broadcasts a new route
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const isCorrect = playerId != null && (reveal?.correctPlayerIds.includes(playerId) ?? false);
  const correctPlayers = players.filter((p) => reveal?.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal?.incorrectPlayerIds.includes(p.id));
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex((p) => p.id === playerId) + 1;

  const getPlayerTeam = (pId: string) => teams.find((t) => t.playerIds.includes(pId));
  const totalTeamScore = teams.reduce((acc, t) => acc + t.score, 0) || 1;

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
      <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
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

      <div className="w-full max-w-lg mx-auto flex flex-col gap-5 flex-1">
        {/* Team Battle Scoreboard */}
        {isTeamMode && teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-sm text-text-primary tracking-wide">TEAM BATTLE</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green">
                LIVE
              </span>
            </div>

            {teams.length === 2 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center flex-1">
                    <p className="font-score text-3xl font-bold" style={{ color: teams[0].colour }}>
                      {formatRands(teams[0].score)}
                    </p>
                    <p className="text-xs text-text-muted uppercase tracking-wider">{teams[0].name}</p>
                  </div>
                  <span className="font-display text-sm text-text-muted mx-4">VS</span>
                  <div className="text-center flex-1">
                    <p className="font-score text-3xl font-bold" style={{ color: teams[1].colour }}>
                      {formatRands(teams[1].score)}
                    </p>
                    <p className="text-xs text-text-muted uppercase tracking-wider">{teams[1].name}</p>
                  </div>
                </div>

                {/* Score progress bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-elevated">
                  <div
                    className="transition-all duration-700 rounded-l-full"
                    style={{
                      width: `${Math.max(5, (teams[0].score / totalTeamScore) * 100)}%`,
                      backgroundColor: teams[0].colour,
                    }}
                  />
                  <div
                    className="transition-all duration-700 rounded-r-full"
                    style={{
                      width: `${Math.max(5, (teams[1].score / totalTeamScore) * 100)}%`,
                      backgroundColor: teams[1].colour,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-3">
                    <span className="text-text-muted font-score text-sm w-4">{idx + 1}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.colour }} />
                    <span className="flex-1 font-medium text-text-primary text-sm">{team.name}</span>
                    <span className="font-score text-sm" style={{ color: team.colour }}>
                      {formatRands(team.score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Personal result */}
        <motion.div
          className={`rounded-2xl p-6 flex flex-col items-center gap-3 ${
            isCorrect
              ? 'bg-neon-green/10 border border-neon-green/30'
              : 'bg-neon-pink/10 border border-neon-pink/30'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="text-5xl">{isCorrect ? '✅' : '❌'}</span>
          <p
            className={`font-display text-3xl tracking-wide ${
              isCorrect ? 'text-neon-green' : 'text-neon-pink'
            }`}
          >
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </p>
          {me && (
            <p className="font-score text-2xl text-neon-gold font-bold">
              {formatRands(me.score)}
            </p>
          )}
        </motion.div>

        {/* Correct answer card */}
        {reveal && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5 flex flex-col gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase">Correct Answer</p>
            <p className="text-xl font-display font-bold text-neon-green">{reveal.correctAnswer}</p>
            {reveal.explanation && (
              <p className="text-sm text-text-secondary leading-relaxed">{reveal.explanation}</p>
            )}
          </motion.div>
        )}

        {/* Round Rankings */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-5 flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-text-muted tracking-[0.15em] uppercase">
            {isTeamMode ? 'Round Rankings' : 'Scores'}
          </p>
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((p, idx) => {
              const pTeam = isTeamMode ? getPlayerTeam(p.id) : null;
              const wasCorrect = reveal?.correctPlayerIds.includes(p.id);
              const isMe = p.id === playerId;
              return (
                <motion.div
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    isMe ? 'bg-bg-elevated' : ''
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.05 }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
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
                  {pTeam && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {p.name}
                      {isMe && <span className="ml-1 text-xs text-neon-cyan">(you)</span>}
                    </p>
                    {isTeamMode && (
                      <p className={`text-xs font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                        {wasCorrect ? `+${formatRands(round?.points ?? 0)}` : 'No points'}
                      </p>
                    )}
                  </div>
                  <span className="font-score text-neon-gold text-sm">
                    {formatRands(p.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Waiting indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-auto"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for next round…</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
