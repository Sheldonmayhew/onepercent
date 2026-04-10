import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useHostMultiplayer, broadcastHostState, endHostGame } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import { PLAYER_COLOURS } from '../types';
import GameLayout, { NavCTA, NavBack } from '../components/Game/GameLayout';

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
}

export function Component() {
  const navigate = useNavigate();
  const session = useGameStore((s) => s.session);
  const { startGame, resetGame, assignPlayerToTeam } = useGameStore();
  const { roomCode } = useMultiplayerStore();
  const mpReset = useMultiplayerStore((s) => s.reset);
  const { createRoom } = useHostMultiplayer();
  const profile = useProfileStore((s) => s.profile);

  const [copied, setCopied] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const hostAddedRef = useRef(false);
  const roomCreatedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!session || roomCreatedRef.current || roomCode) return;
    roomCreatedRef.current = true;
    createRoom();
  }, [session, createRoom, roomCode]);

  useEffect(() => {
    if (!session || !roomCode || hostAddedRef.current) return;
    const alreadyHost = session.players.some((p) => p.isHost);
    if (alreadyHost) {
      hostAddedRef.current = true;
      return;
    }
    hostAddedRef.current = true;
    const name = profile?.name ?? 'Host';
    const avatar = profile?.avatar ?? '👑';
    useGameStore.getState().addPlayer(name, avatar, true);
  }, [session, roomCode, profile]);

  if (!session || !roomCode) {
    return (
      <div className="h-dvh flex items-center justify-center bg-bg-primary">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-secondary font-display tracking-wide">CREATING ROOM…</p>
        </motion.div>
      </div>
    );
  }

  const { players, settings, teams } = session;
  const isTeamMode = settings.teamMode;
  const canStart = players.length >= 2;
  const joinUrl = getJoinUrl(roomCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStartGame = () => {
    try {
      startGame();
      broadcastHostState('/player/round-intro');
      navigate('/host/round-intro');
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleBack = () => {
    endHostGame();
    mpReset();
    resetGame();
    navigate('/');
  };

  return (
    <GameLayout
      header={
        <div className="px-4 pt-4 pb-2">
          <h1 className="font-display text-3xl text-text-primary text-center tracking-tight">
            LOBBY
          </h1>
        </div>
      }
      secondaryAction={<NavBack onClick={handleBack} />}
      cta={
        <NavCTA onClick={handleStartGame} disabled={!canStart}>
          {canStart ? 'START GAME' : `NEED ${2 - players.length} MORE`}
        </NavCTA>
      }
    >
      <div className="pt-2 flex flex-col gap-5">
        {/* Room Code Card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6 flex flex-col items-center"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}
        >
          <span className="text-xs text-text-muted tracking-[0.15em] mb-2">ROOM CODE</span>
          <span className="font-display text-5xl text-neon-cyan font-bold tracking-[0.3em]">
            {roomCode}
          </span>

          <div className="mt-5 p-3 bg-white rounded-xl">
            <QRCodeSVG
              value={joinUrl}
              size={140}
              bgColor="#ffffff"
              fgColor="#0a0a0f"
              level="M"
            />
          </div>

          <motion.button
            onClick={handleCopy}
            className="mt-4 px-5 py-2 rounded-lg text-sm font-medium bg-bg-elevated text-neon-cyan hover:bg-bg-surface transition-all"
            whileTap={{ scale: 0.95 }}
          >
            {copied ? '✓ COPIED!' : 'COPY INVITE LINK'}
          </motion.button>
        </motion.div>

        {/* Player count dots */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < players.length ? 'bg-neon-cyan' : 'bg-bg-elevated'
              }`}
              animate={i < players.length ? { scale: [1, 1.3, 1] } : { scale: 0.75 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Team mode layout */}
        {isTeamMode && teams.length > 0 && players.length > 0 ? (
          <>
            <div>
              <h3 className="font-display text-xs text-text-muted tracking-[0.15em] mb-3 text-center">
                {selectedPlayerId ? 'TAP A TEAM TO ASSIGN' : 'TAP A PLAYER BELOW, THEN A TEAM'}
              </h3>

              <div className="flex flex-col gap-3 relative">
                {teams.map((team, teamIdx) => {
                  const teamPlayers = players.filter((p) => p.teamId === team.id);
                  return (
                    <motion.button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        if (selectedPlayerId) {
                          assignPlayerToTeam(selectedPlayerId, team.id);
                          broadcastHostState();
                          setSelectedPlayerId(null);
                        }
                      }}
                      className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all ${
                        selectedPlayerId ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${team.colour}30, ${team.colour}10)`,
                        border: selectedPlayerId ? `2px solid ${team.colour}40` : '2px solid transparent',
                      }}
                      initial={{ opacity: 0, x: teamIdx % 2 === 0 ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + teamIdx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-display text-xl tracking-wide" style={{ color: team.colour }}>
                          {team.name}
                        </h4>
                        <span className="text-xs text-text-muted font-score">
                          {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {teamPlayers.slice(0, 4).map((p) => (
                            <div key={p.id} className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-base ring-2 ring-bg-primary">
                              {p.avatar}
                            </div>
                          ))}
                        </div>
                        {teamPlayers.length > 4 && <span className="text-xs text-text-muted">+{teamPlayers.length - 4}</span>}
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

            {/* Player grid with team badges */}
            <div>
              <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">
                Players Ready ({players.length})
              </p>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {players.map((player) => {
                    const pTeam = teams.find((t) => t.id === player.teamId);
                    const isSelected = selectedPlayerId === player.id;
                    return (
                      <motion.button
                        key={player.id}
                        type="button"
                        layout
                        onClick={() => setSelectedPlayerId((prev) => (prev === player.id ? null : player.id))}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`bg-bg-card shadow-soft rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                          isSelected ? 'ring-2 ring-neon-cyan shadow-md' : 'hover:bg-bg-elevated'
                        }`}
                      >
                        <div className="relative">
                          <span className="text-3xl">{player.avatar}</span>
                          {player.isHost && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-gold flex items-center justify-center">
                              <span className="text-[8px]">👑</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-text-primary text-sm text-center truncate w-full">
                          {player.name}
                        </span>
                        {pTeam ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider" style={{ backgroundColor: pTeam.colour }}>
                            {pTeam.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted uppercase tracking-wider">
                            No Team
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2 min-h-[96px]">
            <AnimatePresence mode="popLayout">
              {players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -16, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-4 py-3"
                >
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PLAYER_COLOURS[idx % PLAYER_COLOURS.length] }} />
                  <span className="flex-1 text-lg font-medium text-text-primary">
                    {player.name}
                    {player.isHost && <span className="ml-1.5 text-neon-gold text-sm">👑</span>}
                  </span>
                  <span className="text-xs text-text-muted">P{idx + 1}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && (
              <div className="flex items-center justify-center h-24 text-text-muted text-sm">
                Waiting for players to join…
              </div>
            )}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
