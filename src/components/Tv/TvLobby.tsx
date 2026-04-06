import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { GameBroadcast } from '../../stores/multiplayerStore';

interface TvLobbyProps {
  gameState: GameBroadcast;
  roomCode: string | null;
}

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
}

export default function TvLobby({ gameState, roomCode }: TvLobbyProps) {
  const { players, packName, teamMode, teams } = gameState;

  return (
    <div className="min-h-dvh flex items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Join info */}
        <div className="flex flex-col items-center gap-6">
          <h1 className="font-display text-5xl lg:text-7xl text-text-primary tracking-tight">
            JOIN THE GAME
          </h1>

          {roomCode && (
            <>
              <div className="bg-bg-card shadow-soft rounded-3xl p-8 flex flex-col items-center gap-4">
                <span className="text-xs text-text-muted tracking-[0.2em] uppercase">
                  Room Code
                </span>
                <span className="font-display text-7xl lg:text-8xl text-neon-cyan font-bold tracking-[0.35em]">
                  {roomCode}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <QRCodeSVG
                  value={getJoinUrl(roomCode)}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="M"
                />
              </div>
            </>
          )}

          {packName && (
            <span className="inline-block px-4 py-2 rounded-full bg-bg-elevated text-sm font-bold text-text-secondary uppercase tracking-wider">
              {packName}
            </span>
          )}
        </div>

        {/* Right: Players */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3 mb-2">
            <h2 className="font-display text-3xl text-text-primary tracking-wide">
              PLAYERS
            </h2>
            <span className="font-score text-2xl text-neon-cyan">{players.length}</span>
          </div>

          {/* Player count dots */}
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < players.length ? 'bg-neon-cyan' : 'bg-bg-elevated'
                }`}
                animate={i < players.length ? { scale: [1, 1.3, 1] } : { scale: 0.75 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Player list */}
          <div className="space-y-3 min-h-[200px]">
            <AnimatePresence mode="popLayout">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-4 bg-bg-card shadow-soft rounded-2xl px-5 py-4"
                >
                  <span className="text-3xl">{player.avatar}</span>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.colour }}
                  />
                  <span className="text-xl font-medium text-text-primary flex-1">
                    {player.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length === 0 && (
              <motion.div
                className="flex items-center justify-center h-48"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                <p className="text-text-muted text-xl">Waiting for players...</p>
              </motion.div>
            )}
          </div>

          {/* Team display */}
          {teamMode && teams && teams.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display text-sm text-text-muted tracking-[0.15em] uppercase mb-3">
                Teams
              </h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
                {teams.map((team) => {
                  const teamPlayers = players.filter((p) =>
                    team.playerIds.includes(p.id)
                  );
                  return (
                    <div
                      key={team.id}
                      className="bg-bg-card shadow-soft rounded-xl p-4"
                    >
                      <h4
                        className="font-display text-sm tracking-wide mb-2"
                        style={{ color: team.colour }}
                      >
                        {team.name}
                      </h4>
                      <div className="space-y-1.5">
                        {teamPlayers.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-sm text-text-primary">
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                        {teamPlayers.length === 0 && (
                          <p className="text-text-muted text-xs italic">Empty</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
