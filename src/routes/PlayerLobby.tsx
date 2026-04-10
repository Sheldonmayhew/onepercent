import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import GameLayout, { NavBack } from '../components/Game/GameLayout';

const CURRENT_ROUTE = '/player/lobby';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect, sendJoinTeam } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

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

  const myTeam = me ? teams.find((t) => t.playerIds.includes(me.id)) : null;
  const getPlayerTeam = (pId: string) => teams.find((t) => t.playerIds.includes(pId));

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
          className="flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-bg-elevated"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm font-medium">Waiting for host</p>
        </motion.div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Waiting for Host card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6 flex flex-col items-center gap-3"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="text-5xl">⏳</span>
          <h1 className="font-display text-2xl text-text-primary tracking-wide text-center">
            Waiting for Host to Start
          </h1>
          {packName && (
            <p className="text-sm text-text-muted text-center">
              Pack: <span className="text-text-secondary font-medium">{packName}</span>
            </p>
          )}
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < players.length ? 'bg-neon-cyan' : 'bg-bg-elevated'}`} />
            ))}
          </div>
          <p className="text-xs text-text-muted">
            {players.length < 2
              ? `Game starts as soon as ${2 - players.length} more player${2 - players.length === 1 ? '' : 's'} join...`
              : `${players.length} players ready`}
          </p>
        </motion.div>

        {/* Team mode */}
        {isTeamMode && teams.length > 0 ? (
          <>
            <div>
              <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3 text-center">Choose Your Side</p>
              <div className="flex flex-col gap-3">
                {teams.map((team, teamIdx) => {
                  const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
                  const isMine = myTeam?.id === team.id;
                  return (
                    <motion.button
                      key={team.id}
                      type="button"
                      onClick={() => { if (playerId) sendJoinTeam(playerId, team.id); }}
                      className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all ${isMine ? 'ring-2 shadow-lg' : 'opacity-80 hover:opacity-100'}`}
                      style={{
                        background: `linear-gradient(135deg, ${team.colour}30, ${team.colour}10)`,
                        ['--tw-ring-color' as string]: team.colour,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: teamIdx % 2 === 0 ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + teamIdx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-xl tracking-wide" style={{ color: team.colour }}>{team.name}</h3>
                        {isMine ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: team.colour }}>SELECTED</span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ borderColor: team.colour, color: team.colour }}>JOIN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {teamPlayers.slice(0, 4).map((p) => (
                            <div key={p.id} className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-base ring-2 ring-bg-primary">{p.avatar}</div>
                          ))}
                        </div>
                        {teamPlayers.length > 4 && <span className="text-xs text-text-muted ml-1">+{teamPlayers.length - 4}</span>}
                        {teamPlayers.length === 0 && <span className="text-xs text-text-muted italic">No players yet</span>}
                      </div>
                    </motion.button>
                  );
                })}
                {teams.length === 2 && (
                  <div className="flex items-center justify-center -my-1.5 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-bg-card shadow-soft flex items-center justify-center">
                      <span className="font-display text-xs text-text-muted">VS</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Players Ready ({players.length})</p>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {players.map((player) => {
                    const pTeam = getPlayerTeam(player.id);
                    return (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`bg-bg-card shadow-soft rounded-xl p-4 flex flex-col items-center gap-2 border ${player.id === playerId ? 'border-neon-cyan/30' : 'border-transparent'}`}
                      >
                        <div className="relative">
                          <span className="text-3xl">{player.avatar}</span>
                          {player.id === playerId && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-gold flex items-center justify-center"><span className="text-[8px]">★</span></div>
                          )}
                        </div>
                        <span className="font-medium text-text-primary text-sm text-center truncate w-full">
                          {player.id === playerId ? `You (${player.name})` : player.name}
                        </span>
                        {pTeam ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider" style={{ backgroundColor: pTeam.colour }}>{pTeam.name}</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted uppercase tracking-wider">No Team</span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Players ({players.length}/8)</p>
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
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-card shadow-soft border ${player.id === playerId ? 'border-neon-cyan/30' : 'border-transparent'}`}
                  >
                    <span className="text-2xl">{player.avatar}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.colour }} />
                    <span className="flex-1 font-medium text-text-primary">
                      {player.name}
                      {player.id === playerId && <span className="ml-1.5 text-xs text-neon-cyan">(you)</span>}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
