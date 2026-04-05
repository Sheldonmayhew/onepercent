import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerMultiplayer } from '../../hooks/useMultiplayer';
import { useMultiplayerStore } from '../../stores/multiplayerStore';

export default function JoinGame() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinRoom } = usePlayerMultiplayer();
  const { error, reset } = useMultiplayerStore();

  const handleJoin = async () => {
    if (!code.trim() || !name.trim() || joining) return;
    setJoining(true);
    try {
      await joinRoom(code.trim(), name.trim());
    } catch {
      setJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-neon-cyan glow-cyan tracking-tight mb-1">
            JOIN GAME
          </h1>
          <p className="text-text-secondary text-sm">Enter the room code from the host's screen</p>
        </div>

        {/* Room Code */}
        <div className="mb-4">
          <label className="text-xs text-text-secondary font-medium block mb-2">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
            onKeyDown={handleKeyDown}
            placeholder="ABC12"
            maxLength={5}
            autoFocus
            className="w-full py-3.5 px-4 rounded-xl bg-bg-elevated border border-white/10 text-center text-text-primary text-3xl font-score tracking-[0.4em] uppercase outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-text-muted placeholder:tracking-[0.4em] placeholder:text-xl"
          />
        </div>

        {/* Player Name */}
        <div className="mb-6">
          <label className="text-xs text-text-secondary font-medium block mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full py-3 px-4 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-lg font-medium outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-text-muted"
          />
        </div>

        {error && (
          <p className="text-neon-pink text-sm text-center mb-4">{error}</p>
        )}

        {/* Join Button */}
        <motion.button
          onClick={handleJoin}
          disabled={!code.trim() || !name.trim() || joining}
          className="w-full py-3.5 rounded-xl font-display text-xl tracking-wider bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all box-glow-cyan"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {joining ? 'JOINING...' : 'JOIN'}
        </motion.button>

        {/* Back */}
        <motion.button
          onClick={reset}
          className="w-full mt-3 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
