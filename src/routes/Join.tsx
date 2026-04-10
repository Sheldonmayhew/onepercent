import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useProfileStore } from '../stores/profileStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import EmojiPicker, { ALL_EMOJIS } from '../components/Game/EmojiPicker';
import BottomNavBar from '../components/BottomNavBar';
import ProfileScreen from '../components/Profile/ProfileScreen';
import { useNavTabs } from '../hooks/useNavTabs';

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

  const { showProfile, handleTabChange, closeProfile } = useNavTabs('join');

  useEffect(() => { setError(null); }, [code, name, setError]);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) return;

    setLoading(true);
    setError(null);
    await joinRoom(trimmedCode, trimmedName, avatar);
    setLoading(false);

    const currentError = useMultiplayerStore.getState().error;
    if (!currentError) navigate('/player/lobby', { replace: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleJoin(); };

  if (showProfile) {
    return (
      <>
        <ProfileScreen onClose={closeProfile} />
        <BottomNavBar activeTab="profile" onTabChange={handleTabChange} />
      </>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-20">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 lg:pt-14">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-text-primary text-center tracking-tight mb-6 md:mb-10 lg:mb-12">
          JOIN GAME
        </h1>

        <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-5 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-text-muted tracking-[0.15em] uppercase">Room Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} placeholder="ABCD" maxLength={6} className="py-3.5 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl bg-bg-card shadow-soft text-text-primary text-2xl md:text-3xl font-display tracking-[0.3em] text-center outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all uppercase" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-text-muted tracking-[0.15em] uppercase">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter your name" maxLength={20} className="py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl bg-bg-card shadow-soft text-text-primary text-lg md:text-xl outline-none focus:ring-2 focus:ring-neon-cyan/30 transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs md:text-sm text-text-muted tracking-[0.15em] uppercase">Avatar</label>
            <motion.button onClick={() => setShowPicker((v) => !v)} className="flex items-center gap-3 py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all" whileTap={{ scale: 0.98 }}>
              <span className="text-3xl md:text-4xl">{avatar}</span>
              <span className="text-sm md:text-base">{showPicker ? 'Close picker' : 'Change avatar'}</span>
            </motion.button>
            {showPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <EmojiPicker selected={avatar} onSelect={(e) => { setAvatar(e); setShowPicker(false); }} />
              </motion.div>
            )}
          </div>
          {error && (
            <motion.p className="text-center text-neon-pink text-sm md:text-base font-medium" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>{error}</motion.p>
          )}

          {/* Join CTA */}
          <motion.button
            onClick={handleJoin}
            disabled={loading || !code.trim() || !name.trim()}
            className="w-full py-3.5 md:py-4 rounded-full font-display text-xl md:text-2xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'JOINING…' : 'JOIN GAME'}
          </motion.button>
        </div>
      </div>

      <BottomNavBar activeTab="join" onTabChange={handleTabChange} />
    </div>
  );
}
