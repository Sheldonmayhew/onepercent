import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useHostMultiplayer } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import type { MultiplayerMode } from '../types';
import { TEAM_NAMES, TEAM_COLOURS } from '../types';
import { generateId } from '../utils/helpers';

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('science')) return '🔬';
  if (lower.includes('history')) return '📜';
  if (lower.includes('sport')) return '🏀';
  if (lower.includes('geo')) return '🌍';
  if (lower.includes('music') || lower.includes('entertainment') || lower.includes('pop')) return '🎬';
  if (lower.includes('food') || lower.includes('cook')) return '🍳';
  if (lower.includes('nature') || lower.includes('animal')) return '🌿';
  if (lower.includes('tech') || lower.includes('computer')) return '💻';
  if (lower.includes('math') || lower.includes('number')) return '🔢';
  if (lower.includes('language') || lower.includes('word')) return '📝';
  if (lower.includes('art')) return '🎨';
  if (lower.includes('brain') || lower.includes('logic')) return '🧠';
  return '📚';
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { availablePacks, initQuickPlay, initHostGame, addPlayer, startGame } = useGameStore();
  const { createRoom } = useHostMultiplayer();
  const profile = useProfileStore((s) => s.profile);

  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const locationState = location.state as { mode?: MultiplayerMode; teamCount?: 2 | 3 | 4 } | null;
  const mode = locationState?.mode ?? 'individual';
  const teamCount = locationState?.teamCount ?? 2;

  const [selectedPacks, setSelectedPacks] = useState<string[]>(
    availablePacks.length > 0 ? [availablePacks[0].pack_id] : []
  );

  const allSelected = availablePacks.length > 0 && selectedPacks.length === availablePacks.length;

  const togglePack = (packId: string) => {
    setSelectedPacks((prev) => {
      const isSelected = prev.includes(packId);
      // Always keep at least one pack selected
      if (isSelected && prev.length <= 1) return prev;
      return isSelected ? prev.filter((id) => id !== packId) : [...prev, packId];
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPacks(availablePacks.length > 0 ? [availablePacks[0].pack_id] : []);
    } else {
      setSelectedPacks(availablePacks.map((p) => p.pack_id));
    }
  };

  const totalQuestions = availablePacks
    .filter((p) => selectedPacks.includes(p.pack_id))
    .reduce((sum, p) => sum + p.question_count, 0);

  const handleQuickPlay = () => {
    const packs = selectedPacks.length > 0 ? selectedPacks : availablePacks.slice(0, 1).map((p) => p.pack_id);
    initQuickPlay(packs);
    addPlayer(profile?.name ?? 'Player', profile?.avatar);
    startGame();
    navigate('/quick-play/round-intro');
  };

  const handleHost = async () => {
    const packs = selectedPacks.length > 0 ? selectedPacks : availablePacks.slice(0, 1).map((p) => p.pack_id);
    initHostGame(mode, packs);

    // If team mode with more than 2 teams, regenerate teams with the correct count
    if (mode === 'team' && teamCount > 2) {
      const store = useGameStore.getState();
      if (store.session) {
        const teams = Array.from({ length: teamCount }, (_, i) => ({
          id: generateId(),
          name: TEAM_NAMES[i],
          colour: TEAM_COLOURS[i],
          playerIds: [] as string[],
          score: 0,
        }));
        useGameStore.setState({
          session: {
            ...store.session,
            teams,
            settings: { ...store.session.settings, teamCount },
          },
        });
      }
    }

    await createRoom();
    navigate('/host/lobby');
  };

  const handleBack = () => {
    if (isQuickPlay) {
      navigate('/');
    } else {
      navigate('/host/mode');
    }
  };

  const title = isQuickPlay ? 'QUICK PLAY' : 'SELECT PACKS';

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-24">
      <motion.div
        className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-3xl text-text-primary text-center mb-6 tracking-tight">
          {title}
        </h1>

        {/* Pack grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-text-primary tracking-wide">Categories</h2>
            <button
              onClick={toggleAll}
              className="text-xs text-neon-cyan font-medium hover:text-neon-purple transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availablePacks.map((pack) => {
              const isSelected = selectedPacks.includes(pack.pack_id);
              return (
                <motion.button
                  key={pack.pack_id}
                  onClick={() => togglePack(pack.pack_id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-bg-elevated shadow-primary'
                      : 'bg-bg-card shadow-soft hover:bg-bg-surface'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary-container/20' : 'bg-bg-elevated'
                    }`}
                  >
                    {getCategoryIcon(pack.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium text-sm text-text-primary truncate">
                      {pack.name}
                    </span>
                    <span className="text-[10px] text-text-muted">{pack.question_count} Qs</span>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-5 h-5 text-neon-cyan flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-text-muted mt-2">
            {totalQuestions} questions from {selectedPacks.length} pack
            {selectedPacks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {isQuickPlay ? (
            <motion.button
              onClick={handleQuickPlay}
              className="w-full py-4 rounded-full font-display text-2xl tracking-wider bg-neon-gold text-text-primary shadow-gold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              START
            </motion.button>
          ) : (
            <motion.button
              onClick={handleHost}
              className="w-full py-4 rounded-full font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              NEXT
            </motion.button>
          )}
        </div>

        <motion.button
          onClick={handleBack}
          className="w-full mt-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
