import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useHostMultiplayer, broadcastHostState, endHostGame } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import { PLAYER_COLOURS } from '../types';

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
}

export function Component() {
  const navigate = useNavigate();
  const session = useGameStore((s) => s.session);
  const { startGame, resetGame } = useGameStore();
  const { roomCode } = useMultiplayerStore();
  const mpReset = useMultiplayerStore((s) => s.reset);
  const { createRoom } = useHostMultiplayer();
  const profile = useProfileStore((s) => s.profile);

  const [copied, setCopied] = useState(false);
  const hostAddedRef = useRef(false);
  const roomCreatedRef = useRef(false);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  // Create room on mount (once)
  useEffect(() => {
    if (!session || roomCreatedRef.current) return;
    roomCreatedRef.current = true;
    createRoom();
  }, [session, createRoom]);

  // Auto-add host as player (once room + session exist)
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

  // Redirect if no session or roomCode not yet available — only after initial load
  if (!session || !roomCode) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg-primary">
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
    startGame();
    broadcastHostState('/player/round-intro');
    navigate('/host/round-intro');
  };

  const handleBack = () => {
    endHostGame();
    mpReset();
    resetGame();
    navigate('/');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center bg-bg-primary px-4 py-8 overflow-y-auto">
      <motion.div
        className="w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <h1 className="font-display text-5xl text-text-primary text-center tracking-tight mb-8">
          LOBBY
        </h1>

        {/* Room Code Card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6 flex flex-col items-center mb-6"
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
              size={160}
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

          <p className="text-text-muted text-xs mt-2">
            Scan QR code or share the link to join
          </p>
        </motion.div>

        {/* Player count dots */}
        <div className="flex justify-center gap-2 mb-5">
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

        {/* Player List */}
        <div className="space-y-2 mb-6 min-h-[96px]">
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
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAYER_COLOURS[idx % PLAYER_COLOURS.length] }}
                />
                <span className="flex-1 text-lg font-medium text-text-primary">
                  {player.name}
                  {player.isHost && (
                    <span className="ml-1.5 text-neon-gold text-sm" title="Host">
                      👑
                    </span>
                  )}
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

        {/* Team Groupings (team mode, read-only) */}
        {isTeamMode && teams.length > 0 && players.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-display text-xs text-text-muted tracking-[0.15em] mb-3">
              TEAMS
            </h3>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}
            >
              {teams.map((team) => {
                const teamPlayers = players.filter((p) => p.teamId === team.id);
                return (
                  <div
                    key={team.id}
                    className="bg-bg-card rounded-xl shadow-soft p-3 min-h-[72px]"
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
                          <div
                            key={p.id}
                            className="flex items-center gap-1 text-xs text-text-primary"
                          >
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

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-full font-display text-lg tracking-wide bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            BACK
          </motion.button>

          <motion.button
            onClick={handleStartGame}
            disabled={!canStart}
            className={`flex-[2] py-3.5 rounded-full font-display text-lg tracking-wide transition-all ${
              canStart
                ? 'bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary hover:brightness-110'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }`}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            {canStart
              ? 'START GAME'
              : `NEED ${2 - players.length} MORE PLAYER${2 - players.length === 1 ? '' : 'S'}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
