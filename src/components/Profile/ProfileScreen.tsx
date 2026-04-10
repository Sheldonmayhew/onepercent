import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../../stores/profileStore';
import { PLAYER_COLOURS } from '../../types';
import EmojiPicker, { ALL_EMOJIS } from '../Game/EmojiPicker';
import { formatRands } from '../../utils/helpers';

interface ProfileScreenProps {
  onClose: () => void;
}

export default function ProfileScreen({ onClose }: ProfileScreenProps) {
  const { profile, createProfile, updateProfile, clearProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? ALL_EMOJIS[0]);
  const [colour, setColour] = useState(profile?.colour ?? PLAYER_COLOURS[0]);
  const [editing, setEditing] = useState(!profile);

  const handleSave = () => {
    if (!name.trim()) return;
    if (profile) {
      updateProfile({ name: name.trim(), avatar, colour });
    } else {
      createProfile(name.trim(), avatar, colour);
    }
    setEditing(false);
  };

  const handleClear = () => {
    clearProfile();
    setName('');
    setAvatar(ALL_EMOJIS[0]);
    setColour(PLAYER_COLOURS[0]);
    setEditing(true);
  };

  const stats = profile?.stats;
  const winRate = stats && stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;
  const accuracy = stats && stats.questionsAnswered > 0
    ? Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100)
    : 0;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-8 lg:px-12 py-8 pb-24">
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-2xl lg:max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-text-primary tracking-tight">PROFILE</h1>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
        </div>

        {editing ? (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8 mb-6">
            <div className="mb-4 md:mb-5">
              <label className="text-xs md:text-sm text-text-secondary font-medium block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full py-3 md:py-4 px-4 md:px-5 rounded-xl md:rounded-2xl bg-white border border-gray-200 text-text-primary text-lg md:text-xl font-medium outline-none focus:border-neon-cyan focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
            </div>

            <div className="mb-4 md:mb-5">
              <label className="text-xs md:text-sm text-text-secondary font-medium block mb-2">Avatar</label>
              <EmojiPicker selected={avatar} onSelect={setAvatar} />
            </div>

            <div className="mb-6 md:mb-8">
              <label className="text-xs md:text-sm text-text-secondary font-medium block mb-2">Colour</label>
              <div className="flex gap-2 md:gap-3">
                {PLAYER_COLOURS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColour(c)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${
                      colour === c ? 'ring-2 ring-white ring-offset-2 ring-offset-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-display text-lg md:text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-primary"
              whileTap={{ scale: 0.98 }}
            >
              {profile ? 'SAVE' : 'CREATE PROFILE'}
            </motion.button>
          </div>
        ) : profile ? (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8 mb-6 text-center">
              <span className="text-5xl md:text-6xl block mb-2">{profile.avatar}</span>
              <h2 className="font-display text-2xl md:text-3xl" style={{ color: profile.colour }}>{profile.name}</h2>
              <p className="text-text-muted text-xs md:text-sm mt-1">
                Playing since {new Date(profile.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2 md:gap-3 justify-center mt-4 md:mt-6">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium bg-white border border-gray-200 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                >
                  Clear Profile
                </button>
              </div>
            </div>

            {/* Stats */}
            {stats && stats.gamesPlayed > 0 && (
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
                <h3 className="font-display text-lg md:text-xl text-text-primary tracking-wide mb-4 md:mb-6">STATS</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  <StatCard label="Games Played" value={String(stats.gamesPlayed)} />
                  <StatCard label="Win Rate" value={`${winRate}%`} />
                  <StatCard label="Total Score" value={formatRands(stats.totalScore)} />
                  <StatCard label="Best Game" value={formatRands(stats.highestScore)} />
                  <StatCard label="Accuracy" value={`${accuracy}%`} />
                  <StatCard label="Questions Right" value={`${stats.questionsCorrect}/${stats.questionsAnswered}`} />
                </div>
              </div>
            )}
          </>
        ) : null}
      </motion.div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-indigo-50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center">
      <span className="text-xs md:text-sm text-text-muted block mb-1">{label}</span>
      <span className="font-score text-lg md:text-xl text-neon-gold font-bold">{value}</span>
    </div>
  );
}
