import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { endHostGame } from '../../hooks/useMultiplayer';
import { PLAYER_COLOURS, PLAYER_AVATARS } from '../../types';

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#join=${code}`;
}

export default function Lobby() {
  const { session, addPlayer, removePlayer, startGame, resetGame, setScreen } = useGameStore();
  const { roomCode } = useMultiplayerStore();
  const mpReset = useMultiplayerStore((s) => s.reset);
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const { players, settings } = session;
  const isMultiplayer = !!roomCode;
  // In multiplayer, players join via their devices — lower the min to 1 so host can start when ready
  const minPlayers = settings.mode === 'practice' ? 1 : isMultiplayer ? 2 : 4;
  const maxPlayers = settings.mode === 'practice' ? 1 : 8;
  const canStart = players.length >= minPlayers;

  const handleAddPlayer = () => {
    const name = playerName.trim();
    if (!name || players.length >= maxPlayers) return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    addPlayer(name);
    setPlayerName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddPlayer();
  };

  const handleBack = () => {
    endHostGame();
    mpReset();
    setScreen('landing');
    setTimeout(() => resetGame(), 0);
  };

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-5xl text-neon-cyan glow-cyan tracking-tight">LOBBY</h1>

          {/* Room Code + Share (multiplayer) */}
          {isMultiplayer && roomCode && (
            <motion.div
              className="mt-4 bg-bg-surface/80 border border-neon-gold/30 rounded-xl px-6 py-4 inline-flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span className="text-xs text-text-muted block mb-1">ROOM CODE</span>
              <span className="font-score text-4xl text-neon-gold tracking-[0.3em] glow-gold">
                {roomCode}
              </span>

              {/* QR Code */}
              <div className="mt-4 p-3 bg-white rounded-xl">
                <QRCodeSVG
                  value={getJoinUrl(roomCode)}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="M"
                />
              </div>

              {/* Copy Link */}
              <motion.button
                onClick={() => {
                  navigator.clipboard.writeText(getJoinUrl(roomCode));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-neon-gold/10 border border-neon-gold/30 text-neon-gold hover:bg-neon-gold/20 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {copied ? '✓ COPIED!' : 'COPY INVITE LINK'}
              </motion.button>

              <p className="text-text-muted text-xs mt-2">
                Scan the QR code or share the link to join
              </p>
            </motion.div>
          )}

          <p className="text-text-secondary mt-3">
            {isMultiplayer
              ? 'Players join on their own devices with the room code above'
              : settings.mode === 'practice'
                ? 'Enter your name to start practicing'
                : `Add ${minPlayers} to ${maxPlayers} players to begin`}
          </p>

          <div className="flex gap-3 justify-center mt-3">
            <span className="text-xs px-3 py-1 rounded-full bg-bg-elevated text-text-secondary border border-white/5">
              {settings.mode.toUpperCase()}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-bg-elevated text-text-secondary border border-white/5">
              {session.pack.name}
            </span>
            {isMultiplayer && (
              <span className="text-xs px-3 py-1 rounded-full bg-neon-green/10 text-neon-green border border-neon-green/20">
                MULTIPLAYER
              </span>
            )}
          </div>
        </div>

        {/* Local player input (for pass-and-play or adding bots) */}
        {!isMultiplayer && (
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={players.length >= maxPlayers ? 'Lobby full' : 'Enter player name...'}
              disabled={players.length >= maxPlayers}
              maxLength={20}
              autoFocus
              className="flex-1 py-3 px-4 rounded-xl bg-bg-elevated border border-white/10 text-text-primary placeholder-text-muted outline-none focus:border-neon-cyan/50 transition-colors text-lg font-medium"
            />
            <motion.button
              onClick={handleAddPlayer}
              disabled={!playerName.trim() || players.length >= maxPlayers}
              className="px-6 py-3 rounded-xl font-display text-lg tracking-wide bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              ADD
            </motion.button>
          </div>
        )}

        {/* Player List */}
        <div className="space-y-2 mb-8 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 bg-bg-surface/80 border border-white/5 rounded-xl px-4 py-3"
              >
                <span className="text-2xl">{PLAYER_AVATARS[idx % PLAYER_AVATARS.length]}</span>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAYER_COLOURS[idx % PLAYER_COLOURS.length] }}
                />
                <span className="flex-1 text-lg font-medium text-text-primary">{player.name}</span>
                <span className="text-xs text-text-muted">P{idx + 1}</span>
                {!isMultiplayer && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-text-muted hover:text-neon-pink transition-colors p-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="flex items-center justify-center h-[120px] text-text-muted text-sm">
              {isMultiplayer
                ? 'Waiting for players to join...'
                : 'No players yet — type a name above and hit Enter'}
            </div>
          )}
        </div>

        {/* Player count indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: maxPlayers }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < players.length ? 'bg-neon-cyan scale-100' : 'bg-bg-elevated scale-75'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-bg-elevated border border-white/5 text-text-secondary hover:text-text-primary hover:border-white/10 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            BACK
          </motion.button>
          <motion.button
            onClick={startGame}
            disabled={!canStart}
            className={`flex-[2] py-3.5 rounded-xl font-display text-lg tracking-wide transition-all ${
              canStart
                ? 'bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 box-glow-cyan'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }`}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            {canStart
              ? 'START GAME'
              : `NEED ${minPlayers - players.length} MORE PLAYER${minPlayers - players.length === 1 ? '' : 'S'}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
