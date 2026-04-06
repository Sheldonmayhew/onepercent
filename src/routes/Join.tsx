import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useProfileStore } from '../stores/profileStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import EmojiPicker, { ALL_EMOJIS } from '../components/Game/EmojiPicker';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const error = useMultiplayerStore((s) => s.error);
  const setError = useMultiplayerStore((s) => s.setError);
  const profile = useProfileStore((s) => s.profile);
  const { joinRoom } = usePlayerMultiplayer();

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? ALL_EMOJIS[0]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Clear error when inputs change
  useEffect(() => {
    setError(null);
  }, [code, name, setError]);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) return;

    setLoading(true);
    setError(null);
    await joinRoom(trimmedCode, trimmedName, avatar);
    setLoading(false);

    // If no error set after joinRoom, navigate
    const currentError = useMultiplayerStore.getState().error;
    if (!currentError) {
      navigate('/player/lobby', { replace: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-4 py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="self-start text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
        >
          ← Back
        </button>

        <h1 className="font-display text-4xl text-text-primary text-center tracking-tight">
          JOIN GAME
        </h1>

        {/* Room code input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted tracking-[0.15em] uppercase">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="ABCD"
            maxLength={6}
            className="py-3.5 px-4 rounded-xl bg-bg-card shadow-soft text-text-primary text-2xl font-display tracking-[0.3em] text-center outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all uppercase"
          />
        </div>

        {/* Player name input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted tracking-[0.15em] uppercase">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            className="py-3 px-4 rounded-xl bg-bg-card shadow-soft text-text-primary text-lg outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all"
          />
        </div>

        {/* Avatar picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted tracking-[0.15em] uppercase">Avatar</label>
          <motion.button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-3 py-3 px-4 rounded-xl bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-3xl">{avatar}</span>
            <span className="text-sm">{showPicker ? 'Close picker' : 'Change avatar'}</span>
          </motion.button>

          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <EmojiPicker
                selected={avatar}
                onSelect={(e) => {
                  setAvatar(e);
                  setShowPicker(false);
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            className="text-center text-neon-pink text-sm font-medium"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* Join button */}
        <motion.button
          onClick={handleJoin}
          disabled={loading || !code.trim() || !name.trim()}
          className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'JOINING…' : 'JOIN GAME'}
        </motion.button>
      </div>
    </motion.div>
  );
}
