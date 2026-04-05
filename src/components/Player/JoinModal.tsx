import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerMultiplayer } from '../../hooks/useMultiplayer';
import { useMultiplayerStore } from '../../stores/multiplayerStore';

interface JoinModalProps {
  roomCode: string;
  onClose: () => void;
}

export default function JoinModal({ roomCode, onClose }: JoinModalProps) {
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinRoom } = usePlayerMultiplayer();
  const { error } = useMultiplayerStore();

  const handleJoin = async () => {
    if (!name.trim() || joining) return;
    setJoining(true);
    try {
      await joinRoom(roomCode, name.trim());
    } catch {
      setJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm bg-bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="text-center mb-6">
            <h2 className="font-display text-3xl text-neon-cyan glow-cyan tracking-tight mb-1">
              JOIN GAME
            </h2>
            <p className="text-text-secondary text-sm">
              Room <span className="font-score text-neon-gold tracking-widest">{roomCode}</span>
            </p>
          </div>

          <div className="mb-5">
            <label className="text-xs text-text-secondary font-medium block mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-lg font-medium outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-text-muted"
            />
          </div>

          {error && (
            <p className="text-neon-pink text-sm text-center mb-4">{error}</p>
          )}

          <motion.button
            onClick={handleJoin}
            disabled={!name.trim() || joining}
            className="w-full py-3.5 rounded-xl font-display text-xl tracking-wider bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all box-glow-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {joining ? 'JOINING...' : 'JOIN'}
          </motion.button>

          <motion.button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Back
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
